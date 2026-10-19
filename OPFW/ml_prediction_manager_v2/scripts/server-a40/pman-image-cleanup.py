"""Inventory and remove images of the installed single-node Prediction Manager.

No global prune, Docker volume removal or runtime-directory deletion is used.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess

ENDPOINT = 'unix:///run/containerd/containerd.sock'
CRI = ['crictl', '--runtime-endpoint', ENDPOINT, '--image-endpoint', ENDPOINT]
DOCKER = ['docker', '--host', 'unix:///var/run/docker.sock']
CTR = ['ctr', '--address', '/run/containerd/containerd.sock', '--namespace', 'k8s.io']
PIN = '725eb2edeec1b756b45abb809cdc4dc971a890bf'


def run(args):
    return subprocess.check_output(args, text=True).strip()


def read_cri_images(runner=run):
    return json.loads(runner(CRI + ['images', '-o', 'json'])).get('images') or []


def canonical(ref):
    for prefix in ('docker.io/', 'index.docker.io/', 'registry-1.docker.io/'):
        if ref.startswith(prefix):
            ref = ref[len(prefix):]
            break
    first = ref.split('/', 1)[0]
    if '/' not in ref or not ('.' in first or ':' in first or first == 'localhost'):
        ref = 'docker.io/' + (ref if '/' in ref else 'library/' + ref)
    if '@' not in ref and ':' not in ref.rsplit('/', 1)[-1]:
        ref += ':latest'
    return ref


def literal_config(path):
    result = {}
    if path.exists():
        for line in path.read_text().splitlines():
            match = re.match(r'^(REGISTRY_CONTAINER_NAME|REGISTRY_PORT|REGISTRY_DATA_DIR)=(.*)$', line)
            if match:
                values = shlex.split(match[2], comments=True)
                if len(values) != 1:
                    raise ValueError('Invalid literal Registry setting: ' + match[1])
                result[match[1]] = values[0]
    return result


def source_images(repo, runner=run):
    """Read tracked Docker bases and installer image defaults, including the pin."""
    result = set()
    git = ['git', '-c', 'safe.directory=' + str(repo), '-C', str(repo)]
    for revision in ('HEAD', PIN):
        names = runner(git + ['ls-tree', '-r', '--name-only', revision, '--',
                            'OPFW/ml_prediction_manager_v2', 'OPFW/ml_prediction_manager_v2_frontend']).splitlines()
        for name in names:
            if 'Dockerfile' not in Path(name).name and not name.endswith('/bootstrap-verification.sh'):
                continue
            text = runner(git + ['show', revision + ':' + name])
            bases = re.findall(r'(?m)^FROM[ \t]+(?:--\S+[ \t]+)?([^\s]+)', text) if 'Dockerfile' in Path(name).name else []
            for image in bases:
                if '$' not in image and image != 'scratch':
                    result.add(canonical(image))
            for key, image in re.findall(r'\$\{([A-Z_]*IMAGE[A-Z_]*):=([^}]+)\}', text):
                if '$' not in image and ':' in image and not any(c.isspace() for c in image):
                    result.add(canonical(image))
            for image in re.findall(r'docker[ \t]+pull[ \t]+([a-zA-Z0-9][a-zA-Z0-9_./:@-]+)', text):
                if ':' in image or '@' in image:
                    result.add(canonical(image))
    return result


def docker_inventory(runner=run):
    ids = list(dict.fromkeys(runner(DOCKER + ['image', 'ls', '-aq', '--no-trunc']).splitlines()))
    images = []
    for offset in range(0, len(ids), 100):
        for item in json.loads(runner(DOCKER + ['image', 'inspect'] + ids[offset:offset + 100])):
            images.append({'id': item['Id'], 'refs': item.get('RepoTags') or [],
                           'digests': item.get('RepoDigests') or []})
    ids = runner(DOCKER + ['container', 'ls', '-aq', '--no-trunc']).splitlines()
    containers = []
    for offset in range(0, len(ids), 100):
        for item in json.loads(runner(DOCKER + ['container', 'inspect'] + ids[offset:offset + 100])):
            containers.append({'name': item['Name'].lstrip('/'), 'image_id': item['Image'],
                               'image_ref': item['Config']['Image'], 'mounts': item.get('Mounts') or []})
    return images, containers


def image_plan(images, containers, cri_images, known, registry, port):
    owned_names = {'fedit-fe', registry}
    known = set(known)
    known.update(canonical(c['image_ref']) for c in containers if c['name'] in owned_names)
    for image in cri_images:
        known.update(canonical(r) for r in (image.get('repoTags') or []) + (image.get('repoDigests') or []))
    cri_ids = {image['id'] for image in cri_images}
    protected_ids = {c['image_id'] for c in containers if c['name'] not in owned_names}
    prefixes = ('127.0.0.1:' + str(port) + '/', 'localhost:' + str(port) + '/')
    selected, retained = [], []
    for image in images:
        refs = [ref for ref in image['refs'] if ref.startswith(prefixes) or canonical(ref) in known]
        if refs or (not image['refs'] and image['id'] in cri_ids):
            selected.append({'id': image['id'], 'refs': refs, 'protected': image['id'] in protected_ids})
        else:
            retained.append(image)
    return selected, retained


def inventory(owner, repo, output, runner=run):
    import pwd
    account = pwd.getpwnam(owner)
    if account.pw_uid == 0:
        raise ValueError('Use the original ordinary installation account')
    home = Path(account.pw_dir)
    base = home/'pman-server-725eb2ed'
    if not (base/'installation-started').is_file():
        raise ValueError('The installation ownership marker is missing')
    config = literal_config(base/'server-install.env')
    registry = os.environ.get('FEDIT_REGISTRY_CONTAINER') or config.get('REGISTRY_CONTAINER_NAME', 'pm-verification-registry')
    port = int(config.get('REGISTRY_PORT', '5000'))
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.-]*', registry) or not 0 < port < 65536:
        raise ValueError('Invalid installed Registry setting')
    images, containers = docker_inventory(runner)
    cri_images = read_cri_images(runner)
    containerd_refs = runner(CTR + ['images', 'ls', '-q']).splitlines()
    selected, retained = image_plan(images, containers, cri_images, source_images(repo, runner), registry, port)
    roots = [m['Source'] for c in containers if c['name'] == registry for m in c['mounts']
             if m.get('Type') == 'bind' and m['Destination'] == '/var/lib/registry']
    if not roots:
        configured = config.get('REGISTRY_DATA_DIR', 'auto')
        roots = [str(home/'prediction-manager-work/.prediction-manager/gpu/registry') if configured == 'auto' else configured]
    plan = {'schema': 1, 'owner': owner, 'owner_uid': account.pw_uid, 'owner_home': str(home),
            'registry': registry, 'registry_roots': roots, 'cri_images': cri_images, 'containerd_refs': containerd_refs,
            'docker_targets': selected, 'retained_unrelated_docker_images': retained}
    write_json(output, plan)
    print(f"[PASS] Image inventory: Docker targets={len(selected)}, CRI={len(cri_images)}, unrelated Docker images retained={len(retained)}")


def clear_registry(root, allowed_roots, mountpoints):
    root = Path(root).resolve()
    if not any(root != allowed and root.is_relative_to(allowed) for allowed in allowed_roots):
        raise ValueError('Registry storage is outside this installation: ' + str(root))
    target = root
    for name in ('docker', 'registry', 'v2'):
        target = target/name
        if target.is_symlink():
            raise ValueError('Unexpected symlink in Registry blob path: ' + str(target))
    resolved = target.resolve()
    if not resolved.is_relative_to(root) or resolved == root:
        raise ValueError('Invalid Registry blob path')
    if any(m == resolved or m.is_relative_to(resolved) for m in mountpoints):
        raise ValueError('Unexpected mount inside Registry blob path')
    if resolved.exists():
        if not resolved.is_dir():
            raise ValueError('Registry blob path is not a directory')
        shutil.rmtree(resolved)
    return str(resolved)


def cleanup(plan, output, runner=run, mountpoints=None):
    if plan.get('schema') != 1:
        raise ValueError('Unsupported saved image inventory')
    # Reset must finish before image deletion; a new/foreign cluster is never reset here.
    if runner(CRI + ['pods', '-q']):
        raise ValueError('Kubernetes Pod sandboxes still exist; finish uninstall first')
    images, containers = docker_inventory(runner)
    owned_names = {'fedit-fe', plan['registry']}
    if any(c['name'] in owned_names for c in containers):
        raise ValueError('Platform Docker containers still exist; finish uninstall first')
    protected = {c['image_id'] for c in containers}
    refs = {r: i['id'] for i in images for r in i['refs']}
    present_ids = {i['id'] for i in images}
    current_by_id = {i['id']: i for i in images}
    removed, kept = [], []
    for image in plan['docker_targets']:
        if image['id'] in protected:
            kept.append({'id': image['id'], 'reason': 'used by another Docker container'})
            continue
        if not image['refs'] and current_by_id.get(image['id'], {}).get('refs'):
            kept.append({'id': image['id'], 'reason': 'new Docker tags since inventory'})
            continue
        targets = image['refs'] or ([image['id']] if image['id'] in present_ids else [])
        for ref in targets:
            if image['refs'] and ref not in refs:
                continue
            if image['refs'] and refs[ref] != image['id']:
                raise ValueError('Image changed since the saved inventory: ' + ref)
            runner(DOCKER + ['image', 'rm', '--', ref])
            removed.append(ref)
    # The CRI namespace belongs to this single-node cluster. Other containerd
    # namespaces and Docker images are not pruned.
    cri_before = read_cri_images(runner)
    for image_id in sorted({i['id'] for i in cri_before}):
        runner(CRI + ['rmi', image_id])
    if read_cri_images(runner):
        raise ValueError('CRI images remain after removal')
    # Imports can also leave short aliases which CRI does not expose. Remove
    # those from this cluster's namespace, without touching moby/buildkit/etc.
    remaining_refs = runner(CTR + ['images', 'ls', '-q']).splitlines()
    for ref in remaining_refs:
        runner(CTR + ['images', 'rm', ref])
    if runner(CTR + ['images', 'ls', '-q']):
        raise ValueError('Containerd image aliases remain after removal')
    after, _ = docker_inventory(runner)
    after_refs = {r for i in after for r in i['refs']}
    if any(ref in after_refs for ref in removed if not ref.startswith('sha256:')):
        raise ValueError('A selected Docker image reference remains after removal')
    if mountpoints is None:
        mountpoints = []
        for line in Path('/proc/self/mountinfo').read_text().splitlines():
            value = re.sub(r'\\([0-7]{3})', lambda m: chr(int(m[1], 8)), line.split()[4])
            mountpoints.append(Path(value).resolve())
    home = Path(plan['owner_home']).resolve()
    allowed = [home, Path('/data')/('fedit-pman-' + str(plan['owner_uid']))]
    cleared, shared = [], []
    for root in plan['registry_roots']:
        candidate = Path(root).resolve()/'docker/registry/v2'
        foreign_mounts = [Path(m['Source']).resolve() for c in containers for m in c['mounts'] if m.get('Type') == 'bind']
        if any(m == candidate or m.is_relative_to(candidate) or candidate.is_relative_to(m) for m in foreign_mounts):
            shared.append(str(candidate))
            continue
        cleared.append(clear_registry(root, allowed, mountpoints))
    result = {'removed_docker_refs': removed, 'protected_docker_images': kept,
              'removed_cri_image_ids': sorted({i['id'] for i in cri_before}),
              'removed_containerd_aliases': remaining_refs,
              'cleared_registry_blob_directories': cleared, 'shared_registry_directories_preserved': shared}
    write_json(output, result)
    print(f"[PASS] Image cleanup: Docker references removed={len(removed)}, CRI images removed={len(result['removed_cri_image_ids'])}, shared images retained={len(kept)}")


def write_json(path, data):
    path = Path(path)
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    inv = sub.add_parser('inventory')
    inv.add_argument('--owner', required=True)
    inv.add_argument('--repo', required=True, type=Path)
    inv.add_argument('--output', required=True, type=Path)
    clean = sub.add_parser('cleanup')
    clean.add_argument('--inventory', required=True, type=Path)
    clean.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if os.geteuid() != 0:
        parser.error('Run through pman-reinstall.sh using sudo')
    if args.command == 'inventory':
        inventory(args.owner, args.repo, args.output)
    else:
        import pwd
        plan = json.loads(args.inventory.read_text())
        account = pwd.getpwnam(plan['owner'])
        if account.pw_uid == 0 or account.pw_uid != plan['owner_uid'] or account.pw_dir != plan['owner_home']:
            raise ValueError('Saved inventory does not match the installation account')
        if Path('/etc/kubernetes/admin.conf').exists() or Path('/etc/kubernetes/manifests/kube-apiserver.yaml').exists():
            raise ValueError('The cluster has not been uninstalled; image cleanup was not started')
        cleanup(plan, args.output)


if __name__ == '__main__':
    main()

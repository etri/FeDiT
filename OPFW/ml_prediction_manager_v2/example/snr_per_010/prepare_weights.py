import hashlib
import json
from pathlib import Path


def restore_weights(package):
    metadata = json.loads((package / 'WEIGHT_PARTS.json').read_text())
    for item in metadata['files']:
        target = package / item['path']
        if target.is_file() and target.stat().st_size == item['bytes']:
            with target.open('rb') as stream:
                if hashlib.file_digest(stream, 'sha256').hexdigest() == item['sha256']:
                    continue
        temporary = target.with_name(target.name + '.restoring')
        digest = hashlib.sha256()
        total = 0
        try:
            with temporary.open('wb') as output:
                for part in item['parts']:
                    source = package / part['path']
                    part_digest = hashlib.sha256()
                    part_size = 0
                    with source.open('rb') as stream:
                        while block := stream.read(1024 * 1024):
                            output.write(block)
                            digest.update(block)
                            part_digest.update(block)
                            total += len(block)
                            part_size += len(block)
                    if part_size != part['bytes'] or part_digest.hexdigest() != part['sha256']:
                        raise RuntimeError('Model part mismatch: ' + part['path'])
            if total != item['bytes'] or digest.hexdigest() != item['sha256']:
                raise RuntimeError('Restored model mismatch: ' + item['path'])
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
        print('MODEL_RESTORED', item['path'], total, flush=True)


if __name__ == '__main__':
    restore_weights(Path(__file__).resolve().parent)

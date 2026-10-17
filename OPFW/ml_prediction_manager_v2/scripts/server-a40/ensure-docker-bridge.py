"""Restore only this installer's Docker gateway; preserve other addresses/rules."""
import ipaddress
import json
import os
import subprocess

SUBNET = ipaddress.ip_network('10.254.254.192/28')
GATEWAY = '10.254.254.193'


def command(*args):
    return subprocess.check_output(args, text=True, timeout=30)


def ensure_bridge(run=command):
    networks = json.loads(run('docker', 'network', 'inspect', 'bridge'))
    if len(networks) != 1 or networks[0].get('Name') != 'bridge' or networks[0].get('Driver') != 'bridge':
        raise RuntimeError('Cannot identify the local Docker bridge')
    network = networks[0]
    pools = (network.get('IPAM') or {}).get('Config') or []
    owned = [p for p in pools if p.get('Subnet') == str(SUBNET)]
    if not owned:
        print('[SKIP] Docker bridge uses another address profile; left unchanged')
        return False
    interface = (network.get('Options') or {}).get('com.docker.network.bridge.name', 'docker0')
    if len(owned) != 1 or owned[0].get('Gateway') != GATEWAY or interface != 'docker0':
        raise RuntimeError('Unexpected gateway/interface for the installer Docker subnet')
    links = json.loads(run('ip', '-j', '-d', 'link', 'show', 'dev', interface))
    if len(links) != 1 or (links[0].get('linkinfo') or {}).get('info_kind') != 'bridge':
        raise RuntimeError('The Docker interface is not a Linux bridge')

    def present():
        rows = json.loads(run('ip', '-j', '-4', 'address', 'show', 'dev', interface))
        return any(a.get('local') == GATEWAY and a.get('prefixlen') == SUBNET.prefixlen
                   for row in rows for a in row.get('addr_info', []))

    if present():
        print('[PASS] Docker bridge gateway matches its IPAM configuration')
        return False
    # Do not flush the interface or delete existing aliases, networks or rules.
    # Existing containers can still use their previous gateway during migration.
    run('ip', 'address', 'replace', f'{GATEWAY}/{SUBNET.prefixlen}', 'dev', interface)
    if not present():
        raise RuntimeError('Docker bridge gateway repair did not take effect')
    print('[PASS] Restored Docker bridge gateway 10.254.254.193/28; other addresses preserved')
    return True


if __name__ == '__main__':
    if os.geteuid() != 0:
        raise SystemExit('Run this Docker network check with sudo')
    ensure_bridge()

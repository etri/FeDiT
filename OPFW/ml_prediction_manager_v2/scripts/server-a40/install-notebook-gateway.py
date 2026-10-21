#!/usr/bin/python3
"""Install the PM notebook gateway, preserving the existing HTTPS certificate."""
import datetime
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

assert os.geteuid() == 0, 'Run as root'
source = Path(__file__).with_name('notebook-gateway.py')
nginx = Path('/etc/nginx/conf.d/jupyterlab-8080.conf')
text = nginx.read_text()
pattern = r'    location / \{\n        proxy_pass http://127\.0\.0\.1:8888;\n(.*?)\n    \}\n\}'
match = re.search(pattern, text, re.S)
assert match, 'Expected the standalone Jupyter proxy; inspect before changing it'
backup = Path('/var/backups/pm-notebook-gateway-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
backup.mkdir(mode=0o700)
shutil.copy2(nginx, backup / nginx.name)
host_active = subprocess.run(['systemctl', 'is-active', '--quiet', 'jupyterlab']).returncode == 0
host_enabled = subprocess.run(['systemctl', 'is-enabled', '--quiet', 'jupyterlab']).returncode == 0
(backup / 'previous-state.json').write_text(json.dumps({'host_jupyter_active': host_active, 'host_jupyter_enabled': host_enabled}, indent=2))
destination = Path('/usr/local/libexec/prediction-manager-notebook-gateway.py')
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination)
destination.chmod(0o755)
spec = importlib.util.spec_from_file_location('gateway', destination)
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)
gateway.STATE.mkdir(mode=0o755, parents=True, exist_ok=True)
proxy = Path(gateway.PROXY)
proxy.write_text(match.group(1) + '\n')
proxy.chmod(0o644)
routes, page = gateway.render([], {})
gateway.atomic_write(gateway.ROUTES, routes)
gateway.atomic_write(gateway.STATE / 'index.html', page)
replacement = ('    include /etc/nginx/snippets/prediction-manager-notebooks.conf;\n'
               '    location / { return 404; }\n}')
updated = text[:match.start()] + replacement + text[match.end():]
unit = Path('/etc/systemd/system/prediction-manager-notebook-gateway.service')
unit.write_text('''[Unit]
Description=Prediction Manager notebook connections for HTTPS 8080
After=network-online.target nginx.service kubelet.service
Wants=network-online.target nginx.service

[Service]
Type=simple
Environment=KUBECONFIG=/etc/kubernetes/admin.conf
ExecStart=/usr/bin/python3 /usr/local/libexec/prediction-manager-notebook-gateway.py
Restart=always
RestartSec=5
KillMode=control-group
TimeoutStopSec=30
RuntimeDirectory=prediction-manager-notebook-gateway
RuntimeDirectoryMode=0700
StateDirectory=prediction-manager-notebook-gateway
StateDirectoryMode=0755
UMask=0022
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
''')
unit.chmod(0o644)
try:
    nginx.write_text(updated)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    subprocess.run(['systemctl', 'enable', '--now', unit.name], check=True)
    subprocess.run(['systemctl', 'is-active', '--quiet', unit.name], check=True)
    subprocess.run(['systemctl', 'disable', '--now', 'jupyterlab'], check=True)
except Exception:
    subprocess.run(['systemctl', 'disable', '--now', unit.name])
    nginx.write_text(text)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    if host_enabled:
        subprocess.run(['systemctl', 'enable', 'jupyterlab'], check=True)
    if host_active:
        subprocess.run(['systemctl', 'start', 'jupyterlab'], check=True)
    raise
print('Installed PM notebook gateway on HTTPS 8080. Previous host configuration:', backup)

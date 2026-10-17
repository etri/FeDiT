import ast
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class OverlayCompatibilityTest(unittest.TestCase):
    def test_only_pvc_resource_types_are_changed_and_patch_is_idempotent(self):
        helper = Path(__file__).parents[1] / 'scripts/server-a40/prepare-sandbox-overlay.py'
        spec = importlib.util.spec_from_file_location('sandbox_overlay_test', helper)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'app').mkdir()
            source = root / 'app/sample.py'
            source.write_text("label='한글'; claim=client.V1PersistentVolumeClaimSpec(resources=client.V1ResourceRequirements(requests={'storage':'1Gi'}))\ncontainer=client.V1ResourceRequirements(limits={'cpu':'1'})\n", encoding='utf-8')
            self.assertEqual(module.prepare(root), 1)
            result = source.read_text(encoding='utf-8')
            ast.parse(result)
            self.assertIn('V1PersistentVolumeClaimSpec(resources=client.V1VolumeResourceRequirements', result)
            self.assertIn("container=client.V1ResourceRequirements(limits={'cpu':'1'})", result)
            self.assertEqual(module.prepare(root), 0)


class UpdateRollbackTest(unittest.TestCase):
    def test_failure_restores_only_changed_components_and_success_does_not_rollback(self):
        path = Path(__file__).parents[1] / 'scripts/server-a40/update-user-sandbox.sh'
        text = path.read_text(encoding='utf-8')
        finish = text[text.index('finish() {'):text.index('\ntrap finish EXIT')]
        bash = shutil.which('bash') if os.name != 'nt' else 'C:/Program Files/Git/bin/bash.exe'
        for rc, nginx, backend, failure in [(0, True, True, False), (42, True, True, False),
                                             (42, False, True, False), (42, True, True, True)]:
            with self.subTest(rc=rc, nginx=nginx, backend=backend, rollback_failure=failure), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                (root / 'frontend-nginx.before.conf').write_text('original-config', encoding='utf-8')
                (root / 'active.conf').write_text('new-config', encoding='utf-8')
                env = os.environ.copy()
                env['FIXTURE'] = root.as_posix()
                script = '''set -Eeuo pipefail
work="$FIXTURE"
nginx_source="$work/active.conf"
old_image=old-image
new_image=new-image
revision=test-revision
docker() { echo "docker $*" >> "$work/actions"; return "$rollback_error"; }
kubectl() { echo "kubectl $*" >> "$work/actions"; return "$rollback_error"; }
'''
                script += f'rollback_error={1 if failure else 0}\nnginx_changed={str(nginx).lower()}\ndeployment_changed={str(backend).lower()}\n'
                script += finish + '\ntrap finish EXIT\n' + f'exit {rc}\n'
                result = subprocess.run([bash, '-s'], input=script, text=True, encoding='utf-8', capture_output=True, env=env, timeout=15)
                self.assertEqual(result.returncode, rc, result.stdout + result.stderr)
                self.assertIn(f'EXIT={rc}', (root / 'RESULT.txt').read_text())
                actions = (root / 'actions').read_text() if (root / 'actions').exists() else ''
                if rc == 0:
                    self.assertEqual(actions, '')
                    self.assertEqual((root / 'active.conf').read_text(), 'new-config')
                else:
                    self.assertIn('prediction-manager=old-image', actions)
                    self.assertEqual('docker exec' in actions, nginx)
                    self.assertEqual((root / 'active.conf').read_text(), 'original-config' if nginx else 'new-config')
                    if failure:
                        self.assertIn('rollback needs inspection', result.stdout)


if __name__ == '__main__':
    unittest.main()

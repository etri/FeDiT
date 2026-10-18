"""Fix the pinned Kubernetes client compatibility in an isolated build copy."""
import ast
from pathlib import Path
import sys


def prepare(root: Path) -> int:
    changed = 0
    for path in (root / 'app').rglob('*.py'):
        data = path.read_bytes()
        text = data.decode('utf-8')
        offsets = [0]
        for line in data.splitlines(keepends=True):
            offsets.append(offsets[-1] + len(line))
        edits = []
        for node in ast.walk(ast.parse(text)):
            if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute) or node.func.attr != 'V1PersistentVolumeClaimSpec':
                continue
            for keyword in node.keywords:
                call = keyword.value
                if (keyword.arg == 'resources' and isinstance(call, ast.Call)
                        and isinstance(call.func, ast.Attribute) and call.func.attr == 'V1ResourceRequirements'):
                    end = offsets[call.func.end_lineno - 1] + call.func.end_col_offset
                    start = end - len(b'V1ResourceRequirements')
                    assert data[start:end] == b'V1ResourceRequirements'
                    edits.append((start, end))
        for start, end in sorted(edits, reverse=True):
            data = data[:start] + b'V1VolumeResourceRequirements' + data[end:]
        ast.parse(data.decode('utf-8'))
        if edits:
            path.write_bytes(data)
            changed += len(edits)
    return changed


if __name__ == '__main__':
    print(f'PVC compatibility constructors corrected in build copy: {prepare(Path(sys.argv[1]))}')

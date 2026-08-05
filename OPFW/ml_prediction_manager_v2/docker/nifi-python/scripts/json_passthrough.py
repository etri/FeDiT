#!/opt/pm-python/bin/python
import json
import sys
from datetime import datetime, timezone


def main() -> None:
    payload = json.load(sys.stdin)
    if not isinstance(payload, dict):
        raise ValueError("FlowFile JSON content must be an object")
    payload["_nifi_python"] = {
        "processed": True,
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }
    json.dump(payload, sys.stdout, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()

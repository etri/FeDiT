#!/usr/bin/env bash
set -euo pipefail

# CPU entry point for the section 2.2.9 functional verification.  The common
# verifier owns test-object cleanup and applies the three-minute execution
# limit; this wrapper only selects the CPU-specific assertions.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export VERIFY_PROFILE=cpu
exec "${SCRIPT_DIR}/verify-2.2.9-gpu.sh" "$@"

#!/usr/bin/env bash
# Source this helper; it never changes sudo policy or records a password.
sudo_session_pid=''

sudo_session_start() {
  (( EUID != 0 )) || return 0
  sudo -v || return "$?"
  local parent=$BASHPID
  (
    exec 3>&- 4>&- 9>&-
    sleeper=''
    stop_refresh() {
      trap - TERM INT
      [[ -z "$sleeper" ]] || { kill "$sleeper" 2>/dev/null || true; wait "$sleeper" 2>/dev/null || true; }
      exit 0
    }
    trap stop_refresh TERM INT
    while kill -0 "$parent" 2>/dev/null; do
      sleep 60 &
      sleeper=$!
      wait "$sleeper" || exit 0
      sleeper=''
      kill -0 "$parent" 2>/dev/null || break
      sudo -n -v || exit 1
    done
  ) </dev/null >/dev/null 2>&1 &
  sudo_session_pid=$!
}

sudo_session_stop() {
  [[ -n "${sudo_session_pid:-}" ]] || return 0
  kill "$sudo_session_pid" 2>/dev/null || true
  local attempt
  for attempt in {1..20}; do
    kill -0 "$sudo_session_pid" 2>/dev/null || break
    sleep 0.1
  done
  kill -KILL "$sudo_session_pid" 2>/dev/null || true
  wait "$sudo_session_pid" 2>/dev/null || true
  sudo_session_pid=''
}

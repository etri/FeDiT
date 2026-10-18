#!/bin/sh
set -eu

# The container receives runtime values with the NDXPRO_ENV_* prefix. Write
# a small config script consumed before the CRA bundle so the same image can
# be used in different environments without rebuilding it.
runtime_file=/usr/share/nginx/html/runtime-config.js
printf '%s\n' 'window.__NDXPRO_CONFIG__ = {' > "$runtime_file"

for key in $(env | awk -F= '/^NDXPRO_ENV_/ { print $1 }'); do
  value=$(printenv "$key" || true)
  suffix=$(printf '%s' "$key" | sed 's/^NDXPRO_ENV_//')
  target="REACT_APP_"$suffix
  escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\r//g')
  printf '  "%s": "%s",\n' "$target" "$escaped_value" >> "$runtime_file"
done

printf '%s\n' '};' >> "$runtime_file"

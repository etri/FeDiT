#!/bin/sh
# ============================================
# Dynamic environment variable injection script
# Automatically executed when Docker container starts
# Replaces placeholders in built JS files with actual values
# ============================================

set +e  # Continue execution even if errors occur

echo "=== Starting environment variable injection ==="

# Check if any IITP_ENV_ variables exist
if ! env | grep -q "IITP_ENV_"; then
    echo "No IITP_ENV_ variables found, skipping injection"
    exit 0
fi

# Iterate through all environment variables with IITP_ENV_ prefix
for i in $(env | grep IITP_ENV_)
do
  # Extract environment variable key (name)
  key=$(echo "$i" | cut -d '=' -f 1)

  # Extract environment variable value (handles cases with '=' in value)
  value=$(echo "$i" | cut -d '=' -f 2-)

  # Log environment variable being processed
  echo "Processing: $key = $value"

  # Check if html directory exists
  if [ -d "/usr/share/nginx/html" ]; then
    # Replace placeholders with actual values in JavaScript files
    find /usr/share/nginx/html -type f -name '*.js' \
      -exec sed -i "s|${key}|${value}|g" '{}' \; 2>/dev/null || true

    # Also process CSS files (environment variables may be included in CSS)
    find /usr/share/nginx/html -type f -name '*.css' \
      -exec sed -i "s|${key}|${value}|g" '{}' \; 2>/dev/null || true
  else
    echo "Warning: /usr/share/nginx/html not found"
  fi
done

echo "=== Environment variable injection completed ==="
exit 0
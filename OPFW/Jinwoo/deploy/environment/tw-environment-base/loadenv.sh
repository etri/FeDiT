#!/bin/bash
loadEnv() {
  local envFile="${1?Missing environment file}"
  local environmentAsArray variableDeclaration
  mapfile environmentAsArray < <(
    grep --invert-match '^#' "${envFile}" \
      | grep --invert-match '^\s*$'
  ) # Uses grep to remove commented and blank lines
  for variableDeclaration in "${environmentAsArray[@]}"; do
    IFS="=" read -ra STR_ARRAY <<< "$variableDeclaration"
    var1=`echo ${STR_ARRAY[0]}`
    var2=`echo ${STR_ARRAY[1]}`
    export "${var1}=${var2//[$'\r\n']}" # The substitution removes the line breaks
  done
}
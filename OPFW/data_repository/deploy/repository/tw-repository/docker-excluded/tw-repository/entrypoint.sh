#!/bin/bash
echo
ls -al
echo
echo "APP_NAME: ${APP_NAME}"
echo "WORKDIR: ${WORKDIR}"
echo "TZ: ${TZ}"

cp -r /jw/init-files/icon /jw/files/
cp -r /jw/init-files/font /jw/files/

catalina.sh run

#tail -f /dev/null
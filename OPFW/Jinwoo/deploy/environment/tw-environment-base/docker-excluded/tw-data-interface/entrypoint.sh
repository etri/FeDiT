#!/bin/bash
echo
ls -al
echo
echo "APP_NAME: ${APP_NAME}"
echo "WORKDIR: ${WORKDIR}"
echo "TZ: ${TZ}"
echo "JAVA_OPTIONS: ${JAVA_OPTIONS}"

# cp ./svc/tw-data-interface.service /etc/systemd/system/usr/sbin/init
# cp ./svc/tw-data-interface.service /etc/systemd/system

# set -euo pipefail
# exec /usr/sbin/init

#echo "*** run jar file"
java -jar ${JAVA_OPTIONS} ${WORKDIR}/svc/${APP_NAME}.jar

# echo "NODE_ENV: ${NODE_ENV}"
# echo "WORKDIR: ${WORKDIR}"
# echo "TZ: ${TZ}"
# echo "JAVA_OPTIONS: ${JAVA_OPTIONS}"

# cp ./svc/tw-data-interface.service /etc/systemd/system
# systemctl stop tw-data-interface.service
# systemctl daemon-reload
# systemctl enable tw-data-interface.service
# systemctl start tw-data-interface.service
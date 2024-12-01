#!/bin/bash
echo
ls -al
echo
echo "APP_NAME: ${APP_NAME}"
echo "WORKDIR: ${WORKDIR}"
echo "TZ: ${TZ}"
echo "JAVA_OPTIONS: ${JAVA_OPTIONS}"

#echo "*** run jar file"
java -jar ${JAVA_OPTIONS} ${WORKDIR}/svc/${APP_NAME}.jar
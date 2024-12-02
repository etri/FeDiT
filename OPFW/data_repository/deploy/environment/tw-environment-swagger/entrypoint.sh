#!/bin/sh
ls -al
echo 
echo "NODE_ENV: ${NODE_ENV}"
echo "WORKDIR: ${WORKDIR}"
npm run prod.pm2.docker

#!/bin/bash

echo 'Starting FeDitApiGWCloudGateway-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWCloudGateway.jar --server.port=8000 &
sleep 5 

echo 'Starting FeDitApiGWReceiver-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWReceiver.jar --server.port=23419  &
sleep 5 

echo 'Starting FeDitApiGWCtrlCmdProcessor-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWCtrlCmdProcessor.jar --server.port=23429 &
sleep 5

echo 'Starting FeDitApiGWResponser-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWResponser.jar --server.port=23439 &
sleep 5

echo 'Starting FeDitApiGWTransmitter-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWTransmitter.jar --server.port=23449 &
sleep 5

echo 'Starting FeDitApiGWDiscoveryService-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar FeDitApiGWDiscoveryService.jar --server.port=8761 

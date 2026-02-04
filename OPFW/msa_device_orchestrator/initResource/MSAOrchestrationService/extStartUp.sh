#!/bin/bash

echo 'Starting MSAGatewayService-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar MSAGatewayService.jar --server.port=8000 &
sleep 5 

echo 'Starting ControlCommandReceiver-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar ControlCommandReceiver.jar --server.port=21419 &
sleep 5 

echo 'Starting ControlCommandProducer-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar ControlCommandProducer.jar --server.port=21429 &
sleep 5

echo 'Starting ResultDataConsumer-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar ResultDataConsumer.jar --server.port=21439 &
sleep 5 

echo 'Starting ResultDataTransmitter-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar ResultDataTransmitter.jar --server.port=21449 &
sleep 5

echo 'Starting ControlCommandStatusChecker-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar ControlCommandStatusChecker.jar & sleep 5

echo 'Starting MSADiscoveryService-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar MSADiscoveryService.jar --server.port=8761 








#!/bin/bash

echo 'Starting DETRCKGatewayService-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar DETRCKGatewayService.jar --server.port=8000 &
sleep 5 

echo 'Starting TrackingCommandReceiver-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar TrackingCommandReceiver.jar --server.port=22419 &
sleep 5 

echo 'Starting TrackingCommandPublisher-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar TrackingCommandPublisher.jar --server.port=22429 &
sleep 5

echo 'Starting TrackingDataSubscriber-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar TrackingDataSubscriber.jar --server.port=22439 &
sleep 5 

echo 'Starting TrackingEventTrigger-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar TrackingEventTrigger.jar --server.port=22449 &
sleep 5

echo 'Starting TrackingCommandStatusChecker-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar TrackingCommandStatusChecker.jar & sleep 5

echo 'Starting DETRCKDiscoveryService-0.0.1-SNAPSHOT Server...'
java -XX:+UseParallelGC -XX:MaxGCPauseMillis=200 -Xms64m -Xmx128m -Djava.net.preferIPv4Stack=true -Duser.timezone=Asia/Seoul  \
-jar DETRCKDiscoveryService.jar --server.port=8761 








FROM adoptopenjdk/openjdk11:latest
ARG JAR_FILE1=DETRCKDiscoveryService-0.0.1-SNAPSHOT.jar
ARG JAR_FILE2=DETRCKGatewayService-0.0.1-SNAPSHOT.jar
ARG JAR_FILE3=TrackingCommandReceiver-0.0.1-SNAPSHOT.jar
ARG JAR_FILE4=TrackingCommandPublisher-0.0.1-SNAPSHOT.jar
ARG JAR_FILE5=TrackingDataSubscriber-0.0.1-SNAPSHOT.jar
ARG JAR_FILE6=TrackingEventTrigger-0.0.1-SNAPSHOT.jar
ARG JAR_FILE7=TrackingCommandStatusChecker-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE1} DETRCKDiscoveryService.jar
COPY ${JAR_FILE2} DETRCKGatewayService.jar
COPY ${JAR_FILE3} TrackingCommandReceiver.jar
COPY ${JAR_FILE4} TrackingCommandPublisher.jar
COPY ${JAR_FILE5} TrackingDataSubscriber.jar
COPY ${JAR_FILE6} TrackingEventTrigger.jar
COPY ${JAR_FILE7} TrackingCommandStatusChecker.jar
ADD extStartUp.sh /
RUN chmod +x /extStartUp.sh
CMD ["/extStartUp.sh"]
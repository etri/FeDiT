FROM adoptopenjdk/openjdk11:latest
ARG JAR_FILE1=MSADiscoveryService-0.0.1-SNAPSHOT.jar
ARG JAR_FILE2=MSAGatewayService-0.0.1-SNAPSHOT.jar
ARG JAR_FILE3=ControlCommandReceiver-0.0.1-SNAPSHOT.jar
ARG JAR_FILE4=ControlCommandProducer-0.0.1-SNAPSHOT.jar
ARG JAR_FILE5=ResultDataConsumer-0.0.1-SNAPSHOT.jar
ARG JAR_FILE6=ResultDataTransmitter-0.0.1-SNAPSHOT.jar
ARG JAR_FILE7=ControlCommandStatusChecker-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE1} MSADiscoveryService.jar
COPY ${JAR_FILE2} MSAGatewayService.jar
COPY ${JAR_FILE3} ControlCommandReceiver.jar
COPY ${JAR_FILE4} ControlCommandProducer.jar
COPY ${JAR_FILE5} ResultDataConsumer.jar
COPY ${JAR_FILE6} ResultDataTransmitter.jar
COPY ${JAR_FILE7} ControlCommandStatusChecker.jar
ADD extStartUp.sh /
RUN chmod +x /extStartUp.sh
CMD ["/extStartUp.sh"]
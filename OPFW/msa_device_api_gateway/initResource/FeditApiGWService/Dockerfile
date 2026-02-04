FROM adoptopenjdk/openjdk11:latest
ARG JAR_FILE1=FeDitApiGWDiscoveryService-0.0.1-SNAPSHOT.jar
ARG JAR_FILE2=FeDitApiGWCloudGateway-0.0.1-SNAPSHOT.jar
ARG JAR_FILE3=FeDitApiGWReceiver-0.0.1-SNAPSHOT.jar
ARG JAR_FILE4=FeDitApiGWCtrlCmdProcessor-0.0.1-SNAPSHOT.jar
ARG JAR_FILE5=FeDitApiGWResponser-0.0.1-SNAPSHOT.jar
ARG JAR_FILE6=FeDitApiGWTransmitter-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE1} FeDitApiGWDiscoveryService.jar
COPY ${JAR_FILE2} FeDitApiGWCloudGateway.jar
COPY ${JAR_FILE3} FeDitApiGWReceiver.jar
COPY ${JAR_FILE4} FeDitApiGWCtrlCmdProcessor.jar
COPY ${JAR_FILE5} FeDitApiGWResponser.jar
COPY ${JAR_FILE6} FeDitApiGWTransmitter.jar
ADD extStartUp.sh /
RUN chmod +x /extStartUp.sh
CMD ["/extStartUp.sh"]
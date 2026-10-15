export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-11.jdk/Contents/Home
./gradlew build -p ./dataAdapter
docker buildx build --platform linux/amd64 -t ndxpro/ndxpro-dataadapter:v1.1 .
docker tag ndxpro/ndxpro-dataadapter:v1.1 ${DOCKER_REGISTRY}/ndxpro-dataadapter:v1.1
docker push ${DOCKER_REGISTRY}/ndxpro-dataadapter:v1.1
#./gradlew jib -DsendCredentialsOverHttp=true
./gradlew build -p ./dataAdapter
#docker build -t ndxpro/data-ingest/data-adapter:0.0.1 .
docker buildx build --platform linux/amd64 -t ndxpro/ndxpro-dataadapter:v1.4 .
docker tag ndxpro/ndxpro-dataadapter:v1.4 172.16.28.217:12000/ndxpro-dataadapter:v1.4
docker push 172.16.28.217:12000/ndxpro-dataadapter:v1.4
#./gradlew jib -DsendCredentialsOverHttp=true
#docker run -p 8080:8080 -d --name data-ingest 172.16.28.217:12000/data-ingest:0.0.1

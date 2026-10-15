# dataIngest

1. Build & Push Docker image 
```
./gradlew build -p ~/IdeaProjects/dataIngest/dataAdapter
docker buildx build --platform linux/amd64 -t ndxpro/ndxpro-dataadapter:v1.1 .
docker tag ndxpro/ndxpro-dataadapter:v1 docker-registry:12000/ndxpro-dataadapter:v1.1
docker push docker-registry:12000/ndxpro-dataadapter:v1.1
```

2. Run gradle jib
```
./gradlew jib -DsendCredentialsOverHttp=true
```

3. Run Docker Container
```
docker run -p 8080:8080 -d --name data-ingest docker-registry:12000/data-ingest:v1.1
```

---
### SHELL Agent Conroller

4. exec bash
```docker exec -it data-ingest bash```

5. run flume agent 
```
/opt/flume/bin/flume-ng agent -n adaptorWO --conf /opt/flume/conf -f /opt/flume/conf/adaptorWO.conf
```
---

### HTTP Agent Conroller
 - Add new Agent
```http request
POST /ndxpro/v1/ingest/agents HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
    "name":"vehicleAgent",
    "type":"HTTP",
    "modelType":"Vehicle",
    "urlAddress":"http://data-source-server:51002",
    "connTerm":1,
    "isSaveSource":false,
    "tag":"dev.pintel.simul.org",
    "format":"json",
    "contextUrl":"http://context-server:3005/e8ight-context.jsonld"
}
```
 - run
```http request
PATCH /ndxpro/v1/ingest/agents/16 HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
    "operation" : "start"
}
```

 - stop
```http request
PATCH /ndxpro/v1/ingest/agents/16 HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
    "operation" : "stop"
}
```
# dataManager


# ndxpro-context

ngsi-context 파일 관리

## Context 관리 로직

> java 11 
>
> spring 2.7.4
>
> mongoDB 
>
> ContextServer 
>
> HttpdServer

1. 사용자가 context 파일을 저장한다.
2. contextServer는 요청받은 파일이 NGSI-LD 규격에 맞는지 유효성 검사를 한다.
3. 서버와 DB에 context 파일을 저장한다 
4. HttpdServer 는 저장한 context 파일을 마운트한다.
5. 단순 context 조회 요청은 HttpdServer에서 할 수 있다.(IP:PORT/{contextId})
6. 조회 이력이 있거나 실제로 사용하는 context는 DB에서 조회한다(캐시기능포함).




<img width="431" alt="image" src="https://user-images.githubusercontent.com/100108789/195259410-94285581-c5cd-470d-b4b1-303c28154989.png">

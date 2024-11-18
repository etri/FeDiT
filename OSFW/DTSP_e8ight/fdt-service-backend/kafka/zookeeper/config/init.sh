mkdir -p /data

# 주키퍼는 myid 파일로 클러스터를 구분한다. 1~255까지 번호를 지정할 수 있다.
echo $MY_ID > /data/myid

# 주키퍼 서버를 실행한다.
/usr/local/zookeeper/bin/zkServer.sh start

# 자동으로 종료되지 않도록 방지한다.
tail -f /dev/null

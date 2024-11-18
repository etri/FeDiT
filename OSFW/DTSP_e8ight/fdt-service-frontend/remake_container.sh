CONTAINER=$1
FILE=$2

IMAGE=$(docker compose images $CONTAINER -q)

docker compose -f $FILE stop $CONTAINER
docker compose -f $FILE rm -f $CONTAINER
docker rmi $IMAGE
docker compose -f $FILE pull $CONTAINER
docker compose -f $FILE up -d --no-deps $CONTAINER
docker compose -f $FILE ps

sed -i "s/{{broker_id}}/$BROKER_ID/" /usr/local/kafka/config/server.properties
sed -i "s/{{in_ip}}/$IN_IP/" /usr/local/kafka/config/server.properties
sed -i "s/{{out_ip}}/$OUT_IP/" /usr/local/kafka/config/server.properties
sed -i "s/{{out_port}}/$OUT_PORT/" /usr/local/kafka/config/server.properties
/usr/local/kafka/bin/kafka-server-start.sh /usr/local/kafka/config/server.properties

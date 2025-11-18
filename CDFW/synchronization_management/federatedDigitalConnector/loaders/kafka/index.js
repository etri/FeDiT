const { Kafka, logLevel, Partitioners } = require("kafkajs");
const config = require("../../config");

function parseBrokers(csv) {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

exports.init = async () => {
  // KafkaJS 클라이언트/프로듀서 생성
  const brokers = parseBrokers(config.kafka.host);
  global.kafka = new Kafka({
    clientId: "federated-digital-twin",
    brokers,
    logLevel: logLevel.NOTHING, // 필요시 커스텀 로그 creator로 교체 가능
    retry: { retries: 5 },
  });

  global.client = global.kafka; // 호환용: 다른 코드가 client를 참조할 수 있어 alias 유지
  global.producer = global.kafka.producer({
    // kafka-node의 partitionerType=3(키 기반)을 대체: Legacy(해시) 파티셔너
    createPartitioner: Partitioners.LegacyPartitioner,
    allowAutoTopicCreation: true,
  });

  try {
    await global.producer.connect();
    logger.info("KafkaJS Producer connected");
  } catch (err) {
    logger.error("KafkaJS Producer connect error:", err);
    throw err;
  }

  // KafkaJS 이벤트 훅 (선택)
  global.producer.on(global.producer.events.CONNECT, (e) => {
    logger.info(`KafkaJS producer CONNECT: ${e?.timestamp || ""}`);
  });
  global.producer.on(global.producer.events.DISCONNECT, (e) => {
    logger.warn(`KafkaJS producer DISCONNECT: ${e?.timestamp || ""}`);
  });
  global.producer.on(global.producer.events.REQUEST_TIMEOUT, (e) => {
    logger.error(`KafkaJS REQUEST_TIMEOUT: ${e?.broker || ""}`);
  });
};

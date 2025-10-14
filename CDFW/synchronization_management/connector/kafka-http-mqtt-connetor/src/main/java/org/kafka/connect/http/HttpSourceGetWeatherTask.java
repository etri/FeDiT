package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

public class HttpSourceGetWeatherTask extends SourceTask {
    //private final Logger logger = LoggerFactory.getLogger(HttpSourceGetWeatherConnector.class);
    Logger logger = Logger.getLogger("HttpSourceGetWeatherLogs");

    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceGetWeatherConnectorConfig config;
    // UTC 시간 출력
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    int MAX_RETRY_COUNT = 3;
    private String connectorName;

    // JAX-RS Response 대체: 2xx 성공 판정
    private static boolean isSuccessful(int status) {
        return status >= 200 && status < 300;
    }

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) { // initialization
        logger.setLevel(Level.WARNING);
        FileHandler fh;
        // 초기화할 때, 필수 props 값이 없으면 ConnectException 에러 발생 시키도록 수정해라
        config = new HttpSourceGetWeatherConnectorConfig(props);
        connectorName = props.get("name");
        try {
            url = new URL(config.getString("api.url"));
            System.out.println("Check HTTP GET URL : " + config.getString("api.url"));

            // new FileHandler(String pattern, int limit (파일크기제한), int count(파일개수제한), boolean append(이어쓰기));
            // %g  The generation number that distinguishes the rotated log files from each other.
            fh = new FileHandler("/tmp/HttpSourceGetWeatherLogs.log", 2000, 100, true);
            fh.setLevel(Level.ALL);
            logger.addHandler(fh);
            SimpleFormatter formatter = new SimpleFormatter();
            fh.setFormatter(formatter);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSourceGetWeatherConnector with connector name '{}'" + connectorName);
        logger.info("HttpSourceGetWeatherTask config setting : " + props.toString());

    }


    String ExponentialStage(Integer Exponential, Object[][] arrList) {

        Integer Min = 0;

        String resultName = "";

        for (Integer i = 0; i < arrList.length; i++) {

            Integer _arrayNumber = (Integer) arrList[i][0];
            String _arrayName = (String) arrList[i][1];

            if ((Exponential >= _arrayNumber) && (_arrayNumber >= Min)) {
                Min = _arrayNumber;
                resultName = _arrayName;
            }
        }

        return resultName;
    }

    public String doit() throws IOException {
        int retryCount = 0;
        boolean success = false;
        String strHttpData = "";
        while (retryCount < MAX_RETRY_COUNT && !success) {
            try {
                String timeParams;
                Calendar cal = Calendar.getInstance();
                DateFormat df = new SimpleDateFormat("yyyyMMdd");
                DateFormat df2 = new SimpleDateFormat("HHmm");
                String yyyyMMdd = df.format(cal.getTime().getTime());
                String HHmm = df2.format(cal.getTime().getTime());


                Object[][] base_time = {{41, "0000"}, {141, "0100"}, {241, "0200"}, {341, "0300"}, {441, "0400"}, {541, "0500"}, {641, "0600"}, {741, "0700"}, {841, "0800"}, {941, "0900"}, {1041, "1000"}, {1141, "1100"}, {1241, "1200"}, {1341, "1300"}, {1441, "1400"}, {1541, "1500"}, {1641, "1600"}, {1741, "1700"}, {1841, "1800"}, {1941, "1900"}, {2041, "2000"}, {2141, "2100"}, {2241, "2200"}, {2341, "2300"}};
                String uri = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=P1HmFl38%2BKGZkSGC1Nx1%2Ba5zR6XBhU0dMnXybf56Rnef6eoj6JY6hknu6MnbZ5loqmTLcwS0Fx5v4aale3uFIA%3D%3D&numOfRows=10&pageNo=1&nx=63&ny=123&dataType=JSON";//&base_date=20230518&base_time=0910

                if (Integer.parseInt(HHmm) < 41) {
                    cal.add(Calendar.DATE, -1);
                    yyyyMMdd = df.format(cal.getTime().getTime());
                    timeParams = "&base_date=" + yyyyMMdd + "&base_time=2300";
                } else {
                    timeParams = "&base_date=" + yyyyMMdd + "&base_time=" + ExponentialStage(Integer.parseInt(HHmm), base_time);
                }

                URL connectUri = new URL(url + timeParams);
                conn = (HttpURLConnection) connectUri.openConnection();
                conn.setRequestProperty("Accept", "*/*;q=0.9");

                // get status check
                int status = conn.getResponseCode();
                if (!isSuccessful(status)) {
                    logger.warning("[FAIL Response] json: " + status + " " + conn.getResponseMessage() + " " + config.getString("api.url"));
                    retryCount++;
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));

                    StringBuilder sb = new StringBuilder();
                    String responseData;
                    while ((responseData = br.readLine()) != null) {
                        sb.append(responseData); // StringBuffer 에 응답받은 데이터 순차적 저장
                    }
                    Instant now = Instant.now();
                    JSONObject http_data_obj = new JSONObject();
                    String httpData = String.valueOf(sb);
                    try {
                        JSONObject jsonNode = new JSONObject(httpData);
                        http_data_obj.put("data", jsonNode.toString());
                    } catch (Exception e) {
                        logger.warning(e + "\n[TypeError] not a json: " + httpData);
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("TypeError", httpData);
                        http_data_obj.put("data", jsonObject.toString());
                    }

                    http_data_obj.put("digital_twin_id", config.getString("digital.twin.id"));
                    http_data_obj.put("sensor_id", config.getString("sensor.id"));
                    http_data_obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
                    http_data_obj.put("location", "{}");
                    strHttpData = String.valueOf(http_data_obj);
                    br.close();
                    success = true;
                }
            } catch (Exception e) {
                logger.warning(e.toString());
            }
        }

        if (!success) {
            logger.warning("Max retry count exceeded. Failed to complete GET request.");
        }
        return strHttpData;

    }


    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        final long sleepMs = config.getInt("poll.interval.ms");
        if (sleepMs > 0) {
            Thread.sleep(sleepMs);
        }
        List<SourceRecord> records = new ArrayList<>();
        try {
            //String data = getRequest();
            String data = doit();
            if (data == null) {
                logger.warning("There is some thing wrong data from url (data==null)");
            } else {
                JSONObject kafka_key = new JSONObject();
                kafka_key.put("digital_twin_id", config.getString("digital.twin.id"));
                String strkafkaKey = String.valueOf(kafka_key);
                records.add(dataConvert(data, strkafkaKey));
            }
            return records;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    protected SourceRecord dataConvert(String httpMessage, String strkafkaKey) {
//        System.out.printf("Converting HTTP Message : %s", httpMessage);

        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourcePartition
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                config.getString("kafka.topic"),  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                strkafkaKey,  // java.lang.Object key (kafka message key)
                Schema.STRING_SCHEMA,  // Schema valueSchema
                httpMessage,  // java.lang.Object value (kafka message value)
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        //System.out.println("Converted HTTP Message : " + sourceRecord);
        return sourceRecord;
    }

    @Override
    public void stop() {
        if (br != null) {
            try {
                br.close();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        if (conn != null) {
            conn.disconnect();
        }
    }
}

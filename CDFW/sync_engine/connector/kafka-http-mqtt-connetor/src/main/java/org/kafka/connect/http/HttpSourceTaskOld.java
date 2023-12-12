package org.kafka.connect.http;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.net.InetSocketAddress;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class HttpSourceTaskOld extends SourceTask{

    HttpServer server;
    BlockingQueue<SourceRecord> httpRecordQueue = new LinkedBlockingQueue<SourceRecord>();
    HttpSourceConnectorOldConfig config;

    @Override
    public String version() {
        return "1.0";
    }

    private void startHTTPServer() throws IOException {
        String url = config.getString("http.url");

        server = HttpServer.create(new InetSocketAddress(1013), 0);
        server.createContext(url, new kafkaHttpHandler());

        server.start();
    }

    class kafkaHttpHandler implements HttpHandler {

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // handler 작성
            String requestMethod = exchange.getRequestMethod();

            if(requestMethod.equals("POST")) {
                System.out.println("post request");

                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), "utf-8");
                BufferedReader br = new BufferedReader(isr);

                StringBuilder sb = new StringBuilder();
                String query;
                while((query = br.readLine()) != null) {
                    sb.append(query); // POST Request 로 받은 데이터 전체를 sb에 문자열로 저장
                }

                String response = "{\"result\":\"well done.\"}";
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();

                try {
                    // json 파싱 코드 추가
//                    String httpData = String.valueOf(sb);
//                    JSONParser parser = new JSONParser();
//                    JSONObject jsonObject = (JSONObject) parser.parse(httpData); // 파싱한 httpData 를 JSONObject 객체에 담는다
//                    // key value 에 "data"가 없을 때 예외처리 추가
//                    httpRecordQueue.put(dataConvert((String) jsonObject.get("data")));
                    httpRecordQueue.put(dataConvert(String.valueOf(sb)));
                } catch (Exception e) {
                    System.out.println(e);
                }

            }
        }
    }

    protected SourceRecord dataConvert(String httpMessage) {
        System.out.printf("Converting HTTP Message : %s", httpMessage);

        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourcePartition
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                config.getString("kafka.topic"),  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                "http",  // java.lang.Object key (kafka message key)
                Schema.STRING_SCHEMA,  // Schema valueSchema
                httpMessage,  // java.lang.Object value (kafka message value)
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        System.out.printf("Converted HTTP Message : %s", sourceRecord);
        return sourceRecord;
    }


    @Override
    public void start(Map<String, String> props) {
        config = new HttpSourceConnectorOldConfig(props);
        try {
            startHTTPServer();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        List<SourceRecord> records = new ArrayList<>();
        records.add(httpRecordQueue.take());
        return records;
    }

    @Override
    public void stop() {
        server.stop(3);
    }
}

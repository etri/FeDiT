package kr.co.e8ight.ndxpro.dataAdapter.sink;

import com.google.common.base.Strings;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.flume.*;
import org.apache.flume.conf.Configurable;
import org.apache.flume.sink.AbstractSink;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class CallRestApiSink extends AbstractSink implements Configurable {
    private static final Logger log = LoggerFactory.getLogger(CallRestApiSink.class);
    private String ingestServer;
    //todo Use max dump size
    public static final int DEFAULT_MAX_BYTE_DUMP = 16;
    public static final String MAX_BYTES_DUMP_KEY = "maxBytesToLog";

    @Override
    public void configure(Context context) {
        ingestServer = context.getString("INGEST_SERVER", "");
        String strMaxBytes = context.getString(MAX_BYTES_DUMP_KEY);
        if (!Strings.isNullOrEmpty(strMaxBytes)) {
            try {
                Integer.parseInt(strMaxBytes);
            } catch (NumberFormatException e) {
                log.warn(String.format("Unable to convert %s to integer, using default value(%d) for maxByteToDump", strMaxBytes,
                        DEFAULT_MAX_BYTE_DUMP));
            }
        }
        log.info("IngestServer : {}",ingestServer);
    }

    @Override
    public Status process() throws EventDeliveryException {
        Status result = Status.READY;
        Channel channel = getChannel();
        Transaction transaction = channel.getTransaction();
        Event event = null;

        try {
            transaction.begin();
            event = channel.take();

            if (event != null) {
                String content = new String(event.getBody(), StandardCharsets.UTF_8);
                log.info("Logger: " + content);
                if (!"".equals(content) ) {
                    if (content.startsWith("{") || content.startsWith("[")) {
                        String resultConnect = httpConnection(ingestServer, content);
                        log.info("{}", resultConnect);
                    }
                }
            } else {
                // No event found, request back-off semantics from the sink runner
                result = Status.BACKOFF;
            }
            transaction.commit();

        } catch (Exception ex) {
            transaction.rollback();
            throw new EventDeliveryException("Failed to log event: " + event, ex);
        } finally {
            transaction.close();
        }

        return result;
    }

    private String httpConnection(String targetUrl, String jsonBody) {
        URL url;
        HttpURLConnection conn = null;
        BufferedReader br = null;
        StringBuffer sb;
        String returnText = null;
        String jsonData;
        int responseCode;

        try {
            url = new URL(targetUrl);

            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestMethod("POST");

            if (!"".equals(jsonBody)) {
                conn.setDoOutput(true);
                OutputStreamWriter wr = new OutputStreamWriter(conn.getOutputStream());
                wr.write(jsonBody);
                wr.flush();
            }
            responseCode = conn.getResponseCode();
            log.debug("responseCode : {}", responseCode);

            if (responseCode < 400) {
                br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            } else {
                br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
            }

            sb = new StringBuffer();

            while ((jsonData = br.readLine()) != null) {
                sb.append(jsonData);
            }
            returnText = sb.toString();

            log.debug("returnText:{}",returnText);
        } catch (IOException e) {
            log.error("Exception : " + ExceptionUtils.getStackTrace(e));
        } finally {
            try {
                br.close();
                conn.disconnect();
            } catch (Exception e2) {
                log.error("Exception : " + ExceptionUtils.getStackTrace(e2));
            }
        }
        return returnText;
    }
}

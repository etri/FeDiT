package net.jw.twin.data_interface.rest_controller.v1;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.jw.twin.common.exception.CustomException;
import net.jw.twin.common.response.ResponseService;
import net.jw.twin.common.response.model.CommonResult;
import net.jw.twin.common.response.model.SingleResult;
import net.jw.twin.data_interface.exception.ErrorStatus;
import net.jw.twin.utils.avro.Avro2Mysql;
import org.apache.avro.Schema;
import org.apache.avro.file.DataFileReader;
import org.apache.avro.file.SeekableByteArrayInput;
import org.apache.avro.file.SeekableInput;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericDatumReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Base64;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/v1")
@Hidden
public class AvroController {
    private final ResponseService responseService;

    @Autowired
    DataSource datasource;

    @PostMapping(value = "/avro/find")
    public SingleResult<JsonArray> avroFind(@RequestBody JsonObject content) throws IOException, ClassNotFoundException, SQLException {
        JsonArray result = null;
        Connection connection = null;

        try {
            connection = datasource.getConnection();

            JsonElement avscElement = content.get("avsc");
            if (null == avscElement) {
                throw new CustomException(ErrorStatus.RECEIVED_PARAM__NULL, "avsc 파일 정보가 없습니다.", "avsc파일");
            }

            String avscStr = null;
            if(avscElement.isJsonPrimitive()){
                avscStr = avscElement.getAsString();
            }else if(avscElement.isJsonObject()){
                avscStr = avscElement.toString();
            }else {
                throw new CustomException(ErrorStatus.RECEIVED_PARAM__WRONG_TYPE, "avsc 정보가 Primitive, JsonObject 가 아닙니다.", "avsc");
            }

            Schema schema = new Schema.Parser().parse(avscStr);

            JsonElement matchElement = content.get("match");
            try {
                result = Avro2Mysql.find(connection, schema, matchElement.getAsJsonArray());
            } catch (Exception e) {
                throw new CustomException(ErrorStatus.DB__FAILED,
                        CustomException.SEND_DETAIL_MESSAGE.TRUE,
                        "avro find failed. msg : " + e.getMessage());
            }
        }
        finally {
            if(null!=connection) {
                connection.close();
            }
        }

        return responseService.getSingleResult(result);
    }

    @PostMapping(value = "/avro")
    public CommonResult avroUpsert(@RequestBody JsonObject content) throws IOException, ClassNotFoundException, SQLException {

        final HikariPoolMXBean poolMXBean = ((HikariDataSource) datasource).getHikariPoolMXBean();

        log.info("avroUpsert[begin]-connections info total: {}, active: {}, idle: {}, await: {}", poolMXBean.getTotalConnections(),
                poolMXBean.getActiveConnections(), poolMXBean.getIdleConnections(), poolMXBean.getThreadsAwaitingConnection());

        JsonElement element = content.get("avro");
        String dataString = null;
        if(element.isJsonPrimitive()){
            dataString = element.getAsString();
        }else if(element.isJsonObject()){
            dataString = element.toString();
        }else {
            throw new CustomException(ErrorStatus.RECEIVED_PARAM__WRONG_TYPE, "avro 정보가 Primitive, JsonObject 가 아닙니다.", "avro");
        }


        Base64.Decoder decoder = Base64.getDecoder();
        byte[] decodedBytes = decoder.decode(dataString);

        SeekableInput seekableByteArrayInput = new SeekableByteArrayInput(decodedBytes);
        GenericDatumReader<GenericData.Record> reader = new GenericDatumReader<>();
        DataFileReader<GenericData.Record> dataFileReader = new DataFileReader<>(seekableByteArrayInput, reader);
//        System.out.println(dataFileReader.getSchema().toString());

        GenericData.Record record = null;
        while (dataFileReader.hasNext()){
            record = dataFileReader.next(record);

            System.out.println(record.toString());
        }

        log.info("avroUpsert[middle] count : " + dataFileReader.getBlockCount());

        Connection connection = null;
        try {
            connection = datasource.getConnection();

            JsonArray matachJsonArray = null;
            JsonElement matchElement = content.get("match");
            if(null!=matchElement){
                matachJsonArray = matchElement.getAsJsonArray();
            }

            try {
                Avro2Mysql.upsert(connection, decodedBytes, matachJsonArray);
            } catch (SQLException se) {
                throw new CustomException(ErrorStatus.DB__FAILED,
                        "avro upsert failed. msg : " + se.getMessage());
            } catch (Exception e) {
                throw new CustomException(ErrorStatus.DB__FAILED,
                        CustomException.SEND_DETAIL_MESSAGE.TRUE,
                        "avro upsert failed. msg : " + e.getMessage());
            }
        }
        finally {
            if(null!=connection) {
                connection.close();
            }

            log.info("avroUpsert[end]-connections info total: {}, active: {}, idle: {}, await: {}", poolMXBean.getTotalConnections(),
                    poolMXBean.getActiveConnections(), poolMXBean.getIdleConnections(), poolMXBean.getThreadsAwaitingConnection());
        }

        return responseService.getSuccessResult();
    }
}

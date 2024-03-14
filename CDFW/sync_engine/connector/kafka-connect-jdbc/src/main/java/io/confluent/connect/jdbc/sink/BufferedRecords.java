/*
 * Copyright 2018 Confluent Inc.
 *
 * Licensed under the Confluent Community License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at
 *
 * http://www.confluent.io/confluent-community-license
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OF ANY KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations under the License.
 */

package io.confluent.connect.jdbc.sink;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.data.Timestamp;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.sink.SinkRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.BatchUpdateException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.stream.Collectors;
import java.util.Date;
import java.util.Arrays;


import io.confluent.connect.jdbc.dialect.DatabaseDialect;
import io.confluent.connect.jdbc.dialect.DatabaseDialect.StatementBinder;
import io.confluent.connect.jdbc.sink.metadata.FieldsMetadata;
import io.confluent.connect.jdbc.sink.metadata.SchemaPair;
import io.confluent.connect.jdbc.util.ColumnId;
import io.confluent.connect.jdbc.util.TableId;

import static java.util.Objects.isNull;
import static java.util.Objects.nonNull;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;

public class BufferedRecords {
  private static final Logger log = LoggerFactory.getLogger(BufferedRecords.class);

  private final TableId tableId;
  private final JdbcSinkConfig config;
  private final DatabaseDialect dbDialect;
  private final DbStructure dbStructure;
  private final Connection connection;

  private List<SinkRecord> records = new ArrayList<>();
  private Schema keySchema;
  private Schema valueSchema;
  private RecordValidator recordValidator;
  private FieldsMetadata fieldsMetadata;
  private PreparedStatement updatePreparedStatement;
  private PreparedStatement deletePreparedStatement;
  private StatementBinder updateStatementBinder;
  private StatementBinder deleteStatementBinder;
  private boolean deletesInBatch = false;
  private ObjectMapper objectMapper = new ObjectMapper();

  public BufferedRecords(
      JdbcSinkConfig config,
      TableId tableId,
      DatabaseDialect dbDialect,
      DbStructure dbStructure,
      Connection connection
  ) {
    this.tableId = tableId ;
    this.config = config;
    this.dbDialect = dbDialect;
    this.dbStructure = dbStructure;
    this.connection = connection;
    this.recordValidator = RecordValidator.create(config);
    if (config.dataType.equals("sensor")) {
      // System.out.println("######## if :" + config.dataType);
      // System.out.println("######## tableId :" + tableId);
      this.valueSchema = SchemaBuilder.struct()
    .field("digital_twin_id", Schema.STRING_SCHEMA)
    .field("sensor_id", Schema.STRING_SCHEMA)
    .field("data", Schema.STRING_SCHEMA) 
    .field("location", Schema.STRING_SCHEMA)
    .field("rowtime", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("digital_object")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("digital_twin_id", Schema.STRING_SCHEMA) 
    .field("digital_object_id", Schema.STRING_SCHEMA)
    .field("location", Schema.STRING_SCHEMA)
    .field("data", Schema.STRING_SCHEMA)
    .field("rowtime", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("UnalliedDigitalObjects")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("federated_digital_twin_id", Schema.STRING_SCHEMA)
    .field("digital_twin_id", Schema.STRING_SCHEMA) 
    .field("digital_object_id", Schema.STRING_SCHEMA)
    .field("location", Schema.STRING_SCHEMA)
    .field("data", Schema.STRING_SCHEMA)
    .field("rowtime", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("federated_digital_object")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("federated_digital_twin_id", Schema.STRING_SCHEMA) 
    .field("federated_digital_object_id", Schema.STRING_SCHEMA)
    .field("location", Schema.STRING_SCHEMA)
    .field("data", Schema.STRING_SCHEMA)
    .field("rowtime", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("simulation_result")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("simulation_data_id", Schema.STRING_SCHEMA)
    .field("simulation_id", Schema.STRING_SCHEMA)
    .field("input_data", Schema.STRING_SCHEMA)
    .field("result_data", Schema.STRING_SCHEMA)
    .field("trigger_time", Timestamp.SCHEMA)
    .field("result_time", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("control_result")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("control_data_id", Schema.STRING_SCHEMA)
    .field("controller_id", Schema.STRING_SCHEMA)
    .field("control_data_creator", Schema.STRING_SCHEMA)
    .field("control_creation_time",  Timestamp.SCHEMA)
    .field("control_execution_time", Timestamp.SCHEMA)
    .field("control_command", Schema.STRING_SCHEMA)
    .field("control_delivery_result", Schema.STRING_SCHEMA)
    .field("control_execution_result", Schema.STRING_SCHEMA)
    .field("control_delivery_time", Timestamp.SCHEMA)
    .build();
    } else if (config.dataType.equals("do_control_result")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("digital_twin_id", Schema.STRING_SCHEMA)
    .field("digital_object_control_result_id", Schema.STRING_SCHEMA)
    .field("digital_object_control_data_id", Schema.STRING_SCHEMA)
    .field("control_execution_time", Timestamp.SCHEMA)
    .field("control_execution_result", Schema.STRING_SCHEMA)
    .build();
    } else if (config.dataType.equals("fdo_control_result")) {
      this.valueSchema = SchemaBuilder.struct()
    .field("federated_digital_object_control_result_id", Schema.STRING_SCHEMA)
    .field("federated_digital_object_control_data_id", Schema.STRING_SCHEMA)
    .field("federated_digital_object_control_execution_time", Timestamp.SCHEMA)
    .field("federated_digital_object_control_execution_result", Schema.STRING_SCHEMA)
    .field("digital_object_id", Schema.STRING_SCHEMA)
    .build();
    } else {
      System.out.println("######## here is else// value shema null: " + config.dataType);
      System.out.println("######## tableId :" + tableId);
    }
  }

  public List<SinkRecord> add(SinkRecord record) throws SQLException, TableAlterOrCreateException {
    try {
      recordValidator.validate(record);
      final List<SinkRecord> flushed = new ArrayList<>();
  
      boolean schemaChanged = false;
      if (!Objects.equals(keySchema, record.keySchema())) {
        keySchema = record.keySchema();
        schemaChanged = true;
      }
      if (isNull(record.valueSchema())) {
        // For deletes, value and optionally value schema come in as null.
        // We don't want to treat this as a schema change if key schemas is the same
        // otherwise we flush unnecessarily.
        if (config.deleteEnabled) {
          deletesInBatch = true;
        }
      } else if (Objects.equals(valueSchema, record.valueSchema())) {
        if (config.deleteEnabled && deletesInBatch) {
          // flush so an insert after a delete of same record isn't lost
          flushed.addAll(flush());
        }
      } else {
        // value schema is not null and has changed. This is a real schema change.
        valueSchema = record.valueSchema();
        schemaChanged = true;
      }
      if (schemaChanged || updateStatementBinder == null) {
        // Each batch needs to have the same schemas, so get the buffered records out
        flushed.addAll(flush());
  
        // re-initialize everything that depends on the record schema
        final SchemaPair schemaPair = new SchemaPair(
            record.keySchema(),
            valueSchema
        );
        fieldsMetadata = FieldsMetadata.extract(
            tableId.tableName(),
            config.pkMode,
            config.pkFields,
            config.fieldsWhitelist,
            schemaPair
        );
        dbStructure.createOrAmendIfNecessary(
            config,
            connection,
            tableId,
            fieldsMetadata
        );
        final String insertSql = getInsertSql();
        final String deleteSql = getDeleteSql();
        log.debug(
            "{} sql: {} deleteSql: {} meta: {}",
            config.insertMode,
            insertSql,
            deleteSql,
            fieldsMetadata
        );
        close();
        updatePreparedStatement = dbDialect.createPreparedStatement(connection, insertSql);
        updateStatementBinder = dbDialect.statementBinder(
            updatePreparedStatement,
            config.pkMode,
            schemaPair,
            fieldsMetadata,
            dbStructure.tableDefinition(connection, tableId),
            config.insertMode
        );
        if (config.deleteEnabled && nonNull(deleteSql)) {
          deletePreparedStatement = dbDialect.createPreparedStatement(connection, deleteSql);
          deleteStatementBinder = dbDialect.statementBinder(
              deletePreparedStatement,
              config.pkMode,
              schemaPair,
              fieldsMetadata,
              dbStructure.tableDefinition(connection, tableId),
              config.insertMode
          );
        }
      }
      
      // set deletesInBatch if schema value is not null
      if (isNull(record.value()) && config.deleteEnabled) {
        deletesInBatch = true;
      }
  
      records.add(record);
  
      if (records.size() >= config.batchSize) {
        flushed.addAll(flush());
      }
      return flushed;
      
    } catch (Exception e) {
      log.error("Error occurred during add operation.", e);
      return new ArrayList<>();
    }

  }

  DateTimeFormatter formatter = new DateTimeFormatterBuilder()
      .appendPattern("yyyy-MM-dd HH:mm:ss")
      .appendFraction(ChronoField.MILLI_OF_SECOND, 0, 3, true) // min 2 max 3
      .toFormatter();



  @SuppressWarnings("unchecked")
  public List<SinkRecord> flush() throws SQLException {
    try {
      if (records.isEmpty()) {
        log.debug("Records is empty");
        return new ArrayList<>();
      }
      log.debug("Flushing {} buffered records", records.size());
      for (SinkRecord record : records) {
        try {
          Map<String, Object> recordValue = (Map<String, Object>) record.value();
                    
          Iterator<String> iteratorKey = recordValue.keySet().iterator();
          Struct valueStruct = new Struct(valueSchema);
          String[] validKeys = {"rowtime", "trigger_time", "result_time", "control_execution_time", "federated_digital_object_control_execution_time"};
          while (iteratorKey.hasNext()) {
            String key = iteratorKey.next();
            
            if (Arrays.asList(validKeys).contains(key)) {
              LocalDateTime dateTime = LocalDateTime.parse(recordValue.get(key).toString(), formatter);
              long epochTime = dateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
              valueStruct.put(key, new Date(epochTime));
            } else if (key.equals("data") || key.equals("control_command")) {
              ObjectMapper objectMapper = new ObjectMapper();
              try {
                String jsonString = recordValue.get(key).toString();
                JsonNode jsonNode = objectMapper.readTree(jsonString);
                // valueStruct.put(key, recordValue.get(key));
                valueStruct.put(key, jsonNode.toString());
              } catch (Exception e) {
                ObjectNode jsonObject = objectMapper.createObjectNode();
                jsonObject.put("TypeError", recordValue.toString());
                String jsonString = jsonObject.toString();
                valueStruct.put(key, jsonString);
                continue; // 유효하지 않은 JSON인 경우
              }        
            } else if (key.equals("location")) {
              try {
                String jsonString = recordValue.get(key).toString();
                valueStruct.put(key, jsonString);
              } catch (Exception e) {
                ObjectMapper objectMapper = new ObjectMapper();
                ObjectNode jsonObject = objectMapper.createObjectNode();
                jsonObject.put("TypeError", recordValue.toString());
                String jsonString = jsonObject.toString();
                valueStruct.put(key, jsonString);
                continue; // 유효하지 않은 JSON인 경우
              }        
            } else {
              valueStruct.put(key, recordValue.get(key));
            }     
          }
          SinkRecord valueRecord =
                  new SinkRecord(
                          record.topic(),
                          record.kafkaPartition(),
                          record.keySchema(),
                          record.key(),
                          valueSchema,
                          valueStruct,
                          record.kafkaOffset()
                  );
  
          if (isNull(record.value()) && nonNull(deleteStatementBinder)) {
            deleteStatementBinder.bindRecord(record);
          } else {
            updateStatementBinder.bindRecord(valueRecord);
          }
        } catch (Exception e) {
          log.error("Error for() processing record: Skipping this record.", record, e);
          continue;
        }
      }
      executeUpdates();
      executeDeletes();
  
      final List<SinkRecord> flushedRecords = records;
      records = new ArrayList<>();
      deletesInBatch = false;
      return flushedRecords;
      
    } catch (Exception e) {
      log.error("Error occurred during flush operation.", e);
      // 예외 처리 후의 동작을 결정하고 return할 값을 지정
      return new ArrayList<>();
    }
    
  }


  private void prodKafka(String topic, Map<String, Object> data) throws Exception {
    Properties props = new Properties();
    props.put("bootstrap.servers", "localhost:9092");
    props.put("acks", "all");
    props.put("retries", 0);
    props.put("batch.size", 16384);
    props.put("linger.ms", 1);
    props.put("buffer.memory", 33554432);
    props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
    props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
    Producer<String, String> producer = new KafkaProducer<String, String>(props);

    try {
      producer.send(
              new ProducerRecord<String, String>(topic, objectMapper.writeValueAsString(data))
      );
      //System.out.println("Message sent successfully" + data);
      producer.close();
    } catch (Exception e) {
      System.out.println("Kafka Produce Exception : " + e);
    }
  }

  private void executeUpdates() throws SQLException {
    int[] batchStatus = updatePreparedStatement.executeBatch();
    for (int updateCount : batchStatus) {
      if (updateCount == Statement.EXECUTE_FAILED) {
        throw new BatchUpdateException(
                "Execution failed for part of the batch update", batchStatus);
      }
    }
  }

  private void executeDeletes() throws SQLException {
    if (nonNull(deletePreparedStatement)) {
      int[] batchStatus = deletePreparedStatement.executeBatch();
      for (int updateCount : batchStatus) {
        if (updateCount == Statement.EXECUTE_FAILED) {
          throw new BatchUpdateException(
                  "Execution failed for part of the batch delete", batchStatus);
        }
      }
    }
  }

  public void close() throws SQLException {
    log.debug(
        "Closing BufferedRecords with updatePreparedStatement: {} deletePreparedStatement: {}",
        updatePreparedStatement,
        deletePreparedStatement
    );
    if (nonNull(updatePreparedStatement)) {
      updatePreparedStatement.close();
      updatePreparedStatement = null;
    }
    if (nonNull(deletePreparedStatement)) {
      deletePreparedStatement.close();
      deletePreparedStatement = null;
    }
  }

  private String getInsertSql() throws SQLException {
    switch (config.insertMode) {
      case INSERT:
        return dbDialect.buildInsertStatement(
            tableId,
            asColumns(fieldsMetadata.keyFieldNames),
            asColumns(fieldsMetadata.nonKeyFieldNames),
            dbStructure.tableDefinition(connection, tableId)
        );
      case UPSERT:
        if (fieldsMetadata.keyFieldNames.isEmpty()) {
          throw new ConnectException(String.format(
              "Write to table '%s' in UPSERT mode requires key field names to be known, check the"
                  + " primary key configuration",
              tableId
          ));
        }
        try {
          return dbDialect.buildUpsertQueryStatement(
              tableId,
              asColumns(fieldsMetadata.keyFieldNames),
              asColumns(fieldsMetadata.nonKeyFieldNames),
              dbStructure.tableDefinition(connection, tableId)
          );
        } catch (UnsupportedOperationException e) {
          throw new ConnectException(String.format(
              "Write to table '%s' in UPSERT mode is not supported with the %s dialect.",
              tableId,
              dbDialect.name()
          ));
        }
      case UPDATE:
        return dbDialect.buildUpdateStatement(
            tableId,
            asColumns(fieldsMetadata.keyFieldNames),
            asColumns(fieldsMetadata.nonKeyFieldNames),
            dbStructure.tableDefinition(connection, tableId)
        );
      default:
        throw new ConnectException("Invalid insert mode");
    }
  }

  private String getDeleteSql() {
    String sql = null;
    if (config.deleteEnabled) {
      switch (config.pkMode) {
        case RECORD_KEY:
          if (fieldsMetadata.keyFieldNames.isEmpty()) {
            throw new ConnectException("Require primary keys to support delete");
          }
          try {
            sql = dbDialect.buildDeleteStatement(
                tableId,
                asColumns(fieldsMetadata.keyFieldNames)
            );
          } catch (UnsupportedOperationException e) {
            throw new ConnectException(String.format(
                "Deletes to table '%s' are not supported with the %s dialect.",
                tableId,
                dbDialect.name()
            ));
          }
          break;

        default:
          throw new ConnectException("Deletes are only supported for pk.mode record_key");
      }
    }
    return sql;
  }

  private Collection<ColumnId> asColumns(Collection<String> names) {
    return names.stream()
        .map(name -> new ColumnId(tableId, name))
        .collect(Collectors.toList());
  }
}

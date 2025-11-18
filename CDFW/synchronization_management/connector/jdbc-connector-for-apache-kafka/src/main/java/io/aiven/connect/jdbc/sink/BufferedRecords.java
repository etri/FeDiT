/*
 * Copyright 2024 Aiven Oy and jdbc-connector-for-apache-kafka project contributors
 * Copyright 2016 Confluent Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.aiven.connect.jdbc.sink;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.data.Timestamp;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.sink.SinkRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.aiven.connect.jdbc.dialect.DatabaseDialect;
import io.aiven.connect.jdbc.dialect.DatabaseDialect.StatementBinder;
import io.aiven.connect.jdbc.sink.metadata.FieldsMetadata;
import io.aiven.connect.jdbc.sink.metadata.SchemaPair;
import io.aiven.connect.jdbc.util.ColumnId;
import io.aiven.connect.jdbc.util.TableDefinition;
import io.aiven.connect.jdbc.util.TableId;

import static io.aiven.connect.jdbc.sink.JdbcSinkConfig.InsertMode.MULTI;

public class BufferedRecords {
    private static final Logger log = LoggerFactory.getLogger(BufferedRecords.class);

    private final TableId tableId;
    private final JdbcSinkConfig config;
    private final DatabaseDialect dbDialect;
    private final DbStructure dbStructure;
    private final Connection connection;

    private final List<SinkRecord> records = new ArrayList<>();
    private final List<SinkRecord> tombstoneRecords = new ArrayList<>();
    private SchemaPair currentSchemaPair;
    private FieldsMetadata fieldsMetadata;
    private TableDefinition tableDefinition;
    private PreparedStatement preparedStatement;
    private StatementBinder preparedStatementBinder;

    private PreparedStatement deletePreparedStatement;
    private StatementBinder deletePreparedStatementBinder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter FORMATTER =
        new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd HH:mm:ss")
            .optionalStart()
                // millisecond 1~3자리 허용 (.S, .SS, .SSS)
                .appendFraction(ChronoField.MILLI_OF_SECOND, 1, 3, true)
            .optionalEnd()
            .toFormatter();

    public BufferedRecords(
            final JdbcSinkConfig config,
            final TableId tableId,
            final DatabaseDialect dbDialect,
            final DbStructure dbStructure,
            final Connection connection
    ) {
        this.tableId = tableId;
        this.config = config;
        this.dbDialect = dbDialect;
        this.dbStructure = dbStructure;
        this.connection = connection;
    }

    // === 사용자 정의 value 스키마 빌더 ===
    private Schema buildValueSchema(final String dataType) {
        if (dataType == null || dataType.isEmpty()) {
            return null;
        }

        switch (dataType) {
            case "sensor":
                return SchemaBuilder.struct()
                    .field("digital_twin_id", Schema.STRING_SCHEMA)
                    .field("sensor_id", Schema.STRING_SCHEMA)
                    .field("data", Schema.STRING_SCHEMA)
                    .field("location", Schema.STRING_SCHEMA)
                    .field("rowtime", Timestamp.SCHEMA)
                    .build();

            case "digital_object":
            case "UnalliedDigitalObjects":
                return SchemaBuilder.struct()
                    .field("digital_twin_id", Schema.STRING_SCHEMA)
                    .field("digital_object_id", Schema.STRING_SCHEMA)
                    .field("location", Schema.STRING_SCHEMA)
                    .field("data", Schema.STRING_SCHEMA)
                    .field("rowtime", Timestamp.SCHEMA)
                    .build();

            case "federated_digital_object":
                return SchemaBuilder.struct()
                    .field("federated_digital_twin_id", Schema.STRING_SCHEMA)
                    .field("federated_digital_object_id", Schema.STRING_SCHEMA)
                    .field("location", Schema.STRING_SCHEMA)
                    .field("data", Schema.STRING_SCHEMA)
                    .field("rowtime", Timestamp.SCHEMA)
                    .build();

            case "simulation_result":
                return SchemaBuilder.struct()
                    .field("simulation_data_id", Schema.STRING_SCHEMA)
                    .field("simulation_id", Schema.STRING_SCHEMA)
                    .field("input_data", Schema.STRING_SCHEMA)
                    .field("result_data", Schema.STRING_SCHEMA)
                    .field("trigger_time", Timestamp.SCHEMA)
                    .field("result_time", Timestamp.SCHEMA)
                    .build();

            case "control_result":
                return SchemaBuilder.struct()
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

            case "do_control_result":
                return SchemaBuilder.struct()
                    .field("digital_twin_id", Schema.STRING_SCHEMA)
                    .field("digital_object_control_result_id", Schema.STRING_SCHEMA)
                    .field("digital_object_control_data_id", Schema.STRING_SCHEMA)
                    .field("control_execution_time", Timestamp.SCHEMA)
                    .field("control_execution_result", Schema.STRING_SCHEMA)
                    .field("digital_object_id", Schema.STRING_SCHEMA)
                    .build();

            case "fdo_control_result":
                return SchemaBuilder.struct()
                    .field("federated_digital_object_id", Schema.STRING_SCHEMA)
                    .field("federated_digital_object_control_result_id", Schema.STRING_SCHEMA)
                    .field("federated_digital_object_control_data_id", Schema.STRING_SCHEMA)
                    .field("federated_digital_object_control_execution_time", Timestamp.SCHEMA)
                    .field("federated_digital_object_control_execution_result", Schema.STRING_SCHEMA)
                    .field("digital_object_id", Schema.STRING_SCHEMA)
                    .build();

            default:
                return null;
        }
    }

    // === Map→Struct 변환 + 타임스탬프/JSON 정규화 ===
    @SuppressWarnings("unchecked")
    private SinkRecord transformRecord(final SinkRecord record) {
        // tombstone은 그대로
        if (record.value() == null) {
            return record;
        }

        // 이미 Struct 등인 경우 패스
        if (!(record.value() instanceof Map)) {
            return record;
        }

        final String dt = config.dataType;
        final Schema targetSchema = buildValueSchema(dt);
        if (targetSchema == null) {
            return record; // data.type 미지정이면 패스
        }

        final Map<String, Object> map = (Map<String, Object>) record.value();
        final Struct struct = new Struct(targetSchema);

        for (final Map.Entry<String, Object> e : map.entrySet()) {
            final String key = e.getKey();
            final Object val = e.getValue();
            try {
                if (isTimestampKey(key)) {
                    final LocalDateTime ldt = LocalDateTime.parse(String.valueOf(val), FORMATTER);
                    final long epoch = ldt.toInstant(ZoneOffset.UTC).toEpochMilli();
                    struct.put(key, new Date(epoch));
                } else if ("data".equals(key) || "control_command".equals(key)) {
                    final String s = String.valueOf(val);
                    try {
                        // 타입 참조 줄이기: JsonNode 변수 선언 없이 바로 직렬화 문자열만 사용
                        struct.put(key, objectMapper.readTree(s).toString());
                    } catch (final Exception ex) {
                        // ObjectNode 타입 참조 없이, Map → JSON 직렬화로 대체
                        struct.put(key, objectMapper.writeValueAsString(
                            Collections.singletonMap("TypeError", String.valueOf(map))
                        ));
                    }
                } else if ("location".equals(key)) {
                    struct.put(key, String.valueOf(val));
                } else {
                    struct.put(key, val);
                }
            } catch (final Exception ex) {
                log.warn("Failed to transform field '{}' with value '{}' : {}", key, val, ex.toString());
            }
        }

        return new SinkRecord(
            record.topic(),
            record.kafkaPartition(),
            record.keySchema(),
            record.key(),
            targetSchema,
            struct,
            record.kafkaOffset(),
            record.timestamp(),
            record.timestampType(),
            record.headers()
        );
    }

    private static final Set<String> TS_KEYS = Set.of(
        "rowtime",
        "trigger_time",
        "result_time",
        "control_execution_time",
        "federated_digital_object_control_execution_time"
    );

    private static boolean isTimestampKey(final String key) {
        return TS_KEYS.contains(key);
    }

    public List<SinkRecord> add(final SinkRecord record) throws SQLException {
        // 1) 먼저 사용자 전처리 적용
        final SinkRecord effectiveRecord = transformRecord(record);

        // 2) 변환된 레코드 기준으로 스키마 쌍 계산
        final SchemaPair schemaPair = new SchemaPair(
                effectiveRecord.keySchema(),
                effectiveRecord.valueSchema()
        );

        log.debug("buffered records in list {}", records.size());

        if (currentSchemaPair == null) {
            reInitialize(schemaPair);
        }

        final List<SinkRecord> flushed;
        // tombstone이거나, 스키마쌍이 동일하면 기존 배치에 붙임
        if (effectiveRecord.value() == null || currentSchemaPair.equals(schemaPair)) {
            if (config.deleteEnabled && isTombstone(effectiveRecord)) {
                tombstoneRecords.add(effectiveRecord);
            } else {
                records.add(effectiveRecord);
            }
            if (records.size() + tombstoneRecords.size() >= config.batchSize) {
                log.debug("Flushing buffered records {} and tombstone records {} "
                                + "after exceeding the configured batch size of {}.",
                        records.size(), tombstoneRecords.size(), config.batchSize);
                flushed = flush();
            } else {
                flushed = Collections.emptyList();
            }
        } else {
            // 스키마쌍이 바뀌면 일단 플러시하고 다시 시도
            log.debug("Flushing buffered records after due to unequal schema pairs: "
                    + "current schemas: {}, next schemas: {}", currentSchemaPair, schemaPair);
            flushed = flush();
            currentSchemaPair = null;
            flushed.addAll(add(effectiveRecord));
        }
        return flushed;
    }

    private void prepareStatement() throws SQLException {
        close();
        if (!records.isEmpty()) {
            final String insertSql = config.insertMode == MULTI ? getMultiInsertSql() : getInsertSql();
            log.debug("Prepared SQL for insert mode {} with {} records: {}",
                    config.insertMode, records.size(), insertSql);
            preparedStatement = connection.prepareStatement(insertSql);
            preparedStatementBinder = dbDialect.statementBinder(
                    preparedStatement,
                    config.pkMode,
                    currentSchemaPair,
                    fieldsMetadata,
                    config.insertMode
            );
        }

        if (!tombstoneRecords.isEmpty()) {
            final String deleteSql = getDeleteSql();
            log.debug("Prepared SQL for tombstone with {} records: {}", tombstoneRecords.size(), deleteSql);
            deletePreparedStatement = connection.prepareStatement(deleteSql);
            deletePreparedStatementBinder = dbDialect.statementBinder(
                    deletePreparedStatement,
                    config.pkMode,
                    currentSchemaPair,
                    fieldsMetadata,
                    config.insertMode
            );
        }
    }

    /**
     * Re-initialize everything that depends on the record schema
     */
    private void reInitialize(final SchemaPair schemaPair) throws SQLException {
        currentSchemaPair = schemaPair;
        fieldsMetadata = FieldsMetadata.extract(
                tableId.tableName(),
                config.pkMode,
                config.pkFields,
                config.fieldsWhitelist,
                currentSchemaPair
        );
        dbStructure.createOrAmendIfNecessary(
                config,
                connection,
                tableId,
                fieldsMetadata
        );

        tableDefinition = dbStructure.tableDefinitionFor(tableId, connection);
    }

    public List<SinkRecord> flush() throws SQLException {
        if (records.isEmpty() && tombstoneRecords.isEmpty()) {
            log.debug("Records and tombstone records are empty.");
            return new ArrayList<>();
        }

        prepareStatement();
        bindRecords();

        processBatch(records, "regular");
        processBatch(tombstoneRecords, "tombstone");

        final List<SinkRecord> flushedRecords = new ArrayList<>(records);
        flushedRecords.addAll(tombstoneRecords);

        records.clear();
        tombstoneRecords.clear();

        return flushedRecords;
    }

    private void processBatch(final List<SinkRecord> batchRecords, final String recordType) throws SQLException {
        if (batchRecords.isEmpty()) {
            log.debug("No {} records to process.", recordType);
            return;
        }

        int totalSuccessfulExecutionCount = 0;
        boolean successNoInfo = false;

        log.debug("Executing {} record batch...", recordType);
        final int[] updateCounts = recordType.equals("tombstone") ? executeDeleteBatch() : executeBatch();
        for (final int updateCount : updateCounts) {
            if (updateCount == Statement.SUCCESS_NO_INFO) {
                successNoInfo = true;
            } else {
                totalSuccessfulExecutionCount += updateCount;
            }
        }

        log.debug("Done executing {} record batch.", recordType);
        verifySuccessfulExecutions(totalSuccessfulExecutionCount, batchRecords, successNoInfo, recordType);
    }

    private void verifySuccessfulExecutions(final int totalSuccessfulExecutionCount,
                                            final List<SinkRecord> batchRecords,
                                            final boolean successNoInfo,
                                            final String recordType) {
        if (totalSuccessfulExecutionCount != batchRecords.size() && !successNoInfo) {
            switch (config.insertMode) {
                case INSERT:
                case MULTI:
                    throw new ConnectException(String.format(
                            "Update count (%d) did not sum up to total number of %s records (%d)",
                            totalSuccessfulExecutionCount,
                            recordType,
                            batchRecords.size()
                    ));
                case UPSERT:
                case UPDATE:
                    log.debug("{} {} records:{} resulting in totalSuccessfulExecutionCount:{}",
                            config.insertMode,
                            recordType,
                            batchRecords.size(),
                            totalSuccessfulExecutionCount
                    );
                    break;
                default:
                    throw new ConnectException("Unknown insert mode: " + config.insertMode);
            }
        }

        if (successNoInfo) {
            log.info("{} {} records:{} , but no count of the number of rows it affected is available",
                    config.insertMode,
                    recordType,
                    batchRecords.size()
            );
        }
    }

    private int[] executeBatch() throws SQLException {
        if (preparedStatement != null) {
            if (config.insertMode == MULTI) {
                preparedStatement.addBatch();
            }
            log.debug("Executing batch with insert mode {}", config.insertMode);
            return preparedStatement.executeBatch();
        }
        return new int[0];
    }

    private int[] executeDeleteBatch() throws SQLException {
        if (deletePreparedStatement != null) {
            log.debug("Executing batch delete");
            return deletePreparedStatement.executeBatch();
        }
        return new int[0];
    }

    private void bindRecords() throws SQLException {
        log.debug("Binding {} buffered records", records.size());
        int index = 1;
        for (final SinkRecord record : records) {
            if (config.insertMode == MULTI) {
                // All records are bound to the same prepared statement,
                // so when binding fields for record N (N > 0)
                // we need to start at the index where binding fields for record N - 1 stopped.
                index = preparedStatementBinder.bindRecord(index, record);
            } else {
                preparedStatementBinder.bindRecord(record);
            }
        }

        for (final SinkRecord tombstoneRecord : tombstoneRecords) {
            deletePreparedStatementBinder.bindTombstoneRecord(tombstoneRecord);
        }
        log.debug("Done binding records.");
    }

    private boolean isTombstone(final SinkRecord record) {
        // Tombstone records are events with a null value.
        return record.value() == null;
    }

    public void close() throws SQLException {
        log.info("Closing BufferedRecords with preparedStatement: {}", preparedStatement);
        if (preparedStatement != null) {
            preparedStatement.close();
            preparedStatement = null;
        }

        log.info("Closing BufferedRecords with deletePreparedStatement: {}", deletePreparedStatement);
        if (deletePreparedStatement != null) {
            deletePreparedStatement.close();
            deletePreparedStatement = null;
        }
    }

    private String getMultiInsertSql() {
        if (config.insertMode != MULTI) {
            throw new ConnectException(String.format(
                    "Multi-row first insert SQL unsupported by insert mode %s",
                    config.insertMode
            ));
        }
        try {
            return dbDialect.buildMultiInsertStatement(
                    tableId,
                    records.size(),
                    asColumns(fieldsMetadata.keyFieldNames),
                    asColumns(fieldsMetadata.nonKeyFieldNames)
            );
        } catch (final UnsupportedOperationException e) {
            throw new ConnectException(String.format(
                    "Write to table '%s' in MULTI mode is not supported with the %s dialect.",
                    tableId,
                    dbDialect.name()
            ));
        }
    }

    private String getInsertSql() {
        switch (config.insertMode) {
            case INSERT:
                return dbDialect.buildInsertStatement(
                        tableId,
                        tableDefinition,
                        asColumns(fieldsMetadata.keyFieldNames),
                        asColumns(fieldsMetadata.nonKeyFieldNames)
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
                            tableDefinition,
                            asColumns(fieldsMetadata.keyFieldNames),
                            asColumns(fieldsMetadata.nonKeyFieldNames)
                    );
                } catch (final UnsupportedOperationException e) {
                    throw new ConnectException(String.format(
                            "Write to table '%s' in UPSERT mode is not supported with the %s dialect.",
                            tableId,
                            dbDialect.name()
                    ));
                }
            case UPDATE:
                return dbDialect.buildUpdateStatement(
                        tableId,
                        tableDefinition,
                        asColumns(fieldsMetadata.keyFieldNames),
                        asColumns(fieldsMetadata.nonKeyFieldNames)
                );
            default:
                throw new ConnectException("Invalid insert mode");
        }
    }

    private String getDeleteSql() {
        return dbDialect.buildDeleteStatement(
            tableId,
            tombstoneRecords.size(),
            asColumns(fieldsMetadata.keyFieldNames)
        );
    }

    private Collection<ColumnId> asColumns(final Collection<String> names) {
        return names.stream()
                .map(name -> new ColumnId(tableId, name))
                .collect(Collectors.toList());
    }
}

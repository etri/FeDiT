import path from 'node:path';
import avro from 'avsc';
import config from '@/config';
import AvroDateType from '@/utils/avsc/DateType'
import LoggerInstance from '@/loaders/logger';

export class AvroSchema {
    schemaPath: string;
    schema: avro.Schema;

    constructor(schemaPath: string) {
        this.schemaPath = schemaPath;

        let resolvedPath = path.resolve(config.path.assets, './'+schemaPath);
        let logicalTypeDefs = { 'timestamp-millis': AvroDateType };
        try {
            this.schema = avro.parse(resolvedPath, { logicalTypes: logicalTypeDefs });
        }catch(e){
            LoggerInstance.error(`🔥 failed to parse avro schema: ${resolvedPath}`);
            throw e;
        }
    }

    getSchema():avro.Schema {
        return this.schema;
    }
} 
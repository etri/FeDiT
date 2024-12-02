import path from 'node:path';
import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';
import mysql, { Connection } from 'mysql2/promise';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/avroschema';
import { getDateString } from '@/utils/time';

export default async (mysqlConnection: Connection) => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaRiverWaterLevel = new AvroSchema(config.avro.schemaPath.riverWaterLevel)
        Container.set('avroSchemaRiverWaterLevel', avroSchemaRiverWaterLevel);

        Container.set('mysqlConnection', mysqlConnection);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let date = new Date(Date.now());
                let date_5 = new Date(date.getTime() - 5*60*1000);

                LoggerInstance.info('cron job is called date:' + getDateString(date));  

                const schemaRiverWaterLevel: AvroSchema = Container.get('avroSchemaRiverWaterLevel');
                const mysqlConnection: Connection = Container.get('mysqlConnection');

                let encoder = new avro.streams.BlockEncoder(schemaRiverWaterLevel.getSchema());

                const sql_query = 'select * from measurement where ? <= `measurement_date` and `measurement_date` <= ?;'
                let values: any[] = [`${getDateString(date_5)}`, `${getDateString(date)}`];

                const [results] = await mysqlConnection.execute(sql_query, values);

                if (Array.isArray(results)) {
                    results.forEach(element => {
                        let data = element as any;
                        data.measurement_date = new Date(data.measurement_date);
                        encoder.write(element);

                        // LoggerInstance.info(JSON.stringify(data));
                    });
                }else{
                    throw new Error("result is not array.");
                }

                encoder.end();

                const buff = [];
                for await (let chunk of encoder) {
                    buff.push(chunk);
                }

                const binaryData = Buffer.concat(buff);

                axios.post(config.baseIpAddress.dataInterface_upsert,
                    {
                        avro: Buffer.from(binaryData).toString('base64')
                    }).then((res) => {
                        LoggerInstance.info(JSON.stringify(res.data));
                    }).catch(error => {
                        // LoggerInstance.error(JSON.stringify(error.response.data), error);
                        LoggerInstance.error(JSON.stringify(error), error);
                    });

            } catch (e) {
                LoggerInstance.error(e);
            }
        });

        Container.set('cronHandler', cronhandlerInstance);

        cronhandlerInstance.start();
    } catch (e) {
        LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
        throw e;
    }
};
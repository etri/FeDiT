import path from 'node:path';
import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/avroschema';
import { getDataTime } from '@/utils/time';

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaRoadCondition = new AvroSchema(config.avro.schemaPath.roadCondition)
        Container.set('avroSchemaRoadCondition', avroSchemaRoadCondition);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let data_time = getDataTime(new Date());

                LoggerInstance.info('cron job is called date:' + data_time);

                const apiKey = config.openapi.keys.jejucits;
                const apiUrl = config.openapi.url;
                const response = await axios.get(apiUrl, { params: { code: apiKey } });

                const result = response?.data?.result;
                if (result != "success") {
                    throw new Error(result ? result : "openapi response error.");
                }

                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');
                const schemaRoadCondition: AvroSchema = Container.get('avroSchemaRoadCondition');
                
                let encoder = new avro.streams.BlockEncoder(schemaRoadCondition.getSchema());

                const promises = response.data.info.map(async(item: any) => {
                    item.id = Number(item.id);
                    item.link_id = Number(item.link_id);
                    item.visibility = Number(item.visibility);
                    item.snow = Number(item.snow);
                    item.road_temp = Number(item.road_temp);
                    item.water_film = Number(item.water_film);
                    item.friction = String(item.friction);
                    item.code = String(item.code);
                    item.date_time = data_time;

                    let matchItems = [
                        {
                            name: "type",
                            value: "ROAD_GPS"
                        },
                        {
                            name: "latitude",
                            value: item.latitude
                        },
                        {
                            name: "longitude",
                            value: item.longitude
                        }
                    ];
                        
                    try {
                    let res = await axios.post(config.baseIpAddress.dataInterface_find,
                        {
                            avsc: schemaMeasurePosition.getSchema(),
                            match: matchItems
                        });
                        item.measure_position_id = res.data.data[0].id;
                    } catch(e) {
                        LoggerInstance.error("avro find failed.");
                        throw e;
                    }

                    encoder.write(item);
                });

                await Promise.all(promises);
                encoder.end();

                const buff = [];
                for await (let chunk of encoder) {
                    buff.push(chunk);
                }

                const binaryData = Buffer.concat(buff);

                LoggerInstance.info('before avro send. ');

                axios.post(config.baseIpAddress.dataInterface_upsert,
                    {
                        avro: Buffer.from(binaryData).toString('base64')
                    }).then((res) => {
                        LoggerInstance.info(JSON.stringify(res.data));
                    }).catch(error => {
                        LoggerInstance.error(JSON.stringify(error.response.data), error);
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
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

        const avroSchemaVvms = new AvroSchema(config.avro.schemaPath.vvms)
        Container.set('avroSchemaVvms', avroSchemaVvms);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let data_time = getDataTime(new Date());

                LoggerInstance.info('cron job is called date:' + data_time);             

                const apiKey = config.openapi.keys.jejucits;
                const apiUrl = config.openapi.url.vvms;
                const response = await axios.get(apiUrl, { params: { code: apiKey } });

                const result = response?.data?.result;
                if (result != "success") {
                    throw new Error(result ? result : "openapi response error.");
                }

                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');
                const schemaVvms: AvroSchema = Container.get('avroSchemaVvms');

                let encoder = new avro.streams.BlockEncoder(schemaVvms.getSchema());

                const promises = response.data.info.map(async (item: any) => {
                    item.date_time = data_time;
                    item.link_id = item.link_id ? Number(item.link_id) : null;
                    item.latitude = item.latitude ? String(item.latitude) : null;
                    item.longitude = item.longitude ? String(item.longitude) : null;
                    item.direction = item.heading ? parseInt(item.heading) : null;
                    item.intersection_type = item.base_type ? String(item.base_type) : null;
                    item.interscetion_shape = item.road_type ? Number(item.road_type) : null;
                    item.info = item.info ? String(item.info) : null;

                    let matchItems = [
                        {
                            name: "type",
                            value: "STANDARD_LINK"
                        },
                        {
                            name: "standard_link",
                            value: item.link_id
                        }
                    ];
                        
                    try {
                    let res = await axios.post(config.baseIpAddress.dataInterface_find,
                        {
                            avsc: schemaMeasurePosition.getSchema(),
                            match: matchItems
                        });
                        item.measure_position_id = res.data.data[0].id;
                        encoder.write(item);
                    } catch(e) {
                        LoggerInstance.error("avro find failed. measure_position_id not exist. link_id : " + item.link_id);
                    }
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
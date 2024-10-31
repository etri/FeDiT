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

        const avroSchemaTraffic = new AvroSchema(config.avro.schemaPath.traffic)
        Container.set('avroSchemaTraffic', avroSchemaTraffic);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let data_time = getDataTime(new Date());

                LoggerInstance.info('cron job is called date:' + data_time);

                const apiKey = config.openapi.keys.jejuits;
                const apiUrl = config.openapi.url.traffic;
                const response = await axios.get(apiUrl, { params: { code: apiKey, type: "L" } });

                const result = response?.data?.result;
                if (result != "success") {
                    throw new Error(result ? result : "openapi response error.");
                }

                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');
                const schemaTraffic: AvroSchema = Container.get('avroSchemaTraffic');

                let encoder = new avro.streams.BlockEncoder(schemaTraffic.getSchema());

                // const promises = response.data.info.map(async (item: any) => {
                for(const item of response.data.info) {
                    item.date_time = data_time;
                    item.link_id = item.link_id ? Number(item.link_id) : null;
                    item.prcn_dt = item.prcn_dt ? String(item.prcn_dt) : null;
                    item.tfvl = item.trvl_hh ? parseInt(item.trvl_hh) : null;
                    item.speed = item.sped ? parseInt(item.sped) : null;
                    item.trvl_hh = item.trvl_hh ? parseInt(item.trvl_hh) : null;

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
                    } catch (e) {
                        LoggerInstance.error("avro find failed. measure_position_id not exist. link_id : " + item.link_id);
                    }
                };

                // await Promise.all(promises);
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
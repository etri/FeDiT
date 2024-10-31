import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDateString_yyyymmddhhmmss } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaBeachWaterTemperature = new AvroSchema(config.avro.schemaPath.beachWaveHeight)
        Container.set('avroSchemaBeachWaterTemperature', avroSchemaBeachWaterTemperature);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');

                let matchItems = [
                    {
                        name: "type",
                        value: "BEACH"
                    }
                ];

                let res;
                try {
                    res = await axios.post(config.baseIpAddress.dataInterface_find,
                        {
                            avsc: schemaMeasurePosition.getSchema(),
                            match: matchItems
                        });
                } catch (e) {
                    LoggerInstance.error("avro find failed.");
                    throw e;
                }

                const schema: AvroSchema = Container.get('avroSchemaBeachWaterTemperature');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                const searchTime = getDateString_yyyymmddhhmmss(new Date());
                const promises = res.data.data.map(async (item: any) => {
                    const measure_position_id = item.id;
                    const baeachNumBase = 200000;
                    const beachNum = measure_position_id - baeachNumBase;
                    const apiKey = config.openapi.keys.datagokr;
                    const apiUrl = config.openapi.url;
                    const response = await axios.get(apiUrl, {
                        params: {
                            serviceKey: apiKey,
                            dataType: "JSON",
                            numOfRows: 100,
                            pageNo: 1,
                            searchTime: searchTime,
                            beach_num: beachNum
                        }
                    });

                    for (const element of response.data.response.body.items.item) {

                        const date_time = new Date(element.tm.substring(0, 4),
                            parseInt(element.tm.substring(4, 6)) - 1,
                            element.tm.substring(6, 8),
                            element.tm.substring(8, 10),
                            element.tm.substring(10));

                        encoder.write({
                            date_time: date_time,
                            measure_position_id: measure_position_id,
                            wave_height: parseParamFloat(element.wh)
                        })
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
                        LoggerInstance.error(error.message, error);
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
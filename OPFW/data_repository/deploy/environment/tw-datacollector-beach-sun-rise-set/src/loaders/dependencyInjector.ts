import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDataTime } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'

function getNowPlus(plus:number) {
    var date = new Date();
    date.setDate(date.getDate() + plus);
    return date;
}

function getDateTruncatedString(date:Date) {
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaBeachSunRiseSet = new AvroSchema(config.avro.schemaPath.beachSunRiseSet)
        Container.set('avroSchemaBeachSunRiseSet', avroSchemaBeachSunRiseSet);

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

                const schema: AvroSchema = Container.get('avroSchemaBeachSunRiseSet');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                const promises = res.data.data.map(async (item: any) => {
                    const measure_position_id = item.id;
                    const apiKey = config.openapi.keys.datagokr;
                    const apiUrl = config.openapi.url;
                    const response = await axios.get(apiUrl, {
                        params: {
                            serviceKey: apiKey,
                            returnType: "json",
                            numOfRows: 100,
                            pageNo: 1,
                            stationName: item.name,
                            dataTerm: "DAILY",
                            ver: "1.3"
                        }
                    });

                    for (const element of response.data.response.body.items) {

                        encoder.write({
                            date_time: new Date(element.dataTime),
                            measure_position_id: measure_position_id,
                            sunrise: `${element.sunrise}:00`,
                            sunset: `${element.sunset}:00`,
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
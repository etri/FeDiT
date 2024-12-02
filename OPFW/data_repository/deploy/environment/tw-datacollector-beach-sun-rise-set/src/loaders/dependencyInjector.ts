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

async function getData(encoder: avro.streams.BlockEncoder, baseDate: Date) {
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

    const baseDateStr = getDateTruncatedString(baseDate);
    const promises = res.data.data.map(async (item: any) => {
        const measure_position_id = item.id;
        const beachNumBase = 200000;
        const beachNum = measure_position_id - beachNumBase;
        const apiKey = config.openapi.keys.datagokr;
        const apiUrl = config.openapi.url;
        const response = await axios.get(apiUrl, {
            params: {
                serviceKey: apiKey,
                returnType: "JSON",
                numOfRows: 100,
                pageNo: 1,
                base_date: baseDateStr,
                beachNum: beachNum,
            }
        });

        for (const element of response.data.response.body.items.item) {

            encoder.write({
                date_time: new Date(element.dataTime),
                measure_position_id: measure_position_id,
                so2_value: parseParamFloat(element.so2Value),
                co_value: parseParamFloat(element.coValue),
                o3_value: parseParamFloat(element.o3Value),
                no2_value: parseParamFloat(element.no2Value),
                pm10_value: parseParamInt(element.pm10Value),
                pm10_expected_value: parseParamInt(element.pm10Value24),
                pm25_value: parseParamInt(element.pm25Value),
                pm25_expected_value: parseParamInt(element.pm25Value24),
                integrated_value: parseParamInt(element.khaiValue),
                integrated_grade: parseParamInt(element.khaiGrade),
                so2_grade: parseParamInt(element.so2Grade),
                co_grade: parseParamInt(element.coGrade),
                o3_grade: parseParamInt(element.o3Grade),
                no2_grade: parseParamInt(element.no2Grade),
                pm10_day_grade: parseParamInt(element.pm10Grade),
                pm25_day_grade: parseParamInt(element.pm25Grade),
                pm10_hour_grade: parseParamInt(element.pm10Grade1h),
                pm25_hour_grade: parseParamInt(element.pm25Grade1h),
                so2_flag: String(element.so2Flag),
                co_flag: String(element.coFlag),
                o3_flag: String(element.o3Flag),
                no2_flag: String(element.no2Flag),
                pm10_flag: String(element.pm10Flag),
                pm25_flag: String(element.pm25Flag)
            })
        }
    });

    await Promise.all(promises);
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
                            so2_value: parseParamFloat(element.so2Value),
                            co_value: parseParamFloat(element.coValue),
                            o3_value: parseParamFloat(element.o3Value),
                            no2_value: parseParamFloat(element.no2Value),
                            pm10_value: parseParamInt(element.pm10Value),
                            pm10_expected_value: parseParamInt(element.pm10Value24),
                            pm25_value: parseParamInt(element.pm25Value),
                            pm25_expected_value: parseParamInt(element.pm25Value24),
                            integrated_value: parseParamInt(element.khaiValue),
                            integrated_grade: parseParamInt(element.khaiGrade),
                            so2_grade: parseParamInt(element.so2Grade),
                            co_grade: parseParamInt(element.coGrade),
                            o3_grade: parseParamInt(element.o3Grade),
                            no2_grade: parseParamInt(element.no2Grade),
                            pm10_day_grade: parseParamInt(element.pm10Grade),
                            pm25_day_grade: parseParamInt(element.pm25Grade),
                            pm10_hour_grade: parseParamInt(element.pm10Grade1h),
                            pm25_hour_grade: parseParamInt(element.pm25Grade1h),
                            so2_flag: String(element.so2Flag),
                            co_flag: String(element.coFlag),
                            o3_flag: String(element.o3Flag),
                            no2_flag: String(element.no2Flag),
                            pm10_flag: String(element.pm10Flag),
                            pm25_flag: String(element.pm25Flag)
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
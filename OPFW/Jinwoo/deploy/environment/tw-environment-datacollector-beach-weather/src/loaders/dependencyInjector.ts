import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDateString_yyyymmddhhmmss, sleep } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'

async function parseData(measure_position_id: number, dataList: any[], currentItem: any) {
    const category = currentItem.category;
    let usingData = false;
    switch (category) {
        case "T1H":
        case "RN1":
        case "SKY":
        case "REH":
        case "PTY":
        case "VEC":
        case "WSD":
            usingData = true;
            break;
    }

    if (!usingData) {
        return;
    }

    const fcstDate = currentItem.fcstDate;
    const fcstTime = currentItem.fcstTime;
    const fcstValue = currentItem.fcstValue;

    const dateTime = new Date(fcstDate.substring(0, 4), fcstDate.substring(4, 6)-1, fcstDate.substring(6, 8), fcstTime.substring(0, 2), 0, 0);

    let beachWeather = dataList.find(item => item.date_time.getTime() == dateTime.getTime() && item.measure_position_id == measure_position_id);
    if (!beachWeather) {
        beachWeather = {
            measure_position_id: measure_position_id,
            date_time: dateTime,
            temperature: null,
            precipitation_one_hour: null,
            sky_status: null,
            humidity: null,
            rain_type: null,
            wind_direction: null,
            wind_speed: null
        };
        dataList.push(beachWeather);
    }

    switch (category) {
        case "T1H": { // 기온, Integer
            beachWeather.temperature = parseParamInt(fcstValue);
            break;
        }
        case "RN1": { // 1시간 강수량, String or float, "강수없음", 1.0, ..
            beachWeather.precipitation_one_hour = String(fcstValue);
            break;
        }
        case "SKY": { // 하늘상태, String
            beachWeather.sky_status = String(fcstValue);
            break;
        }
        case "REH": { // 습도, Integer
            beachWeather.humidity = parseParamInt(fcstValue);
            break;
        }
        case "PTY": { // 강수형태, Integer, 0~7
            beachWeather.rain_type = parseParamInt(fcstValue);
            break;
        }
        case "VEC": { // 풍향, Integer
            beachWeather.wind_direction = parseParamInt(fcstValue);
            break;
        }
        case "WSD": { // 풍속, Integer
            beachWeather.wind_speed = parseParamInt(fcstValue);
            break;
        }
    }
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaBeachWeather = new AvroSchema(config.avro.schemaPath.beachWeather)
        Container.set('avroSchemaBeachWeather', avroSchemaBeachWeather);

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

                const now = new Date();
                const hourTruncatedTime = new Date(now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    now.getHours(), 0, 0);
                let apiAvailableTime = new Date(hourTruncatedTime.setMinutes(45));
                let baseTime;
                if (now > apiAvailableTime) {
                    baseTime = new Date(hourTruncatedTime.setMinutes(30));
                } else {
                    baseTime = new Date(now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        now.getHours() - 1, 30, 0);
                }

                const baseDateStr = String(baseTime.getFullYear()
                    + String(baseTime.getMonth() + 1).padStart(2, '0')
                    + String(baseTime.getDate()).padStart(2, '0'));
                const baseTimeStr = String(baseTime.getHours()).padStart(2, '0')
                    + String(baseTime.getMinutes()).padStart(2, '0');


                let dataList: any[] = [];

                for(const item of res.data.data){
                    const measure_position_id = item.id;
                    const baeachNumBase = 200000;
                    const beachNum = measure_position_id - baeachNumBase;
                    const apiKey = config.openapi.keys.datagokr;
                    const apiUrl = config.openapi.url;
                    let response = null;

                    try {
                        response = await axios.get(apiUrl, {
                            params: {
                                serviceKey: apiKey,
                                dataType: "JSON",
                                numOfRows: 100,
                                pageNo: 1,
                                base_date: parseInt(baseDateStr),
                                base_time: parseInt(baseTimeStr),
                                beach_num: beachNum
                            }
                        });
                    } catch (e) {
                        LoggerInstance.error("get openapi data error : " + e);
                        return;
                    }
                    
                    let resultCode = response?.data?.response?.header?.resultCode;
                    if(!resultCode) {
                        LoggerInstance.error("get openapi response error.");
                        return;
                    }

                    if(resultCode!="00") {
                        LoggerInstance.error("resultCode is not '00'. resultCode : " + resultCode);
                        return;
                    }

                    for (const element of response?.data.response.body.items.item) {
                        parseData(measure_position_id, dataList, element);
                    }
                }


                const schema: AvroSchema = Container.get('avroSchemaBeachWeather');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                LoggerInstance.info('dataList length : ' + dataList.length);

                const promises_2 = dataList.map(async (item: any) => {
                    encoder.write(item);
                });

                await Promise.all(promises_2);
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
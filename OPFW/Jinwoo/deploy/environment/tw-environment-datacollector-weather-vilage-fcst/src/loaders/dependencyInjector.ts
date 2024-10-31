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
        case "POP":
		case "PTY":
		case "PCP":
		case "REH":
		case "SNO":
		case "SKY":
		case "TMP":
		case "TMN":
		case "TMX":
		case "UUU":
		case "VVV":
		case "WAV":
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

    const dateTime = new Date(fcstDate.substring(0, 4), fcstDate.substring(4, 6) - 1, fcstDate.substring(6, 8), fcstTime.substring(0, 2), 0, 0);
    
    let data = dataList.find(item => item.date_time.getTime() == dateTime.getTime() && item.measure_position_id == measure_position_id);
    if (!data) {
        data = {
            measure_position_id: measure_position_id,
            date_time: dateTime,
            precipitation_percent: null,
            rain_type: null,
            precipitation_one_hour: null,
            humidity: null,
            snow_cover_one_hour: null,
            sky_status: null,
            temperature: null,
            lowest_temperature: null,
            highest_temperature: null,
            wave: null,
            wind_direction: null,
            wind_speed: null,
            wind_uuu: null,
            wind_vvv: null
        };
        dataList.push(data);
    }

    switch (category) {
        case "POP" : { // 강수확률
            data.precipitation_percent = parseParamInt(fcstValue);
            break;
        }
        case "PTY" : { // 강수형태
            data.rain_type = parseParamInt(fcstValue);
            break;
        }
        case "PCP" : { // 강수량
            data.precipitation_one_hour = String(fcstValue);
            break;
        }
        case "REH" : { // 습도
            data.humidity = parseParamInt(fcstValue);
            break;
        }
        case "SNO" : { // 1시간 신적설
            data.snow_cover_one_hour = String(fcstValue);
            break;
        }
        case "SKY" : { // 하늘상태, String
            data.sky_status = String(fcstValue);
            break;
        }
        case "TMP" : { // 기온
            data.temperature = parseParamFloat(fcstValue);
            break;
        }
        case "TMN" : { // 일최저기온
            data.lowest_temperature = parseParamFloat(fcstValue);
            break;
        }
        case "TMX" : { // 일최고기온
            data.highest_temperature = parseParamFloat(fcstValue);
            break;
        }
        case "UUU" : { // 풍속 동서성분
            data.wind_uuu = parseParamFloat(fcstValue);
            break;
        }
        case "VVV" : { // 풍속 남북성분
            data.wind_vvv = parseParamFloat(fcstValue);
            break;
        }
        case "WAV" : { // 파고
            data.wave = parseParamFloat(fcstValue);
            break;
        }
        case "VEC" : { // 풍향
            data.wind_direction = parseParamInt(fcstValue);
            break;
        }
        case "WSD" : { // 풍속
            data.wind_speed = parseParamFloat(fcstValue);
            break;
        }
    }
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaWeatherVilageFcst = new AvroSchema(config.avro.schemaPath.weatherVilageFcst)
        Container.set('avroSchemaWeatherVilageFcst', avroSchemaWeatherVilageFcst);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                const now = new Date();
                if((now.getHours()-2)%3!=0){
                    LoggerInstance.error("not available time: " + now.toLocaleString());
                    return;
                }

                const baseDateStr = String(now.getFullYear()
                    + String(now.getMonth() + 1).padStart(2, '0')
                    + String(now.getDate()).padStart(2, '0'));
                const baseTimeStr = `${now.getHours().toString().padStart(2, '0')}00`;

                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');

                let matchItems = [
                    {
                        name: "type",
                        value: "DISTRICT_CODE"
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

                let dataList: any[] = [];

                for (const item of res.data.data) {
                    const measure_position_id = item.id;
                    const apiKey = config.openapi.keys.datagokr;
                    const apiUrl = config.openapi.url;
                    let response = null;

                    try {
                        response = await axios.get(apiUrl, {
                            params: {
                                serviceKey: apiKey,
                                dataType: "JSON",
                                numOfRows: 1000,
                                pageNo: 1,
                                base_date: baseDateStr,
                                base_time: baseTimeStr,
                                nx: item.grid_x,
                                ny: item.grid_y
                            }
                        });
                    } catch (e) {
                        LoggerInstance.error("get openapi data error : " + e);
                        return;
                    }

                    let resultCode = response?.data?.response?.header?.resultCode;
                    if (!resultCode) {
                        LoggerInstance.error("get openapi response error.");
                        return;
                    }

                    if (resultCode != "00") {
                        LoggerInstance.error("resultCode is not '00'. resultCode : " + resultCode + ", resultMesage : " + response?.data?.response?.header?.resultMsg);
                        return;
                    }

                    for (const element of response?.data.response.body.items.item) {
                        parseData(measure_position_id, dataList, element).catch((e) => {
                            LoggerInstance.error("error : " + e);
                        });
                    }
                }


                const schema: AvroSchema = Container.get('avroSchemaWeatherVilageFcst');
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
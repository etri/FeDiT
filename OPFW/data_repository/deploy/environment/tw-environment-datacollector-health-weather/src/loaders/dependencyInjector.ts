import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDateString_yyyymmddhhmmss } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'

type HealthWeather = {
    date_time: Date;
    measure_position_id: number;
    oak_pollen_index: null | number;
    pine_pollen_index: null | number;
    weeds_pollen_index: null | number;
    detail_code: null | number;
}

async function getMeasurePositionArray(): Promise<any[]> {
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

    return res.data.data;
}

function makeData(dataTime: Date, measure_position_id: number, index: null | number, api: string): HealthWeather {
    let data: HealthWeather = {
        date_time: dataTime,
        measure_position_id: measure_position_id,
        oak_pollen_index: null,
        pine_pollen_index: null,
        weeds_pollen_index: null,
        detail_code: null
    }

    switch (api) {
        case "getOakPollenRiskIdxV3":
            data.oak_pollen_index = index;
            break;
        case "getPinePollenRiskIdxV3":
            data.pine_pollen_index = index;
            break;
        case "getWeedsPollenRiskndxV3":
            data.weeds_pollen_index = index;
            break;
    }

    return data;
}

async function getData(dataList: any[], measurPositionArray: any[], time: string, api: string) {
    const apiKey = config.openapi.keys.datagokr;
    const apiUrl = config.openapi.urlBase + api;
    // const promises = measurPositionArray.map(async (measurePosition: any) => {
    for (const measurePosition of measurPositionArray) {
        const response = await axios.get(apiUrl, {
            params: {
                serviceKey: apiKey,
                numOfRows: 100,
                pageNo: 1,
                areaNo: measurePosition.district_code,
                time: time,
                dataType: "JSON"
            }
        });

        let resultCode = response?.data?.response?.header?.resultCode;
        if (!resultCode) {
            LoggerInstance.error("get openapi response error.");
            continue;
        }

        if (resultCode != "00") {
            LoggerInstance.error("resultCode is not '00'. resultCode : " + resultCode);
            continue;
        }

        for (const element of response?.data.response.body.items.item) {
        // const promises = response.data.response.body.items.item.map((element: any) => {
            let rerecvDateStr = element.date;
            if (!rerecvDateStr) {
                return;
            }

            let recvDateTime = new Date(rerecvDateStr.substring(0, 4), parseInt(rerecvDateStr.substring(4, 6)) - 1, rerecvDateStr.substring(6, 8), 0, 0);

            //today
            let dataTime = recvDateTime;
            let index = parseParamInt(element.today);
            let data = makeData(dataTime, measurePosition.id, index, api);
            dataList.push(data);

            //tomorrow
            dataTime = new Date(recvDateTime.getFullYear(), recvDateTime.getMonth(), recvDateTime.getDate()+1);
            index = parseParamInt(element.tomorrow);
            data = makeData(dataTime, measurePosition.id, index, api);
            dataList.push(data);

            //dayaftertomorrow
            dataTime = new Date(recvDateTime.getFullYear(), recvDateTime.getMonth(), recvDateTime.getDate()+2);
            index = parseParamInt(element.dayaftertomorrow);
            data = makeData(dataTime, measurePosition.id, index, api);
            dataList.push(data);

            //twodaysaftertomorrow
            dataTime = new Date(recvDateTime.getFullYear(), recvDateTime.getMonth(), recvDateTime.getDate()+3);
            index = parseParamInt(element.twodaysaftertomorrow);
            data = makeData(dataTime, measurePosition.id, index, api);
            dataList.push(data);
        }
        // });
        // await Promise.all(promises);
    }

    // })
    // await Promise.all(promises);
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaHealthWeather = new AvroSchema(config.avro.schemaPath.healthWeather)
        Container.set('avroSchemaHealthWeather', avroSchemaHealthWeather);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                const now = new Date();

                const paramTimeStr = String(now.getFullYear()
                    + String(now.getMonth() + 1).padStart(2, '0')
                    + String(now.getDate()).padStart(2, '0')
                    + String(now.getHours()).padStart(2, '0'));

                let measurPositionArray = await getMeasurePositionArray();

                let dataList: any[] = [];

                await getData(dataList, measurPositionArray, paramTimeStr, "getOakPollenRiskIdxV3");
                await getData(dataList, measurPositionArray, paramTimeStr, "getPinePollenRiskIdxV3");
                await getData(dataList, measurPositionArray, paramTimeStr, "getWeedsPollenRiskndxV3");


                const schema: AvroSchema = Container.get('avroSchemaHealthWeather');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                const promises = dataList.map(async (item: any) => {
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
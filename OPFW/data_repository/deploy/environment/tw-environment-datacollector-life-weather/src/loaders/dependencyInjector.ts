import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDateString_yyyymmddhhmmss, addHours } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'

type LifeWeather = {
    date_time: Date;
    measure_position_id: number;
    air_diffusion_index: null | number;
    uv_index: null | number;
    sensory_temperature: null | number;
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

function makeData(dataTime: Date, measure_position_id: number, index: null | number, api: string): LifeWeather {
    let data: LifeWeather = {
        date_time: dataTime,
        measure_position_id: measure_position_id,
        air_diffusion_index: null,
        uv_index: null,
        sensory_temperature: null,
        detail_code: null
    }

    switch (api) {
        case "getAirDiffusionIdxV4":
            data.air_diffusion_index = parseParamInt(index);
            break;
        case "getSenTaIdxV4":
            data.sensory_temperature = parseParamInt(index);
            break;
        case "getUVIdxV4":
            data.uv_index = parseParamInt(index);
            break;
    }

    return data;
}

async function getData(dataList: any[], measurPositionArray: any[], time: string, api: string) {
    const apiKey = config.openapi.keys.datagokr;
    const apiUrl = config.openapi.urlBase + api;

    for (const measurePosition of measurPositionArray) {
        const response = await axios.get(apiUrl, {
            params: {
                serviceKey: apiKey,
                numOfRows: 100,
                pageNo: 1,
                areaNo: measurePosition.district_code,
                time: time,
                dataType: "JSON",
                requestCode: "A42"
            }
        });

        let resultCode = response?.data?.response?.header?.resultCode;
        if (!resultCode) {
            LoggerInstance.error("get openapi response error.");
            continue;
        }

        if (resultCode != "00") {
            LoggerInstance.error("resultCode is not '00'. resultCode : " + resultCode + ", resultMesage : " + response?.data?.response?.header?.resultMsg);
            continue;
        }

        for (const element of response?.data.response.body.items.item) {
            // const promises = response.data.response.body.items.item.map((element: any) => {
            let rerecvDateStr = element.date;
            if (!rerecvDateStr) {
                return;
            }

            let recvDateTime = new Date(rerecvDateStr.substring(0, 4), parseInt(rerecvDateStr.substring(4, 6)) - 1, rerecvDateStr.substring(6, 8), 0, 0);

            for (let hours = 0; hours <= 75; ++hours) {
                const hourStr = "h" + String(hours);
                if (!element.hasOwnProperty(hourStr)) {
                    continue;
                }

                let sendDateTime = addHours(recvDateTime, hours);
                let value = element[hourStr];

                let data = makeData(sendDateTime, measurePosition.id, value, api);

                let found = dataList.find(item => item.date_time.getTime() == data.date_time.getTime() && item.measure_position_id == data.measure_position_id);
                if (!found) {
                    dataList.push(data);
                } else {
                    if(data.uv_index) { found.uv_index = data.uv_index; }
                    if(data.air_diffusion_index) { found.air_diffusion_index = data.air_diffusion_index; }
                    if(data.sensory_temperature) { found.sensory_temperature = data.sensory_temperature; }
                }
            }
        }
        // });
        // await Promise.all(promises);
    }
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaMeasurePosition = new AvroSchema(config.avro.schemaPath.measurePosition)
        Container.set('avroSchemaMeasurePosition', avroSchemaMeasurePosition);

        const avroSchemaLifeWeather = new AvroSchema(config.avro.schemaPath.lifeWeather)
        Container.set('avroSchemaLifeWeather', avroSchemaLifeWeather);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                const now = new Date();

                const paramTimeStr = String(now.getFullYear()
                    + String(now.getMonth() + 1).padStart(2, '0')
                    + String(now.getDate()).padStart(2, '0')
                    + String(now.getHours()).padStart(2, '0'));

                let measurPositionArray = await getMeasurePositionArray();

                let dataList: any[] = [];

                await getData(dataList, measurPositionArray, paramTimeStr, "getAirDiffusionIdxV4");
                await getData(dataList, measurPositionArray, paramTimeStr, "getSenTaIdxV4");
                await getData(dataList, measurPositionArray, paramTimeStr, "getUVIdxV4");


                const schema: AvroSchema = Container.get('avroSchemaLifeWeather');
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
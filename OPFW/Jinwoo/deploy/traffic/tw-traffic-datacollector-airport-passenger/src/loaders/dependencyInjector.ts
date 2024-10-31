import path from 'node:path';
import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/avroschema';
import { getDataTime } from '@/utils/time';

function getToday() {
    var date = new Date();
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

        const avroSchemaTraffic = new AvroSchema(config.avro.schemaPath.airportPassanger)
        Container.set('avroSchemaTraffic', avroSchemaTraffic);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                LoggerInstance.info('cron job is called date:' + new Date());

                const apiKey = config.openapi.keys.airportPassanger;
                const apiUrl = config.openapi.url.airportPassanger;
                const response = await axios.get(apiUrl, {
                    params: {
                        schDate: getToday(),
                        schAirport: "CJU",
                        serviceKey: apiKey,
                        numOfRows: 200
                    }
                });

                // console.log(response.data.response.body.items.item);
                // console.log(response.data);

                const result = response?.data?.response?.header?.resultCode;
                if (result != "00") {
                    throw new Error(result ? result : "openapi response error.");
                }

                const schemaMeasurePosition: AvroSchema = Container.get('avroSchemaMeasurePosition');
                const schemaTraffic: AvroSchema = Container.get('avroSchemaTraffic');

                let encoder = new avro.streams.BlockEncoder(schemaTraffic.getSchema());

                let dataList: any = [];

                const promises_1 = response.data.response.body.items.item.map(async (item: any) => {
                    let data = dataList.find((e: any) => e.hh === item.hh);
                    if (!data) {
                        data = {
                            hh: item.hh,
                            measure_position_id: 111001,
                            loc_out_pax: 0,
                            loc_in_pax: 0,
                            itn_out_pax: 0,
                            itn_in_pax: 0,
                            in_pax: 0,
                            out_pax: 0
                        };
                        dataList.push(data);
                    }

                    if (item.aod == 'D') {
                        if (item.tof == 'D') {
                            data.loc_out_pax = item.pct;
                        } else {
                            data.itn_out_pax = item.pct;
                        }
                        data.out_pax += item.pct;
                    } else {
                        if (item.tof == 'D') {
                            data.loc_in_pax = item.pct;
                        } else {
                            data.itn_in_pax = item.pct;
                        }
                        data.in_pax += item.pct;
                    }
                });

                await Promise.all(promises_1);

                let today = new Date();

                LoggerInstance.info('openapi data list length :' + dataList.length);

                const promises_2 = dataList.map(async(item: any) => {
                    item.date_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(item.hh), 0, 0);
                    try {
                        encoder.write(item);
                    } catch (e) {
                        LoggerInstance.error(`failed to write avsc. item = ${JSON.stringify(item)}\n error = ${e}`);
                    }
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
                        LoggerInstance.error(JSON.stringify(error.response), error);
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
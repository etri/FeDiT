import path from 'node:path';
import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/avroschema';
import { getDataTime } from '@/utils/time';

async function getData_Danger(dataList: any[]) {
    const apiKey = config.openapi.keys.jejucits;
    const apiUrl = config.openapi.url.danger;
    const response = await axios.get(apiUrl, { params: { code: apiKey } });

    const result = response?.data?.result;
    if (result != "success") {
        throw new Error(result ? result : "openapi response error.");
    }

    let reformattedArray: [] = response.data.info.map((item: any) => {
        return {
            event_id: item.ocrr_id,
            info_type: "danger",
            latitude: item.latitude,
            longitude: item.longitude,
            direction: item.heading,
            link_id: item.link_id,
            code: item.code,
        };
    });

    dataList.push(...reformattedArray);
}

async function getData_Control(dataList: any[]) {
    const apiKey = config.openapi.keys.jejucits;
    const apiUrl = config.openapi.url.control;
    const response = await axios.get(apiUrl, { params: { code: apiKey } });

    const result = response?.data?.result;
    if (result != "success") {
        throw new Error(result ? result : "openapi response error.");
    }

    let reformattedArray: [] = response.data.info.map((item: any) => {
        return {
            event_id: item.ocrr_id,
            info_type: "road-control",
            latitude: item.latitude,
            longitude: item.longitude,
            direction: item.heading,
            link_id: item.link_id,
            whole_lane: item.whole_lane,
            block_lane: item.block_lane,
            text: item.text,
        };
    });

    dataList.push(...reformattedArray);
}

async function getData_Work(dataList: any[]) {
    const apiKey = config.openapi.keys.jejucits;
    const apiUrl = config.openapi.url.work;
    const response = await axios.get(apiUrl, { params: { code: apiKey } });

    const result = response?.data?.result;
    if (result != "success") {
        throw new Error(result ? result : "openapi response error.");
    }

    let reformattedArray: [] = response.data.info.map((item: any) => {
        return {
            event_id: item.ocrr_id,
            info_type: "road-work",
            latitude: item.latitude,
            longitude: item.longitude,
            direction: item.heading,
            link_id: item.link_id,
            whole_lane: item.whole_lane,
            block_lane: item.block_lane,
            text: item.text,
        };
    });

    dataList.push(...reformattedArray);
}

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaRoadOperationStatus = new AvroSchema(config.avro.schemaPath.roadOperationStatus)
        Container.set('avroSchemaRoadOperationStatus', avroSchemaRoadOperationStatus);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let data_time = getDataTime(new Date());

                LoggerInstance.info('cron job is called date:' + data_time);

                let dataList: any[] = [];

                await getData_Danger(dataList);
                await getData_Control(dataList);
                await getData_Work(dataList);

                const schemaRoadOperationStatus: AvroSchema = Container.get('avroSchemaRoadOperationStatus');

                let encoder = new avro.streams.BlockEncoder(schemaRoadOperationStatus.getSchema());

                const promises = dataList.map(async (item: any) => {
                    item.date_time = data_time;
                    item.event_id = item.event_id ? String(item.event_id) : null;
                    // item.info_type = String(item.info_type);
                    item.latitude = item.latitude ? String(item.latitude) : null;
                    item.longitude = item.longitude ? String(item.longitude) : null;
                    item.direction = item.direction ? parseInt(item.direction) : null;
                    item.link_id = item.link_id ? Number(item.link_id) : null;
                    item.code = item.code ? Number(item.code) : null;
                    item.whole_lane = item.whole_lane ? Number(item.whole_lane) : null;
                    item.block_lane = item.block_lane ? String(item.block_lane) : null;
                    item.text = item.text ? String(item.text) : null;

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
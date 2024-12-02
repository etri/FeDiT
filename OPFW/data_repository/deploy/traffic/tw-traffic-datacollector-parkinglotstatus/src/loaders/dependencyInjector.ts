import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDataTime } from '@/utils/time';

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaParkingLotStatusInstance = new AvroSchema(config.avro.schemaPath.parkingLotStatus)
        Container.set('avroSchemaParkingLotStatus', avroSchemaParkingLotStatusInstance);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                let data_time = getDataTime(new Date());

                LoggerInstance.info('cron job is called date:' + data_time);

                const apiKey = config.openapi.keys.jejucits;
                const apiUrl = config.openapi.url;
                const response = await axios.get(apiUrl, { params: { code: apiKey } });

                const result = response?.data?.result;
                if (result != "success") {
                    throw new Error(result ? result : "openapi response error.");
                }

                const schema: AvroSchema = Container.get('avroSchemaParkingLotStatus');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                response.data.info.forEach((item: any) => {
                    item.id = Number(item.id);
                    item.date_time = data_time;
                    encoder.write(item);
                });
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
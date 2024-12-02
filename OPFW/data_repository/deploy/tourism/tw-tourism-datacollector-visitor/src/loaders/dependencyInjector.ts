import { Container } from 'typedi';
import axios from 'axios';
import avro from 'avsc';

import LoggerInstance from './logger';
import config from '@/config';
import { CronHandler } from '@/services/cronhandler';
import { AvroSchema } from '@/services/AvroSchema';
import { getDateString_yyyymmddhhmmss, sleep } from '@/utils/time';
import { parseParamInt, parseParamFloat } from '@/utils/etc'
import puppeteer  from "puppeteer";
import { PuppeteerLaunchOptions }  from "puppeteer";

// type PuppeteerOption = {
//     headless: boolean,
//     args: string[],
//     executablePath: null | string
// }

export default () => {
    try {
        Container.set('logger', LoggerInstance);

        const avroSchemaVisitjeju = new AvroSchema(config.avro.schemaPath.visitjeju)
        Container.set('avroSchemaVisitjeju', avroSchemaVisitjeju);

        const avroSchemaVisitor = new AvroSchema(config.avro.schemaPath.visitor)
        Container.set('avroSchemaVisitor', avroSchemaVisitor);

        const cronhandlerInstance = new CronHandler(config.cron.initialPattern, async () => {
            try {
                const schemaVisitjeju: AvroSchema = Container.get('avroSchemaVisitjeju');

                let matchItems = [
                    {
                        name: "has_visitor_data",
                        value: "1"
                    }
                ];

                let res;
                try {
                    res = await axios.post(config.baseIpAddress.dataInterface_find,
                        {
                            avsc: schemaVisitjeju.getSchema(),
                            match: matchItems
                        });
                } catch (e) {
                    LoggerInstance.error("avro find failed.");
                    throw e;
                }


                let dataList: any[] = [];

                let options: PuppeteerLaunchOptions  = {
                    headless: true,
                    args: ['--no-sandbox', '--disable-dev-shm-usage'],
                    executablePath: undefined
                };

                if(process.platform === "linux"){
                    options.executablePath = '/usr/bin/chromium-browser';
                }

                const browser = await puppeteer.launch(options);

                const page = await browser.newPage();
                await page.setViewport({
                    width: 1920,
                    height: 1080,
                });



                let data_time = new Date();

                for (const item of res.data.data) {
                    const contentsid = item.contentsid;
                    const kakao_code = item.kakao_code;

                    const kakaoPlaceMapUrl = config.urlBase.placeMapKakao + kakao_code;

                    const httpResponseWeWaitForPromise = page.waitForResponse(response => {
                        return response.url().includes("https://place.map.kakao.com/main/v/" + kakao_code);
                    });

                    await page.goto(kakaoPlaceMapUrl);

                    const httpResponseWeWait = await httpResponseWeWaitForPromise;

                    let payload = await httpResponseWeWait.json();

                    let data = {
                        date_time: data_time,
                        visitjeju_id: contentsid,
                        s2graph: JSON.stringify(payload.s2graph)
                    };

                    dataList.push(data);

                    await sleep(20+40*Math.random());
                }

                await browser.close();

                const schema: AvroSchema = Container.get('avroSchemaVisitor');
                let encoder = new avro.streams.BlockEncoder(schema.getSchema());

                LoggerInstance.info('dataList length : ' + dataList.length);

                const promises_2 = dataList.map(async (item: any) => {
                    try {
                        encoder.write(item);
                    }catch(e){
                        LoggerInstance.error(e);
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
import path from 'path'
import dotenv from 'dotenv';
import cast from './cast-helper';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

let envFound;
if (process.env.NODE_ENV === 'production') {
    envFound = dotenv.config({ path: path.join(__dirname, '../../env/.env.production'), debug:  true })
} else if (process.env.NODE_ENV === 'development') {
    envFound = dotenv.config({ path: path.join(__dirname, '../../env/.env.development'), debug:  true })
} else {
    throw new Error(`process.env.NODE_ENV 값이 유효하지 않습니다 : ${process.env.NODE_ENV}`)
}

if (envFound.error) {
    // This error should crash whole process

    console.log(envFound);
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
    node_env: cast('NODE_ENV', 'string', 'dcevelopment'),
    app: {
        name: cast('APP_NAME', 'string', undefined),
        version: cast('APP_VERSION', 'string', undefined)
    },
    port: cast('SERVICE_PORT', 'number', undefined),
    logs: {
        dir: cast('LOGDIR', 'string', undefined)
    },
    baseIpAddress: {
        dataInterface_upsert: cast('DATAINTERFACE_IPADDRESS__UPSERT', 'string', undefined),
        dataInterface_find: cast('DATAINTERFACE_IPADDRESS__FIND', 'string', undefined),
        otelCollector: cast('OTELCOLLECTOR_IPADDRESS', 'string', undefined),
    },
    api: {
        prefix: '/api',
    },
    path: {
        root: path.resolve(),
        assets: path.resolve("./dist/assets")
    },
    openapi: {
        url: cast('OPENAPI_URL', 'string', undefined),
        keys: {
            datagokr: cast('OPENAPIKEY_DATAGOKR', 'string', undefined),
        }
    },
    cron: {
        initialPattern: cast('CRON_INITIAL_PATTERN', 'string', undefined)
    },
    avro: {
        schemaPath: {
            measurePosition : cast('AVRO_SCHEMA_FILE__MEASURE_POSITION', 'string', undefined),
            beachWeather : cast('AVRO_SCHEMA_FILE__BEACH_WEATHER', 'string', undefined)
        }
    }
};
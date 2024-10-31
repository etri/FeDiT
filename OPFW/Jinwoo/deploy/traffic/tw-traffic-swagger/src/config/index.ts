import path from 'path'
import dotenv from 'dotenv';
import cast from './cast-helper';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
    node_env: cast('NODE_ENV', 'string', 'development'),
    app: {
        name: cast('APP_NAME', 'string', undefined),
        version: cast('APP_VERSION', 'string', undefined)
    },
    port: cast('CONTAINER_SERVICE_PORT', 'number', undefined),
    logs: {
        dir: cast('LOGDIR', 'string', undefined)
    },
    api: {
        prefix: '',
    },
    path: {
        root: path.resolve(),
        assets: path.resolve("./dist/assets")
    }
};
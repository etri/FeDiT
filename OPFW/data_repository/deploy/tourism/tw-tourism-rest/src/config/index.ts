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
    node_env: cast('NODE_ENV', 'string', 'development'),
    app: {
        name: cast('APP_NAME', 'string', undefined),
        version: cast('APP_VERSION', 'string', undefined)
    },
    port: cast('CONTAINER_SERVICE_PORT', 'number', undefined),
    imageAPI: {
        ipAddress: cast('IMAGE_API__HOST_SERVICE_IPADDRESS', 'string', undefined),
        port: cast('IMAGE_API__HOST_SERVICE_PORT', 'number', undefined),
        servicdId: cast('IMAGE_API__SERVICE_ID', 'number', undefined),
    },
    logs: {
        dir: cast('LOGDIR', 'string', undefined)
    },
    api: {
        prefix: '/v1',
    },
    path: {
        root: path.resolve(),
        assets: path.resolve("./dist/assets")
    },
    dataInterfaceIpAddress: cast('DATAINTERFACE_IPADDRESS', 'string', undefined),
    databaseSource: {
        host : cast('DATABASESOURCE__HOST', 'string', undefined),
        port: cast('DATABASESOURCE__PORT', 'number', undefined),
        user : cast('DATABASESOURCE__USER', 'string', undefined),
        password : cast('DATABASESOURCE__PASSWORD', 'string', undefined),
        database : cast('DATABASESOURCE__DATABASE', 'string', undefined),
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    }
};
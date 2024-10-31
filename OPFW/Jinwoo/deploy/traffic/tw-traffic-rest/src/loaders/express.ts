import express, { Express, Request, Response, NextFunction } from 'express';
import Logger from './logger';
import routes from '../api';
import config from '../config';
import cors from 'cors';

class ResponseError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export default ({ app }: { app: express.Application }) => {
    /**
     * Health Check endpoints
     * @TODO Explain why they are here
     */
    app.get('/status', (req, res) => {
        res.status(200).end();
    });
    app.head('/status', (req, res) => {
        res.status(200).end();
    });

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy');

    // The magic package that prevents frontend developers going nuts
    // Alternate description:
    // Enable Cross Origin Resource Sharing to all origins by default
    //   app.use(cors());

    // Some sauce that always add since 2014
    // "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
    // Maybe not needed anymore ?
    // app.use(require('method-override')());

    app.use(function (req, res, next) {
        Logger.info("----------------------------");
        Logger.info(JSON.stringify(req.headers));

        next(); // 다음 미들웨어 함수를 작동
    });

    app.options('*', cors())
    app.use(cors({
        "origin": config.cors.origin
    }));

    // app.options("/", function (req, res, next) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    //     res.header('Access-Control-Allow-Private-Network', 'true');
    //     res.send(204);
    // });

    // app.use(function(req, res, next) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    //     // res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    //     // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     // res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE");
    //     next();
    //   });

    // Transforms the raw string of req.body into json
    app.use(express.json());
    // Load API routes
    app.use(config.api.prefix, routes());

    // API Documentation
    //   app.use(OpticMiddleware({
    //       enabled: process.env.NODE_ENV !== 'production',
    //   }));

    /// catch 404 and forward to error handler
    app.use((req: Request, res: Response, next) => {
        const err = new ResponseError(404, 'Not Found');
        next(err);
    });

    /// error handlers
    app.use((err: ResponseError, req: Request, res: Response, next: NextFunction) => {
        Logger.error("(default)", err);
        /**
         * Handle 401 thrown by express-jwt library
         */
        if (err.name === 'UnauthorizedError') {
            return res
                .status(err.status)
                .send({ message: err.message })
                .end();
        }
        return next(err);
    });

    app.use((err: ResponseError, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500);
        res.json({
            errors: {
                message: err.message,
            },
        });
    });
};
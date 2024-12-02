import express, { Express, Request, Response, NextFunction } from 'express';
import Logger from './logger';
import routes from '../api';
import routesAutogen from '../api-autogen';
import config from '../config';
import cors from 'cors';

class ResponseError extends Error {
    status: number;

    constructor(status:number, message:string) {
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

    app.use(cors());
    // Transforms the raw string of req.body into json
    app.use(express.json());
    // Load API routes

    app.use(config.api.prefix, routes());
    app.use(config.api.prefix, routesAutogen());

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
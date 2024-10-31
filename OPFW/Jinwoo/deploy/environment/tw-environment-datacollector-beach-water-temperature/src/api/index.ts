import { Router } from 'express';
import hello from './routes/hello';
import cron from './routes/cron'
import appinfo from './routes/appinfo';

// guaranteed to get dependencies
export default () => {
	const app = Router();
    hello(app);
	cron(app);
	appinfo(app);

	return app
}
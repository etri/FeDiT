import { Router } from 'express';
import measurePosition from './routes/measure-position';
import measurePositionType from './routes/measure-position-type';
import airQuality from './routes/air-quality';
import beachWaterTemperature from './routes/beach-water-temperature';
import beachWaveHeight from './routes/beach-wave-height';
import beachWeather from './routes/beach-weather';
import healthWeather from './routes/health-weather';
import lifeWeather from './routes/life-weather';
import riverWaterLevel from './routes/river-water-level';
import riverWaterLevelDevice from './routes/river-water-level-device';
import weatherUltraSrtFcst from './routes/weather-ultra-srt-fcst';
import weatherUltraSrtNcst from './routes/weather-ultra-srt-ncst';
import weatherVilageFcst from './routes/weather-vilage-fcst';

export default () => {
	const app = Router();

	measurePosition(app);
	measurePositionType(app);
	airQuality(app);
	beachWaterTemperature(app);
	beachWaveHeight(app);
	beachWeather(app);
	healthWeather(app);
	lifeWeather(app);
	riverWaterLevel(app);
	riverWaterLevelDevice(app);
	weatherUltraSrtFcst(app);
	weatherUltraSrtNcst(app);
	weatherVilageFcst(app);

	return app;
}

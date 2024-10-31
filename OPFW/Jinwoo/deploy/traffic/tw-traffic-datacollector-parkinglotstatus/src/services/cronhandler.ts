import { CronJob, CronTime } from "cron";

export class CronHandler {
    origCronPattern : string;
    cronJob : CronJob;

    constructor(cronPattern: string, onTick: any){
        this.origCronPattern = cronPattern;
        this.cronJob = new CronJob(cronPattern, onTick);
    }

    start() {
        this.cronJob.start();
    }

    getCronPattern() {
        return this.origCronPattern;
    }

    setCronPattern(cronPattern: string) {
        this.origCronPattern = cronPattern;
        this.cronJob.setTime(new CronTime(cronPattern));
    }
}
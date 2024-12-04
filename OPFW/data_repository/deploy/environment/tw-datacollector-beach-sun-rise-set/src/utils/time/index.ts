export function getDataTime(date:string | number | Date) {
    const denom = 10;
    const roundedDate = new Date(date);
    const roundedMinutes = Math.floor(roundedDate.getMinutes() / denom) * denom;
    roundedDate.setMinutes(roundedMinutes);
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    return roundedDate;
}

export function getDateStringWithoutTime(date:Date, format:string) {
    return date.toLocaleString('en-GB').
    replace(/(\d+)\/(\d+)\/(\d+)(,)(\s)(\w+:\w+:\w+)/, format);
}

export function hhmmToTimeMillis(hhmm:string) {
    // 입력값을 ":" 기준으로 분리
    const [hours, minutes] = hhmm.split(":").map(Number);

    // 자정(00:00)부터의 밀리초 계산
    const millisSinceMidnight = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

    return millisSinceMidnight;
}
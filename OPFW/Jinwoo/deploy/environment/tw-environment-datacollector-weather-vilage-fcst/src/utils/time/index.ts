export function getDataTime(date: string | number | Date) {
    const denom = 10;
    const roundedDate = new Date(date);
    const roundedMinutes = Math.floor(roundedDate.getMinutes() / denom) * denom;
    roundedDate.setMinutes(roundedMinutes);
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    return roundedDate;
}

export function getDateString_yyyymmddhhmmss(date: Date) {
    return String(date.getFullYear())
        + String(date.getMonth() + 1).padStart(2, '0')
        + String(date.getDate()).padStart(2, '0')
        + String(date.getHours()).padStart(2, '0')
        + String(date.getMinutes()).padStart(2, '0');
}

export function sleep(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
} // 함수정의
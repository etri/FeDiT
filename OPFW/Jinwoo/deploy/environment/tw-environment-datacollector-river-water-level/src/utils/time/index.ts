export function getDataTime(date:string | number | Date) {
    const denom = 10;
    const roundedDate = new Date(date);
    const roundedMinutes = Math.floor(roundedDate.getMinutes() / denom) * denom;
    roundedDate.setMinutes(roundedMinutes);
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    return roundedDate;
}

export function getDateString(date : Date){
    return date.toLocaleString('en-GB').replace(/(\d+)\/(\d+)\/(\d+)(,)/, '$3-$2-$1');
}
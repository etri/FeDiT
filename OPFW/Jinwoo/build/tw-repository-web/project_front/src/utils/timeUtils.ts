const getDateString = (date:Date) => {
    return date.toLocaleString('en-GB').
    replace(/(\d+)\/(\d+)\/(\d+)(,)/, '$3-$2-$1');
}

const getDateStringWithoutTime = (date:Date) => {
    if(null===date||undefined===date)
        return '';
    return date.toLocaleString('en-GB').
    replace(/(\d+)\/(\d+)\/(\d+)(,)(\s)(\w+:\w+:\w+)/, '$3-$2-$1');
}

const getDateStringWithoutTimeFromString = (dateString:string) => {
    let date = new Date(dateString);
    return getDateStringWithoutTime(date);
}

export { getDateString, getDateStringWithoutTime, getDateStringWithoutTimeFromString };
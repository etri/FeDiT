export function parseParamInt(data:any) {
    if(!data)
        return null;
    let parsed = parseInt(data);
    if(isNaN(parsed)){
        return null;
    }
    return parsed;
}

export function parseParamFloat(data:any) {
    if(!data)
        return null;
    let parsed = parseFloat(data);
    if(isNaN(parsed)){
        return null;
    }
    return parsed;
}
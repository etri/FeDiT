const convertToNumber = (value: string) => {
    const result = Number(value)
    if (!Number.isNaN(result)) {
        return result
    }
}

const convertToString = (value: string) => value

type ConvertType = "number" | "string";
type TypeConverterType = {
    [index: string]: typeof convertToNumber | typeof convertToString,
    number: typeof convertToNumber,
    string: typeof convertToString
}
const typeConverter: TypeConverterType = {
    number: convertToNumber,
    string: convertToString
}

const cast = (key: string, convertTypeKey: ConvertType, defaultValue: any) => {
    const value = process.env[key]
    if (value !== undefined) {
        const result = typeConverter[convertTypeKey](value)
        if (result !== undefined) {
            return result
        }
        throw new Error(`process.env.${key}에 적절한 값을 설정하지 않았습니다`)
    }
    if (defaultValue !== undefined) {
        return defaultValue
    }
    throw new Error(`process.env.${key}에 할당할 값이 없습니다`)
}

export default cast;
'use strict'

function uriEncodingParameter(data, hiddenId) {
    let encodedData = encodeURIComponent(JSON.stringify(data));
    $('#' + hiddenId).val(encodedData);
}

function uriDecodingParameter(hiddenId) {
    let encodedData = $('#' + hiddenId).val();
    let decodedData = JSON.parse(decodeURIComponent(encodedData));
    return decodedData;
}

function formatKstDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


/**
 * JSON Schema Information을 바탕으로 JSON 객체를 생성하는 함수
 * 사용 예시
 * const schemaInformation = {
 *     // 여기에 사용자가 올린 JSON Schema 객체가 들어갑니다.
 *     "type": "object",
 *     "properties": {
 *         "id": { "type": "string" },
 *         "location": {
 *             "type": "object",
 *             "properties": {
 *                 "coordinates": { "type": "array", "items": { "type": "number" } }
 *             }
 *         }
 *     }
 * };
 *
 * const result = generateSampleFromSchema(schemaInformation);
 * console.log(JSON.stringify(result, null, 2));
 * */
function generateSampleFromSchema(schema) {
    // 1. 기본 타입별 샘플 값 정의
    const samples = {
        string: "sample_text",
        number: 0,
        integer: 0,
        boolean: true
    };

    // 2. 타입에 따른 분기 처리
    if (schema.type === "object") {
        const obj = {};
        if (schema.properties) {
            for (const [key, value] of Object.entries(schema.properties)) {
                obj[key] = generateSampleFromSchema(value);
            }
        }
        return obj;
    } else if (schema.type === "array") {
        return [generateSampleFromSchema(schema.items)];
    } else {
        // enum 처리
        if (schema.enum) return schema.enum[0];

        // 수정된 부분: Nullish coalescing operator (??) 사용
        // samples[schema.type]이 0이더라도 null로 넘어가지 않고 0을 반환합니다.
        return samples[schema.type] ?? null;
    }
}
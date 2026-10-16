import validator from '@rjsf/validator-ajv8'
import type { RJSFSchema } from '@rjsf/utils'

import { Form } from '@rjsf/daisyui'

const testSchema: RJSFSchema = {
    title: 'Tracking Request',
    type: 'object',
    required: ['reqIdentifier', 'callBackURL', 'trckProcInfo'],
    properties: {
        reqIdentifier: {
            type: 'string',
            title: '요청 식별자',
        },
        callBackURL: {
            type: 'string',
            format: 'uri',
            title: '콜백 URL',
        },
        trckProcInfo: {
            type: 'array',
            title: '트래킹 처리 정보',
            items: {
                type: 'object',
                properties: {
                    trckTp: { type: 'string', title: '트래킹 타입' },
                    trckPrcIdtifier: {
                        type: 'string',
                        title: '트래킹 처리 식별자',
                    },
                    federatedTwinId: { type: 'string', title: '연합 트윈 ID' },
                    federatedDigitalObjectId: {
                        type: 'string',
                        title: '연합 디지털 오브젝트 ID',
                    },
                    digitalTwinId: { type: 'string', title: '디지털 트윈 ID' },
                    digitalObjId: {
                        type: 'string',
                        title: '디지털 오브젝트 ID',
                    },
                    trckTopic: { type: 'string', title: '트래킹 토픽' },
                    trckValInfo: {
                        type: 'string',
                        title: '트래킹 값 정보 (JSON String)',
                    },
                    evntDelay: { type: 'number', title: '이벤트 지연(ms)' },
                    bufferSize: { type: 'number', title: '버퍼 크기' },
                    dtFltTp: { type: 'string', title: '필터 타입' },
                    evntCondition: {
                        type: 'string',
                        title: '이벤트 조건 (JSON String)',
                    },
                    evntOccrCnt: { type: 'number', title: '이벤트 발생 횟수' },
                    evntEndDt: {
                        type: 'string',
                        title: '이벤트 종료 날짜 (JSON String)',
                    },
                },
            },
        },
    },
}

export default function DataTrackingRJSF() {
    return (
        <div className="mt-10 ml-8 w-3/4">
            <Form
                schema={testSchema}
                validator={validator}
                onChange={console.log}
                onSubmit={console.log}
            />
        </div>
    )
}

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const upsertSuccess = new Rate('upsert_success_rate');
const upsertDuration = new Trend('upsert_duration', true);

const STELLIO_URL = __ENV.K6_STELLIO_URL || 'http://{stellioIp}:{stellioPort}/ngsi-ld/v1';
const CONTEXT_URL = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';

const SUBJECT_POOL = ['제조', '에너지', '환경', '물류', '관광'];
const KEYWORD_POOL = ['온도', '센서', '습도', '진동', '압력', '전력', '유량'];

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m',  target: 10 },
        { duration: '30s', target: 50 },
        { duration: '1m',  target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m',  target: 100 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<500'],
        'http_req_failed': ['rate<0.01'],
        'upsert_success_rate': ['rate>0.99'],
    },
};

function buildEntity(vuId, iteration) {
    const dtid = `K6-${vuId}-${iteration}-${Date.now()}`;
    const idx = iteration % SUBJECT_POOL.length;
    const kidx = iteration % KEYWORD_POOL.length;

    return {
        id: `urn:ngsi-ld:DigitalTwin:${dtid}`,
        type: 'DigitalTwin',
        name: { type: 'Property', value: `k6 스트레스 트윈 ${iteration}` },
        description: { type: 'Property', value: `k6 부하 테스트 엔티티 VU=${vuId} iter=${iteration}` },
        owner: { type: 'Property', value: 'k6-tester' },
        subjects: { type: 'Property', value: [SUBJECT_POOL[idx]] },
        keywords: { type: 'Property', value: [KEYWORD_POOL[kidx], KEYWORD_POOL[(kidx + 1) % KEYWORD_POOL.length]] },
        '@context': [CONTEXT_URL],
    };
}

export default function () {
    const entity = buildEntity(__VU, __ITER);
    const payload = JSON.stringify([entity]);

    const params = {
        headers: {
            'Content-Type': 'application/ld+json',
        },
    };

    const startTime = Date.now();
    const res = http.post(`${STELLIO_URL}/entityOperations/upsert`, payload, params);
    const duration = Date.now() - startTime;

    upsertDuration.add(duration);

    const success = check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    upsertSuccess.add(success ? 1 : 0);

    if (!success) {
        console.warn(`Upsert failed: status=${res.status}, body=${res.body}`);
    }

    sleep(0.1);
}

export function handleSummary(data) {
    const summary = {
        timestamp: new Date().toISOString(),
        scenario: 'Stellio Upsert TPS (Ramp-up)',
        target: STELLIO_URL,
        metrics: {
            totalRequests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
            successRate: data.metrics.upsert_success_rate ? data.metrics.upsert_success_rate.values.rate : 0,
            avgDuration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg : 0,
            p50Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(50)'] : 0,
            p95Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
            p99Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'] : 0,
            maxDuration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max : 0,
            tps: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
        },
    };

    return {
        stdout: JSON.stringify(summary, null, 2) + '\n',
        'reports/k6-stellio-tps-result.json': JSON.stringify(summary, null, 2),
    };
}

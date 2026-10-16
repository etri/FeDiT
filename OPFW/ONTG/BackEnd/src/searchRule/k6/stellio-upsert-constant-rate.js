import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const upsertSuccess = new Rate('upsert_success_rate');
const upsertDuration = new Trend('upsert_duration', true);
const upsertCount = new Counter('upsert_total');

const STELLIO_URL = __ENV.K6_STELLIO_URL || 'http://{stellioIp}:{stellioPort}/ngsi-ld/v1';
const TARGET_RATE = parseInt(__ENV.K6_TARGET_RATE || '100');
const DURATION = __ENV.K6_DURATION || '2m';
const CONTEXT_URL = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';

const SUBJECT_POOL = ['제조', '에너지', '환경', '물류', '관광'];
const KEYWORD_POOL = ['온도', '센서', '습도', '진동', '압력', '전력', '유량'];

export const options = {
    scenarios: {
        constant_rate_upsert: {
            executor: 'constant-arrival-rate',
            rate: TARGET_RATE,
            timeUnit: '1s',
            duration: DURATION,
            preAllocatedVUs: 50,
            maxVUs: 200,
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<500', 'p(99)<1000'],
        'http_req_failed': ['rate<0.05'],
        'upsert_success_rate': ['rate>0.95'],
    },
};

function buildEntity(vuId, iteration) {
    const dtid = `K6C-${vuId}-${iteration}-${Date.now()}`;
    const idx = iteration % SUBJECT_POOL.length;
    const kidx = iteration % KEYWORD_POOL.length;

    return {
        id: `urn:ngsi-ld:DigitalTwin:${dtid}`,
        type: 'DigitalTwin',
        name: { type: 'Property', value: `k6 고정TPS 트윈 ${iteration}` },
        description: { type: 'Property', value: `고정 TPS 테스트 VU=${vuId} iter=${iteration}` },
        owner: { type: 'Property', value: 'k6-constant-rate' },
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
    upsertCount.add(1);

    const success = check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    upsertSuccess.add(success ? 1 : 0);

    if (!success) {
        console.warn(`Upsert failed: status=${res.status}, body=${res.body}`);
    }
}

export function handleSummary(data) {
    const summary = {
        timestamp: new Date().toISOString(),
        scenario: `Stellio Upsert Constant Rate (${TARGET_RATE} req/s)`,
        target: STELLIO_URL,
        targetRate: TARGET_RATE,
        metrics: {
            totalRequests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
            successRate: data.metrics.upsert_success_rate ? data.metrics.upsert_success_rate.values.rate : 0,
            achievedTps: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
            avgDuration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg : 0,
            p50Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(50)'] : 0,
            p95Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
            p99Duration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'] : 0,
            maxDuration: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max : 0,
            droppedIterations: data.metrics.dropped_iterations ? data.metrics.dropped_iterations.values.count : 0,
        },
    };

    return {
        stdout: JSON.stringify(summary, null, 2) + '\n',
        'reports/k6-stellio-constant-rate-result.json': JSON.stringify(summary, null, 2),
    };
}

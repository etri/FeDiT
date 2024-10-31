import { Resource } from '@opentelemetry/resources';
import { trace, metrics, ValueType } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import config from '@/config';

export function load(appname: string, appversion: string) {
    const collectorOptions = {
        // url is optional and can be omitted - default is http://localhost:4317
        // Unix domain sockets are also supported: 'unix:///path/to/socket.sock'
        url: config.baseIpAddress.otelCollector,
    };
    const metricExporter = new OTLPMetricExporter(collectorOptions);
    const metricReader = new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 10000,
    });
    const resource = Resource.default().merge(
        new Resource({
            [SEMRESATTRS_SERVICE_NAME]: appname,
            [SEMRESATTRS_SERVICE_VERSION]: appversion,
        }),
    );
    const meterProvider = new MeterProvider({
        resource: resource,
        readers: [metricReader]
    });
    // meterProvider.addMetricReader(metricReader);
    metrics.setGlobalMeterProvider(meterProvider);

    const meter = metrics.getMeter(appname, appversion);

    const gauge = meter.createObservableGauge('memory.rss', {
        unit: 'byte',
        valueType: ValueType.INT
    });

    gauge.addCallback((result) => {
        result.observe(process.memoryUsage().rss);
    });
}


const VITE_GRAFANA_URL =
    import.meta.env.VITE_GRAFANA_URL || 'http://{serverIp}'
const FROM = 'now-1h'
const TO = 'now'
const REFRESH = '10s'

export default function Dashboard() {
    ;(console.log(
        'import.meta.env.GRAFANA_URL:',
        import.meta.env.VITE_GRAFANA_URL
    ),
        console.log('Grafana URL:', VITE_GRAFANA_URL))

    const dashboards = [
        {
            title: 'MariaDB',
            uid: '4a1902e5-34e6-47df-a62e-b0e30d9a2239',
            slug: 'simple-dashboard-mysql',
            publicUid:
                'grafana/d/MQWgroiiz/mysql-overview?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=mariadb_exporter:9104&refresh=10s&kiosk',
        },
        {
            title: 'RabbitMQ',
            uid: '280ed6a3-1905-4a2f-8c5e-75df0580a051',
            slug: 'simple-dashboard-rabbitmq',
            publicUid:
                'grafana/d/Wu4xkdEZk/rabbitmq-monitoring?orgId=1&from=now-3h&to=now&timezone=browser&var-datasource=eerajw7ff2800c&var-node=$__all&refresh=10s&kiosk',
        },
        {
            title: 'SpringBoot',
            uid: '309d735d-ab53-4cc7-a232-7ab8a7f35fdc',
            slug: 'simple-dashboard-springboot',
            publicUid:
                'grafana/d/X034JGT7Gz/springboot-apm-dashboard?orgId=1&from=now-3h&to=now&timezone=browser&var-application=&var-instance=$__all&var-hikaricp=HikariPool-1&var-memory_pool_heap=$__all&var-memory_pool_nonheap=$__all&refresh=10s&kiosk',
        },
    ]

    return (
        <div className="w-full h-screen flex flex-col m-0 p-0 overflow-hidden">
            <div className="w-full h-[250px] flex-shrink-0 m-0 p-0">
                <a
                    href={`${VITE_GRAFANA_URL}/grafana/d/rYdddlPWk/node-exporter-full?orgId=1&from=now-3h&to=now&timezone=browser&var-DS_PROMETHEUS=eerajw7ff2800c&var-job=node_exporter&var-nodename=7900b8710466&var-node=node-exporter:9100&var-diskdevices=%5Ba-z%5D%2B%7Cnvme%5B0-9%5D%2Bn%5B0-9%5D%2B%7Cmmcblk%5B0-9%5D%2B&refresh=10s&kiosk`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center font-bold text-white bg-gray-800 p-1 block hover:bg-gray-700"
                >
                    Service Monitoring
                </a>
                <iframe
                    src={`${VITE_GRAFANA_URL}/grafana/d/7dfb3178-581e-45c9-b23e-98b6e3424894/simple-dashboard-kubenode?kiosk&_dash.hideTimePicker&_dash.hideVariables&from=${FROM}&to=${TO}&refresh=${REFRESH}`}
                    frameBorder="0"
                    scrolling="no"
                    className="w-full h-full border-0 m-0 p-0"
                />
            </div>

            <div className="flex w-full h-[calc(100vh-250px)] m-0 p-0">
                {dashboards.map(({ title, uid, slug, publicUid }) => {
                    const dashboardUrl = `${VITE_GRAFANA_URL}/grafana/d/${uid}/${slug}`
                    const publicDashboardUrl = `${VITE_GRAFANA_URL}/${publicUid}`
                    const iframeUrl = `${dashboardUrl}?kiosk&_dash.hideTimePicker&_dash.hideVariables&from=${FROM}&to=${TO}&refresh=${REFRESH}`
                    return (
                        <div
                            key={title}
                            className="w-1/3 h-full flex flex-col border-0"
                        >
                            <a
                                href={publicDashboardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-center font-bold text-white bg-gray-800 p-1 hover:bg-gray-700"
                            >
                                {title}
                            </a>
                            <iframe
                                src={iframeUrl}
                                frameBorder="0"
                                className="flex-grow w-full border-0"
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

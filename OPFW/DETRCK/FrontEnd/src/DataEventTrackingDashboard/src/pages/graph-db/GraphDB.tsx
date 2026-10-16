import { useEffect, useRef, useState } from 'react'
import NeoVis, { NeoVisEvents } from 'neovis.js'

const CYPHER_QUERY = 'MATCH (n)-[r]->(m) RETURN n, r, m'

const DEFAULT_MOVE_SEC = 3
const DEFAULT_PAUSE_SEC = 3

const REFRESH_OPTIONS = [
    { label: '안함', value: 0 },
    { label: '1분', value: 60000 },
    { label: '3분', value: 180000 },
    { label: '5분', value: 300000 },
    { label: '10분', value: 600000 },
    { label: '30분', value: 1800000 },
]

export default function GraphDB() {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const vizRef = useRef<NeoVis | null>(null)
    const renderingRef = useRef<boolean>(false)
    const [intervalMs, setIntervalMs] = useState<number>(0)
    const [isRendering, setIsRendering] = useState<boolean>(false)
    const [moveSec, setMoveSec] = useState<number>(DEFAULT_MOVE_SEC)
    const [pauseSec, setPauseSec] = useState<number>(DEFAULT_PAUSE_SEC)
    const moveSecRef = useRef<number>(DEFAULT_MOVE_SEC)
    const pauseSecRef = useRef<number>(DEFAULT_PAUSE_SEC)
    useEffect(() => {
        moveSecRef.current = moveSec
    }, [moveSec])
    useEffect(() => {
        pauseSecRef.current = pauseSec
    }, [pauseSec])

    const triggerRender = () => {
        const viz = vizRef.current
        if (!viz) return
        if (renderingRef.current) return
        renderingRef.current = true
        setIsRendering(true)
        viz.renderWithCypher(CYPHER_QUERY)
    }

    useEffect(() => {
        if (!containerRef.current) return

        const viz = new NeoVis({
            containerId: containerRef.current.id,
            neo4j: {
                serverUrl:
                    import.meta.env.VITE_NEO4J_URI || 'bolt://localhost:7687',
                serverUser: import.meta.env.VITE_NEO4J_USER || 'neo4j',
                serverPassword:
                    import.meta.env.VITE_NEO4J_PASSWORD || 'password',
            },
            initialCypher: CYPHER_QUERY,
            labels: {
                [NeoVis.NEOVIS_DEFAULT_CONFIG]: {
                    [NeoVis.NEOVIS_ADVANCED_CONFIG]: {
                        function: {
                            group: (node: { labels?: string[] }) =>
                                node.labels?.includes('Recent')
                                    ? 'recent'
                                    : (node.labels?.[0] ?? 'default'),
                            label: (node: {
                                labels?: string[]
                                properties?: Record<string, unknown>
                            }) => {
                                const p = node.properties ?? {}
                                const candidates = [
                                    'name',
                                    'ngsi-ld:name',
                                    'label',
                                    'title',
                                    'hostname',
                                    'id',
                                    'displayName',
                                    'username',
                                ]
                                const truncate = (s: string) =>
                                    s.length > 8 ? s.slice(0, 8) + '...' : s
                                const PREFIX_RULES: [RegExp, string][] = [
                                    [/twin|트윈/i, '[T]'],
                                    [/object|오브젝트/i, '[O]'],
                                    [/subject|서브젝트/i, '[S]'],
                                    [/keyword|키워드/i, '[K]'],
                                    [/name|네임|이름/i, '[N]'],
                                ]
                                const nodeLabel = node.labels?.[0] ?? ''
                                console.log('[GraphDB] node label:', nodeLabel, 'properties:', p)
                                const matched = PREFIX_RULES.find(([re]) =>
                                    re.test(nodeLabel)
                                )
                                const prefix = matched ? matched[1] : ''
                                const withPrefix = (s: string) =>
                                    prefix ? `${prefix} ${s}` : s
                                for (const key of candidates) {
                                    if (p[key] != null && p[key] !== '') {
                                        return withPrefix(
                                            truncate(String(p[key]))
                                        )
                                    }
                                }
                                const firstStr = Object.entries(p).find(
                                    ([, v]) =>
                                        typeof v === 'string' ||
                                        typeof v === 'number'
                                )
                                if (firstStr)
                                    return withPrefix(
                                        truncate(String(firstStr[1]))
                                    )
                                return withPrefix(truncate(nodeLabel))
                            },
                            title: (node: {
                                labels?: string[]
                                properties?: Record<string, unknown>
                            }) => {
                                const escape = (s: string) =>
                                    s.replace(
                                        /[&<>"]/g,
                                        (c) =>
                                            ({
                                                '&': '&amp;',
                                                '<': '&lt;',
                                                '>': '&gt;',
                                                '"': '&quot;',
                                            })[c]!
                                    )
                                const labels =
                                    (node.labels ?? []).join(', ') ||
                                    '(no label)'
                                const props = node.properties ?? {}
                                const rows = Object.entries(props)
                                    .map(([k, v]) => {
                                        const val =
                                            typeof v === 'object'
                                                ? JSON.stringify(v)
                                                : String(v)
                                        const safe =
                                            val.length > 200
                                                ? val.slice(0, 200) + '...'
                                                : val
                                        return `<tr><td style="padding:2px 8px;color:#888;vertical-align:top;white-space:nowrap;">${escape(k)}</td><td style="padding:2px 8px;word-break:break-all;">${escape(safe)}</td></tr>`
                                    })
                                    .join('')
                                const container =
                                    document.createElement('div')
                                container.innerHTML = `
                                    <div style="font-family:sans-serif;font-size:12px;max-width:420px;">
                                        <div style="font-weight:bold;margin-bottom:4px;">${escape(labels)}</div>
                                        <table style="border-collapse:collapse;">${rows || '<tr><td style="padding:2px 8px;color:#888;">no properties</td></tr>'}</table>
                                    </div>
                                `
                                return container
                            },
                        },
                    },
                },
            },
            visConfig: {
                interaction: {
                    hover: true,
                    tooltipDelay: 100,
                },
                nodes: { shape: 'dot', size: 20 },
                groups: {
                    recent: {
                        color: {
                            background: '#ffffff',
                            border: '#cccccc',
                            highlight: {
                                background: '#ffffff',
                                border: '#888888',
                            },
                        },
                        font: { color: '#000000' },
                    },
                },
                edges: { arrows: { to: { enabled: true } } },
                physics: {
                    enabled: true,
                    stabilization: false,
                    timestep: 0.5,
                    maxVelocity: 50,
                    barnesHut: {
                        gravitationalConstant: -8000,
                        springLength: 200,
                        springConstant: 0.01,
                        damping: 0.09,
                    },
                },
            },
        } as never)

        vizRef.current = viz
        let physicsTimerId: ReturnType<typeof setTimeout> | null = null
        const startPhysicsToggle = () => {
            const network = (viz as unknown as { network?: unknown }).network as
                | {
                      setOptions: (opts: Record<string, unknown>) => void
                  }
                | undefined
            if (!network) return
            if (physicsTimerId) clearTimeout(physicsTimerId)
            const loop = (enabled: boolean) => {
                network.setOptions({ physics: { enabled } })
                const sec = enabled
                    ? moveSecRef.current
                    : pauseSecRef.current
                physicsTimerId = setTimeout(
                    () => loop(!enabled),
                    Math.max(100, sec * 1000)
                )
            }
            loop(true)
        }
        const attachDragFixHandler = () => {
            const network = (viz as unknown as { network?: unknown })
                .network as
                | {
                      on: (event: string, cb: (params: { nodes: string[] }) => void) => void
                      body: { data: { nodes: { update: (items: unknown) => void } } }
                  }
                | undefined
            if (!network) return
            network.on('dragEnd', (params) => {
                if (!params?.nodes?.length) return
                const updates = params.nodes.map((id) => ({
                    id,
                    physics: false,
                }))
                network.body.data.nodes.update(updates)
            })
        }
        viz.registerOnEvent?.(NeoVisEvents.CompletionEvent, () => {
            renderingRef.current = false
            setIsRendering(false)
            startPhysicsToggle()
            attachDragFixHandler()
        })
        viz.registerOnEvent?.(NeoVisEvents.ErrorEvent, () => {
            renderingRef.current = false
            setIsRendering(false)
        })
        renderingRef.current = true
        setIsRendering(true)
        viz.render()

        return () => {
            if (physicsTimerId) clearTimeout(physicsTimerId)
            vizRef.current = null
            renderingRef.current = false
        }
    }, [])

    useEffect(() => {
        if (intervalMs <= 0) return
        const id = setInterval(() => {
            triggerRender()
        }, intervalMs)
        return () => clearInterval(id)
    }, [intervalMs])

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                    type="button"
                    onClick={triggerRender}
                    disabled={isRendering}
                    className="bg-blue-400 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isRendering ? '새로고침 중...' : '새로고침'}
                </button>
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                    주기 설정
                </label>
                <select
                    value={intervalMs}
                    onChange={(e) => setIntervalMs(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    {REFRESH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="ml-auto flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-900 dark:text-white">
                        움직임
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={moveSec}
                        onChange={(e) =>
                            setMoveSec(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-20 border border-gray-300 rounded-md px-2 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        초
                    </span>
                    <label className="text-sm font-bold text-gray-900 dark:text-white ml-2">
                        멈춤
                    </label>
                    <input
                        type="number"
                        min={1}
                        value={pauseSec}
                        onChange={(e) =>
                            setPauseSec(
                                Math.max(1, Number(e.target.value) || 1)
                            )
                        }
                        className="w-20 border border-gray-300 rounded-md px-2 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        초
                    </span>
                </div>
            </div>
            <div
                id="neo4j-viz"
                ref={containerRef}
                className="flex-1 min-h-0 w-full bg-white dark:bg-gray-900"
            />
        </div>
    )
}

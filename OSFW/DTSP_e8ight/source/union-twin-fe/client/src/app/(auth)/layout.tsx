import { Combine, Layers, Search } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-black">
      <aside className="relative hidden w-[55%] overflow-hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1629] via-[#132040] to-[#0a1a3a]" />
        <div className="absolute top-0 -right-40 h-full w-1/2 bg-gradient-to-l from-[#4b83d4]/20 via-[#4b83d4]/10 to-transparent" />
        <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-[#3a6fc2]/15 via-transparent to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }}
        />

        <Visualization />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Fedit
            </span>
          </div>

          <div className="max-w-md pb-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6b9fe0]/30 bg-[#6b9fe0]/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="size-2 animate-pulse rounded-full bg-[#6b9fe0]" />
              <span className="text-xs font-medium text-[#8bb8f0]">
                Digital Twin Federation Platform
              </span>
            </div>
            <h1 className="mb-4 text-3xl leading-tight font-bold text-white">
              <span className="text-[#6b9fe0]">Integrate</span> Multiple
              <br />
              Digital Twins
            </h1>
            <p className="mb-8 text-sm leading-relaxed text-slate-300">
              개별 디지털 트윈의 메타데이터를 등록·검색하고,
              <br />
              연합 모델로 통합하여 조회·시뮬레이션합니다.
            </p>
            <FeatureCards />
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Fedit. All rights reserved.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </main>
    </div>
  );
}

const FEATURES = [
  {
    icon: Layers,
    title: '메타데이터 등록 & 검색',
    description: '단일 트윈 메타데이터 정의, 등록 및 그래프 시각화',
  },
  {
    icon: Combine,
    title: '연합 트윈 통합 관리',
    description: '다수의 단일 트윈을 연합 모델로 통합·객체 조회',
  },
  {
    icon: Search,
    title: '데이터 수집 & 트래킹',
    description: '연합 객체 수집 설정, 현황 모니터링 및 이벤트 추적',
  },
] as const;

function FeatureCards() {
  return (
    <div className="space-y-3">
      {FEATURES.map(({ icon: IconComponent, title, description }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#6b9fe0]/20">
            <IconComponent className="size-[18px] text-[#6b9fe0]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Visualization() {
  return (
    <svg
      className="absolute inset-0 size-full opacity-40"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
    >
      <g className="animate-pulse">
        <circle cx="150" cy="150" r="8" fill="#5b8fd4" opacity="0.7" />
        <circle cx="250" cy="200" r="6" fill="#7ab3e8" opacity="0.5" />
        <circle cx="180" cy="280" r="5" fill="#5b8fd4" opacity="0.4" />
        <circle cx="350" cy="180" r="7" fill="#5b8fd4" opacity="0.6" />
        <circle cx="450" cy="250" r="9" fill="#7ab3e8" opacity="0.7" />
        <circle cx="550" cy="150" r="6" fill="#5b8fd4" opacity="0.7" />
        <circle cx="650" cy="220" r="8" fill="#7ab3e8" opacity="0.6" />
        <circle cx="300" cy="350" r="7" fill="#5b8fd4" opacity="0.5" />
        <circle cx="500" cy="380" r="8" fill="#7ab3e8" opacity="0.6" />
        <circle cx="600" cy="320" r="5" fill="#5b8fd4" opacity="0.4" />
        <circle cx="200" cy="450" r="6" fill="#7ab3e8" opacity="0.5" />
        <circle cx="400" cy="480" r="9" fill="#5b8fd4" opacity="0.9" />
        <circle cx="550" cy="450" r="7" fill="#7ab3e8" opacity="0.6" />
      </g>

      <g stroke="#5b8fd4" strokeWidth="1" opacity="0.25">
        <line x1="150" y1="150" x2="250" y2="200" />
        <line x1="250" y1="200" x2="350" y2="180" />
        <line x1="350" y1="180" x2="450" y2="250" />
        <line x1="450" y1="250" x2="550" y2="150" />
        <line x1="550" y1="150" x2="650" y2="220" />
        <line x1="180" y1="280" x2="300" y2="350" />
        <line x1="300" y1="350" x2="500" y2="380" />
        <line x1="500" y1="380" x2="600" y2="320" />
        <line x1="200" y1="450" x2="400" y2="480" />
        <line x1="400" y1="480" x2="550" y2="450" />
        <line x1="250" y1="200" x2="180" y2="280" />
        <line x1="450" y1="250" x2="500" y2="380" />
      </g>

      <circle r="3" fill="#5b8fd4">
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path="M150,150 L250,200 L350,180 L450,250 L550,150 L650,220"
        />
      </circle>
      <circle r="3" fill="#7ab3e8">
        <animateMotion
          dur="5s"
          repeatCount="indefinite"
          path="M180,280 L300,350 L500,380 L600,320"
        />
      </circle>
      <circle r="3" fill="#5b8fd4">
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          path="M200,450 L400,480 L550,450"
        />
      </circle>
    </svg>
  );
}

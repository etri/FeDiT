interface GitHubLink {
  name: string;
  link: string;
  description?: string;
}

export const MAIN_FRAMEWORK_LINK: GitHubLink = {
  name: 'FeDiT',
  link: 'https://github.com/etri/FeDiT',
  description: '연합 디지털트윈 프레임워크 v1.0',
};

export const GITHUB_LINKS: Record<string, GitHubLink> = {
  '디지털 연합트윈 서비스 플랫폼': {
    name: 'DTSP',
    link: 'https://github.com/Fedit-3Sub/DTSP',
  },
  '물리 시뮬레이션 전후처리 도구': {
    name: 'PPAT',
    link: 'https://github.com/Fedit-3Sub/PPAT',
  },
  '서비스 로직 저작도구': {
    name: 'SLCT',
    link: 'https://github.com/Fedit-3Sub/SLCT',
  },
  '이산 연속 시뮬레이션 조합 도구': {
    name: 'HYMS',
    link: 'https://github.com/Fedit-3Sub/HYMS',
  },
  '연합트윈 시각화 프로세스 도구': {
    name: 'DTVS',
    link: 'https://github.com/Fedit-3Sub/DTVS',
    description: '연합트윈 3차원 시각화 엔진',
  },
  '연합트윈 시각화 프로세스 도구 ': {
    name: 'L3DT',
    link: 'https://github.com/Fedit-3Sub/L3DT',
    description: '경량3D 변환 툴킷',
  },
  '3차원 형상 단순화 및 경량화 도구': {
    name: 'MOLM',
    link: 'https://github.com/Fedit-3Sub/MOLM',
  },
  '실시간 시뮬레이션 도구': {
    name: 'DTAI',
    link: 'https://github.com/Fedit-3Sub/DTAI',
    description: '2D 기반 대기확산 유동해석 예측 모델',
  },
};

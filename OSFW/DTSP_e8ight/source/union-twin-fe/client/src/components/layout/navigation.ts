import {
  Activity,
  Box,
  Boxes,
  ChartBar,
  Cog,
  Combine,
  Component,
  Database,
  Eye,
  FileCode,
  GitBranch,
  GitFork,
  Layers,
  Megaphone,
  Search,
  Settings2,
  Sparkles,
  SquarePen,
  Tag,
  TrendingUp,
  TrendingUpDown,
  Users,
  Wrench,
} from 'lucide-react';

import type {
  DashboardNavigationItem,
  NavigationItem,
  NavigationSection,
} from '@/components/layout/types';

const pinnedNavigation: NavigationItem[] = [
  {
    title: '게시판',
    icon: Megaphone,
    href: '/noticeboard',
  },
];

const workspaceNavigation: NavigationItem[] = [
  {
    title: '메타데이터',
    icon: Database,
    items: [
      { title: '검색', icon: Search, href: '/metadata/search' },
      { title: '등록', icon: SquarePen, href: '/metadata/registration' },
      { title: '그래프', icon: GitBranch, href: '/metadata/graph' },
    ],
  },
  {
    title: '프로세싱',
    icon: Cog,
    items: [
      { title: '동기화 엔진', icon: Combine, href: '/processing/sync-engine' },
      {
        title: '유효성 검증',
        icon: Sparkles,
        href: '/processing/verification',
      },
    ],
  },
  {
    title: '서비스 디스크립션 도구',
    icon: Wrench,
    items: [
      { title: '단일 트윈 통합', icon: Combine, href: '/service/unite-twins' },
      { title: '속성 관리', icon: Tag, href: '/service/attributes' },
      { title: '데이터 모델링', icon: Component, href: '/service/models' },
      { title: '컨텍스트', icon: Layers, href: '/service/contexts' },
      { title: '엔티티 조회', icon: Search, href: '/service/entities' },
      { title: '수집 설정', icon: Settings2, href: '/service/agents' },
      {
        title: '수집 현황',
        icon: ChartBar,
        href: '/service/statistics',
      },
      { title: '서비스 로직 저작', icon: SquarePen, href: '/service/logic' },
    ],
  },
];

const analyticsNavigation: NavigationItem[] = [
  { title: '예측기', icon: TrendingUp, href: '/predictor' },
  { title: '물리 시뮬레이션', icon: Box, href: '/physics' },
  { title: '이산/연속 시뮬레이션', icon: TrendingUpDown, href: '/simulation' },
  { title: '이벤트 트래킹', icon: Activity, href: '/tracking' },
  { title: '시각화 뷰어', icon: Eye, href: '/viewer?tour_id=03' },
];

const developerNavigation: NavigationItem[] = [
  {
    title: 'API 문서',
    icon: FileCode,
    items: [{ title: '제주시 공기질 API', href: '/docs/jeju' }],
  },
  { title: 'GitHub', icon: GitFork, href: '/github' },
  { title: '3D 뷰어 데모', icon: Boxes, href: '/demo' },
];

export const adminNavigation: NavigationItem[] = [
  { title: '사용자 관리', icon: Users, href: '/admin/users' },
  { title: '공지사항 관리', icon: Megaphone, href: '/admin/notices' },
];

const navigationSections: NavigationSection[] = [
  { label: null, items: pinnedNavigation },
  { label: '작업공간', items: workspaceNavigation },
  { label: '분석', items: analyticsNavigation },
  { label: '개발자', items: developerNavigation },
];

export function getVisibleSections(isAdmin: boolean): NavigationSection[] {
  return isAdmin
    ? [...navigationSections, { label: '관리', items: adminNavigation }]
    : navigationSections;
}

export function getNavigationPath(href: string): string {
  return href.split('?')[0];
}

function flattenNavigationItems(
  items: NavigationItem[],
  parent?: NavigationItem,
): DashboardNavigationItem[] {
  return items.flatMap((item) => {
    if (item.items?.length) {
      return flattenNavigationItems(item.items, item);
    }

    if (!item.href) {
      return [];
    }

    const icon = item.icon ?? parent?.icon;

    if (!icon) {
      return [];
    }

    return [
      {
        title: item.title,
        href: item.href,
        icon,
        subtitle: parent ? parent.title : undefined,
      },
    ];
  });
}

export const dashboardNavigationItems = flattenNavigationItems([
  ...pinnedNavigation,
  ...workspaceNavigation,
  ...analyticsNavigation,
]);
export const resourceDashboardItems =
  flattenNavigationItems(developerNavigation);

export interface DashboardGroup {
  label: string;
  items: DashboardNavigationItem[];
}

export const dashboardGroups: DashboardGroup[] = [
  { label: '바로가기', items: flattenNavigationItems(pinnedNavigation) },
  ...workspaceNavigation.map((group) => ({
    label: group.title,
    items: flattenNavigationItems(group.items ?? [], group),
  })),
  { label: '분석', items: flattenNavigationItems(analyticsNavigation) },
];

export interface StatisticsTab {
  tabName: string;
  tabPath: string;
}

export interface StatisticsSummary {
  provider?: string;
  dataModel?: string;
  totalEntities: number;
  successEntities: number;
  failEntities: number;
}

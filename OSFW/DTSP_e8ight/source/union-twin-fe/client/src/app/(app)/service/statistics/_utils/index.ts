const dateFormatter = (date: number | Date | undefined) => {
  const baseFormat = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return baseFormat.replaceAll('.', '').replaceAll(' ', '-');
};

export const getDate = (date: Date, num: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + num);
  return dateFormatter(nextDate);
};

export const getRangeBefore = (dateStr: string, num: number) => {
  return {
    startDate: getDate(new Date(dateStr), -num),
    endDate: getDate(new Date(dateStr), 0),
  };
};

export const TREND_RANGE_DAYS = 6;

const STATISTICS_STATE_BY_TYPE = {
  dataModelStatistics: {
    title: 'Model Type',
    onClickState: 'dataModel',
  },
  dataModelNameList: {
    title: 'Model Type',
    onClickState: 'dataModel',
  },
  sourceStatistics: {
    title: 'Provider',
    onClickState: 'provider',
  },
} as const;

export const returnStatesByType = (type: string) => {
  const statisticsState =
    STATISTICS_STATE_BY_TYPE[type as keyof typeof STATISTICS_STATE_BY_TYPE];

  return statisticsState ?? null;
};

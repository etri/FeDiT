import { useMemo } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import dayjs from 'dayjs';

import { getChartColors } from '@/app/(app)/service/statistics/_components/chart/chartColors';

import type { StatisticsRecord } from '@/apis/statistics';

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

const BASE_OPTIONS: ChartOptions<'bar' | 'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'start',
      labels: {
        boxWidth: 12,
        boxHeight: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 24,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: { maxRotation: 0, padding: 10 },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.18)',
      },
      border: { display: false, dash: [4, 4] },
      ticks: { padding: 12 },
    },
  },
};

function BarChart({ props }: { props?: StatisticsRecord[] }) {
  const chartData = useMemo(() => {
    if (!props || !Array.isArray(props)) return null;

    const colors = getChartColors();
    return {
      labels: props.map((item) => dayjs(item.date).format('MMM D')),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Success',
          data: props.map((item) => item.successEntities),
          backgroundColor: colors.success,
          stack: 'daily',
          borderRadius: 10,
          maxBarThickness: 36,
        },
        {
          type: 'bar' as const,
          label: 'Fail',
          data: props.map((item) => item.failEntities),
          backgroundColor: colors.fail,
          stack: 'daily',
          borderRadius: 10,
          maxBarThickness: 36,
        },
        {
          type: 'line' as const,
          label: 'Total',
          data: props.map((item) => item.totalEntities),
          borderColor: colors.total,
          backgroundColor: colors.total,
          borderWidth: 2.5,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          tension: 0.3,
        },
      ],
      rawDates: props.map((item) => item.date),
    };
  }, [props]);

  const options = useMemo<ChartOptions<'bar' | 'line'>>(
    () => ({
      ...BASE_OPTIONS,
      plugins: {
        ...BASE_OPTIONS.plugins,
        tooltip: {
          callbacks: {
            title(items) {
              const index = items[0]?.dataIndex ?? 0;
              const rawDate = chartData?.rawDates[index];
              return rawDate ? dayjs(rawDate).format('dddd, MMM D, YYYY') : '';
            },
          },
        },
      },
    }),
    [chartData],
  );

  if (!chartData) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center">
        <Empty className="max-w-sm border-0 bg-transparent">
          <EmptyHeader>
            <EmptyTitle>No trend data</EmptyTitle>
            <EmptyDescription>
              Recent collection data will appear here when statistics are
              available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col">
      <div className="relative h-full w-full">
        <ReactChart
          type="bar"
          data={chartData as ChartData<'bar' | 'line', number[], string>}
          options={options}
        />
      </div>
    </div>
  );
}

export default BarChart;

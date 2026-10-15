import { Doughnut } from 'react-chartjs-2';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  ArcElement,
  Chart as ChartJS,
  type ChartOptions,
  DoughnutController,
  Legend,
  Tooltip,
  type TooltipItem,
} from 'chart.js';

import { getChartColors } from '@/app/(app)/service/statistics/_components/chart/chartColors';

import type { StatisticsTotals } from '@/apis/statistics';

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

const DOUGHNUT_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(context: TooltipItem<'doughnut'>) {
          const value = Number(context.raw ?? 0);
          return `${context.label}: ${value.toLocaleString()}`;
        },
      },
    },
  },
};

function DonutChart({ props }: { props?: StatisticsTotals }) {
  const totalEntities = props?.totalEntities ?? 0;
  const successEntities = props?.successEntities ?? 0;
  const failEntities = props?.failEntities ?? 0;

  const colors = getChartColors();
  const dataConfig = {
    labels: ['Success', 'Fail'],
    datasets: [
      {
        data: [successEntities, failEntities],
        backgroundColor: [colors.success, colors.fail],
        borderColor: [colors.surface, colors.surface],
        borderWidth: 4,
        hoverOffset: 4,
      },
    ],
  };

  if (!props || totalEntities === 0) {
    return (
      <div className="flex h-[220px] w-full flex-col items-center justify-center p-4">
        <Empty className="max-w-xs border-0 bg-transparent p-0">
          <EmptyHeader>
            <EmptyTitle className="text-sm">No data available</EmptyTitle>
            <EmptyDescription className="text-xs">
              No statistics were collected for the selected day.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative mx-auto aspect-square h-[220px] w-full max-w-[220px]">
        <Doughnut data={dataConfig} options={DOUGHNUT_OPTIONS} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-foreground text-sm font-bold">
            {totalEntities.toLocaleString()}
          </p>
          <p className="text-muted-foreground text-xs">Total</p>
        </div>
      </div>
    </div>
  );
}

export default DonutChart;

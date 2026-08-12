import { useStatisticsTable } from 'components/NDXPRO/statistics/hooks/useStatisticsTable';
import { ISummary } from 'components/NDXPRO/statistics/types';
import { returnStatesByType } from 'components/NDXPRO/statistics/utils';
import lang from '../../../lang.json';
import StatisticsError from '../../statisticsError';
import StatisticsLoading from '../../statisticsLoading';
import StatisticsLabel from './StatisticsLabel';
import StatisticsTableItem from './StatisticsTableItem';

export const tableList = (data: any, type: string) => {
  const setTableList = (data: any) => {
    const statistics = Array.isArray(data?.statistics) ? data.statistics : [];
    return statistics.map((task: ISummary) => {
      const firstChild: string = Object.keys(task)[0];
      const nameKey = firstChild as keyof typeof task;
      const nameValue = task[nameKey];

      if (
        nameValue &&
        typeof nameValue === 'string' &&
        task.successEntities !== undefined &&
        task.failEntities !== undefined &&
        task.totalEntities !== undefined
      ) {
        return (
          <StatisticsTableItem
            key={nameValue}
            name={nameValue}
            task={task}
            type={type}
          />
        );
      }
      return null;
    });
  };

  return setTableList(data);
};

function StatisticsTable({ type }: { type: string }) {
  const [data, loading, error, fetchData] = useStatisticsTable(type);

  if (loading || !data) {
    return (
      <div className="statistics-table">
        <StatisticsLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-table">
        <StatisticsError err={error} />
      </div>
    );
  }

  const statistics = Array.isArray(data?.statistics) ? data.statistics : [];

  return (
    <ul className="statistics-table">
      <li className="summary thead">
        <button type="button">
          <p>{returnStatesByType(type)?.title}</p>
          <StatisticsLabel type="success" text={lang.en.success} />
          <StatisticsLabel type="fail" text={lang.en.fail} />
          <StatisticsLabel type="total" text={lang.en.total} />
        </button>
      </li>
      {!loading && !error && statistics.length > 0 && tableList(data, type)}
      {!loading && !error && statistics.length === 0 && (
        <li className="statistics-no-data-row">No Data</li>
      )}
    </ul>
  );
}

export default StatisticsTable;

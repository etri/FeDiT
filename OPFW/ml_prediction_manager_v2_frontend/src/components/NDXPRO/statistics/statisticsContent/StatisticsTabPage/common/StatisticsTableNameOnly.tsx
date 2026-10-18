import { useStatisticsTable } from 'components/NDXPRO/statistics/hooks/useStatisticsTable';
import { returnStatesByType } from 'components/NDXPRO/statistics/utils';
import StatisticsError from '../../statisticsError';
import StatisticsLoading from '../../statisticsLoading';
import StatisticsTableItem from './StatisticsTableItem';

export const NameList = (data: any, type: string) => {
  const setTableList = (data: any) => {
    const dataModels = Array.isArray(data?.dataModel) ? data.dataModel : [];
    return dataModels.map((task: any) => (
      <StatisticsTableItem key={task} name={task} task={null} type={type} />
    ));
  };

  return setTableList(data);
};

function StatisticsTableNameOnly({ type }: { type: string }) {
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

  const dataModels = Array.isArray(data?.dataModel) ? data.dataModel : [];

  return (
    <ul className="statistics-table name-only">
      <li className="summary thead">
        <button type="button">
          <p>{returnStatesByType(type)?.title}</p>
        </button>
      </li>
      {!loading && !error && dataModels.length > 0 && NameList(data, type)}
      {!loading && !error && dataModels.length === 0 && (
        <li className="statistics-no-data-row">No Data</li>
      )}
    </ul>
  );
}

export default StatisticsTableNameOnly;

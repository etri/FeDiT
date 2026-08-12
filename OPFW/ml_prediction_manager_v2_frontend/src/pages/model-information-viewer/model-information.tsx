import { useQuery } from '@tanstack/react-query';
import { getEntities } from 'apis/NDXPRO/dataServiceApi';
import { getFdtTourData } from 'apis/NDXPRO/viewerService';

import { ReactComponent as ArrowDownIcon } from 'assets/images/arrow_down.svg';
import { ReactComponent as ArrowUpIcon } from 'assets/images/arrow_up_ndxpro.svg';
import Dust from 'assets/images/dust.svg';
import Finedust from 'assets/images/finedust.svg';
import Humidity from 'assets/images/humidity.svg';
import Notification from 'assets/images/notification.svg';
import Parking from 'assets/images/parking.svg';
import Precipitation from 'assets/images/precipitation.svg';
import Temperature from 'assets/images/temperature.svg';
import Traffic from 'assets/images/traffic.svg';
import Windspeed from 'assets/images/windspeed.svg';
import Skeleton from 'components/skeleton/skeleton';
import { useEffect, useMemo, useState } from 'react';

function ModelInformation({ is3DModelLoaded, tourId }: any) {
  const [modelData, setModelData] = useState<any>({
    weatherData: {},
    airQualityData: {},
    trafficData: [],
    parkingData: {},
  });

  const { data: fdtTourData } = useQuery({
    queryKey: ['getEntitiesForTour'],
    queryFn: () =>
      getEntities({
        headers: {
          Link: '<http://220.124.222.90:53005/fdt-twin-context-v1.0.1.jsonld>',
        },
        params: {
          type: 'FdtPoc',
          limit: 100,
          offset: 0,
        },
      }),
  });

  const fdtTourEntities = fdtTourData?.entities ?? [];
  const fdtTourEntityIds = fdtTourEntities.map((entity: any) => {
    const idParts = entity.entityId.split(':');
    return idParts[3];
  });

  const fdtTourEntityIdMap: any = {
    '01': 'F-KR-109941-0003',
    '02': 'F-KR-109941-0004',
    '03': 'F-KR-109941-0007',
    '04': 'F-KR-109941-0008',
    '05': 'F-KR-109941-0009',
    '06': 'F-KR-109941-0010',
    '07': 'F-KR-109941-0011',
    '08': 'F-KR-109941-0013',
    '09': 'F-KR-109941-0014',
    '10': 'F-KR-109941-0015',
    '11': 'F-KR-109941-0017',
    '12': 'F-KR-109941-0018',
    '13': 'F-KR-109941-0020',
  };

  const mappedEntityId = fdtTourEntityIdMap[tourId] || fdtTourEntityIdMap['03'];
  const isValidEntityId = fdtTourEntityIds.includes(mappedEntityId);

  const {
    data: fdtTour,
    isLoading: isLoadingTour,
    error: tourError,
  } = useQuery({
    queryKey: ['getFdtTourData', mappedEntityId],
    queryFn: () =>
      getFdtTourData(mappedEntityId, '4d8cf9f0-0654-4bc1-bb34-edd6539d1efa'),
    enabled: !!mappedEntityId && is3DModelLoaded,
  });

  useEffect(() => {
    if (fdtTour) {
      const dataset = fdtTour?.federation_data?.dataset ?? [];
      setModelData({
        weatherData:
          dataset.find((item: any) => item.type === 'FdtWeather')
            ?.weatherMeasurement ?? {},
        airQualityData:
          dataset.find((item: any) => item.type === 'FdtAirQuality')
            ?.airQualityMeasurement ?? {},
        trafficData:
          dataset.find((item: any) => item.type === 'FdtTraffic')
            ?.trafficMeasurement ?? [],
        parkingData:
          dataset.find((item: any) => item.type === 'FdtParking')
            ?.parkingMeasurement ?? {},
      });
    }
  }, [fdtTour]);

  const { weatherData, airQualityData, trafficData, parkingData } = modelData;

  const averageTrafficCongestion = useMemo(() => {
    if (trafficData?.value?.length > 0) {
      const totalCongestion = trafficData.value.reduce(
        (acc: any, curr: any) => acc + curr.tfvl,
        0,
      );
      return (totalCongestion / trafficData.value.length).toFixed(2);
    }
    return 'No data';
  }, [trafficData]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex h-full flex-grow flex-col overflow-y-scroll rounded-lg bg-white p-4 shadow-card">
      {is3DModelLoaded ? (
        <p className="text-[24px] font-bold">
          {fdtTour ? fdtTour.measure_position_name : ''}
        </p>
      ) : (
        <Skeleton className="h-[36px] w-[240px]" />
      )}

      <div className="mt-[16px] flex flex-grow flex-col">
        <div className="flex flex-col gap-2 rounded-md bg-gray-200 p-4">
          {is3DModelLoaded ? (
            <p className="py-[4px] text-center text-[20px] font-bold">
              📍 지역 정보 반경 (5km)
            </p>
          ) : (
            <Skeleton className="m-auto my-[8px] h-[44px] w-[240px]" />
          )}
          <Accordion
            measurementData={airQualityData}
            is3DModelLoaded={is3DModelLoaded}
            title="💨 공기질"
            isOpen={openIndex === 0}
            onToggle={() => handleToggle(0)}
          >
            <DataDisplay
              label="미세먼지"
              unit="µg/m³"
              value={airQualityData?.value?.pm10_value}
              iconSrc={Dust}
            />
            <DataDisplay
              label="초미세먼지"
              unit="µg/m³"
              value={airQualityData?.value?.pm25_value}
              iconSrc={Finedust}
            />
          </Accordion>

          <Accordion
            measurementData={weatherData}
            is3DModelLoaded={is3DModelLoaded}
            title="🌤️ 날씨"
            isOpen={openIndex === 1}
            onToggle={() => handleToggle(1)}
          >
            <DataDisplay
              label="온도"
              unit="°C"
              value={weatherData?.value?.temperature}
              iconSrc={Temperature}
            />
            <DataDisplay
              label="습도"
              unit="%"
              value={weatherData?.value?.humidity}
              iconSrc={Humidity}
            />
            <DataDisplay
              label="강수량"
              value={weatherData?.value?.precipitation_one_hour}
              iconSrc={Precipitation}
            />
            <DataDisplay
              label="풍속"
              unit="m/s"
              value={weatherData?.value?.wind_speed}
              iconSrc={Windspeed}
            />
          </Accordion>

          <Accordion
            measurementData={trafficData}
            is3DModelLoaded={is3DModelLoaded}
            title="🚦 교통"
            isOpen={openIndex === 2}
            onToggle={() => handleToggle(2)}
          >
            <DataDisplay
              label="평균 교통 혼잡도"
              description="교통 혼잡도는 반경 5km 내의 교통 데이터를 기반으로 계산됩니다."
              value={averageTrafficCongestion}
              iconSrc={Traffic}
            />
          </Accordion>

          <Accordion
            measurementData={parkingData}
            is3DModelLoaded={is3DModelLoaded}
            title="🅿️ 인근 주차장"
            isOpen={openIndex === 3}
            onToggle={() => handleToggle(3)}
          >
            <DataDisplay
              label="인근 주차장 정보"
              description="기본요금은 30분에 1000원이며 추가요금은 15분당 500원으로 계산됩니다. "
              value={`${parkingData?.value?.name},\n${parkingData?.value?.addr}`}
              iconSrc={Parking}
            />
          </Accordion>
          <Accordion
            is3DModelLoaded={is3DModelLoaded}
            title="📢 공지"
            isOpen={openIndex === 4}
            onToggle={() => handleToggle(4)}
          >
            <DataDisplay
              label="공지"
              description="공지사항"
              value="공지사항"
              iconSrc={Notification}
            />
          </Accordion>
        </div>
      </div>
    </div>
  );
}
function Accordion({
  measurementData,
  is3DModelLoaded,
  title,
  isOpen,
  onToggle,
  children,
}: any) {
  const formatObservedAt = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };
  return (
    <div className="">
      <button
        className={`flex w-full items-center justify-between hover:bg-gray-50 ${isOpen ? 'rounded-t-md' : 'rounded-md'} bg-gray-100 px-4 py-2 text-left`}
        onClick={onToggle}
      >
        {is3DModelLoaded ? (
          <>
            <span className="w-[120px] text-[20px] font-semibold">{title}</span>
            {measurementData?.observedAt ? (
              <span>
                최신 갱신 : {formatObservedAt(measurementData.observedAt)}
              </span>
            ) : null}
            <span className="text-[20px] font-semibold">
              {isOpen ? (
                <ArrowUpIcon className="fill-gray-400" />
              ) : (
                <ArrowDownIcon className="fill-gray-400" />
              )}
            </span>
          </>
        ) : (
          <Skeleton className="h-[36px] w-full" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 rounded-b-md bg-white p-4">
          {children}
        </div>
      )}
    </div>
  );
}

function DataDisplay({
  label,
  description,
  unit,
  value,
  iconSrc,
}: {
  label: string;
  description?: string;
  unit?: string;
  value: string | number;
  iconSrc?: string;
}) {
  return (
    <div className="relative border-b-[1px] border-solid border-b-gray-400 pb-2">
      <p className="text-[18px] font-bold">{label}</p>
      <p className="mt-[4px] text-gray-500">{description}</p>
      <div className="my-[8px]">
        <div className="flex items-end gap-[6px] px-[4px]">
          <p className="whitespace-pre-wrap text-[18px] font-semibold leading-[24px]">
            {value}
          </p>
          <p className="mb-[4px] text-[14px] leading-[1] text-gray-500">
            {unit}
          </p>
          {iconSrc && (
            <img
              src={iconSrc}
              alt={label}
              className="absolute right-[16px] z-10 !h-[36px] !w-[36px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelInformation;

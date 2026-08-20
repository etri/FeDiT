import { type ReactNode, useMemo } from 'react';

import {
  Accordion as UiAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@e8ight/ui/components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { meanBy } from 'es-toolkit';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CloudHail,
  CloudRain,
  Droplets,
  type LucideIcon,
  ParkingSquare,
  Thermometer,
  TrafficCone,
  Wind,
} from 'lucide-react';

import { ndxproQueries } from '@/apis/ndxpro';

interface ModelInformationProps {
  is3DModelLoaded: boolean;
  tourId: string;
}

const fdtTourEntityIdMap: Record<string, string> = {
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

export function ModelInformation({
  is3DModelLoaded,
  tourId,
}: ModelInformationProps) {
  const mappedEntityId = fdtTourEntityIdMap[tourId] || fdtTourEntityIdMap['03'];

  const { data: fdtTour } = useQuery(
    ndxproQueries.fdtTour({
      federatedDigitalObjectId: mappedEntityId,
      secretKey: '4d8cf9f0-0654-4bc1-bb34-edd6539d1efa',
      enabled: !!mappedEntityId && is3DModelLoaded,
    }),
  );

  const { weatherData, airQualityData, trafficData, parkingData } =
    useMemo(() => {
      const dataset = fdtTour?.federation_data?.dataset ?? [];
      return {
        weatherData: dataset.find((item) => item.type === 'FdtWeather')
          ?.weatherMeasurement,
        airQualityData: dataset.find((item) => item.type === 'FdtAirQuality')
          ?.airQualityMeasurement,
        trafficData: dataset.find((item) => item.type === 'FdtTraffic')
          ?.trafficMeasurement,
        parkingData: dataset.find((item) => item.type === 'FdtParking')
          ?.parkingMeasurement,
      };
    }, [fdtTour]);

  const averageTrafficCongestion = trafficData?.value?.length
    ? meanBy(trafficData.value, (item) => item.tfvl).toFixed(2)
    : 'No data';

  return (
    <Card className="flex-1">
      <CardHeader>
        {is3DModelLoaded ? (
          <CardTitle className="text-foreground text-lg font-bold">
            {fdtTour ? fdtTour.measure_position_name : ''}
          </CardTitle>
        ) : (
          <Skeleton className="h-9 w-60" />
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="bg-muted flex flex-1 flex-col gap-2 overflow-y-auto rounded-md p-4">
          {is3DModelLoaded ? (
            <p className="text-foreground shrink-0 py-1 text-center text-sm font-bold tracking-[.03em]">
              📍 지역 정보 반경 (5km)
            </p>
          ) : (
            <Skeleton className="m-auto my-2 h-11 w-60 shrink-0" />
          )}
          <UiAccordion
            type="single"
            collapsible
            className="flex flex-1 flex-col gap-2"
          >
            <RegionSectionItem
              value="air-quality"
              icon="💨"
              title="공기질"
              isLoaded={is3DModelLoaded}
              observedAt={airQualityData?.observedAt}
            >
              <DataDisplay
                label="미세먼지"
                unit="µg/m³"
                value={airQualityData?.value?.pm10_value}
                icon={CloudHail}
              />
              <DataDisplay
                label="초미세먼지"
                unit="µg/m³"
                value={airQualityData?.value?.pm25_value}
                icon={CloudHail}
              />
            </RegionSectionItem>

            <RegionSectionItem
              value="weather"
              icon="🌤️"
              title="날씨"
              isLoaded={is3DModelLoaded}
              observedAt={weatherData?.observedAt}
            >
              <DataDisplay
                label="온도"
                unit="°C"
                value={weatherData?.value?.temperature}
                icon={Thermometer}
              />
              <DataDisplay
                label="습도"
                unit="%"
                value={weatherData?.value?.humidity}
                icon={Droplets}
              />
              <DataDisplay
                label="강수량"
                value={weatherData?.value?.precipitation_one_hour}
                icon={CloudRain}
              />
              <DataDisplay
                label="풍속"
                unit="m/s"
                value={weatherData?.value?.wind_speed}
                icon={Wind}
              />
            </RegionSectionItem>

            <RegionSectionItem
              value="traffic"
              icon="🚦"
              title="교통"
              isLoaded={is3DModelLoaded}
              observedAt={trafficData?.observedAt}
            >
              <DataDisplay
                label="평균 교통 혼잡도"
                description="교통 혼잡도는 반경 5km 내의 교통 데이터를 기반으로 계산됩니다."
                value={averageTrafficCongestion}
                icon={TrafficCone}
              />
            </RegionSectionItem>

            <RegionSectionItem
              value="parking"
              icon="🅿️"
              title="인근 주차장"
              isLoaded={is3DModelLoaded}
              observedAt={parkingData?.observedAt}
            >
              <DataDisplay
                label="인근 주차장 정보"
                description="기본요금은 30분에 1000원이며 추가요금은 15분당 500원으로 계산됩니다."
                value={`${parkingData?.value?.name},\n${parkingData?.value?.addr}`}
                icon={ParkingSquare}
              />
            </RegionSectionItem>

            <RegionSectionItem
              value="notice"
              icon="📢"
              title="공지"
              isLoaded={is3DModelLoaded}
            >
              <DataDisplay
                label="공지"
                description="공지사항"
                value="공지사항"
                icon={Bell}
              />
            </RegionSectionItem>
          </UiAccordion>
        </div>
      </CardContent>
    </Card>
  );
}

interface RegionSectionItemProps {
  value: string;
  title: string;
  icon: string;
  isLoaded: boolean;
  observedAt?: string;
  children: ReactNode;
}

function RegionSectionItem({
  value,
  title,
  icon,
  isLoaded,
  observedAt,
  children,
}: RegionSectionItemProps) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-md border-0"
    >
      <AccordionTrigger className="hover:bg-muted/80 bg-muted/50 flex-wrap gap-x-2 gap-y-1 rounded-md border-0 px-4 py-2 text-left font-normal hover:no-underline focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:rounded-b-none [&>svg]:hidden">
        {isLoaded ? (
          <>
            <span className="text-foreground w-[120px] shrink-0 text-sm font-bold tracking-[.03em]">
              {icon} {title}
            </span>
            {observedAt && (
              <span>최신 갱신 : {formatObservedAt(observedAt)}</span>
            )}
            <span className="text-xl font-semibold">
              <ChevronUp className="text-muted-foreground hidden group-aria-expanded/accordion-trigger:block" />
              <ChevronDown className="text-muted-foreground group-aria-expanded/accordion-trigger:hidden" />
            </span>
          </>
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
      </AccordionTrigger>
      <AccordionContent className="bg-card rounded-b-md p-4 [&_p]:mb-0">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function formatObservedAt(timestamp: string) {
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
}

function DataDisplay({
  label,
  description,
  unit,
  value,
  icon: Icon,
}: {
  label: string;
  description?: string;
  unit?: string;
  value: string | number | undefined;
  icon?: LucideIcon;
}) {
  return (
    <div className="border-border relative border-b pb-2">
      <p className="text-foreground text-sm font-bold">{label}</p>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
      <div className="my-2">
        <div className="flex items-end gap-1.5 px-1 pr-14">
          <p className="text-foreground text-sm font-bold whitespace-pre-wrap">
            {value}
          </p>
          {unit && (
            <p className="text-muted-foreground mb-1 text-sm leading-none">
              {unit}
            </p>
          )}
          {Icon && (
            <Icon className="text-muted-foreground absolute right-4 z-10 size-9" />
          )}
        </div>
      </div>
    </div>
  );
}

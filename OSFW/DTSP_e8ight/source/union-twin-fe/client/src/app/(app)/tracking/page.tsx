import DefinitionTable from '@/app/(app)/tracking/_components/DefinitionTable';
import FormSection from '@/app/(app)/tracking/_components/FormSection';
import TrackingForm from '@/app/(app)/tracking/_components/TrackingForm';
import {
  INTERFACE_DEFINITION_COLUMNS,
  INTERFACE_DEFINITION_ROWS,
  TRACKING_REQUEST_COLUMNS,
  TRACKING_REQUEST_ROWS,
} from '@/app/(app)/tracking/_constants/definitionTableData';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="동적 데이터 / 이벤트 트레킹 프로세스" />

      <FormSection
        title="인터페이스 정의 (Tracking Command)"
        defaultOpen={false}
      >
        <DefinitionTable
          columnTitles={INTERFACE_DEFINITION_COLUMNS}
          tableRows={INTERFACE_DEFINITION_ROWS}
        />
      </FormSection>

      <FormSection
        title="트래킹 요청 정의 (Tracking Command)"
        defaultOpen={false}
      >
        <DefinitionTable
          columnTitles={TRACKING_REQUEST_COLUMNS}
          tableRows={TRACKING_REQUEST_ROWS}
        />
      </FormSection>

      <TrackingForm />
    </PageContainer>
  );
}

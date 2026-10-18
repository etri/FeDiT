# 폼 추가 가이드

이 문서는 프로젝트에 새로운 폼을 추가하는 방법을 설명합니다.

## 프로젝트 구조

```
src/
├── components/
│   ├── forms/                    # 모든 폼 컴포넌트
│   │   ├── general/             # General 카테고리 폼들
│   │   │   └── GeneralForm.tsx
│   │   └── simulation/          # Simulation 카테고리 폼들
│   │       └── dredged/         # Dredged 서브카테고리
│   │           └── DredgedLBM.tsx
│   └── workbench/
│       ├── FormStateDialog.tsx  # 폼 상태 다이얼로그
│       └── ProjectPanel.tsx     # 프로젝트 설정 패널
├── config/
│   ├── formConfig.ts            # 폼 정의 및 설정
│   └── projectConfig.ts         # 프로젝트 설정 및 폼 매핑
├── services/                    # API 서비스 레이어
│   ├── api/
│   │   ├── client.ts           # axios 인스턴스
│   │   ├── config.ts           # API 설정
│   │   └── types.ts            # API 타입
│   └── simulation/
│       └── simulationService.ts # 시뮬레이션 서비스
├── stores/
│   └── projectStore.ts          # Zustand 전역 상태 관리
└── types/
    └── formTypes.ts             # 폼 관련 타입 정의
```

## 새 폼 추가 3단계

### 1단계: 폼 컴포넌트 생성

적절한 카테고리 폴더에 새 폼 컴포넌트를 생성합니다.<br>
**중요**: 현재 사용 중인 패턴은 `forwardRef`와 `useImperativeHandle`을 사용하여 부모 컴포넌트에서 폼 메서드를 호출할 수 있도록 합니다.

**예시: `src/components/forms/simulation/heatTransfer/HeatTransferLBM.tsx`**

```tsx
import { forwardRef, useImperativeHandle } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import type { FormRef } from '../../../../types/formTypes';

interface BoundaryCondition {
  type: string;
  value: number;
}

interface HeatTransferLBMFormData {
  initialTemperature: number;
  heatSource: number;
  timeSteps: number;
  boundaryConditions: BoundaryCondition[];
}

const HeatTransferLBM = forwardRef<FormRef>((_, ref) => {
  const {
    control,
    formState: { errors, touchedFields },
    getValues,
    trigger,
  } = useForm<HeatTransferLBMFormData>({
    defaultValues: {
      initialTemperature: 20,
      heatSource: 100,
      timeSteps: 1000,
      boundaryConditions: [{ type: 'Dirichlet', value: 25 }],
    },
  });

  // 동적 배열 필드 관리 (boundaryConditions)
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'boundaryConditions',
  });

  // 부모 컴포넌트에서 호출 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    getData: () => {
      return getValues();
    },
    validate: async () => {
      const result = await trigger();
      return result;
    },
    getErrors: () => errors,
    getTouchedFields: () => touchedFields
  }));

  const handleAddBoundary = () => {
    append({ type: 'Neumann', value: 0 });
  };

  const handleRemoveBoundary = () => {
    if (fields.length > 1) {
      remove(fields.length - 1);
    }
  };

  // DataTable 셀 편집 핸들러
  const onCellEditComplete = (e: any) => {
    const { field: columnField, newValue, rowIndex, originalEvent: event } = e;
    
    if (newValue === null || newValue === undefined) {
      event.preventDefault();
      return;
    }
    
    // id 필드 제외하고 업데이트 (useFieldArray가 자동으로 추가하는 id 제외)
    const { id, ...boundaryData } = fields[rowIndex] as any;
    update(rowIndex, { ...boundaryData, [columnField]: newValue });
  };

  return (
    <form className="p-fluid">
      <div className="field">
        <label htmlFor="initialTemperature">Initial Temperature (°C)</label>
        <Controller
          name="initialTemperature"
          control={control}
          rules={{
            required: "Initial temperature is required",
            min: { value: -273, message: "Temperature must be above absolute zero" },
          }}
          render={({ field, fieldState }) => (
            <InputNumber
              id={field.name}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              className={classNames({ "p-invalid": fieldState.error })}
            />
          )}
        />
        {errors.initialTemperature && (
          <small className="p-error">{errors.initialTemperature.message}</small>
        )}
      </div>

      <div className="field">
        <label htmlFor="heatSource">Heat Source (W/m²)</label>
        <Controller
          name="heatSource"
          control={control}
          rules={{
            required: "Heat source is required",
            min: { value: 0, message: "Heat source must be non-negative" },
          }}
          render={({ field, fieldState }) => (
            <InputNumber
              id={field.name}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              className={classNames({ "p-invalid": fieldState.error })}
            />
          )}
        />
        {errors.heatSource && (
          <small className="p-error">{errors.heatSource.message}</small>
        )}
      </div>

      {/* Boundary Conditions DataTable */}
      <div className="field">
        <div className="flex justify-content-between align-items-center mb-2">
          <label>Boundary Conditions</label>
          <div className="flex gap-2">
            <Button
              type="button"
              icon="pi pi-plus"
              size="small"
              onClick={handleAddBoundary}
              style={{
                width: "1.8rem",
                height: "1.8rem",
                padding: 0,
              }}
            />
            <Button
              type="button"
              icon="pi pi-minus"
              size="small"
              outlined
              onClick={handleRemoveBoundary}
              disabled={fields.length <= 1}
              style={{
                width: "1.8rem",
                height: "1.8rem",
                padding: 0,
              }}
            />
          </div>
        </div>
        
        <DataTable
          value={fields}
          size="small"
          editMode="cell"
        >
          <Column
            field="type"
            header="Boundary Type"
            editor={(options) => (
              <select
                value={options.value}
                onChange={(e) => options.editorCallback?.(e.target.value)}
              >
                <option value="Dirichlet">Dirichlet</option>
                <option value="Neumann">Neumann</option>
                <option value="Robin">Robin</option>
              </select>
            )}
            onCellEditComplete={onCellEditComplete}
          />
          <Column
            field="value"
            header="Boundary Value"
            editor={(options) => (
              <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback?.(e.value)}
              />
            )}
            onCellEditComplete={onCellEditComplete}
          />
        </DataTable>
      </div>
    </form>
  );
});

HeatTransferLBM.displayName = 'HeatTransferLBM';

export default HeatTransferLBM;
```

### 2단계: formConfig.ts에 폼 등록

`src/config/formConfig.ts` 파일에서 새 폼을 등록합니다.<br>
**중요**: 3단계 깊이 구조를 사용합니다: `category.subcategory.key`

```typescript
// FormId는 3단계 깊이: category.subcategory.key
export type FormId = `${FormCategory}.${string}.${string}`;

// FORM_CATEGORIES에 새 폼 추가
export const FORM_CATEGORIES = {
  general: {
    basic: {
      info: {
        component: lazy(() => import('../components/forms/general/GeneralForm')),
        name: 'General Settings',
        icon: 'pi pi-cog'
      }
    }
  },
  
  simulation: {
    dredged: {
      lbm: {
        component: lazy(() => import('../components/forms/simulation/dredged/DredgedLBM')),
        name: 'Dredged LBM',
        icon: 'pi pi-box'
      }
    },

    // 새 서브카테고리 추가 예시
    heatTransfer: {
      lbm: {
        component: lazy(() => import('../components/forms/simulation/heatTransfer/HeatTransferLBM')),
        name: 'Heat Transfer LBM',
        icon: 'pi pi-fire'
      }
    }
  },
} as const;
```

### 3단계: 프로젝트 타입에 폼 매핑

`src/config/projectConfig.ts`에서 프로젝트별로 사용할 폼을 지정합니다.<br>
_(⚠️ 현재는 프로젝트 당 하나의 폼만 사용할 수 있습니다. - 25.09.16 기준)_

```typescript
// <------- Define project form mapping below ------->

// Define simulation and solver types (for type safety)
export type SimulationType = 'dredged' | 'heatTransfer';
export type SolverType = 'lbm' | 'default';

// Depth-based project form mapping: simulation -> solver -> forms
export const PROJECT_FORM_MAPPING: ProjectFormMapping = {
  dredged: {
    lbm: ["simulation.dredged.lbm"],
    default: ["general.basic.info"], // Fallback for dredged with unknown solver
  },

  // 생성한 Form 매핑
  heatTransfer: {
    lbm: ["simulation.heatTransfer.lbm"],
  },

  default: {
    default: ["general.basic.info"], // Ultimate fallback
  },
} as const;

// <---------------------------------------------------------->
```

## TypeScript 타입 안정성 가이드

### 타입 안정성 원칙
- **any 타입 사용 금지**: 모든 데이터는 명시적 타입 정의 필요
- **엄격 모드 준수**: TypeScript strict 모드에서 에러 없이 동작해야 함
- **타입 추론 활용**: 가능한 경우 TypeScript의 타입 추론 기능 활용

### getTouchedFields 올바른 구현
`getTouchedFields` 메서드 구현 시 타입 안정성을 보장하는 패턴:

```typescript
// 잘못된 예시 (타입 에러 발생)
getTouchedFields: () => touchedFields  // ❌ 중첩 구조와 플랫 구조 불일치

// 올바른 예시 (타입 안전)
getTouchedFields: () => {
  const flattened: Partial<Record<keyof FormData, boolean>> = {};
  
  Object.keys(touchedFields).forEach((key) => {
    if (key !== 'particles') {  // 배열 필드 제외
      const value = touchedFields[key as keyof typeof touchedFields];
      if (typeof value === 'boolean') {
        flattened[key as keyof FormData] = value;
      }
    }
  });
  
  // 배열 필드 처리
  if (touchedFields.particles && 
      Array.isArray(touchedFields.particles) && 
      touchedFields.particles.length > 0) {
    flattened.particles = true;
  }
  
  return flattened;
}
```

### PrimeReact InputNumber 타입 처리
PrimeReact의 `InputNumber` 컴포넌트는 `Nullable<number>` 타입을 사용합니다:

```typescript
// Nullable 타입 정의
type Nullable<T> = T | null | undefined;

// InputNumber onChange 처리
<InputNumber
  value={field.value}
  onValueChange={(e) => {
    // e.value는 Nullable<number> 타입
    field.onChange(e.value ?? null);  // nullish coalescing 사용
  }}
/>

// 함수에서 처리
const handleNumberChange = (e: InputNumberChangeEvent) => {
  const value = e.value ?? null;  // number | null로 변환
  updateField(value);
};
```

### 동적 배열 필드 타입 처리
`useFieldArray` 사용 시 타입 안정성:

```typescript
interface Particle {
  diameter: number;
  density: number;
  concentration: number;
}

// useFieldArray의 fields는 자동으로 id 필드가 추가됨
const { fields, update } = useFieldArray<{
  particles: Particle[]
}>({
  control,
  name: 'particles'
});

// 셀 편집 시 타입 안전한 처리
const handleParticleFieldChange = (
  rowIndex: number,
  field: keyof Particle,
  value: number | null
) => {
  if (value === null) return;
  
  // 기존 데이터 유지하면서 업데이트
  const currentParticle = getValues(`particles.${rowIndex}`);
  setValue(`particles.${rowIndex}.${field}`, value);
  trigger(`particles.${rowIndex}.${field}`);
};
```

## API 서비스 통합

### 서비스 레이어 구조
프로젝트에는 API 통신을 위한 서비스 레이어가 구축되어 있습니다:

```
src/services/
├── api/
│   ├── client.ts      # axios 인스턴스 및 인터셉터
│   ├── config.ts      # API 엔드포인트 설정
│   └── types.ts       # 공통 API 타입 정의
├── simulation/
│   ├── simulationService.ts  # 시뮬레이션 API 서비스
│   └── simulationTypes.ts    # 시뮬레이션 타입 정의
└── index.ts          # 서비스 export
```

### 폼 데이터 제출
폼 데이터를 API로 전송하는 방법:

```typescript
import { simulationService } from '../../../services';

const MyForm = forwardRef<FormRef>((_, ref) => {
  const { getValues, trigger } = useForm<FormData>();
  
  // 폼 제출 처리
  const handleSubmit = async () => {
    // 1. 유효성 검증
    const isValid = await trigger();
    if (!isValid) return;
    
    // 2. 폼 데이터 가져오기
    const formData = getValues();
    
    // 3. API 호출
    try {
      const response = await simulationService.createSimulation({
        type: 'dredged_lbm',
        parameters: formData
      });
      
      console.log('Simulation created:', response);
    } catch (error) {
      console.error('Failed to create simulation:', error);
    }
  };
  
  return (
    // 폼 UI...
  );
});
```

### 환경 변수 설정
API 엔드포인트는 환경 변수로 관리됩니다:

```typescript
// .env 파일
VITE_API_BASE_URL=http://localhost:8000/api

// 사용
import { API_BASE_URL } from '../../config';
```

자세한 환경 변수 설정은 [vite-environment-variables.md](./vite-environment-variables.md)를 참조하세요.

### 에러 처리
API 응답 에러 처리 패턴:

```typescript
try {
  const result = await simulationService.runSimulation(id);
  // 성공 처리
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 400) {
      // 유효성 검증 에러
      const validationErrors = error.response.data.errors;
      // 폼 에러로 표시
    } else if (error.response?.status === 401) {
      // 인증 에러
    }
  }
  // 일반 에러 처리
}
```

## 체크리스트

새 폼을 추가할 때 확인해야 할 사항:

- [ ] 폼 컴포넌트가 `forwardRef`를 사용하는가?
- [ ] `useImperativeHandle`로 필수 메서드를 노출하는가?
  - [ ] `getData()`: 폼 데이터 반환
  - [ ] `validate()`: 폼 검증 실행
  - [ ] `getErrors()`: 에러 객체 반환
  - [ ] `getTouchedFields()`: 터치된 필드 반환
- [ ] `useFieldArray`를 사용하여 동적 배열 필드를 관리하는가? (필요한 경우)
- [ ] DataTable 셀 편집 시 `id` 필드를 제외하는가?
- [ ] `formConfig.ts`에 3단계 구조로 등록했는가?
- [ ] 적절한 아이콘과 이름을 추가했는가?
- [ ] `displayName`을 설정했는가?
- [ ] TypeScript 타입 안정성을 보장하는가? (any 타입 사용 금지)

## 파일 구조 설명

### 핵심 패턴
- **forwardRef & useImperativeHandle**: 부모 컴포넌트(ProjectPanel)에서 폼 메서드 호출
- **useFieldArray**: 동적 배열 필드 관리 (예: particles, materials)
- **3단계 구조**: category.subcategory.key (예: `simulation.dredged.lbm`)

### 역할 분리
- **`formConfig.ts`**: 폼 컴포넌트 정의, 메타데이터, lazy loading
- **`projectConfig.ts`**: 프로젝트 타입별 폼 매핑, 조건부 폼 선택
- **`projectStore.ts`**: Zustand를 통한 전역 프로젝트 상태 관리
- **`services/`**: API 통신 및 비즈니스 로직

### Import 경로 참고
폼 컴포넌트에서 주요 import 경로:
- FormRef 타입: `../../../../types/formTypes` (깊이에 따라 조정)
- PrimeReact 컴포넌트: `primereact/[component]`
- React Hook Form: `react-hook-form`
- API 서비스: `../../../services`

## 팁

### 카테고리 구성
- **general**: 프로젝트 기본 정보
- **simulation**: 시뮬레이션 설정
  - **dredged**: 준설 시뮬레이션
  - **heatTransfer**: 열전달 시뮬레이션
- **analysis**: 분석 도구 설정
- **mesh**: 메시 생성 설정

### 네이밍 규칙
- 폼 컴포넌트: `[Domain][Type].tsx` (예: `DredgedLBM.tsx`, `HeatTransferLBM.tsx`)
- 폼 ID: `category.subcategory.key` (예: `simulation.dredged.lbm`)

### useFieldArray 사용 시 주의사항 (DataTable 셀 편집)
```typescript
// 셀 편집 시 id 필드 제외
const onCellEditComplete = (e: any) => {
  const { field: columnField, newValue, rowIndex } = e;
  // id 필드를 제외한 데이터만 업데이트
  const { id, ...data } = fields[rowIndex] as any;
  update(rowIndex, { ...data, [columnField]: newValue });
};
```

### Zustand Store 활용 예시
```typescript
import useProjectStore from '../../../../stores/projectStore';

const MyForm = forwardRef<FormRef>((_, ref) => {
  const { projectId, projectName, simulation, solver } = useProjectStore();
  // 전역 프로젝트 상태 활용
});
```

## 문제 해결

### 폼이 표시되지 않는 경우
1. `formConfig.ts`에 3단계 구조로 올바르게 등록되었는지 확인
2. import 경로가 정확한지 확인
3. `displayName` 설정 확인

### forwardRef 관련 오류
1. `FormRef` 타입 import 확인
2. `useImperativeHandle`의 모든 메서드 구현 확인
3. ref를 올바르게 전달하는지 확인

### useFieldArray 문제
1. `fields` 배열 사용 시 `id` 필드 자동 추가됨을 인지
2. 업데이트 시 `id` 필드 제외 필요
3. `append`, `remove`, `update` 메서드 올바른 사용

### TypeScript 타입 에러
1. `any` 타입 사용 여부 확인
2. `Nullable` 타입 처리 확인
3. 타입 정의 누락 여부 확인

## 참고 파일
- **실제 구현 예시**: 
  - `src/components/forms/simulation/dredged/DredgedLBM.tsx` (타입 안전 구현)
  - `src/components/forms/general/GeneralForm.tsx`
- **API 서비스**:
  - `src/services/api/client.ts` (axios 설정)
  - `src/services/simulation/simulationService.ts` (API 호출)
- **폼 설정**: `src/config/formConfig.ts` (3단계 구조)
- **프로젝트 설정**: `src/config/projectConfig.ts` (조건부 폼 매핑)
- **타입 정의**: `src/types/formTypes.ts` (FormRef 인터페이스)
- **전역 상태**: `src/stores/projectStore.ts` (Zustand)
- **관련 문서**: 
  - [API 서비스 가이드](./api-service-guide.md)
  - [환경 변수 설정](./vite-environment-variables.md)
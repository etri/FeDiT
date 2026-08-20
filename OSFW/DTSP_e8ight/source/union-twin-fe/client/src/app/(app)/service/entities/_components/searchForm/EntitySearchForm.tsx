import { Button } from '@e8ight/ui/components/ui/button';
import { Plus, X } from 'lucide-react';

import EntityCriteriaDateTimeInput from '@/app/(app)/service/entities/_components/EntityCriteriaDateTimeInput';
import EntitySearchCriteriaInput from '@/app/(app)/service/entities/_components/searchForm/EntitySearchCriteriaInput';
import { useEntityTabStore } from '@/app/(app)/service/entities/_stores/useEntityTabStore';
import {
  createEmptyCriteriaInfo,
  createEmptyObservedTimeInfo,
} from '@/app/(app)/service/entities/_utils/searchInfo';

import type {
  CriteriaInfoTypeList,
  ObservedTimeInfoType,
  SearchCriteriaInfoType,
} from '@/apis/entity';

interface IProps {
  searchCriteriaInfoList: CriteriaInfoTypeList;
  isDynamic?: boolean | null;
  timePropertyList?: string[];
}

function EntitySearchForm({
  searchCriteriaInfoList,
  isDynamic,
  timePropertyList,
}: IProps) {
  const searchInfo = useEntityTabStore((s) => s.searchInfo);
  const setSearchInfo = useEntityTabStore((s) => s.setSearchInfo);
  const criteriaList = searchInfo.criteriaInfoList;
  const isDynamicMode = Boolean(isDynamic);

  const updateCriteriaAt = (index: number, next: SearchCriteriaInfoType) => {
    const updated = [...criteriaList];
    updated[index] = next;
    setSearchInfo({ ...searchInfo, criteriaInfoList: updated });
  };

  const addFilter = () => {
    setSearchInfo({
      ...searchInfo,
      criteriaInfoList: [...criteriaList, createEmptyCriteriaInfo()],
    });
  };

  const removeFilter = (index: number) => {
    if (criteriaList.length === 1) {
      setSearchInfo({
        ...searchInfo,
        criteriaInfoList: [createEmptyCriteriaInfo()],
      });
      return;
    }
    setSearchInfo({
      ...searchInfo,
      criteriaInfoList: criteriaList.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3">
      {isDynamicMode && timePropertyList && (
        <EntityCriteriaDateTimeInput
          label="Observed time"
          timePropertyList={timePropertyList}
          searchCriteriaInfoList={searchCriteriaInfoList}
          observedTimeInfo={
            searchInfo.observedTimeInfo ?? createEmptyObservedTimeInfo()
          }
          onChange={(nextObservedTimeInfo: ObservedTimeInfoType) =>
            setSearchInfo({
              ...searchInfo,
              observedTimeInfo: nextObservedTimeInfo,
            })
          }
        />
      )}
      <div className="space-y-2">
        {criteriaList.map((criteria, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <EntitySearchCriteriaInput
                label="Field"
                searchCriteriaInfoList={searchCriteriaInfoList}
                searchCriteriaInfo={criteria}
                observedTimeProperty={
                  isDynamicMode
                    ? (
                        searchInfo.observedTimeInfo ??
                        createEmptyObservedTimeInfo()
                      ).property
                    : undefined
                }
                onChange={(next: SearchCriteriaInfoType) =>
                  updateCriteriaAt(index, next)
                }
              />
            </div>
            {criteriaList.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-1 shrink-0 gap-1.5"
                onClick={() => removeFilter(index)}
              >
                <X className="size-4" />
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-1.5 py-1"
          onClick={addFilter}
        >
          <Plus className="size-3.5" />
          Add filter
        </Button>
      </div>
    </div>
  );
}

export default EntitySearchForm;

import type { Dispatch, SetStateAction } from 'react';

import { toast } from '@e8ight/ui/components/ui/sonner';

import type { DataModelAttribute as DataModelApiAttribute } from '@/apis/model';
import type {
  DataModelAttribute,
  DataModelAttributeFormatted,
  ObjectMemberFormatted,
  ObjectMemberRecord,
  ObjectMemberValue,
} from '@/types/dataModel';

export const attributesToArray = (
  attributeNames: Record<string, string>,
  attributes: Record<string, DataModelApiAttribute>,
): DataModelAttributeFormatted[] => {
  const arr: DataModelAttributeFormatted[] = [];
  Object.entries(attributes).forEach(([key, value]) => {
    const filteredValue = structuredClone(value);
    delete filteredValue.childAttributeNames;

    arr.push({
      id: key,
      value: (!value.childAttributes
        ? value
        : {
            ...filteredValue,
            childAttributes: attributesToArray(
              value.childAttributeNames!,
              value.childAttributes,
            ),
          }) as DataModelAttribute,
      name: attributeNames[key],
      toggle: false,
    });
  });
  return arr;
};

export const ObjectMemberToArray = (
  objectMembers: Record<string, unknown>,
): ObjectMemberFormatted[] => {
  const arr: ObjectMemberFormatted[] = [];
  Object.entries(objectMembers as Record<string, ObjectMemberRecord>).forEach(
    ([key, value]) => {
      arr.push({
        id: key,
        value: (!value.objectMember
          ? value
          : {
              ...value,
              ...{ objectMember: ObjectMemberToArray(value.objectMember) },
            }) as ObjectMemberValue,
        toggle: false,
      });
    },
  );
  return arr;
};

export const memberToObject = (
  arr: ObjectMemberFormatted[],
): Record<string, unknown> => {
  const newObj: Record<string, unknown> = {};
  arr.forEach((e) => {
    newObj[e.id] = e.value;
    if (e.value.objectMember) {
      const newChildObj: Record<string, unknown> = structuredClone(e.value);
      newChildObj.objectMember = memberToObject(e.value.objectMember);
      newObj[e.id] = newChildObj;
    }
  });
  return newObj;
};

export const attributesToObject = (
  attributes: DataModelAttributeFormatted[],
) => {
  const attributeNamesObj: Record<string, string> = {};
  attributes.forEach((e) => {
    attributeNamesObj[e.id] = e.name;
  });

  const attributesObj: Record<string, unknown> = {};
  attributes.forEach((e) => {
    const value = attributeFilter(e.value);
    attributesObj[e.id] = {
      ...value,
      ...childAttributesToObject(value.childAttributes),
    };
  });

  return { attributeNames: attributeNamesObj, attributes: attributesObj };
};

const childAttributesToObject = (
  childAttributes: DataModelAttributeFormatted[] | undefined,
) => {
  if (!childAttributes) {
    return {};
  }

  const childAttributeNamesObj: Record<string, string> = {};
  childAttributes.forEach((e) => {
    childAttributeNamesObj[e.id] = e.name;
  });

  const childAttributesObj: Record<string, DataModelAttribute> = {};
  childAttributes.forEach((e) => {
    const value = attributeFilter(e.value);
    childAttributesObj[e.id] = value;
  });

  return {
    childAttributeNames: childAttributeNamesObj,
    childAttributes: childAttributesObj,
  };
};

export const AddAttributeOrMemberHandle = <
  T extends { id: string; toggle: boolean; value: object },
>(
  owner: string | undefined,
  closer: () => void,
  attributeType: 'objectMember' | 'childAttributes',
  newItem: T,
  state: T[],
  setState: Dispatch<SetStateAction<T[]>>,
  setModelSelected?: Dispatch<SetStateAction<Array<string | undefined>>>,
) => {
  if (!newItem.id || newItem.id.trim() === '') {
    toast.warning('Attribute ID is required');
    return;
  }

  const newState = structuredClone(state);

  if (!owner) {
    if (newState.some((e) => e.id === newItem.id)) {
      toast.warning('Duplicate Attribute exist');
      return;
    }
    if (['unitCode', 'observedAt'].includes(newItem.id)) {
      toast.warning(`${newItem.id} must be a Child attribute`);
      return;
    }
    newState.push(newItem);
  }

  if (owner) {
    const ownerObj = newState.find((e) => e.id === owner);
    if (!ownerObj) return;

    const ownerValue = ownerObj.value as {
      objectMember?: T[];
      childAttributes?: T[];
    };
    const children = (ownerValue[attributeType] ??= []);

    if (children.some((e) => e.id === newItem.id)) {
      toast.warning(`Duplicate child attribute exist in ${owner}`);
      return;
    }
    children.push(newItem);
    ownerObj.toggle = true;
  }

  setState(newState);
  closer();

  if (setModelSelected) {
    setModelSelected([owner, newItem.id]);
  }
};

const attributeFilter = (value: DataModelAttribute) => {
  const newValue = structuredClone(value);
  if (newValue.format === '') {
    delete newValue.format;
  }

  if (newValue.enum?.length === 0) {
    delete newValue.enum;
  }

  if (
    newValue.objectMember &&
    Object.entries(newValue.objectMember).length === 0
  ) {
    delete newValue.objectMember;
  }

  if (newValue.valid && Object.entries(newValue.valid).length === 0) {
    delete newValue.valid;
  }

  if (newValue.modelType?.length === 0) {
    delete newValue.modelType;
  }

  if (newValue.description === '') {
    delete newValue.description;
  }
  return newValue;
};

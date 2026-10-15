import { prefixValueForAttributeType } from '@/app/(app)/service/entities/_constants/entity';
import { AttributeTypes } from '@/types/common';

import type { NGSILDType } from '@/apis/entity';
import type { TreeJsonType } from '@/app/(app)/service/entities/_types/entityTree';

function isAttributeNode(
  value: unknown,
): value is Record<string, unknown> & { type: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.constructor === Object &&
    'type' in value &&
    typeof value.type === 'string'
  );
}

const attributeTypeValues: string[] = [
  AttributeTypes.Property,
  AttributeTypes.Relationship,
];

export function generateTreeListJson(attributeObj: NGSILDType) {
  const jsonForTreeList: TreeJsonType = {};

  const appendTreeItemAtTreeList = (
    target: string,
    objectValue: Record<string, unknown> & { type: string },
    depth: number,
    parent: string,
  ) => {
    const jsonForTreeItem = {
      target,
      type: objectValue.type,
      parent,
      children: generateChildren(`${parent}/${target}`, depth, objectValue),
    };

    if (Object.keys(jsonForTreeList).includes(depth.toString())) {
      jsonForTreeList[depth].push(jsonForTreeItem);
    } else {
      jsonForTreeList[depth] = new Array(jsonForTreeItem);
    }
  };

  const generateChildren = (
    parent: string,
    depth: number,
    objectValue: Record<string, unknown>,
  ) => {
    const children: Record<string, unknown> = {};
    Object.entries(objectValue)
      .filter(([target]) => target !== 'type')
      .forEach(([target, value]) => {
        if (
          isAttributeNode(value) &&
          attributeTypeValues.includes(value.type)
        ) {
          children[target] = `${prefixValueForAttributeType}${value.type}`;
          appendTreeItemAtTreeList(target, value, depth + 1, parent);
        } else {
          children[target] = value;
        }
      });

    return children;
  };

  const metaKeys = new Set(['id', 'type', '@context']);
  Object.entries(attributeObj)
    .filter(([target]) => !metaKeys.has(target))
    .forEach(([target, value]) => {
      if (isAttributeNode(value)) {
        appendTreeItemAtTreeList(target, value, 0, 'root');
      }
    });

  return jsonForTreeList;
}

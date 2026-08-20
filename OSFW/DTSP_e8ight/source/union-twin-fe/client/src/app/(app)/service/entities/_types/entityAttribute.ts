import type { TreeItemType } from '@/app/(app)/service/entities/_types/entityTree';

export interface EntityAttributeSelection {
  depth: number;
  item: TreeItemType;
  path: string[];
  treePath: string;
}

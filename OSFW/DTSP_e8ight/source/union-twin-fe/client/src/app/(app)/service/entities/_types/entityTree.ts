export interface TreeItemType {
  target: string;
  type: string;
  parent: string;
  children: Record<string, unknown>;
}

export type TreeJsonType = Record<number, TreeItemType[]>;

export interface TreeHistoryType {
  treeHistoryId: string;
  treeHistory: Record<string, boolean>;
}

import type { ContextModel } from '@/types/context';

export function partitionContextModels(list: ContextModel[]) {
  const attrs = list.filter((x) => x.type === 'attr');
  const models = list.filter((x) => x.type === 'Model');
  return { attrs, models };
}

export function prependModel(list: ContextModel[], title: string) {
  const { attrs, models } = partitionContextModels(list);
  if (models.some((m) => m.title === title)) {
    return list;
  }
  return [{ type: 'Model', title }, ...models, ...attrs];
}

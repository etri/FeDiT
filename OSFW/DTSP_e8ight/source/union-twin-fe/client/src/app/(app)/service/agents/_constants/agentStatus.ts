export const AGENT_STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  RUN: 'default',
  STOP: 'destructive',
  CREATED: 'secondary',
  HANG: 'outline',
  DIED: 'destructive',
  DIE: 'destructive',
  DELETED: 'destructive',
};

export const AGENT_STATUS_CLASS: Record<string, string> = {
  DIED: 'bg-foreground text-background hover:bg-foreground',
  DIE: 'bg-black text-white hover:bg-black',
};

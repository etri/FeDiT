export type FileUnit = 'Bytes' | 'KB' | 'MB' | 'GB';

export const formatFileSize = (
  bytes: number,
): { value: number; unit: FileUnit; formatted: string } => {
  if (bytes === 0) {
    return { value: 0, unit: 'Bytes', formatted: '0 Bytes' };
  }
  const k = 1024;
  const sizes: FileUnit[] = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  const unit = sizes[i] ?? 'GB';
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return {
    value,
    unit,
    formatted: `${value} ${unit}`,
  };
};

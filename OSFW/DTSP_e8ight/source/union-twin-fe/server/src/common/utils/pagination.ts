export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  size: number,
) {
  return {
    data,
    meta: { page, size, total, totalPages: Math.ceil(total / size) },
  };
}

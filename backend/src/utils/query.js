export const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit) || 1
});

export const parseSort = (query, allowedFields, fallback = "-createdAt") => {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : fallback.replace("-", "");
  const direction = query.sortOrder === "asc" ? 1 : -1;

  if (query.sortBy && allowedFields.includes(query.sortBy)) {
    return { [sortBy]: direction };
  }

  return fallback.startsWith("-") ? { [fallback.slice(1)]: -1 } : { [fallback]: 1 };
};

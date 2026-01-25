import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export async function paginate<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
}

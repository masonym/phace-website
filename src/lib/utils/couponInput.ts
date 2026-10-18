export interface CouponFields {
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt?: Date;
  usageLimit?: number;
  categoryIds?: string[];
}

/**
 * Validates the editable coupon fields from an admin request body.
 * Empty optional fields come back undefined, meaning "not set".
 */
export function parseCouponFields(body: any): { fields: CouponFields } | { error: string } {
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return { error: 'Name is required' };
  }
  if (body.type !== 'PERCENTAGE' && body.type !== 'FIXED_AMOUNT') {
    return { error: 'Type must be PERCENTAGE or FIXED_AMOUNT' };
  }
  if (typeof body.value !== 'number' || !Number.isFinite(body.value) || body.value <= 0) {
    return { error: 'Value must be greater than 0' };
  }
  if (body.type === 'PERCENTAGE' && body.value > 100) {
    return { error: 'Percentage cannot exceed 100%' };
  }

  let expiresAt: Date | undefined;
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return { error: 'Expiry date is not a valid date' };
  }

  const usageLimit = body.usageLimit ?? undefined;
  if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    return { error: 'Usage limit must be a whole number of at least 1' };
  }

  const categoryIds = body.categoryIds ?? undefined;
  if (categoryIds !== undefined &&
      (!Array.isArray(categoryIds) || categoryIds.some((id: unknown) => typeof id !== 'string' || !id))) {
    return { error: 'categoryIds must be a list of category IDs' };
  }

  return {
    fields: {
      name: body.name.trim(),
      type: body.type,
      value: body.value,
      expiresAt,
      usageLimit,
      categoryIds: categoryIds?.length ? Array.from(new Set<string>(categoryIds)) : undefined,
    },
  };
}

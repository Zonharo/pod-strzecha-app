import { z } from 'zod';

import { RATING_TAGS } from '@/domain/purchases/purchase';

export const ratingSchema = z.object({
  purchaseId: z.uuid(),
  rating: z.number().int().min(1, { message: 'rating_required' }).max(5),
  tags: z
    .array(z.enum(RATING_TAGS))
    .max(RATING_TAGS.length)
    .transform((tags) => [...new Set(tags)]),
  comment: z
    .string()
    .trim()
    .max(500, { message: 'comment_too_long' })
    .transform((value) => (value.length ? value : null)),
});

export type RatingInput = z.input<typeof ratingSchema>;

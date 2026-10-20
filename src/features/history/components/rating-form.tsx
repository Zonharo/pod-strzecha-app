import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  RATING_TAGS,
  tagMood,
  type PurchaseRating,
  type RatingTag,
} from '@/domain/purchases/purchase';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { STAR_LABELS, TAG_LABELS, ratingErrorMessage } from '../messages';
import { useRatePurchase } from '../queries';
import { Stars } from './stars';

type Props = {
  purchaseId: string;
  initial: PurchaseRating | null;
};

export function RatingForm({ purchaseId, initial }: Props) {
  const { colors } = useTheme();
  const rate = useRatePurchase();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [tags, setTags] = useState<RatingTag[]>(initial?.tags ?? []);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const toggle = (tag: RatingTag) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );

  const submit = async () => {
    setMessage(null);
    const result = await rate.mutateAsync({ purchaseId, rating, tags, comment });
    setMessage(
      result.ok
        ? { text: 'Dziękujemy! Twoja ocena trafi do sklepu.', error: false }
        : { text: ratingErrorMessage(result.error), error: true },
    );
  };

  const mood = rating ? tagMood(rating) : null;

  return (
    <View style={styles.root}>
      <Text variant="title">{initial ? 'Twoja ocena' : 'Jak było?'}</Text>
      <Stars value={rating} size={36} onChange={setRating} />
      {rating ? (
        <Text muted>{STAR_LABELS[rating]}</Text>
      ) : (
        <Text variant="caption" muted>
          Twoja ocena pomaga sklepowi. Widzi ją tylko piekarnia.
        </Text>
      )}

      {mood ? (
        <>
          <Text variant="caption" style={styles.question}>
            {mood === 'praise' ? 'Co Ci się podobało?' : 'Co możemy poprawić?'}
          </Text>
          <View style={styles.tags}>
            {RATING_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  onPress={() => toggle(tag)}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceStrong,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{ color: active ? colors.onPrimary : colors.text }}
                  >
                    {TAG_LABELS[tag]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            placeholder="Chcesz coś dodać? (nieobowiązkowe)"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            style={styles.comment}
          />
          {message ? (
            <Text variant="caption" style={{ color: message.error ? colors.danger : colors.ink }}>
              {message.text}
            </Text>
          ) : null}
          <Button
            title={initial ? 'Zapisz zmiany' : 'Wyślij ocenę'}
            onPress={submit}
            loading={rate.isPending}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  question: {
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  comment: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});

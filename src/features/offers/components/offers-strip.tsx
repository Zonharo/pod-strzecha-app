import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/text';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { useOffers } from '../queries';
import { OfferImage } from './offer-visual';

const OFFER_ICON = { ios: 'megaphone.fill', android: 'campaign' } as const;

export function OffersStrip() {
  const { colors } = useTheme();
  const offers = useOffers();
  const items = offers.data ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text variant="title">Dla Ciebie</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.scroller}
      >
        {items.map((offer) => (
          <Pressable
            key={offer.id}
            accessibilityRole="button"
            onPress={() => router.push(`/offers/${offer.id}`)}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <OfferImage url={offer.imageUrl} icon={OFFER_ICON} style={styles.image} />
            <View style={styles.texts}>
              <Text numberOfLines={2} style={styles.title}>
                {offer.title}
              </Text>
              {offer.body ? (
                <Text variant="caption" muted numberOfLines={2}>
                  {offer.body}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  scroller: {
    marginHorizontal: -spacing.md,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tile: {
    width: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 0,
  },
  texts: {
    padding: spacing.md,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
});

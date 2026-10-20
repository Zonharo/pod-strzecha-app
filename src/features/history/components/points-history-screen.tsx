import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { formatDateTime } from '@/domain/format';
import { pointsWord } from '@/domain/points/points';
import { EmptyState } from '@/shared/ui/empty-state';
import { StatusScreen } from '@/shared/ui/status-screen';
import { Text } from '@/shared/ui/text';
import { spacing, useTheme } from '@/shared/ui/theme';

import { pointsEntryTitle } from '../messages';
import { usePointsHistory } from '../queries';

export function PointsHistoryScreen() {
  const { colors } = useTheme();
  const history = usePointsHistory();
  const entries = history.data?.pages.flatMap((page) => page.items) ?? [];

  if (history.isPending) return <StatusScreen loading />;
  if (history.isError) {
    return (
      <StatusScreen
        title="Nie udało się wczytać historii"
        actionTitle="Spróbuj ponownie"
        onAction={() => history.refetch()}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(entry) => entry.id}
      ItemSeparatorComponent={() => (
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (history.hasNextPage && !history.isFetchingNextPage) history.fetchNextPage();
      }}
      renderItem={({ item }) => {
        const positive = item.delta > 0;
        return (
          <Pressable
            disabled={!item.purchaseId}
            onPress={() => item.purchaseId && router.push(`/history/${item.purchaseId}`)}
            style={styles.row}
            accessibilityLabel={`${pointsEntryTitle(item)}, ${positive ? 'plus' : 'minus'} ${Math.abs(item.delta)} ${pointsWord(item.delta)}`}
          >
            <View style={styles.texts}>
              <Text numberOfLines={2}>{pointsEntryTitle(item)}</Text>
              <Text variant="caption" muted>
                {formatDateTime(item.createdAt)}
              </Text>
            </View>
            <Text style={[styles.delta, { color: positive ? colors.ink : colors.textMuted }]}>
              {positive ? '+' : '−'}
              {Math.abs(item.delta)}
            </Text>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon={{ ios: 'leaf.fill', android: 'eco' }}
          title="Pusto"
          description="Tu zobaczysz każdy kłosek, który dostaniesz albo wymienisz."
        />
      }
      ListFooterComponent={
        history.isFetchingNextPage ? (
          <ActivityIndicator color={colors.ink} style={styles.footer} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  delta: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});

import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { searchStores, type Store } from '@/domain/stores/store';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';
import { radius, spacing, useTheme } from '@/shared/ui/theme';

import { useStores } from '../queries';

type Props = {
  selectedId: string | null;
  onSelect: (store: Store) => void;
  header?: React.ReactElement;
};

export function StorePicker({ selectedId, onSelect, header }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const stores = useStores();
  const results = useMemo(() => searchStores(stores.data ?? [], query), [stores.data, query]);

  return (
    <FlatList
      data={results}
      keyExtractor={(store) => store.id}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          <TextField
            placeholder="Miasto, ulica albo nazwa sklepu"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel="Szukaj sklepu"
          />
        </View>
      }
      ListEmptyComponent={
        stores.isPending ? (
          <ActivityIndicator color={colors.ink} style={styles.empty} />
        ) : stores.isError ? (
          <View style={styles.empty}>
            <Text muted style={styles.center}>
              Nie udało się pobrać listy sklepów.
            </Text>
            <Button variant="secondary" title="Spróbuj ponownie" onPress={() => stores.refetch()} />
          </View>
        ) : (
          <Text muted style={[styles.center, styles.empty]}>
            Nie mamy sklepu pasującego do „{query}”.
          </Text>
        )
      }
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: selected ? colors.surfaceStrong : colors.surface,
                borderColor: selected ? colors.primary : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.itemTexts}>
              <Text>{item.name}</Text>
              <Text variant="caption" muted>
                {item.address}, {item.city}
              </Text>
            </View>
            {selected ? (
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle' }}
                size={24}
                tintColor={colors.ink}
              />
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  itemTexts: {
    flex: 1,
    gap: 2,
  },
  empty: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  center: {
    textAlign: 'center',
  },
});

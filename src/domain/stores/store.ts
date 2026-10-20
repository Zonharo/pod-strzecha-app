export type Store = {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
};

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const searchStores = (stores: readonly Store[], query: string): Store[] => {
  const words = normalize(query).split(' ').filter(Boolean);
  const matching =
    words.length === 0
      ? [...stores]
      : stores.filter((store) => {
          const haystack = normalize(`${store.city} ${store.name} ${store.address}`);
          return words.every((word) => haystack.includes(word));
        });
  return matching.sort(
    (a, b) => a.city.localeCompare(b.city, 'pl') || a.name.localeCompare(b.name, 'pl'),
  );
};

export const storeLabel = (store: Store): string =>
  store.name.toLocaleLowerCase('pl-PL').startsWith(store.city.toLocaleLowerCase('pl-PL'))
    ? store.name
    : `${store.city}, ${store.name}`;

export const MONTHS_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
] as const;

export const formatMoney = (amount: number): string => {
  const [whole = '0', fraction = '00'] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.length > 4 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : whole;
  return `${amount < 0 ? '-' : ''}${grouped},${fraction} zł`;
};

const pad = (value: number) => String(value).padStart(2, '0');

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDateTime = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  const time = `${date.getHours()}:${pad(date.getMinutes())}`;
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days === 0) return `Dziś, ${time}`;
  if (days === 1) return `Wczoraj, ${time}`;
  const dayMonth = `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear()
    ? `${dayMonth}, ${time}`
    : `${dayMonth} ${date.getFullYear()}`;
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
};

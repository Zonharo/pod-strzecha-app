import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';

const loadEnv = (file) => {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
};

loadEnv('.env.local');
loadEnv('.env');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const apiKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const terminalKey = process.env.POS_TERMINAL_KEY;

if (!url || !apiKey || !terminalKey) {
  console.error('Brakuje POS_TERMINAL_KEY w .env.local albo danych Supabase w .env.');
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    kod: { type: 'string' },
    kwota: { type: 'string' },
    kupony: { type: 'string' },
    nagrody: { type: 'string' },
    zwrot: { type: 'string' },
  },
});

const rpc = async (name, body) => {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message ?? 'Błąd kasy');
    error.hint = data.hint;
    throw error;
  }
  return data;
};

const toPayload = (input) => {
  const text = input.trim();
  if (/^PS1\.\d{13}\.\d{6}$/.test(text)) return text;
  const digits = text.replace(/\s+/g, '');
  if (/^\d{19}$/.test(digits)) return `PS1.${digits.slice(0, 13)}.${digits.slice(13)}`;
  return digits;
};

const LAST_CARD_FILE = '.kasa.local';

const lastCard = () => {
  if (!existsSync(LAST_CARD_FILE)) return null;
  const value = readFileSync(LAST_CARD_FILE, 'utf8').trim();
  return /^\d{13}$/.test(value) ? value : null;
};

const askForCode = async () => {
  const remembered = lastCard();
  const cardAnswer = (
    await prompt(
      remembered
        ? `Numer karty (13 cyfr pod kodem, Enter = ${remembered}): `
        : 'Numer karty (13 cyfr pod kodem): ',
    )
  ).replace(/\s+/g, '');
  if (/^\d{19}$/.test(cardAnswer) || cardAnswer.startsWith('PS1.')) return toPayload(cardAnswer);
  const card = cardAnswer || remembered;
  if (!card || !/^\d{13}$/.test(card)) throw new Error('Numer karty ma 13 cyfr');
  writeFileSync(LAST_CARD_FILE, `${card}\n`);
  const otp = (
    await prompt('Kod z karty (6 cyfr, zmienia się co 30 s, Enter = sam numer): ')
  ).replace(/\s+/g, '');
  if (!otp) return card;
  if (!/^\d{6}$/.test(otp)) throw new Error('Kod z karty ma 6 cyfr');
  return `PS1.${card}.${otp}`;
};

const pickIds = (answer, items) =>
  answer
    .split(/[ ,]+/)
    .filter(Boolean)
    .map((n) => items[Number(n) - 1]?.id)
    .filter(Boolean);

const describeBenefit = (item) => {
  switch (item.benefit) {
    case 'percent_off':
      return `-${item.value}%`;
    case 'amount_off':
      return `-${item.value} zł`;
    case 'fixed_price':
      return `za ${item.value} zł`;
    case 'free_item':
      return 'gratis';
    case 'bonus_points':
      return `+${points(item.value)}`;
    case 'points_multiplier':
      return `kłoski x${item.value}`;
    default:
      return item.benefit;
  }
};

const pointsWord = (count) => {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return 'kłosek';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) return 'kłoski';
  return 'kłosków';
};

const points = (count) => `${count} ${pointsWord(count)}`;

const rl = createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
const prompt = async (question) => {
  process.stdout.write(question);
  const { value, done } = await lines.next();
  return done ? '' : value;
};
const ask = async (question, preset) => preset ?? (await prompt(question));

try {
  if (values.zwrot) {
    const result = await rpc('pos_refund', {
      p_terminal_key: terminalKey,
      p_transaction_id: values.zwrot,
    });
    console.log(`Zwrot zapisany. Saldo klienta: ${points(result.points_balance ?? 0)}.`);
  } else {
    const code = values.kod ? toPayload(values.kod) : await askForCode();
    const client = await rpc('pos_identify', { p_terminal_key: terminalKey, p_code: code });
    console.log(`\nKlient: ${client.first_name}, saldo ${points(client.points_balance)}.`);
    if (!client.can_redeem) console.log('Sam numer karty: nalicza kłoski, bez kuponów i nagród.');

    client.coupons.forEach((c, i) =>
      console.log(`  kupon ${i + 1}. ${c.title} (${describeBenefit(c)})`),
    );
    client.rewards.forEach((r, i) =>
      console.log(`  nagroda ${i + 1}. ${r.title} (${describeBenefit(r)})`),
    );

    const total = Number(
      (await ask('\nKwota paragonu po rabatach, zł: ', values.kwota)).replace(',', '.'),
    );
    const couponIds = client.coupons.length
      ? pickIds(
          await ask('Numery kuponów do użycia (Enter, żeby pominąć): ', values.kupony ?? ''),
          client.coupons,
        )
      : [];
    const rewardIds = client.rewards.length
      ? pickIds(
          await ask('Numery nagród do wydania (Enter, żeby pominąć): ', values.nagrody ?? ''),
          client.rewards,
        )
      : [];

    const transactionId = `TEST-${Date.now()}`;
    const result = await rpc('pos_complete', {
      p_terminal_key: terminalKey,
      p_session_id: client.session_id,
      p_transaction_id: transactionId,
      p_total: total,
      p_receipt_number: transactionId,
      p_customer_coupon_ids: couponIds,
      p_redemption_ids: rewardIds,
    });
    console.log(
      `\nGotowe. Naliczono ${points(result.points_earned)}, saldo ${points(result.points_balance)}.`,
    );
    console.log(`Numer transakcji do zwrotu: ${transactionId}`);
  }
} catch (error) {
  console.error(
    `\nKasa odrzuciła operację: ${error.message}${error.hint ? ` (${error.hint})` : ''}`,
  );
  process.exitCode = 1;
} finally {
  rl.close();
}

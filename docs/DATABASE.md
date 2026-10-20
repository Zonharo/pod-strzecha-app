# Baza danych

Osobny projekt Supabase `mwebbglitrxhqcdvhpqx` (Pod Strzecha App, eu-west-1, Postgres 17), niezależny od panelu
pracowników. Schemat powstaje wyłącznie z migracji w `supabase/migrations/`. Nazwy plików odpowiadają wersjom
zapisanym w Supabase, więc nie zmieniaj ich i nie edytuj zastosowanych migracji. Każda zmiana to nowy plik.

Wspólny klucz z panelem i przyszłym POS-em to **kod sklepu** (`stores.code`, np. `POZ-01`).

## Program lojalnościowy

Punkty nazywają się w aplikacji **kłoski**, a w bazie `points`. Odmianę liczy `private.points_word()`.

| Zasada                    | Wartość domyślna (`program_settings`)                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Naliczanie                | 1 kłosek za każdą pełną złotówkę po rabatach (`points_per_zloty`)                                                  |
| Na powitanie              | 50 kłosków po dokończeniu zakładania konta (`welcome_bonus`, raz na konto)                                         |
| Wygasanie                 | wszystkie kłoski po 12 mies. bez zakupów (`points_inactivity_months`), przypomnienie 30 dni wcześniej              |
| Nagrody                   | kłoski schodzą przy wymianie, nagroda ważna 14 dni (`reward_valid_days`). Nieodebrana albo anulowana oddaje kłoski |
| Limit nagród              | najwyżej 5 aktywnych naraz (`max_active_rewards`)                                                                  |
| Oceny                     | do 7 dni po zakupie (`rating_window_days`)                                                                         |
| Ochrona przed nadużyciami | najwyżej 1000 kłosków dziennie (`daily_points_cap`), paragon do 2000 zł (`max_purchase_total`)                     |
| Urodziny                  | kupon z `birthday_coupon_id` (kupon `audience = personal`) w dniu urodzin, 29 lutego w zwykłym roku 28 lutego      |

Zmiana zasad to `update public.program_settings set ...` w SQL Editor. Nowa wersja regulaminu: zmień
`terms_version`, a aplikacja poprosi każdego o akceptację (`accept_terms`).

## Tabele

| Tabela                            | Zawartość                                                                                | Klient (RLS)                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `regions`, `stores`               | 5 regionów, 157 sklepów (kopia z panelu), godziny otwarcia w `opening_hours`             | czyta każdy, też niezalogowany                                                           |
| `program_settings`                | jeden wiersz z zasadami programu                                                         | czyta każdy                                                                              |
| `customers`                       | klient = `auth.users.id`, imię, ulubiony sklep, urodziny (dzień i miesiąc), saldo, zgody | tylko własny; zmienia `first_name`, `home_store_id`, `marketing_push`, `marketing_email` |
| `customer_consents`               | historia zgód (regulamin, push, e-mail) zapisywana triggerem                             | tylko własne                                                                             |
| `loyalty_cards`                   | numer karty EAN-13 `29xxxxxxxxxxc`, jedna aktywna na klienta                             | tylko własne                                                                             |
| `private.card_secrets`            | sekret kodu zmiennego (20 bajtów), poza API                                              | brak dostępu                                                                             |
| `points_ledger`                   | księga kłosków, tylko dopisywanie. Saldo w `customers` liczy trigger                     | tylko własne, bez zapisu                                                                 |
| `purchases`, `purchase_items`     | zakupy z kasy, pozycje paragonu (gdy POS je przyśle)                                     | tylko własne                                                                             |
| `coupons`, `coupon_stores`        | definicje kuponów, zakres sieć / region / sklepy                                         | aktywne publiczne czyta każdy, osobiste tylko posiadacz                                  |
| `customer_coupons`, `coupon_uses` | kupony klienta (aktywowane, urodzinowe, prezenty) i ich użycia                           | tylko własne                                                                             |
| `rewards`, `reward_redemptions`   | katalog nagród za kłoski i wymienione nagrody                                            | katalog czyta każdy, wymiany tylko własne                                                |
| `offers`, `offer_stores`          | oferty i aktualności z zakresem i datami                                                 | aktywne czyta każdy                                                                      |
| `purchase_ratings`                | ocena zakupów 1–5, tagi, komentarz                                                       | tylko własne                                                                             |
| `customer_notifications`          | skrzynka powiadomień, tworzą ją tylko triggery i zadania                                 | własne; zmienia tylko `read_at`                                                          |
| `push_tokens`                     | tokeny Expo Push                                                                         | tylko własne, zapis przez funkcje                                                        |
| `pos_terminals`                   | terminale kasowe sklepów z hashem klucza (SHA-256)                                       | brak dostępu                                                                             |
| `private.checkout_sessions`       | sesje kasy między zeskanowaniem a zamknięciem paragonu (20 min)                          | brak dostępu                                                                             |

Pliki obrazków (kupony, nagrody, oferty) są w publicznym buckecie `media` (JPG, PNG, WEBP do 5 MB).
Kolumny `image_path` trzymają ścieżkę w tym buckecie. Wgrywa je tylko panel Supabase.

## Uprawnienia

- Domyślne uprawnienia Supabase są wyłączone (`alter default privileges ... revoke`). Każda tabela i funkcja
  dostaje `grant` jawnie w swojej migracji, więc nowa tabela bez `grant` jest niewidoczna z API.
- RLS jest włączone na każdej tabeli w `public`. Polityki porównują `(select auth.uid())`.
- Saldo, statusy, kupony i nagrody zmieniają wyłącznie funkcje `security definer`. Klient nie ma `insert`
  ani `delete` na żadnej tabeli.
- Schemat `private` nie jest dostępny dla `anon` ani `authenticated`. Są w nim sekrety kart, sesje kasy i funkcje pomocnicze.
- Błędy oczekiwane: `P0001` z kodem w `hint` (np. `not_enough_points`). Aplikacja tłumaczy kod na tekst,
  a `message` jest tylko zapasowym komunikatem.
- Konto klienta powstaje triggerem `on_auth_user_created` przy pierwszym logowaniu (e-mail z kodem, Apple, Google).
  Karta i kłoski na powitanie pojawiają się dopiero po `complete_onboarding` (imię, sklep, regulamin).

## Funkcje dla aplikacji (`authenticated`)

| Funkcja                                                                              | Działanie                                                                     |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `complete_onboarding(imię, sklep, wersja_regulaminu, push, email, miesiąc?, dzień?)` | dokończenie konta, wydanie karty, kłoski na powitanie. Można wywołać ponownie |
| `accept_terms(wersja)`                                                               | akceptacja nowej wersji regulaminu                                            |
| `set_birthday(miesiąc, dzień)`                                                       | data urodzin, tylko raz                                                       |
| `my_card()`                                                                          | numer karty i sekret (hex) do generowania kodu w telefonie                    |
| `rotate_card_secret()`                                                               | nowy sekret, stare kody przestają działać (np. utrata telefonu)               |
| `activate_coupon(id)`                                                                | aktywacja kuponu, ponowne wywołanie zwraca ten sam                            |
| `redeem_reward(id)` / `cancel_reward_redemption(id)`                                 | wymiana kłosków na nagrodę i anulowanie                                       |
| `rate_purchase(zakup, ocena, tagi, komentarz)`                                       | ocena zakupów, można ją poprawić w terminie                                   |
| `register_push_token(token, platforma)` / `unregister_push_token(token)`             | tokeny powiadomień                                                            |
| `export_my_data()`                                                                   | wszystkie dane klienta w JSON (RODO, art. 20)                                 |
| `delete_my_account()`                                                                | usunięcie konta. Zakupy zostają bez klienta do statystyk sklepów              |
| `coupons_for_store(sklep?)`, `offers_for_store(sklep?)`                              | kupony i oferty ważne w sklepie (też dla `anon`)                              |

Na żywo (Realtime): `customers`, `customer_notifications`, `customer_coupons`, `reward_redemptions`.

## Kod przy kasie

- **W aplikacji:** QR z treścią `PS1.<numer karty>.<kod>`, gdzie kod to TOTP (RFC 6238: HMAC-SHA1, 6 cyfr,
  krok 30 s) z sekretu z `my_card()`. Telefon liczy go bez internetu. Baza przyjmuje kroki od −2 do +1,
  czyli około dwóch minut tolerancji zegara. Zgodność z RFC 4226 sprawdzona wektorami testowymi.
- **Sam numer karty** (wpisany ręcznie lub z plastikowej karty): kasa nalicza kłoski, ale nie pokazuje kuponów
  ani nagród i odrzuca ich użycie (`dynamic_code_required`).

## API kasy (`anon` z kluczem terminala)

Kasa woła RPC z kluczem `anon` i własnym kluczem terminala `pst_…`. W bazie jest tylko jego hash.

1. `pos_identify(klucz, kod)` zwraca `session_id`, imię, saldo, `can_redeem` oraz aktywne kupony i nagrody
   ważne w tym sklepie.
2. `pos_complete(klucz, session_id, transaction_id, suma, rabat, nr_paragonu, czas, pozycje, kupony[], nagrody[])`
   zapisuje zakup, zużywa kupony i nagrody, nalicza kłoski (mnożnik i bonus z kuponów) i zwraca saldo.
   Powtórzenie z tym samym `transaction_id` zwraca ten sam wynik, więc kasa może bezpiecznie ponawiać.
3. `pos_refund(klucz, transaction_id)` cofa kłoski za zwrot (najwyżej tyle, ile klient ma).

Pozycje: `[{"sku", "name", "quantity", "unit_price", "total"}]`, do 300 sztuk. Czas zakupu z kasy jest
przyjmowany w oknie 24 h wstecz i 2 min w przód.

Nowy terminal (tylko SQL Editor, klucz pokazuje się raz):

```sql
select private.create_pos_terminal('POZ-01', 'Kasa 1');
```

Wyłączenie: `update public.pos_terminals set is_active = false where ...`.

## Zadania cykliczne (pg_cron, czas UTC)

| Zadanie            | Kiedy     | Co robi                                                                                 |
| ------------------ | --------- | --------------------------------------------------------------------------------------- |
| `expire-rewards`   | co 15 min | wygasza nieodebrane nagrody i oddaje kłoski, przypomina 2 dni przed końcem              |
| `expire-points`    | 02:30     | zeruje kłoski po okresie bez zakupów, przypomina 30 dni wcześniej                       |
| `birthday-coupons` | 06:00     | wydaje kupon urodzinowy (czas Europe/Warsaw)                                            |
| `cleanup`          | 03:00     | usuwa sesje kasy starsze niż 2 dni, powiadomienia starsze niż 180 dni, stare logi crona |

## Treści programu

Do czasu modułu w panelu kupony, nagrody i oferty dodaje się w **Table Editor** albo SQL Editor
(rola `postgres` omija RLS). Ograniczenia w tabelach pilnują poprawności, np. `percent_off` wymaga wartości
1–100, a `free_item` nie przyjmuje wartości.

## Konfiguracja Auth (panel Supabase)

- **Sign In / Providers → Email:** włączone. Email OTP Length 6, Email OTP Expiration 600 s.
- **Email Templates → Magic Link** i **Confirm signup:** treść z kodem `{{ .Token }}`, bez linku.
- **SMTP:** Resend (podłączony).
- **Apple i Google:** po założeniu kont deweloperskich.

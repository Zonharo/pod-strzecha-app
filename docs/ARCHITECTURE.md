# Architektura aplikacji

Clean Architecture jak w panelu pracowników. Zależności wskazują do środka: prezentacja → aplikacja → domena.
Infrastruktura implementuje porty aplikacji. Granice pilnuje ESLint (`eslint.config.js`).

| Warstwa                 | Zawiera                                                                         | Może importować                                                       |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/domain/`           | encje i reguły (klient, stan konta, sklepy, kłoski), `Result`, kody błędów      | nic                                                                   |
| `src/application/`      | schematy Zod (`dto`), porty, use case'y `makeX(deps)`, fałszywe porty do testów | `domain`, `zod`                                                       |
| `src/infrastructure/`   | klient Supabase, repozytoria, `container.ts`                                    | wszystko poniżej                                                      |
| `src/features/<moduł>/` | ekrany, hooki TanStack Query, komunikaty PL                                     | `domain`, `application`, `shared`, z infrastruktury tylko `container` |
| `src/app/`              | trasy Expo Router, cienkie: eksportują ekran z `features`                       | jak `features`                                                        |
| `src/shared/`           | UI (szkło, przyciski, pola), motyw, providery                                   | `domain`                                                              |

## Nawigacja i dostęp

`src/app/_layout.tsx` ustawia stos ze strażnikami `Stack.Protected`:

| Stan                                        | Dostępne trasy                                        |
| ------------------------------------------- | ----------------------------------------------------- |
| niezalogowany                               | `sign-in`, `verify`                                   |
| zalogowany, bez imienia lub regulaminu      | `onboarding` (3 kroki: imię, sklep, urodziny i zgody) |
| nowa wersja regulaminu w `program_settings` | `accept-terms`                                        |
| konto zablokowane                           | `blocked`                                             |
| gotowe konto                                | `(tabs)`: Karta, Kupony, Nagrody, Historia, Konto     |

Stan liczy `accountStateOf()` w domenie. Regulamin (`terms`) jest modalem dostępnym zawsze.

## Logowanie

E-mail z 6-cyfrowym kodem (`signInWithOtp` i `verifyOtp`, `type: 'email'`). Sesja w AsyncStorage, odświeżanie
tokenu tylko gdy aplikacja jest na pierwszym planie. Konto klienta zakłada trigger w bazie przy pierwszym logowaniu,
a kartę i kłoski na powitanie `complete_onboarding`. Wylogowanie czyści pamięć zapytań.

Warunek w Supabase: szablony **Magic Link** i **Confirm signup** muszą zawierać `{{ .Token }}`
(szczegóły w `docs/DATABASE.md`).

## Karta przy kasie

- `my_card()` zwraca numer i sekret karty. Aplikacja trzyma je w SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`)
  i liczy kod TOTP sama, więc karta działa bez internetu (`src/domain/card`, testy na wektorach RFC 4226 i 6238).
- QR zawiera `PS1.<numer karty>.<6 cyfr>`. Pod kodem są te cyfry i numer karty do przepisania ręcznie.
- Ekran karty rozjaśnia ekran do maksimum tylko wtedy, gdy jest widoczny i aplikacja jest na pierwszym planie.
- Ostatni stan konta i ustawienia programu są zapisane w AsyncStorage, żeby aplikacja otworzyła się bez sieci.
  Wylogowanie i usunięcie konta czyszczą obie pamięci.
- Saldo i powiadomienia odświeżają się na żywo (Realtime na `customers` i `customer_notifications`).

## Kasa testowa

Do czasu własnego POS-a zakupy wprowadza skrypt, który woła te same funkcje co przyszła kasa
(`pos_identify`, `pos_complete`, `pos_refund`). Klucz terminala jest w `.env.local` (poza repozytorium,
`POS_TERMINAL_KEY=pst_…`). Nowy terminal: `select private.create_pos_terminal('POZ-01', 'Kasa 1');` w SQL Editor.

```bash
./scripts/kasa.sh
./scripts/kasa.sh --kod "2922942870818 947445" --kwota 23,45
./scripts/kasa.sh --zwrot TEST-1792512216264
```

Kod wpisuje się tak, jak widać go w aplikacji: 13 cyfr numeru karty i 6 cyfr kodu. Sam numer karty nalicza kłoski,
ale nie pozwala użyć kuponów ani nagród.

## Błędy

- Oczekiwane wracają jako `Result`. Kody z bazy (`hint` przy `P0001`) mapuje `toDomainErrorCode`,
  błędy logowania `toAuthErrorCode`. Teksty po polsku są w `features/*/messages.ts`.
- Błędy walidacji to kody z schematów Zod (np. `first_name_required`), tłumaczone w tym samym miejscu.

## Konfiguracja

`.env` trzyma tylko wartości publiczne (adres projektu i klucz `sb_publishable_…`) i jest w repozytorium.
Sekretów aplikacja nie potrzebuje.

## Polecenia (w Dockerze)

```bash
./scripts/dev.sh
./scripts/node.sh npm run typecheck
./scripts/node.sh npm run lint
./scripts/node.sh npm test
./scripts/node.sh npm run bundle
```

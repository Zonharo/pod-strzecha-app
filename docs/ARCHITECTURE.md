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

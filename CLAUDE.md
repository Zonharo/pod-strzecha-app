# CLAUDE.md

Pod Strzechą — aplikacja lojalnościowa dla klientów sieci piekarni (iOS i Android). Expo (React Native) + TypeScript,
backend w osobnym projekcie Supabase `mwebbglitrxhqcdvhpqx`. Obok działa panel pracowników `~/Documents/pod_strzecha`
(inny projekt Supabase); wspólnym kluczem jest kod sklepu. UI, komunikaty i dokumentacja **po polsku**,
identyfikatory w kodzie po angielsku.

## Środowisko

- Na Macu nie ma Node. Node uruchamiaj w Dockerze (`~/.docker/bin/docker`). Telefon łączy się przez Expo Go w tej samej sieci Wi-Fi.
- Przed napisaniem, że coś działa: typecheck, testy i bundle.
- Expo zmienia API co wersję: przed użyciem modułu sprawdź dokumentację dla SDK z `package.json`.
  Zależności dodawaj przez `npx expo install`.
- Migracje wgrywa integracja Supabase (MCP) i zapisuje je w `supabase/migrations` pod wersją z Supabase.
  Nie edytuj zastosowanych migracji, dodaj nową. Szczegóły bazy: `docs/DATABASE.md`.

## Zasady

- Bez komentarzy w kodzie: TS/TSX/JS, konfiguracja i SQL.
- Teksty w UI krótkie i ludzkie, bez myślników łączących zdania i bez technicznych dopisków. Punkty to „kłoski”.
- Nigdy nie zapisuj sekretów w repozytorium. Klucz `anon` jest publiczny; `service_role` nie trafia nigdzie.
- Każda nowa tabela: RLS w tej samej migracji i jawne `grant` (domyślne uprawnienia są wyłączone).
- Zmiany salda, kuponów i nagród tylko przez funkcje `security definer`. Błędy oczekiwane: `P0001` z kodem w `hint`.
- Małe kroki. Każdy kończy się działającą rzeczą do sprawdzenia na telefonie.

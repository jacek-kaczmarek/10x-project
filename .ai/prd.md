# Dokument wymagań produktu (PRD) - 10x Cards

## 1. Przegląd produktu

10x Cards to aplikacja webowa skierowana do studentów, umożliwiająca szybkie tworzenie i zarządzanie fiszkami edukacyjnymi. Użytkownik może:
- generować kandydatów fiszek przez AI na podstawie wklejonego tekstu (1000–10000 znaków) jako generację wraz zapisanymi fiszkami-kandydatami,
- edytować wygenerowane kandydaty i zapisywac z oznaczeniem źródła (AI, AI-edytowane, manualne)
- ręcznie tworzyć pojedyncze fiszki lub całe kolekcje
- przeglądać, edytować i usuwać fiszki w swojej kolekcji
- odbywać sesje powtórek oparte na zewnętrznej bibliotece spaced repetition

System automatycznie śledzi każdą generację AI (czas, model, źródło) oraz loguje błędy generowania dla celów audytu i analizy.

## 2. Problem użytkownika

Ręczne tworzenie wysokiej jakości fiszek jest czasochłonne i zniechęca do stosowania efektywnej metody nauki typu spaced repetition, co obniża motywację i skuteczność procesu nauki.

## 3. Wymagania funkcjonalne

- Uwierzytelnianie: rejestracja, logowanie i zarządzanie sesją użytkownika
- Generowanie propozycji fiszek AI: pole tekstowe (1000–10000 znaków), stała liczba 10 propozycji, pasek postępu z procentami oraz komunikat "Trwa generowanie"
- Edycja propozycji: możliwość edycji wygenerowanych propozycji po stronie klienta (nie są jeszcze zapisane w bazie)
- Zapisywanie fiszek: zapisanie zaakceptowanych i edytowanych propozycji do bazy jako aktywnych fiszek z automatycznym oznaczeniem źródła (AI, AI-edytowane, manualne)
- Śledzenie generacji: każde uruchomienie generowania AI tworzy obiekt generacji (niezależnie od tego czy fiszki zostaną zapisane); zawiera: czas generowania, użyty model AI, długość i hash źródłowego tekstu, identyfikator użytkownika, liczbę wygenerowanych propozycji
- Logowanie błędów generacji: błędy podczas generowania AI są zapisywane w systemie (generation_error_logs) z informacjami: typ błędu, komunikat, użyty model, długość i hash tekstu, identyfikator użytkownika
- Niezależne fiszki: fiszki mogą istnieć poza generacjami (np. tworzone ręcznie)
- Ręczne dodawanie fiszek: formularz z polami "przód" (maks. 200 znaków) i "tył" (maks. 500 znaków), możliwość tworzenia pojedynczych fiszek lub kolekcji
- Zarządzanie kolekcją: widok z paginacją i wyszukiwaniem, możliwość edycji i usuwania fiszek
- Integracja modułu powtórek: sesje nauki oparte na bibliotece open source, wywoływane z poziomu kolekcji
- Obsługa pustych stanów: widoczny przycisk zachęcający do głównej akcji w przypadku braku danych
- Walidacja wejścia: długość tekstu do generowania 1000–10000 znaków, komunikaty błędów
- Ikony informacyjne: tooltipy z krótkim opisem funkcji pod ikoną "i"
- Konfigurowalne limity API: stałe wartości definiowane po stronie systemu
- Oznaczanie źródła fiszek: system automatycznie śledzi czy fiszka pochodzi z AI, została edytowana, czy utworzona ręcznie

## 4. Granice produktu

- Brak autorskiego algorytmu powtórek (użycie gotowej biblioteki)
- Brak importu plików PDF, DOCX i innych formatów
- Brak współdzielenia zestów fiszek między użytkownikami
- Brak obsługi wielu talii i tagowania
- Brak aplikacji mobilnych (tylko web)
- Brak formatowania tekstu (tylko czysty tekst)
- Brak planów monetyzacji i limitów subskrypcyjnych

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Rejestracja
  Opis: Jako nowy użytkownik chcę założyć konto, aby uzyskać dostęp do aplikacji.
  Kryteria akceptacji:
  - Formularz rejestracji zawiera pola email i hasło (min. 6 znaków)
  - Po poprawnym wypełnieniu i wysłaniu formularza konto zostaje utworzone
  - Użytkownik otrzymuje potwierdzenie rejestracji

- ID: US-002
  Tytuł: Logowanie
  Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich fiszek.
  Kryteria akceptacji:
  - Formularz logowania zawiera pola email i hasło
  - Poprawne dane przekierowują do pulpitu użytkownika
  - Niepoprawne dane wyświetlają komunikat o błędzie
  - Proces odbywa się na dedykowanej stronie
  - Odzyskiwanie hasła powinno być możliwe
  - Pozostałe historyjki nie są dostępne bez logowania, wyjątkiem jest rejestracja (dostępna)

- ID: US-003
  Tytuł: Wylogowanie
  Opis: Jako zalogowany użytkownik chcę się wylogować, aby chronić moje dane.
  Kryteria akceptacji:
  - Po kliknięciu wyloguj sesja zostaje zakończona
  - Wylogowanie jest możliwe po kliknięciu przycisku w prawym górnym rogu (topbar)
  - Użytkownik zostaje przekierowany na stronę logowania
  - Proces odbywa się na dedykowanej stronie

- ID: US-004
  Tytuł: Generowanie propozycji fiszek AI
  Opis: Jako użytkownik chcę wkleić tekst (1000–10000 znaków) i wygenerować 10 propozycji fiszek AI, aby szybko otrzymać propozycje do edycji.
  Kryteria akceptacji:
  - Walidacja długości tekstu (min i max)
  - Po uruchomieniu wyświetlany jest pasek postępu z procentami i tekstem "Trwa generowanie"
  - Generacja jest zapisywana w systemie (obiekt generacji)
  - Po zakończeniu wyświetla się lista propozycji do edycji (propozycje NIE są jeszcze zapisane w bazie jako fiszki)

- ID: US-005
  Tytuł: Obsługa błędów generowania
  Opis: Jako użytkownik chcę otrzymać komunikat o błędzie, jeśli proces generowania fiszek się nie powiedzie.
  Kryteria akceptacji:
  - W przypadku błędu sieci lub API wyświetlany jest przejrzysty komunikat
  - Błąd jest zapisywany w systemie wraz z kontekstem (typ błędu, model, tekst źródłowy)

- ID: US-005A
  Tytuł: Śledzenie generacji
  Opis: Jako system chcę rejestrować każdą akcję generowania propozycji AI jako osobny obiekt generacji, aby umożliwić audyt i analizę.
  Kryteria akceptacji:
  - Każde uruchomienie generowania AI tworzy rekord generacji (niezależnie od tego czy propozycje zostaną zapisane)
  - Rekord zawiera: timestamp, użyty model AI, długość i hash źródłowego tekstu, ID użytkownika, liczbę wygenerowanych propozycji
  - Dopiero zapisane fiszki będą powiązane z rekordem generacji przez generation_id
  - Fiszki ręczne nie są powiązane z żadną generacją

- ID: US-005B
  Tytuł: Logowanie błędów generacji
  Opis: Jako administrator chcę mieć logi błędów generowania, aby analizować problemy i poprawiać stabilność systemu.
  Kryteria akceptacji:
  - Każdy błąd podczas generowania jest zapisywany w tabeli generation_error_logs
  - Log zawiera: typ błędu, komunikat, użyty model, długość i hash tekstu źródłowego, ID użytkownika, timestamp
  - Logi są dostępne dla administratora systemu

- ID: US-006
  Tytuł: Edycja propozycji fiszek
  Opis: Jako użytkownik chcę edytować wygenerowane propozycje fiszek, aby dostosować je do moich potrzeb przed zapisaniem.
  Kryteria akceptacji:
  - Lista propozycji umożliwia edycję tekstu przód i tył każdej propozycji (po stronie klienta)
  - Możliwość usunięcia niepożądanych propozycji z listy
  - Zmiany są zachowywane lokalnie (w stanie React/frontend) do momentu zapisania

- ID: US-006A
  Tytuł: Zapisywanie zaakceptowanych propozycji jako fiszek
  Opis: Jako użytkownik chcę zapisać zaakceptowane i edytowane propozycje do bazy danych jako aktywne fiszki z odpowiednim oznaczeniem źródła.
  Kryteria akceptacji:
  - Przycisk "Zapisz fiszki" wysyła zaakceptowane propozycje do API (batch save)
  - System automatycznie oznacza źródło: 'ai' (niezmienione propozycje), 'ai-edited' (edytowane propozycje), 'manual' (ręczne)
  - Wszystkie fiszki są powiązane z rekordem generacji przez generation_id
  - Fiszki są zapisywane ze statusem 'active' i zainicjalizowanymi parametrami SR
  - Po zapisaniu użytkownik zostaje przekierowany do widoku kolekcji

- ID: US-007
  Tytuł: Ręczne dodawanie fiszek
  Opis: Jako użytkownik chcę ręcznie dodać fiszki przez formularz z polami "przód" i "tył", aby dodać własne treści.
  Kryteria akceptacji:
  - Formularz manualnego dodawania zawiera oba pola
  - Walidacja długości pól jest konieczna: maks. 200 znaków "przód", 500 znaków "tył"
  - Możliwość dodania pojedynczej fiszki lub utworzenia kolekcji fiszek
  - Po wypełnieniu i wysłaniu fiszki pojawiają się w kolekcji z oznaczeniem 'manual'

- ID: US-008
  Tytuł: Wyświetlanie kolekcji
  Opis: Jako użytkownik chcę zobaczyć wszystkie moje fiszki z paginacją i możliwością wyszukiwania, aby łatwo przeglądać zasoby.
  Kryteria akceptacji:
  - Widok kolekcji pokazuje fiszki w rekordach po stronie serwera
  - Dostępne jest pole wyszukiwania filtrowania po tekście
  - Paginacja działa i można przechodzić między stronami

- ID: US-009
  Tytuł: Edycja fiszek
  Opis: Jako użytkownik chcę edytować istniejącą fiszkę, aby poprawić błędy lub zaktualizować treść.
  Kryteria akceptacji:
  - Możliwość otwarcia formularza edycji z wypełnionymi polami
  - Zmiany zapisują się po wysłaniu formularza

- ID: US-010
  Tytuł: Usuwanie fiszek
  Opis: Jako użytkownik chcę usuwać zbędne fiszki z kolekcji.
  Kryteria akceptacji:
  - Po potwierdzeniu usunięcia fiszka znika z widoku kolekcji

- ID: US-011
  Tytuł: Obsługa pustych stanów
  Opis: Jako nowy użytkownik chcę zobaczyć jasny przycisk zachęcający do wygenerowania fiszek, gdy kolekcja jest pusta.
  Kryteria akceptacji:
  - Pusty widok pokazuje przycisk "Generuj pierwsze fiszki"

- ID: US-012
  Tytuł: Walidacja pola generowania
  Opis: Jako użytkownik chcę otrzymać informację o błędzie, gdy wklejony tekst jest krótszy niż 1000 lub dłuższy niż 10000 znaków.
  Kryteria akceptacji:
  - Po przekroczeniu lub niedościęciu limitu wyświetlany jest komunikat walidacji

- ID: US-013
  Tytuł: Sesja nauki
  Opis: Jako użytkownik chcę rozpocząć sesję powtórek, aby ćwiczyć fiszki według algorytmu spaced repetition.
  Kryteria akceptacji:
  - Możliwość uruchomienia sesji z kolekcji
  - Prezentacja fiszek jedna po drugiej z opcjami oceny odpowiedzi (łatwe/trudne/powtórz)

- ID: US-014
  Tytuł: Tooltipy informacyjne
  Opis: Jako użytkownik chcę widzieć krótki opis funkcji po najechaniu na ikonę "i", aby szybko zrozumieć interfejs.
  Kryteria akceptacji:
  - Ikona "i" przy każdym kluczowym elemencie
  - Po najechaniu pojawia się tooltip z opisem

## 6. Metryki sukcesu

- 75% fiszek wygenerowanych przez AI zostanie zaakceptowanych przez użytkownika
- 75% fiszek w kolekcji pochodzi z generowania AI
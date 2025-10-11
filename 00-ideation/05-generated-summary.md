Jasne, oto podsumowanie naszej rozmowy, przygotowane zgodnie z Twoimi wytycznymi.

<conversation_summary>
<decisions>
1.  **Grupa docelowa:** Aplikacja jest skierowana do studentów, a ton komunikacji ma być umiarkowanie nieformalny.
2.  **Główna funkcjonalność:** Rdzeniem aplikacji jest generowanie przez AI stałej liczby (domyślnie 10) fiszek na podstawie tekstu dostarczonego przez użytkownika.
3.  **Proces generowania fiszek:** Wygenerowane fiszki trafiają na listę "Kandydaci na fiszkę", gdzie użytkownik może je zaakceptować, edytować lub odrzucić przed finalnym zapisem.
4.  **Interfejs generowania:** W trakcie przetwarzania tekstu przez AI, użytkownikowi wyświetlany jest prosty wskaźnik postępu (procent i tekst).
5.  **Walidacja danych wejściowych:** Długość tekstu do generowania fiszek jest ograniczona do przedziału 1000-10000 znaków.
6.  **Dodatkowa funkcjonalność:** Użytkownicy mogą ręcznie dodawać pojedyncze fiszki za pomocą prostego formularza z polami "przód" i "tył".
7.  **Zarządzanie fiszkami:** Zapisane fiszki są przechowywane w jednej, ogólnej kolekcji dla danego użytkownika. Interfejs zapewnia listę fiszek z paginacją i prostym wyszukiwaniem.
8.  **System powtórek:** Zostanie zaimplementowana gotowa biblioteka open source do inteligentnych powtórek (Spaced Repetition).
9.  **Struktura kolekcji:** Na tym etapie nie będzie podziału na talie (zestawy tematyczne).
10. **Onboarding i UI:** Aplikacja nie będzie posiadała samouczka. Zamiast tego, interfejs będzie opierał się na jasnych tytułach oraz ikonach z podpowiedziami (tooltip).
11. **Formatowanie tekstu:** W MVP fiszki będą obsługiwać wyłącznie zwykły tekst (plain text), bez formatowania.
12. **Puste stany:** Widoki bez danych (np. pusta lista fiszek) zachowają spójny layout, ale będą zawierać wyraźne wezwanie do działania (Call-To-Action).
13. **Model biznesowy i limity:** Aplikacja w wersji MVP będzie darmowa, bez limitów subskrypcyjnych. Limity zapytań do modeli AI będą konfigurowalne po stronie systemu w celu kontroli kosztów.
14. **Bezpieczeństwo:** Standardowe zabezpieczenia (autoryzacja, SSL/TLS, walidacja), bez dodatkowych mechanizmów dla danych wrażliwych.
15. **Stos technologiczny:** Frontend zostanie zbudowany w oparciu o Astro i React, a backend o Supabase (szczegóły w osobnym dokumencie później).
</decisions>

<matched_recommendations>
1.  **Proces przeglądu fiszek:** Zalecenie, aby wprowadzić etap "przeglądu", gdzie użytkownik weryfikuje propozycje AI, zostało w pełni zaimplementowane w planie jako lista "Kandydatów na fiszkę".
2.  **Uproszczenie MVP:** Zgodnie z rekomendacją, w pierwszej wersji pominięto zaawansowane funkcje, takie jak tagowanie, skupiając się na grupowaniu fiszek w jedną, prostą kolekcję.
3.  **Wykorzystanie gotowych bibliotek:** Decyzja o użyciu gotowej biblioteki open-source do systemu powtórek jest zgodna z rekomendacją, aby przyspieszyć rozwój, zamiast tworzyć algorytm od zera.
4.  **Kontrola kosztów AI:** Zalecono stworzenie modelu finansowego do kontroli kosztów zapytań do modeli językowych. Zostało to zaadresowane przez decyzję o wprowadzeniu konfigurowalnych limitów w systemie.
5.  **Model Freemium:** Rekomendacja dotyczyła modelu freemium. Podjęto decyzję, że na etapie MVP aplikacja będzie w całości darmowa, co jest spójne z pierwszym krokiem budowania bazy użytkowników w modelu freemium.
</matched_recommendations>

<prd_planning_summary>
   **a. Główne wymagania funkcjonalne produktu:**
   *   **Uwierzytelnianie:** Użytkownicy muszą mieć możliwość rejestracji i logowania.
   *   **Generowanie Fiszek AI:** System musi pozwalać na wklejenie tekstu (1k-10k znaków) i wygenerowanie z niego 10 fiszek. Proces musi być sygnalizowany wskaźnikiem postępu.
   *   **Zarządzanie Kandydatami:** Musi istnieć interfejs do przeglądania, edycji, akceptacji i odrzucania fiszek wygenerowanych przez AI.
   *   **Zarządzanie Kolekcją:** Po akceptacji fiszki trafiają do głównej kolekcji użytkownika. Użytkownik musi mieć możliwość przeglądania kolekcji (z paginacją), wyszukiwania, edycji i usuwania zapisanych fiszek.
   *   **Ręczne Dodawanie Fiszek:** Musi istnieć prosty formularz do manualnego tworzenia fiszek.
   *   **System Powtórek:** Aplikacja musi integrować się z zewnętrzną biblioteką open source, aby umożliwić sesje nauki oparte na algorytmie Spaced Repetition.

   **b. Kluczowe historie użytkownika i ścieżki korzystania:**
   *   **Główna ścieżka (AI):**
        1. Użytkownik loguje się do aplikacji.
        2. Wkleja tekst ze swoich notatek do dedykowanego pola.
        3. Inicjuje generowanie fiszek i obserwuje postęp.
        4. Przegląda listę "kandydatów", poprawia treść niektórych, odrzuca niepasujące.
        5. Zapisuje zaakceptowane fiszki do swojej kolekcji.
        6. Rozpoczyna sesję nauki, aby zacząć powtarzać nowo dodane fiszki.
   *   **Poboczna ścieżka (ręczna):**
        1. Użytkownik wchodzi do swojej kolekcji.
        2. Otwiera formularz dodawania nowej fiszki.
        3. Wpisuje treść przodu i tyłu fiszki, po czym ją zapisuje.

   **c. Ważne kryteria sukcesu i sposoby ich mierzenia:**
   *   **Główna metryka:** Jakość generowania fiszek przez AI.
   *   **Sposób pomiaru:** Procent "zaakceptowanych" fiszek z listy kandydatów. Fiszka jest uznawana za zaakceptowaną, jeśli nie została jawnie odrzucona przez użytkownika. Celem jest osiągnięcie wskaźnika akceptacji na poziomie **75%**.

   **d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia:**
   *   Nie wybrano konkretnej biblioteki do systemu powtórek.
   *   Szczegółowa mechanika sesji nauki (np. sposób oceniania odpowiedzi przez użytkownika) jest zależna od wybranej biblioteki.
   *   Szczegółowa specyfikacja techniczna stosu technologicznego (Astro/React/Supabase) wymaga osobnej analizy.

</prd_planning_summary>

<unresolved_issues>
1.  **Wybór biblioteki do powtórek:** Należy przeprowadzić research i wybrać konkretną bibliotekę open-source do implementacji algorytmu Spaced Repetition.
2.  **Projekt interfejsu sesji nauki:** Interfejs i interakcje użytkownika podczas sesji nauki (np. przyciski "wiem/nie wiem/powtórz") muszą zostać zaprojektowane po wyborze biblioteki, aby zapewnić kompatybilność.
3.  **Specyfikacja techniczna:** Wymagane jest stworzenie osobnego dokumentu szczegółowo opisującego architekturę i konfigurację stosu Astro + React + Supabase.
</unresolved_issues>
</conversation_summary>
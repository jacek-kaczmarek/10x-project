Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>
### Główny problem
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition.

### Najmniejszy zestaw funkcjonalności
- Generowanie fiszek przez AI na podstawie wprowadzonego tekstu (kopiuj-wklej)
- Manualne tworzenie fiszek
- Przeglądanie, edycja i usuwanie fiszek
- Prosty system kont użytkowników do przechowywania fiszek
- Integracja fiszek z gotowym algorytmem powtórek

### Co NIE wchodzi w zakres MVP
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import wielu formatów (PDF, DOCX, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z innymi platformami edukacyjnymi
- Aplikacje mobilne (na początek tylko web)

### Kryteria sukcesu
- 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika
- Użytkownicy tworzą 75% fiszek z wykorzystaniem AI
</project_description>

<project_details>
<conversation_summary>
<decisions>
1.  **Grupa docelowa:** Aplikacja w fazie MVP jest jednoznacznie skierowana do **studentów**. W związku z tym, ton komunikacji w całej aplikacji powinien być **umiarkowanie nieformalny**.
2.  **Główna funkcjonalność (Generowanie AI):** Rdzeniem aplikacji jest generowanie fiszek przez AI. Proces jest inicjowany na podstawie tekstu dostarczonego przez użytkownika, a system generuje **stałą, z góry określoną liczbę fiszek (domyślnie 10)**.
3.  **Proces weryfikacji fiszek (Kandydaci):** Fiszki wygenerowane przez AI **nie są automatycznie zapisywane**. Pojawiają się na dedykowanej liście "Kandydaci na fiszkę". Interfejs w tym miejscu musi umożliwiać użytkownikowi trzy akcje: **akceptację, edycję lub odrzucenie** każdej z propozycji. Dopiero po zakończeniu tego przeglądu, użytkownik może zapisać zaakceptowane fiszki w swojej kolekcji.
4.  **Interfejs w trakcie generowania:** Podczas gdy AI przetwarza tekst, interfejs musi informować użytkownika o postępie. Wystarczającym rozwiązaniem będzie prosty wskaźnik, zawierający **znacznik procentowy postępu oraz tekst "Trwa generowanie"**.
5.  **Walidacja danych wejściowych:** Aby zapewnić jakość generowanych fiszek i kontrolować koszty, pole tekstowe na materiał źródłowy będzie miało walidację. Dopuszczalna długość tekstu musi mieścić się w przedziale **od 1000 do 10000 znaków**.
6.  **Ręczne dodawanie fiszek:** Jako poboczna, ale ważna funkcja, system musi oferować prosty formularz z polami "przód" i "tył", umożliwiający użytkownikowi ręczne dodawanie pojedynczych fiszek do swojej kolekcji.
7.  **Zarządzanie kolekcją fiszek:** Na obecnym etapie **nie jest planowane tagowanie ani dzielenie na talie**. Wszystkie zapisane fiszki trafiają do jednej, prostej kolekcji. System musi zapewniać **wyświetlanie tej kolekcji z paginacją** oraz **prostą funkcjonalność przeszukiwania** zawartości fiszek.
8.  **System powtórek (Spaced Repetition):** Zostanie wykorzystana **gotowa biblioteka open source**. Kluczowe jest, aby w architekturze aplikacji przewidzieć miejsce na jej integrację poprzez **prosty, dobrze zdefiniowany interfejs programistyczny**.
9.  **Onboarding i UX:** Zrezygnowano z formalnego samouczka (tutoriala). Zamiast tego, łatwość obsługi ma być zapewniona przez przemyślany design: każda strona i widok musi zawierać **krótkie, zrozumiałe tytuły oraz ikony informacyjne ("i")**, które po najechaniu (w tooltipie) wyświetlą krótki opis funkcjonalności.
10. **Formatowanie tekstu w fiszkach:** W wersji MVP fiszki będą obsługiwały wyłącznie **prosty, czysty tekst (plain text)**, bez możliwości formatowania (np. pogrubienia, list).
11. **Obsługa pustych stanów:** Interfejs musi być spójny wizualnie, niezależnie od ilości danych. Oznacza to, że np. tabela na fiszki powinna być zawsze w tym samym miejscu. W przypadku braku danych, zamiast pustki, powinien pojawić się **przycisk w widocznym miejscu, jasno zachęcający do wykonania głównej akcji** (np. wygenerowania pierwszych fiszek).
12. **Model biznesowy i kontrola kosztów:** Na tym etapie **nie ma planów monetyzacji ani wprowadzania limitów subskrypcyjnych** dla użytkowników. Jednakże, w celu ochrony przed nadmiernymi kosztami API modeli językowych, limity użycia **muszą być konfigurowalne po stronie systemu jako stałe wartości**, z początkowo niskimi ustawieniami.
13. **Bezpieczeństwo danych:** Nie ma specyficznych wymagań dotyczących obsługi danych wrażliwych. Bezpieczeństwo będzie opierać się na standardowych praktykach: **autoryzacji i autentykacji użytkownika, walidacji formularzy oraz szyfrowaniu kanału komunikacji (SSL/TLS)**.
14. **Stos technologiczny:** Potwierdzono wybór: **Astro + React** dla frontendu oraz **Supabase** dla backendu. Zaznaczono jednak, że szczegółowa analiza techniczna i decyzje architektoniczne zostaną opisane w **osobnym, dedykowanym artefakcie projektowym**.
</decisions>

<matched_recommendations>
1.  **Etap przeglądu fiszek:** Zalecenie wprowadzenia kroku weryfikacyjnego dla użytkownika, aby dać mu poczucie kontroli i poprawić jakość danych, zostało w pełni zaadresowane przez decyzję o stworzeniu listy "Kandydatów na fiszkę" z opcjami edycji, akceptacji i odrzucenia.
2.  **Minimalizm MVP:** Zgodnie z rekomendacją, by skupić się na kluczowej wartości, świadomie zrezygnowano z bardziej złożonych funkcji, takich jak tagowanie czy wiele talii, na rzecz jednej, prostej kolekcji z wyszukiwaniem, co przyspieszy development.
3.  **Efektywność rozwoju:** Rekomendacja użycia gotowych, sprawdzonych rozwiązań tam, gdzie to możliwe, idealnie pasuje do decyzji o integracji z zewnętrzną biblioteką open source dla systemu powtórek, co oszczędzi czas potrzebny na implementację złożonego algorytmu.
4.  **Zarządzanie ryzykiem kosztowym:** Zalecono proaktywne podejście do kosztów API. Zostało to odzwierciedlone w decyzji o wbudowaniu w system mechanizmu konfigurowalnych, twardych limitów, co stanowi bezpośrednią metodę kontroli wydatków.
5.  **Budowanie bazy użytkowników:** Rekomendowany model freemium zakłada początkową fazę darmową. Decyzja o braku jakichkolwiek planów i limitów dla użytkowników w MVP jest w pełni zgodna z tą strategią, mającą na celu przyciągnięcie pierwszych użytkowników i zebranie feedbacku.
</matched_recommendations>

<prd_planning_summary>
   **a. Główne wymagania funkcjonalne produktu:**
   *   **Uwierzytelnianie:** Pełny cykl życia użytkownika: rejestracja, logowanie, zarządzanie sesją.
   *   **Generowanie Fiszek AI:** Umożliwienie wklejenia tekstu (w granicach 1k-10k znaków) i wygenerowanie z niego stałej liczby 10 fiszek, z wizualnym feedbackiem w postaci paska postępu.
   *   **Zarządzanie Kandydatami:** Dedykowany interfejs do przeglądania, edycji treści, akceptacji (przeniesienia do kolekcji) i odrzucania (trwałego usunięcia) propozycji od AI.
   *   **Zarządzanie Kolekcją:** Centralne miejsce, gdzie użytkownik widzi wszystkie swoje zapisane fiszki. Widok musi wspierać paginację (podział na strony) oraz proste wyszukiwanie tekstowe. Użytkownik musi mieć możliwość edycji i usuwania już istniejących fiszek.
   *   **Ręczne Dodawanie Fiszek:** Prosty, dostępny formularz do manualnego tworzenia fiszek, składający się z pola na przód i tył karty.
   *   **System Powtórek:** Integracja z biblioteką open source w celu dostarczenia funkcji sesji nauki, która inteligentnie dobiera fiszki do powtórki.

   **b. Kluczowe historie użytkownika i ścieżki korzystania:**
   *   **Główna ścieżka (AI):** Użytkownik loguje się, wkleja notatki, uruchamia generator, a następnie na ekranie "Kandydatów" precyzuje i filtruje sugestie AI. Po zaakceptowaniu wybranych pozycji, przechodzi do swojej kolekcji, by zobaczyć finalny rezultat, a następnie może rozpocząć sesję nauki.
   *   **Poboczna ścieżka (ręczna):** W dowolnym momencie użytkownik może szybko dodać pojedynczą, własną fiszkę przez dedykowany formularz, która od razu trafia do jego głównej kolekcji i jest uwzględniana w sesjach nauki.

   **c. Ważne kryteria sukcesu i sposoby ich mierzenia:**
   *   **Główna metryka sukcesu:** Jakość i trafność fiszek generowanych przez AI.
   *   **Sposób pomiaru:** Będziemy śledzić stosunek fiszek zaakceptowanych do odrzuconych na ekranie "Kandydatów". **Za "zaakceptowaną" uznaje się każdą fiszkę, która nie została jawnie usunięta przez użytkownika** (edycja wciąż liczy się jako akceptacja). **Krytyczny próg sukcesu dla MVP to osiągnięcie wskaźnika akceptacji na poziomie 75%**.

   **d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia:**
   *   Brak decyzji co do wyboru konkretnej biblioteki open source do systemu powtórek, co blokuje projekt interfejsu sesji nauki.
   *   Mechanika interakcji użytkownika z algorytmem powtórek (np. sposób oceniania odpowiedzi: "łatwe/trudne/powtórz") jest nieokreślona i zależy od wybranej biblioteki.
   *   Szczegółowa specyfikacja techniczna i architektoniczna stosu technologicznego wymaga opracowania w osobnym dokumencie.

</prd_planning_summary>

<unresolved_issues>
1.  **Wybór biblioteki do powtórek:** Należy przeprowadzić analizę porównawczą dostępnych bibliotek open-source (np. FSRS, implementacje SM-2) i dokonać wyboru, który będzie podstawą do dalszych prac nad modułem nauki.
2.  **Projekt interfejsu sesji nauki:** Po wyborze biblioteki, konieczne jest zaprojektowanie szczegółowego interfejsu użytkownika dla sesji nauki, w tym sposobu prezentacji fiszek i mechanizmu oceniania odpowiedzi przez użytkownika, który będzie dostarczał dane do algorytmu.
3.  **Opracowanie specyfikacji technicznej:** Należy stworzyć dokument techniczny (Technical Design Document), który szczegółowo opisze architekturę aplikacji, modele danych w Supabase, strukturę komponentów React/Astro oraz przepływ danych.
</unresolved_issues>
</conversation_summary>
</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md
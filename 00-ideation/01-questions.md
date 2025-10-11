Jasne, oto 10 pytań i zaleceń, które pomogą w doprecyzowaniu wymagań projektowych (PRD).

1.  Jaka jest główna grupa docelowa użytkowników (np. studenci, profesjonaliści, osoby uczące się języków)? Wiedza ta wpłynie na projekt interfejsu i ton komunikacji.

    Rekomendacja: Zalecam rozpoczęcie od wąskiej grupy docelowej, np. studentów medycyny lub prawa, aby precyzyjniej dostosować model AI do generowania specjalistycznych fiszek i zweryfikować hipotezy na jednorodnej grupie.
2.  W jaki sposób użytkownik będzie kontrolował proces generowania fiszek przez AI? Czy będzie mógł określić liczbę fiszek, ich rodzaj (np. pytanie-odpowiedź, uzupełnianie luk) lub poziom trudności?

    Rekomendacja: Sugeruję, aby w wersji MVP proces był jak najprostszy – AI automatycznie generuje fiszki typu pytanie-odpowiedź. Opcje konfiguracji można dodać w przyszłości na podstawie opinii użytkowników.
3.  Jak dokładnie zdefiniujemy "akceptację" fiszki przez użytkownika na potrzeby metryki sukcesu (75% akceptacji)? Czy edycja fiszki liczy się jako akceptacja, czy tylko kliknięcie przycisku "Akceptuj"?

    Rekomendacja: Proponuję, aby każda fiszka, która nie zostanie jawnie odrzucona (usunięta) przez użytkownika w procesie przeglądu, była traktowana jako "zaakceptowana". Upraszcza to pomiar i odzwierciedla realną wartość dla użytkownika.
4.  Czy mamy już wybrany konkretny, gotowy algorytm powtórek (np. FSRS, SM-2 w wersji open-source)? Wybór wpłynie na logikę przechowywania danych o postępach w nauce.

    Rekomendacja: Rekomenduję użycie algorytmu FSRS (Free Spaced Repetition Scheduler), ponieważ jest nowoczesny, dobrze udokumentowany i istnieją gotowe biblioteki, co przyspieszy implementację.
5.  W jaki sposób użytkownicy będą zarządzać swoimi fiszkami? Czy będą mogli tworzyć talie (zestawy) fiszek, tagować je lub przeszukiwać?

    Rekomendacja: W MVP kluczowe będzie umożliwienie grupowania fiszek w talie. Wyszukiwanie i tagowanie można potraktować jako funkcje drugorzędne, do wdrożenia w dalszej kolejności.
6.  Jaki model biznesowy jest planowany w dłuższej perspektywie? Czy od początku powinniśmy projektować system pod kątem przyszłych planów subskrypcyjnych (np. limity darmowych generacji)?

    Rekomendacja: Zalecam model freemium, gdzie podstawowe funkcje (np. do 50 generacji AI miesięcznie) są darmowe, aby zbudować bazę użytkowników. Płatne plany mogłyby oferować nielimitowane generacje i zaawansowane funkcje w przyszłości.
7.  Jak będzie wyglądał proces edycji fiszek wygenerowanych przez AI? Czy edycja będzie odbywać się na liście wygenerowanych kart przed ich zapisaniem, czy dopiero po dodaniu ich do talii?

    Rekomendacja: Sugeruję wprowadzenie etapu "przeglądu", gdzie użytkownik widzi listę proponowanych fiszek i może je edytować, akceptować lub odrzucać pojedynczo, zanim zostaną one finalnie dodane do jego kolekcji. To da użytkownikowi poczucie kontroli i pomoże nam mierzyć metrykę sukcesu.
8.  Jakie są plany dotyczące polityki prywatności i bezpieczeństwa danych? Użytkownicy będą wklejać potencjalnie wrażliwe informacje ze swoich notatek.

    Rekomendacja: Rekomenduję od początku jasno komunikować, że wklejone teksty są używane wyłącznie do generowania fiszek i nie są przechowywane po zakończeniu tego procesu. Warto też rozważyć anonimizację danych przesyłanych do modeli AI.
9.  Czy istnieje preferowany stos technologiczny dla aplikacji webowej? Wybór może wpłynąć na szybkość rozwoju i skalowalność.

    Rekomendacja: Jeśli nie ma preferencji, sugeruję użycie nowoczesnego frameworka JavaScript (np. React/Next.js lub SvelteKit) dla frontendu i np. Firebase lub Supabase dla backendu, co pozwoli na szybkie wdrożenie systemu kont i bazy danych.
10. Jakie są największe zidentyfikowane ryzyka dla tego projektu, poza jakością generowania fiszek przez AI? Czy bierzemy pod uwagę np. koszt zapytań do modeli językowych?

    Rekomendacja: Zalecam stworzenie prostego modelu finansowego, który oszacuje koszt API modeli językowych w przeliczeniu na jednego aktywnego użytkownika. To pozwoli kontrolować koszty i odpowiednio wcześnie zaplanować strategię monetyzacji.
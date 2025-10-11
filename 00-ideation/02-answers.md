

1. Grupą docelową na tym etapie rozwoju systemu są studenci. Ton komunikacji powinien być umiarkowanie nieformalny.

2. Główną funkcjonalnością ma być generowanie fiszek przez AI o zadanej przez stałą liczbie (domyślna = 10). Dodatkowa poboczna prosta funkcjonalność to wprowadzanie przez użytkownika pojedynczych fiszek przez prosty formularz z polami "przód" i "tył".

3. Fiszki wygenerowane przez AI pojawiają się na liście "Kandydaci na fiszkę" i nie są automatycznie zapisane do bazy danych. Interfejs umożliwia użytkownikowi akceptację fiszek lub ich edycję lub odrzucenie. Po wykonaniu recenzji kandydatów na fiszki system pozwala zapisać zaakceptowane fiszki w bazie danych.

4. Do powtórek użyty zostanie gotowa biblioteka do powtórek open source.

5. Na tym etapie nie implementujemy tagowania, jedynie wyświetlanie z paginacją i proste przeszukiwanie.

6. Na tym etapie nie ma planów biznesowych i monetyzacji użytkowników lub wprowadzania limitów subskrypcyjnych.

7. Pierwsza możliwość edycji (i odrzucenia lub zapisu) fiszek będzie na liście "Kandydaci na fiszkę" (punkt 3). Po zapisaniu do bazy edycja jest możliwa już na liście zapisanych fiszek (patrz punkt 5).

8. Na tym etapie nie ma wymagań kontroli i zabezpieczeń danych wrażliwych wklejanych do fiszek poza autoryzacją i autentykacją klienta, walidacją formularzy i standardowym szyfrowaniem kanałów dostępu (typu SSL/TLS) jeśli jest dostępny.

9. Tak, będzie to Astro + React oraz Supabase, jednak na ten temat będzie tworzony osobna analiza i powstanie osobny artefakt.

10. Limity modeli językowych powinny być konfigurowalne (stałe), należy zadbać o wstępnie niskie limity w celu ochrony przed nadmiernymi kosztami. 






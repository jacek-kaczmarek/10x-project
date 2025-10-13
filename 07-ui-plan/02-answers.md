1. Zaprojektować górny pasek nawigacji z odnośnikami do czterech kluczowych widoków: Rejestracja/Logowanie, Generowanie, Moje fiszki (z filtrowaniem i wyszukiwaniem), Sesja powtórek.

2. Pole tekstowe z walidacją i przyciskiem "Generuj" z zapisem generacji.
Następnie pokazanie zwróconych propozycji fiszek do edycji poniżej.
Opcje dla każej: Akceptuj, Edytuj, Usuń.
Przyciski - zapisz zaakceptowane.
Po zapisaniu reset całości modelu danych po stronie UI (generacji i fiszek), możliwośc wprowadzenia nowej generacji.

3. Użyć responsywnych kart z polami tekstowymi front/back, przyciskiem usuń i wskaźnikiem źródła; zmiany trzymać w lokalnym stanie React.

4. Jeden komponent Toast/Alert do wyświetlania błędów walidacji i błędów serwerowych z jasnymi komunikatami; pola form powinny mieć inline validation.

5. Data-table z nagłówkami kolumn, kontrolkami paginacji i filtrami (select status, select source, input search) oraz możliwościami inline edit/delete.

6. Prosty formularz z dwoma polami tekstowymi (front max200, back max500), walidacja po stronie klienta i przycisk „Dodaj”; po dodaniu toast + odświeżenie listy.

7. Do wyspecyfikowania później.

8.  Mobile-first, burger menu dla nawigacji, kolumny kart dostosowujące się do szerokości, użycie Tailwind breakpoints.

9. Komponenty z Shadcn/ui domyślnie ARIA-compliant, dodać role i etykiety, testy klawiaturowe, WCAG AA.

10. <SPRAWDZIC WIDEO>
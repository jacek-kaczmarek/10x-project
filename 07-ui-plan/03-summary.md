```markdown
<conversation_summary>
<decisions>
1. Zaimplementować Topbar z Shadcn/ui z linkami do: Rejestracja/Logowanie, Generowanie, Moje fiszki, Sesja powtórek.  
2. Stworzyć komponent GenerationForm: pole tekstowe z walidacją, przycisk „Generuj”, zapis generacji, wyświetlenie listy propozycji do edycji i przyciski Akceptuj/Edytuj/Usuń, przycisk „Zapisz” resetujący stan UI.  
3. Użyć responsywnych kart do wyświetlania propozycji fiszek z polami front/back, przyciskiem Usuń i wskaźnikiem źródła, stan trzymany lokalnie w React.  
4. Wdrożyć globalny system Toast/Alert do błędów walidacji i serwera oraz inline validation dla formularzy.  
5. Zaprojektować widok „Moje fiszki” jako data-table z paginacją, filtrami (status, źródło), wyszukiwaniem oraz inline edit/delete.  
6. Utworzyć ManualFlashcardForm: dwa pola tekstowe (front ≤200, back ≤500), walidacja, przycisk „Dodaj”, toast i odświeżenie listy.  
7. Opracować responsywność mobile-first: burger menu, Tailwind breakpoints, adaptacja kolumn kart.  
8. Zapewnić dostępność (ARIA roles/labels, keyboard navigation, WCAG AA) wykorzystując Shadcn/ui.  
9. Przygotować placeholder AuthContext dla przyszłej integracji JWT/Supabase Auth i ochrony routingu.  
10. Zarządzać stanem aplikacji za pomocą React Context i lokalnych hooków, używając React Query (useFlashcards, useGenerations itp.) z retry i error-handlingiem.  
11. Zainicjować Design System na bazie Shadcn/ui z tokenami kolorów, typografią i zestawem podstawowych komponentów.
</decisions>
<matched_recommendations>
1. Użyć komponentu Topbar z Shadcn/ui do głównej nawigacji.  
2. Stworzyć krokowy flow generowania fiszek: textarea, pasek postępu, lista propozycji, edycja i zapis.  
3. Responsywne karty z polami front/back i lokalnym stanem React.  
4. Globalny Toast/Alert oraz inline validation dla formularzy.  
5. Data-table z paginacją, filtrami i inline akcjami dla widoku kolekcji.  
6. Formularz manualny z walidacją po stronie klienta, toastem i odświeżeniem tabeli.  
8. Mobile-first, burger menu, Tailwind breakpoints.  
9. Komponenty ARIA-compliant, role i etykiety, WCAG AA.  
10. Placeholder AuthContext i plan JWT/Supabase Auth.  
11. React Context + React Query hooks do zarządzania stanem i integracji z API.  
17. Inicjalizacja Design System z Shadcn/ui.
</matched_recommendations>
<ui_architecture_planning_summary>
a. Główne wymagania UI:  
- Topbar z czterema widokami.  
- GenerationForm z walidacją i zapisem generacji.  
- FlashcardProposalList z kartami do edycji propozycji.  
- Globalny Toast/Alert i inline validation.  
- FlashcardsTable z paginacją, filtrami, wyszukiwaniem, inline edit/delete.  
- ManualFlashcardForm.  
- Responsywność mobile-first.  
- Dostępność ARIA/WCAG AA.  
- Placeholder AuthContext.  
- Zarządzanie stanem: React Context + React Query.  
- Design System na bazie Shadcn/ui.

b. Kluczowe widoki i przepływy:  
- Login/Register (formularze z walidacją).  
- Generate: textarea → pasek postępu → lista propozycji → edycja/akceptacja → zapis → powrót do formularza.  
- My Flashcards: tabela z paginacją, filtrowaniem, wyszukiwaniem, inline edit/delete.  
- Add Manual: prosty formularz manualny.  
- Study Session (szablon do uzupełnienia): flip-card, oceny, wywołanie PATCH.  
- Nawigacja między widokami via Topbar lub burger menu.

c. Integracja z API i zarządzanie stanem:  
- React Query hooks do GET/POST/PATCH/DELETE: useGenerations, useFlashcards, useManualFlashcard, z retry i error-handlingiem.  
- Debounce przy wyszukiwaniu, cache paginacji i prefetching.  
- Lokalny React state dla propozycji fiszek przed zapisem.

d. Responsywność, dostępność, bezpieczeństwo:  
- Mobile-first, Tailwind breakpoints, burger menu.  
- Shadcn/ui ARIA-compliant, role, labels, testy klawiaturowe, WCAG AA.  
- Placeholder AuthContext dla przyszłej ochrony routingu, JWT w Supabase Auth.

</ui_architecture_planning_summary>
<unresolved_issues>
1. Szczegółowa specyfikacja widoku sesji powtórek (layout, flow ocen).  
2. Dokładne zasady route-protection i token refresh w przyszłej integracji auth.  
3. Definicja design tokens (kolory, typografia) i komponentów w ramach Design System.  
4. Obsługa błędów edge case’ów sieciowych (timeout, rate limit) w UI.
</unresolved_issues>
</conversation_summary>
```
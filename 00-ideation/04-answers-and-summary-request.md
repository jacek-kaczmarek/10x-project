

1. W trakcie generowania pokaż prosty wskaźnik postępu, wystarczy znacznik procent postępu i napis "Trwa generowanie".

2. Walidacja powinna dopuszczać długość między 1000 a 10000 znaków.

3. Na tym etapie ustalamy, że będziemy korzystać z biblioteki open source, warto przewidzieć w projekcie miejsce do integracji z nią (prosty interfejs).

4. Przewidujemy jedną prostą kolekcję dla użytkownika.

5. Nie planujemy samouczka, natomiast warto aby każda strona/widok zawierała krótkie, ale wystarczające do zrozumienia tytuły i ikonki (i) z krótkimi opisami elementów pod tooltipem.

6. Na początek prosty tekst.

7. Interfejs powinien być spójny (tabela powinna być w stałym miejscu), żeby nie zaskakiwać użytkownika zmianami interfejsu, jednak warto umieścić przycisk zachęcający do generowania w widocznym miejscu.

---

Jesteś asystentem AI, którego zadaniem jest podsumowanie rozmowy na temat planowania PRD (Product Requirements Document) dla MVP i przygotowanie zwięzłego podsumowania dla następnego etapu rozwoju. W historii konwersacji znajdziesz następujące informacje:
1. Opis projektu
2. Zidentyfikowany problem użytkownika
3. Historia rozmów zawierająca pytania i odpowiedzi
4. Zalecenia dotyczące zawartości PRD

Twoim zadaniem jest:
1. Podsumować historię konwersacji, koncentrując się na wszystkich decyzjach związanych z planowaniem PRD.
2. Dopasowanie zaleceń modelu do odpowiedzi udzielonych w historii konwersacji. Zidentyfikuj, które zalecenia są istotne w oparciu o dyskusję.
3. Przygotuj szczegółowe podsumowanie rozmowy, które obejmuje:
   a. Główne wymagania funkcjonalne produktu
   b. Kluczowe historie użytkownika i ścieżki korzystania
   c. Ważne kryteria sukcesu i sposoby ich mierzenia
   d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia
4. Sformatuj wyniki w następujący sposób:

<conversation_summary>
<decisions>
[Wymień decyzje podjęte przez użytkownika, ponumerowane].
</decisions>

<matched_recommendations>
[Lista najistotniejszych zaleceń dopasowanych do rozmowy, ponumerowanych]
</matched_recommendations>

<prd_planning_summary>
[Podaj szczegółowe podsumowanie rozmowy, w tym elementy wymienione w kroku 3].
</prd_planning_summary>

<unresolved_issues>
[Wymień wszelkie nierozwiązane kwestie lub obszary wymagające dalszych wyjaśnień, jeśli takie istnieją]
</unresolved_issues>
</conversation_summary>

Końcowy wynik powinien zawierać tylko treść w formacie markdown. Upewnij się, że Twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje dla następnego etapu tworzenia PRD.
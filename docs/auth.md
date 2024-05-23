**AUTH**

TBA
POST /auth/
    - Przyjmuje:
        Obiekt {username: string, password: string}
    - Zwraca:
        200 - obiekt User użytkownika
        403 - informacja o złym haśle
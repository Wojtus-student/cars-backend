**USER**

**Obiekty**

User
* id - string, id usera
* username - string
* password - string
* email - string
* role - string (admin/driver/regular)

**Endpointy**

TBA
GET /user
    - Zwraca listę wszystkich userów

POST /user
    Przyjmuje:
    POST w formacie JSON - obiekt user
    Zwraca:
    200 - id utworzonego usera - OK

GET /user/:userId
    Przyjmuje:
    - parametr :userId - _id usera
    Zwraca:
    200 - obiekt User

PUT /user/:userId
    Przyjmuje:
    - parametr :userId - _id usera
    Zwraca:
    200 - message: 'User updated'

DELETE /user/:userId
    Przyjmuje:
    - parametr :userId - _id usera
    Zwraca:
    200 - sukces
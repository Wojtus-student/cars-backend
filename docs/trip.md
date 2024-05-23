**TRIP**

POST /trip
    Przyjmuje:
    - w POST obiekt Trip
    - dodatkowo role w Trip

GET /trip/:tripID
    Przyjmuje:
    - parametr :tripID - _id trip
    Zwraca:
    - obiekt Trip jeżeli istnieje

GET /trip
    Zwraca:
    - array obiektów Trip

PUT /trip/:tripID
    Przyjmuje:
    - obiekt Trip modyfikujący
    Zwraca:
    200 - OK

DELETE /trip/:tripID
    Przyjmuje:
    - parametr :tripID
    Zwraca:
    200 - OK
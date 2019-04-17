 # [GET] /users/1

* :large_blue_circle: [:large_blue_circle: (200) returns the given user if it exists](#200-returns-the-given-user-if-it-exists)
* :red_circle: [:red_circle: (200) returns the given user if it exists](#200-returns-the-given-user-if-it-exists)

---

### :large_blue_circle: (200) returns the given user if it exists

##### Request

* Method: GET
* Headers
    | Key | Value |
    | :--- | :--- |
    | x-header | 1 |
* Body
    ```
    {
        "foo": "bar"
    }
    ```

##### Response

* Status: 200
* Headers:
    | Key | Value |
    | :--- | :--- |
    | x-header | 1 |
* Body:
    ```
    ```

### :red_circle: (200) returns the given user if it exists
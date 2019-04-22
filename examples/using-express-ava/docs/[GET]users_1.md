# [GET] /users/1

* [(200) returns the given user if it exists](#a1c9c74c-7fca-4060-98b2-2b6ace461998)
* [(500) returns an error if the given user doesnt exist](#854eb9ea-a6cd-44ce-b3f1-7d799179a536)

---

### :chicken: `(200) returns the given user if it exists` <a name="a1c9c74c-7fca-4060-98b2-2b6ace461998"></a>

:egg: **Request**

Method: GET

Headers: 

| Key | Value |
| :--- | :--- |
| x-test-name | (200) returns the given user if it exists |

Body: 

```
{}
```

:hatching_chick: **Response**

Status: 200

Headers: 

| Key | Value |
| :--- | :--- |
| x-test-id | a1c9c74c-7fca-4060-98b2-2b6ace461998 |

Body: 

```
{
  "id": "1",
  "name": "Leonardo"
}
```

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="854eb9ea-a6cd-44ce-b3f1-7d799179a536"></a>

:egg: **Request**

Method: GET

Headers: 

| Key | Value |
| :--- | :--- |
| x-test-name | (500) returns an error if the given user doesnt exist |

Body: 

```
{}
```

:hatching_chick: **Response**

Status: 500

Headers: 

| Key | Value |
| :--- | :--- |
| x-test-id | 854eb9ea-a6cd-44ce-b3f1-7d799179a536 |

Body: 

```
{
  "code": "USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

# [GET] /users/1

* [(200) returns the given user if it exists](#5336ac9a-a51b-4638-98e4-7a3c728d1eaf)
* [(500) returns an error if the given user doesnt exist](#b9b01c23-c7f3-4157-9e05-157b6874a5f1)

---

### :chicken: `(200) returns the given user if it exists` <a name="5336ac9a-a51b-4638-98e4-7a3c728d1eaf"></a>

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
| x-test-id | 5336ac9a-a51b-4638-98e4-7a3c728d1eaf |

Body: 

```
{
  "id": "1",
  "name": "Leonardo"
}
```

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="b9b01c23-c7f3-4157-9e05-157b6874a5f1"></a>

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
| x-test-id | b9b01c23-c7f3-4157-9e05-157b6874a5f1 |

Body: 

```
{
  "code": "USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

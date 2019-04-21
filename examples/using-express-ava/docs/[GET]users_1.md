# [GET] /users/1

* [(200) returns the given user if it exists](#64c0ecde-4f4c-43f0-9e9d-e9ea8666d06e)
* [(500) returns an error if the given user doesnt exist](#bb82e153-3959-444e-91f8-f269c0917bf7)

---

### :chicken: `(200) returns the given user if it exists` <a name="64c0ecde-4f4c-43f0-9e9d-e9ea8666d06e"></a>

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
| x-test-id | 64c0ecde-4f4c-43f0-9e9d-e9ea8666d06e |

Body: 

```
{
  "id": "1",
  "name": "Leonardo"
}
```

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="bb82e153-3959-444e-91f8-f269c0917bf7"></a>

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
| x-test-id | bb82e153-3959-444e-91f8-f269c0917bf7 |

Body: 

```
{
  "code": "USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

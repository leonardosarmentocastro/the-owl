# [get] /users/:id

* [(200) returns the given user if it exists](#8889354f-ae45-4327-a769-72e7e6bfbdf0)
* [(500) returns an error if the given user doesnt exist](#bb9a346e-9294-40d2-8b20-34d9a26cddca)

---

### :chicken: `(200) returns the given user if it exists` <a name="8889354f-ae45-4327-a769-72e7e6bfbdf0"></a>

:egg: **Request**

Path: `/users/1`

Method: GET

Headers: 

| Key | Value |
| :--- | :--- |
| your-header | your-value |

Query parameters: _empty_

Body: 

```
{}
```

:hatching_chick: **Response**

Status: 200

Headers: _empty_

Body: 

```
{
  "id": "1",
  "name": "Leonardo"
}
```

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="bb9a346e-9294-40d2-8b20-34d9a26cddca"></a>

:egg: **Request**

Path: `/users/999`

Method: GET

Headers: _empty_

Query parameters: _empty_

Body: 

```
{}
```

:hatching_chick: **Response**

Status: 500

Headers: _empty_

Body: 

```
{
  "code": "USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

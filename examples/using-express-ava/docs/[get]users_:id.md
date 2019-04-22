# [get] /users/:id

* [(200) returns the given user if it exists](#e41c6b7f-cdc7-497f-bd2a-81dda7160a2e)
* [(500) returns an error if the given user doesnt exist](#e3460a90-ef27-4706-887a-6254e8072d10)

---

### :chicken: `(200) returns the given user if it exists` <a name="e41c6b7f-cdc7-497f-bd2a-81dda7160a2e"></a>

:egg: **Request**

Path: `/users/1`

Method: GET

Headers: 

| Key | Value |
| :--- | :--- |
| your-header | your-value |

Query parameters: _empty_


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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="e3460a90-ef27-4706-887a-6254e8072d10"></a>

:egg: **Request**

Path: `/users/999`

Method: GET

Headers: _empty_

Query parameters: _empty_


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

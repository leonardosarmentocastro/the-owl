# [get] /users/:id

* [(200) returns the given user if it exists](#5aa0200f-45b6-4ee4-9635-4d734cdf736f)
* [(500) returns an error if the given user doesnt exist](#3b60d89f-d1ac-4c3f-8b52-f20f1c9818dd)

---

### :chicken: `(200) returns the given user if it exists` <a name="5aa0200f-45b6-4ee4-9635-4d734cdf736f"></a>

```sh
curl -X GET \
http://localhost:8081/users/1 \
-H 'your-header: your-value'
```

**Request** :egg:

Path: `/users/1`

Query parameters: _empty_

Headers: 

| Key | Value |
| :--- | :--- |
| your-header | your-value |

Body: _empty_

**Response** :hatching_chick:

Status: 200

Headers: _empty_

Body: 

```
{
  "id": "1",
  "name": "Leonardo"
}
```

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="3b60d89f-d1ac-4c3f-8b52-f20f1c9818dd"></a>

```sh
curl -X GET \
http://localhost:8081/users/999
```

**Request** :egg:

Path: `/users/999`

Query parameters: _empty_

Headers: _empty_

Body: _empty_

**Response** :hatching_chick:

Status: 500

Headers: _empty_

Body: 

```
{
  "code": "USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

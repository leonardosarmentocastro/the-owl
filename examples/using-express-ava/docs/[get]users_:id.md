# [get] /users/:id

* [(200) returns the given user if it exists](#55e23415-b72d-4445-b118-d85bdf3b1703)
* [(500) returns an error if the given user doesnt exist](#b503b6bc-3313-4821-b4ca-e980b26f1a71)

---

### :chicken: `(200) returns the given user if it exists` <a name="55e23415-b72d-4445-b118-d85bdf3b1703"></a>

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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="b503b6bc-3313-4821-b4ca-e980b26f1a71"></a>

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

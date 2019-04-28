# [get] /users/:id

* [(200) returns the given user if it exists](#0eea8b45-b32a-4025-a8e7-15b3e4e43d1f)
* [(500) returns an error if the given user doesnt exist](#96a0371b-d221-444f-85a0-e77b3db3f3d7)

---

### :chicken: `(200) returns the given user if it exists` <a name="0eea8b45-b32a-4025-a8e7-15b3e4e43d1f"></a>

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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="96a0371b-d221-444f-85a0-e77b3db3f3d7"></a>

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

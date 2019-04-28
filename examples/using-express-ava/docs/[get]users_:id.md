# [get] /users/:id

* [(200) returns the given user if it exists](#aa647ec2-3bf0-4c17-9a21-bd722d1b4248)
* [(500) returns an error if the given user doesnt exist](#f62077e0-5a2d-407f-aa51-a45326dbb079)

---

### :chicken: `(200) returns the given user if it exists` <a name="aa647ec2-3bf0-4c17-9a21-bd722d1b4248"></a>

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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="f62077e0-5a2d-407f-aa51-a45326dbb079"></a>

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

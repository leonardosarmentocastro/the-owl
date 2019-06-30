# [get] /users/:id

* [(200) returns the given user if it exists](#36cf89b2ed)
* [(500) returns an error if the given user doesnt exist](#31a5f75113)

---

### :chicken: `(200) returns the given user if it exists` <a name="36cf89b2ed"></a>

```sh
curl -X GET \
http://localhost:57471/users/1 \
-H 'your-custom-header: Notice how he appears on the generated doc but "theOwl" headers doesn't!'
```

**Request** :egg:

Path: `/users/1`

Query parameters: _empty_

Headers: 

| Key | Value |
| :--- | :--- |
| your-custom-header | Notice how he appears on the generated doc but "theOwl" headers doesn't! |

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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="31a5f75113"></a>

```sh
curl -X GET \
http://localhost:57471/users/999
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
  "code": "ERROR_USER_NOT_FOUND",
  "message": "User \"999\" not found!"
}
```

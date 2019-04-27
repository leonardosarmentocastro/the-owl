# [get] /users/:id

* [(200) returns the given user if it exists](#a2a7b08c-6737-44bf-965e-d24df1272908)
* [(500) returns an error if the given user doesnt exist](#ca5e738e-d3f0-4e8f-b317-75d92c77d619)

---

### :chicken: `(200) returns the given user if it exists` <a name="a2a7b08c-6737-44bf-965e-d24df1272908"></a>

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

Body: 

```
{}
```

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

### :chicken: `(500) returns an error if the given user doesnt exist` <a name="ca5e738e-d3f0-4e8f-b317-75d92c77d619"></a>

```sh
curl -X GET \
http://localhost:8081/users/999
```

**Request** :egg:

Path: `/users/999`

Query parameters: _empty_

Headers: _empty_

Body: 

```
{}
```

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

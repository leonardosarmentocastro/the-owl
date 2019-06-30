# [get] /users

* [(200) returns the registered users](#869d0327aa)

---

### :chicken: `(200) returns the registered users` <a name="869d0327aa"></a>

```sh
curl -X GET \
http://localhost:55027/users \
-H 'your-custom-header: Notice how it appears on generated doc but "theOwl" headers doesn't!'
```

**Request** :egg:

Path: `/users`

Query parameters: _empty_

Headers: 

| Key | Value |
| :--- | :--- |
| your-custom-header | Notice how it appears on generated doc but "theOwl" headers doesn't! |

Body: _empty_

**Response** :hatching_chick:

Status: 200

Headers: _empty_

Body: 

```
[
  {
    "id": 1,
    "name": "John"
  },
  {
    "id": 2,
    "name": "Paul"
  }
]
```

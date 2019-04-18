 # [GET] /users/1

* [(200) returns the given user if it exists](#3bf374a8-5cc8-47f0-be83-c0b615760803)

---

### :chicken: `(200) returns the given user if it exists` <a name="3bf374a8-5cc8-47f0-be83-c0b615760803"></a>

:egg: **Request**

Method: GET

Headers:

| Key | Value |
| :--- | :--- |
| x-request-header | 1 |

Body: _empty_

:hatching_chick: **Response**

Status: 200

Headers: _empty_

Body:

```
{
  "id": 1,
  "name": "Leonardo"
}

# [get] /health

* [(200) returns the application status](#bde4588532)

---

### :chicken: `(200) returns the application status` <a name="bde4588532"></a>

```sh
curl -X GET \
http://localhost:49855/health \
-H 'your-custom-header: Notice how it appears on generated doc but "theOwl" headers doesn't!'
```

**Request** :egg:

Path: `/health`

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
OK
```

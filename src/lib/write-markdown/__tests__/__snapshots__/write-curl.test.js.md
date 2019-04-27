# Snapshot report for `src/lib/write-markdown/__tests__/write-curl.test.js`

The actual snapshot is saved in `write-curl.test.js.snap`.

Generated by [AVA](https://ava.li).

## (snapshot) must not render "-d" option when receiving empty body

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -H 'content-type: text/json'␍␊
    ````

> Snapshot 2

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -H 'content-type: text/json'␍␊
    ````

> Snapshot 3

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -H 'content-type: text/json'␍␊
    ````

## (snapshot) must render "-H" option for each header entry

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d '{␊
      "id": 1,␊
      "name": "Leonardo"␊
    }' \\␍␊
    -H 'header1: must create an entry'␍␊
    -H 'header2: must create another entry'␍␊
    ````

## (snapshot) must render "-d" option as formatted json when receiving body of type object

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d '{␊
      "id": 2,␊
      "name": "Diogo"␊
    }' \\␍␊
    -H 'content-type: text/json'␍␊
    ````

## (snapshot) must render "-d" option as text when receiving body of scalar type

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d 'string is a scalar type' \\␍␊
    -H 'content-type: text/json'␍␊
    ````

## (snapshot) must not render "-H" option when receiving empty headers

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d '{␊
      "id": 1,␊
      "name": "Leonardo"␊
    }'␍␊
    ````

> Snapshot 2

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d '{␊
      "id": 1,␊
      "name": "Leonardo"␊
    }'␍␊
    ````

## (snapshot) must escape each instruction line of the generated curl, but not the last line

> Snapshot 1

    ````sh␍␊
    curl -X GET \\␍␊
    http://localhost:8080/users/1 \\␍␊
    -d '{␊
      "id": 1,␊
      "name": "Leonardo"␊
    }' \\␍␊
    -H 'content-type: text/json'␍␊
    ````
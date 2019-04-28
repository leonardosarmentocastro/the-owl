# Snapshot report for `src/redux/ducks/docs/__tests__/reducer.test.js`

The actual snapshot is saved in `reducer.test.js.snap`.

Generated by [AVA](https://ava.li).

## must handle "the-owl/CREATE_DOC" action

> Snapshot 1

    {
      allIds: [
        '1',
      ],
      byId: {
        1: {
          id: '1',
          testName: 'test name 1',
        },
      },
    }

> Snapshot 2

    {
      allIds: [
        '1',
        '2',
      ],
      byId: {
        1: {
          id: '1',
          testName: 'test name 1',
        },
        2: {
          id: '2',
          testName: 'test name 2',
        },
      },
    }

## must handle the-owl/COLLECT_REQUEST_INFORMATION action

> Snapshot 1

    {
      allIds: [
        '1',
      ],
      byId: {
        1: {
          id: '1',
          request: {
            body: undefined,
            headers: {},
            method: 'get',
            originalPath: '/users/:id',
            path: '/users/1',
            queryParameters: {},
            url: 'http://localhost/users/1',
          },
          testName: 'test name 1',
        },
      },
    }

> Snapshot 2

    {
      allIds: [
        '1',
        '2',
      ],
      byId: {
        1: {
          id: '1',
          request: {
            body: undefined,
            headers: {},
            method: 'get',
            originalPath: '/users/:id',
            path: '/users/1',
            queryParameters: {},
            url: 'http://localhost/users/1',
          },
          testName: 'test name 1',
        },
        2: {
          id: '2',
          request: {
            body: undefined,
            headers: {},
            method: 'get',
            originalPath: '/users/:id',
            path: '/users/1',
            queryParameters: {},
            url: 'http://localhost/users/1',
          },
          testName: 'test name 2',
        },
      },
    }

## must handle the-owl/COLLECT_RESPONSE_INFORMATION action

> Snapshot 1

    {
      allIds: [
        '1',
      ],
      byId: {
        1: {
          id: '1',
          response: {
            body: {
              id: 1,
              name: 'Leonardo',
            },
            headers: {
              'x-response-header': 'not important value',
            },
            statusCode: 200,
          },
          testName: 'test name 1',
        },
      },
    }

> Snapshot 2

    {
      allIds: [
        '1',
        '2',
      ],
      byId: {
        1: {
          id: '1',
          response: {
            body: {
              id: 1,
              name: 'Leonardo',
            },
            headers: {
              'x-response-header': 'not important value',
            },
            statusCode: 200,
          },
          testName: 'test name 1',
        },
        2: {
          id: '2',
          response: {
            body: {
              id: 1,
              name: 'Leonardo',
            },
            headers: {
              'x-response-header': 'not important value',
            },
            statusCode: 200,
          },
          testName: 'test name 2',
        },
      },
    }
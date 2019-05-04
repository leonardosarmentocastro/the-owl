# the-owl

Create docs for your API using functional tests.

<meta property="og:image" content="https://user-images.githubusercontent.com/11094572/57013840-ae877b80-6c0d-11e9-89b8-45a365d38971.png" />

![the-owl-template](https://user-images.githubusercontent.com/11094572/57013840-ae877b80-6c0d-11e9-89b8-45a365d38971.png)


## How does it works

- Connect `the-owl` middleware to your Express.js application
- You write functional tests for your API endpoints
- Markdown files for each test file are created under `docs/` folder

Pretty interesting, right? Follow along to learn more.

<img width="901" alt="Screenshot 2019-04-28 at 19 32 15" src="https://user-images.githubusercontent.com/11094572/56867964-840aa800-69ec-11e9-82ab-e2ae31590228.png">

## Usage

Install the package:

```sh
npm install --save-dev the-owl
```

Connect the package middleware with your Express app:

```js
const express = require('express');

const app = express();
theOwl.connect(app);
```

In your [functional tests](./examples/using-express-ava/src/modules/users/__tests__/functional/[get]users_:id.js), set custom headers on requests that you want to collect information:

```js
const axios = require('axios');

const ORIGINAL_PATH = `/users/:id`;
const URL = `http://localhost:8080${ORIGINAL_PATH}`;
const getEndpoint = (userId) => URL.replace(':id', userId);

test('(200) returns the given user if it exists', async t => {
  const userId = 1;
  const response = await axios.get(getEndpoint(userId), {
    headers: {
      'content-type': 'application/json',

      // Use our function construct the necessary headers:
      ...theOwl.buildHeaders(t.title, ORIGINAL_PATH),

      // Or optionally... do it yourself
      'x-test-name': '(200) returns the given user if it exists',
      'x-req-original-path': '/users/:id',
    },
  });

  t.deepEqual(response.data, { id: userId, name: 'Leonardo' });
});
```

At the very end of your test suit, invoke:

```js
test.after('create api docs', t => {
  theOwl.createDocs();
});
```

Run your test suit:

```sh
CREATE_DOCS=true npm run test
```

The `docs/` folder will be created (if doesn't exists) with the results:

<img width="289" alt="Screenshot 2019-04-28 at 20 23 51" src="https://user-images.githubusercontent.com/11094572/56868513-90463380-69f3-11e9-96b8-3c9f3d99b1b8.png">


## Motivation

**Enforce functional tests development by earning something tangible from it.**

Usually, API contract changes are done on code and documentations gets obsolete, as it's usually a `.yml` or `@jsdoc` that developers forget to update or it uses boring specific markup rules.

This package was built with the mindset that **all changes should be made in code**.


## Documentation

Please see the [files in the `docs` directory](./docs):

* [Process variables](./docs/process-variables.md)


## Contributing

Please refer to [this](./contributing.md) document.

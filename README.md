# the-owl

_Create docs for your API using functional tests_

<img width="901" alt="Screenshot 2019-04-28 at 19 32 15" src="https://user-images.githubusercontent.com/11094572/56867964-840aa800-69ec-11e9-82ab-e2ae31590228.png">


## How does it works

- Connect `the-owl` middleware to your Express.js application
- You write functional tests for your API endpoints
- Markdown files for each test file are created under `docs/` folder

Pretty interesting, right? Follow along to learn more.


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

In your [functional tests](https://github.com/avajs/ava/), set custom headers on requests that you want to collect information:

```js
const axios = require('axios');

const ORIGINAL_PATH = `/users/:id`;
const URL = `http://localhost:8080${ORIGINAL_PATH}`;';
const getEndpoint = (userId) => URL.replace(':id', userId);

test.serial('(200) returns the given user if it exists', async t => {
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
test.serial.after('create api docs', t => {
  theOwl.createDocs();
});
```

Run your test suit:

```sh
CREATE_DOCS=true npm run test
```

The `docs/` folder will be created (if doesn't exists) with the results:

<img width="289" alt="Screenshot 2019-04-28 at 20 23 51" src="https://user-images.githubusercontent.com/11094572/56868513-90463380-69f3-11e9-96b8-3c9f3d99b1b8.png">


### Process variables (aka `process.env`)

Use the following in your test script, as follows:

```sh
CREATE_DOCS=true npm run test
```

**`CREATE_DOCS=true`**

Doc creation is disabled unless you specify this variable.

This is to avoid having docs being created everytime you save a file while running your tests on `watch mode`.

Run your test with this variable set to have your docs created.


**`LOG_MESSAGES=true`**

Enable this variable to receive stdout messages.

By default, warn/error messages are disabled.

If you, for example, forget to set the custom headers without having this variable set, it will silently not create the docs neither give you a tip about the reason.


**`LOG_REDUX=true`**

Redux is used internally to manage the object tree that holds all request and response information.

Use this variable if you are (for any reason...) interested on seeing the output of each state update.


### Caveats

For instance, doc creation will _only_ work for **functional tests executed serially**.


## Motivation

**Enforce functional tests development by earning something tangible from it.**

Usually, API contract changes are done on code and documentations gets obsolete, as it's usually a `.yml` or `@jsdoc` that developers forget to update or it uses boring specific markup rules.

This package was built with the mindset that **all changes should be made in code**.


## Contributing

To work on the project by yourself, I suggest to clone it and do the following:

1. Open one terminal for `the-owl` itself:

```sh
cd the-owl
npm run start # Watches for changes and build files to dist
```

2. Open another terminal for `examples/` project:

```sh
cd the-owl/examples/using-express-ava
npm run start # Uses nodemon to reboot the server on file changes
```

The examples are symlinking `the-owl` dependency on `package.json`, so whatever changes to `dist/` folder will be automatically working on the example on each run.

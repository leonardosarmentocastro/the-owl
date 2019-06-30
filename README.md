# the-owl

Create docs for your API using functional tests.

<meta property="og:image" content="https://user-images.githubusercontent.com/11094572/57013840-ae877b80-6c0d-11e9-89b8-45a365d38971.png" />

![the-owl-template](https://user-images.githubusercontent.com/11094572/57013840-ae877b80-6c0d-11e9-89b8-45a365d38971.png)

[![Build Status](https://travis-ci.com/leonardosarmentocastro/the-owl.svg?branch=master)](https://travis-ci.com/leonardosarmentocastro/the-owl)
[![codecov](https://codecov.io/gh/leonardosarmentocastro/the-owl/branch/master/graph/badge.svg)](https://codecov.io/gh/leonardosarmentocastro/the-owl)
[![install size](https://packagephobia.now.sh/badge?p=the-owl)](https://packagephobia.now.sh/result?p=the-owl)

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

> On ["examples/01-minimal" server file](./examples/01-minimal/src/server.js):

* Step 1: Connect the "information collection middleware" on your Express server.

```js
const bodyParser = require('body-parser');
const express = require('express');
const theOwl = require('the-owl');

exports.server = {
  close(api) { ... },
  listen(app, port) { ... },

  async start(port = process.env.PORT) {
    const app = express();

    //// STEP 1: Connect the Express middleware so request/response information can be collected.
    theOwl.connect(app);

    // middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // routes
    app.get('/health', (req, res) => res.status(200).send('OK'));
    app.get('/users', (req, res) => res.status(200)
      .json(
        [{ id: 1, name: 'John' }, { id: 2, name: 'Paul' }]
      )
    );

    const api = await this.listen(app, port);
    return api;
  },
};
```

> On ["examples/01-minimal" functional test file](./examples/01-minimal/src/__tests__/[get]health.js):

* Step 2: Set custom headers on requests that you want to collect information;
* Step 3: Set test hook to "createDocs" after all tests have runned.

```js
const got = require('got');
const test = require('ava');
const theOwl = require('the-owl');

const { closeApiOpenedOnRandomPort, startApiOnRandomPort } = require('../__helpers__');

test.before('start server', async t => {
  t.context.endpointOriginalPath = `/health`;
  await startApiOnRandomPort(t);
});
//// STEP 3: Call "createDocs" method after all test cases have runned.
//// STEP 4: Run the script "CREATE_DOCS=true npm test" on terminal.
test.after('create api docs', t => theOwl.createDocs());
test.after.always('close server', t => closeApiOpenedOnRandomPort(t));

test('(200) returns the application status', async t => {
  const response = await got(t.context.endpointBaseUrl , {
    retry: { retries: 0 },
    headers: {
      'your-custom-header': 'Notice how it appears on generated doc but "theOwl" headers doesn\'t!',

      //// STEP 2: Send "theOwl" headers on requests which information must be collected to generate api docs.
      //// NOTE: Information will not be collected if "theOwl" headers are not correctly sent.
      // Option 1: use the utility function to build the headers.
      ...theOwl.buildHeaders(t.title, t.context.endpointOriginalPath),

      // Option 2: you set the headers manually.
      // 'x-test-name': t.title,
      // 'x-req-original-path': t.context.endpointOriginalPath,
    },
  });

  t.assert(response.statusCode === 200);
  t.assert(response.body === 'OK');
});
```

> On terminal

Run your test suit:

```sh
CREATE_DOCS=true npm run test
```

The `docs/` folder will be created (if doesn't exists) with the results:

<img width="239" alt="Screenshot 2019-06-30 at 03 33 25" src="https://user-images.githubusercontent.com/11094572/60391131-f03a8280-9ae7-11e9-8951-41f92c6bdd65.png">


## Motivation

**Enforce functional tests development by earning something tangible from it.**

Usually, API contract changes are done on code and documentations gets obsolete, as it's usually a `.yml` or `@jsdoc` that developers forget to update or it uses boring specific markup rules.

This package was built with the mindset that **all changes should be made in code**.


## Documentation

Please see the [files in the `/documentation` directory](./documentation):

* [01. API](./documentation/01-api.md)
* [02. Process variables](./documentation/02-process-variables.md)


## Contributing

Please refer to [this](./contributing.md) document.

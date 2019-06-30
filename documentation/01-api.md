### API (exposed methods)

To use the library and its exposed methods, install and import it in your code as follows:

```sh
$ npm install --save-dev the-owl
```

```js
const theOwl = require('the-owl');
```

* [buildHeaders(testName, reqOriginalPath)](#build-headers)
* [connect(app)](#connect)
* [createDocs()](#create-docs)

#### buildHeaders(testName, reqOriginalPath) <a name="build-headers"></a>

Returns an object containing necessary set of headers, relevants to a chunk of collected information from request/response of a test case.

These headers must be appended to each request that generates metadata for api docs.

> NOTE: In case you see yourself forgetting to set these headers, warn messages can be enabled by setting `LOG_MESSAGES` process variable when running your test script. [See "02-process-variables.md" for more details.](./02-process-variables.md#log-messages)

Example:

```js
const got = require('got'); // HTTP request library.
const test = require('ava'); // Test library.
const theOwl = require('the-owl');

const reqOriginalPath = '/users/:id';
const url = `http://localhost:3030${reqOriginalPath}`;
const getEndpoint = (userId) => url.replace(':id', userId);

test('(200) must return an user if it exists on database', async t => {
  const testName = t.title;
  const options = {
    headers: {
      'content-type': 'application/json',
      ...theOwl.buildHeaders(testName, reqOriginalPath),
    },
  };

  const userId = 999;
  const response = await got(getEndpoint(userId), options);
  t.assert(response.statusCode === 200);
});
```

##### testName

Type: `String`

Describes the test name, e.g: `"(200) must return an user if it exists on database"`.

Each test name refers to a topic on the written doc's summary.

A md5 hash is generated from it and used to create an anchor tag to improve navigation.

##### reqOriginalPath

Type: `String`

Describes the request original path, e.g. `"/users/:id"`. Its used to write the file name and title.

The Express.js request object only contains the path with each parameter interpolated ("/users/999"), unabling us from describing an endpoint as it is set on the application's router.


#### connect(app) <a name="connect"></a>

Connects the request and response "information collection middlewares" to the given Express app.

Both middlewares uses redux to store information of all test cases relavants to a single test file.

> NOTE: Redux state changes can be logged on STDOUT by running your test scripts with `LOG_REDUX` process variable set. [See "02-process-variables.md" for more details.](./02-process-variables.md#log-redux)

Example:

```js
const express = require('express');
const theOwl = require('the-owl');

const app = express();
theOwl.connect(app);
```

##### app

Type `Object`

[An Express.js application.](https://expressjs.com/en/4x/api.html#express)


#### createDocs() <a name="create-docs"></a>

Creates api doc markdown file relevant to all meta data colleted from a test file.

Should be invoked after all functional tests have runned.

> NOTE: Markdown files will only be generated if `CREATE_DOCS` process variable in set when running your project test script. [See "02-process-variables.md" for more details.](./02-process-variables.md#create-docs)

Example:

```js
const test = require('ava');
const theOwl = require('the-owl');

// test.before('start server', async t => { ... });
test.after('create api docs', t => theOwl.createDocs());
// test.after.always('close server', t => { ... });

test('(200) returns the application status', async t => {
  // ...
});
```
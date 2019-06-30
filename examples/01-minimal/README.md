# minimal

Minimal example project about how to setup `the-owl` with Express.js and AVA test runner.


## Where should I look?

On `src/server.js` file:

* Step 1: Connect the Express middleware so request/response information can be collected.

On `src/__tests__/[get]health.js` or `src/__tests__/[get]post.js` file:

* Step 2: Send "theOwl" headers on requests which information must be collected to generate api docs;
* Step 3: Call "createDocs" method after all test cases have runned.


## How can I see docs being generated?

By running the script:

```sh
npm run test:create-docs
```

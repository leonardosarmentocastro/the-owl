# the-owl

_Generate api docs based on functional tests_

### Roadmap

<!-- * construct a small server under "/bin" as proof of concept -->
<!-- * clever way to grab test name -->
<!-- * maybe skip getting the test name and focus on turning the solution agnostic to "axios" -->
<!-- * on backend, use headers as tracking resource (turning it agnostic to axios) -->
<!-- * save request information on a - redux shape - state tree (looks interesting) -->
<!-- * fix: responseMiddleware is not fired when response ends up with 500 -->
  <!-- * https://github.com/richardschneider/express-mung/blob/master/test/json.js#L63 -->
<!-- * Markdown links may fail if the test has hyphens, e.g.: "(500) returns an error if the given user doesn't exist" (fail due to "doesn't") -->
* Document the usage of `LOG_REDUX_STATE_CHANGES`
* Create a issue on "ava" repo to ask about "transpiling my source files before running tests"
  * The only solution that worked was this one: https://github.com/avajs/ava/issues/1309#issuecomment-356807355
* collect "body" and "headers" on "requestMiddleware"
* Generate CURL for each doc entry
* adicionar algum atributo no "request" que eu possa usar pra agrupar requests feitas pelo mesmo path
  * PELO JEITO não tem nada disso então super-fodase
* filter headers like "x-powered-by" and "x-the-owl-id"
  * maybe not filter "x-the-owl-id" in case we want expose some methods that gives access to the store
    > like "theOwl.getDoc(id)" which would perform "state.doc.byId[id]"
* generate README.md files under "/docs"
  * like AVA: https://github.com/avajs/ava/tree/master/docs
  * how to run a code after all tests are run with ava?
* on example server:
  * construct sample function test API instance
  https://github.com/avajs/ava/blob/master/docs/01-writing-tests.md#before--after-hooks
  https://github.com/avajs/ava/blob/master/docs/01-writing-tests.md
  * add a "after" hook which will execute a `theOwl` function that gets the current state, and outputs README.md file under "/docs"
  following the convention "[method]path_subpath.js", example: "[post]users_sign-up.js"
  * the `.md` files can be constructed using `string templates`, ex:
  ```js
  const markdown = `
    ### [post]users_sign-up.js
    bla bla bla...
  `.trim();
  ```
  * after creating a doc file for this test file, we clean the store (maybe raise bugs if I program it bad, since tests runs concurrently)

### Notes

* If you sent a request to `/users` (which doesnt exist) using the proper headers, it will still be added to the store as a "doc". We need to figure out a way to fix it

### MVP

  * lets works with serial tests for this instance
  * tests are going to be generated on `test.after.always` hooks of each file
  * each test file will output a `doc` file under `/docs`
    * pass a header named `the-owl-file-name` where you set the doc file name (`[post]users_sign-up.js`).
      - Can use nodejs `__filename` if none is passed (might be tricky, but we will try)
      - Since each test file corresponds to an API endpoint test, we can use the request information under redux state to build the doc, following the format `[method]endpoint.js`.
  * flag `GENERATE_API_DOCS=TRUE` needs to be passed in order to enable doc generation
    - to avoid problems with test runner on `watch` mode
  * command should be somethink like `ava --serial GENERATE_API_DOCS=true`
  * find a way to use this inside CI, so doc files are generated and automatically commited to the source tree.

  1. on `theOwl` main file, export a method that will generate api docs with the current state and then clean it
    - for first instance, the file name will be generated using only using the information we have on the store
    - second instance, we can set the file name manually to the axios API instance
  2. ...

### Working

terminal 1:
```
cd the-owl
npm run start # watches for changes and build files to dist
```

terminal 2:
```
cd the-owl/examples/using-express-ava
npm run start # uses nodemon to reboot the server on file changes
```

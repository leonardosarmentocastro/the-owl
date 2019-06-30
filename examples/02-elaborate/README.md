# elaborate

Elaborated example project about how to setup `the-owl` with Express.js and AVA test runner.


## Where should I look?

Inside `src/server/` folder:

* `connect.js` shows how to connect the middleware with your Express.js app
* `server.js` wraps Express.js in order to give it the ability to start/close the server on functional tests

Inside `src/modules/user` folder:

* `__fixtures__/user.js` plain objects that will be served on routes (to "simulate a database")
* `__tests__/[get]users_:id.js` is where the gold is.
* `controller.js` has the implementation for `/users/:id` route
* `router.js` map a route to a controller method


## How can I see docs being generated?

By running the script:

```sh
npm run test:create-docs
```

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

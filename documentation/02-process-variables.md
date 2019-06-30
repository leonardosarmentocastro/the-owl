### Process variables (aka `process.env`)

Use the process variables in your test script, as follows:

```sh
CREATE_DOCS=true npm run test
```

* [CREATE_DOCS](#create-docs)
* [LOG_MESSAGES](#log-messages)
* [LOG_REDUX](#log-redux)

#### `CREATE_DOCS=true` <a name="create-docs"></a>

Doc creation is disabled unless you specify this variable.

This is to avoid having docs being created everytime you save a file while running your tests on `watch mode`.

Run your test with this variable set to have your docs created.


#### `LOG_MESSAGES=true` <a name="log-messages"></a>

Enable this variable to receive stdout messages.

By default, warn/error messages are disabled.

If you, for example, forget to set the custom headers without having this variable set, it will silently not create the docs neither give you a tip about the reason.


#### `LOG_REDUX=true` <a name="log-redux"></a>

Redux is used internally to manage the object tree that holds all request and response information.

Use this variable if you are (for any reason...) interested on seeing the output of each state update.

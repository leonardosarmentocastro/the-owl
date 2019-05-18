# Contributing

Thank you for consider contributing to **`the-owl`**!

Here you can find a list of possible topic to contribute to the project.

## How can I contribute?

### Semantic improvements

* Changed the `testName` attribute to `testTitle`;
* Changed the `REQ_ORIGINAL_PATH` header to `ENDPOINT_ORIGINAL_PATH`, and `reqOriginalPath` attribute to `endpointOriginalPath`;
* Add `endpointOriginalPath` to generated markdown file, right above `Path:` text:
<img width="1146" alt="Screenshot 2019-05-18 at 20 03 11" src="https://user-images.githubusercontent.com/11094572/57973480-8c318400-79a9-11e9-9266-dcc75d925464.png">



### Configure `chalk`

The library `chalk` is used to output colored information on terminal. For now, the codebase is repeating hexcolors a lot in different places.

We should define our own theme and refactor these places to use them.

### Integrate with `travis-ci`

New package version have been released manully from personal computer.

It would be great to have `travis-ci` running tests and releasing new version automatically when a new tag is pushed.

### Add code coverage

Our current test runner (AVA) does not have a code coverage solution built it, meaning we must plugin libraries like `nyc` for such.

We could give [codecov](https://codecov.io) a try.

### Add linter

I think we all agree that we need a linter.

We could give [xo](https://github.com/xojs/xo) a try.

### Improve docs

Honestly, I feel it can be more attractive. My impressions suggests that:

* Examples on `README.md` should be more succinct and show the end minimal setup for an Express API (e.g. the route `[get]users/:id`);
* The ["Documentation"](https://github.com/leonardosarmentocastro/the-owl#documentation) section should include examples regarding the exposed API methods: `buildHeaders`, `connect` and `createDocs`.


## How to start developing on the codebase?

The library is written in pure Javascript, so no transpilation is required.

Install dependencies with `npm install` and use `npm test` to develop changes/features/fixes securely.

The examples folder has a project which `the-owl` is symlinked as dependency on `package.json`, so whatever changes to `src/` will be automatically working on the example on each run.

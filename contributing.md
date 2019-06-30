# Contributing

Thank you for consider contributing to **`the-owl`**!

Here you can find how to start developing on the codebase, as well the list of possible topics to contribute on the project.

## How to start developing on the codebase?

The library is written in pure Javascript, so no transpilation is required.

Install dependencies with `npm install` and use `npm test` to develop changes/features/fixes securely.

The examples folder has a project which `the-owl` is symlinked as dependency on `package.json`, so whatever changes to `src/` will be automatically working on the example on each run.

## Topics to contribute

### Semantic improvements

* Changed the `testName` attribute to `testTitle`;
* Changed the `REQ_ORIGINAL_PATH` header to `ENDPOINT_ORIGINAL_PATH`, and `reqOriginalPath` attribute to `endpointOriginalPath`;
* Add `endpointOriginalPath` to generated markdown file, right above `Path:` text:
<img width="1146" alt="Screenshot 2019-05-18 at 20 03 11" src="https://user-images.githubusercontent.com/11094572/57973480-8c318400-79a9-11e9-9266-dcc75d925464.png">

### Minify deployed code

To [shrink package install size](https://packagephobia.now.sh/result?p=the-owl) from 467kB to 100kb~.

### Configure `chalk`

The library `chalk` is used to output colored information on terminal. For now, the codebase is repeating hexcolors a lot in different places.

We should define our own theme and refactor these places to use them.

### Add linter

I think we all agree that we need a linter.

We could give [xo](https://github.com/xojs/xo) a try.

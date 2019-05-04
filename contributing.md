# Contributing

Thank you for consider contributing to **`the-owl`**!

Here you can find a list of possible topic to contribute to the project.

## How can I contribute?

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

Honestly, I feel it can be more attractive.

But how? I have no idea.

## How to start developing on the codebase?

The library is written in pure Javascript, so no transpilation is required.

Install dependencies with `npm install` and use `npm test` to develop changes/features/fixes securely.

The examples folder has a project which `the-owl` is symlinked as dependency on `package.json`, so whatever changes to `src/` will be automatically working on the example on each run.

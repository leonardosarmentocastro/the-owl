# the-owl

_Generate api docs based on functional tests_

### Roadmap

* Change "write-docs.js" functions to [mdx](https://mdxjs.com/) (used by Docussaurus v2);
* Create a decent README.md
* Document the usage of environment variables
* (NICE TO HAVE) Generate CURL for each doc entry

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

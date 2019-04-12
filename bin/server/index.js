const server = require('./server');

(async () => {
  try {
    const api = await server.start();

    // Example of how to close the API.
    // await server.close(api);
  } catch(err) {
    console.error(err)
  }
})();

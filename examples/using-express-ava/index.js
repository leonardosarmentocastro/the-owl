const { server } = require('./src/server');

(async () => {
  try {
    const api = await server.start();
    // await server.close(api); // Example of how to close the API.
  } catch(err) {
    console.error(err)
  }
})();

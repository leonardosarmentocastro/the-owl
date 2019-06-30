const { server } = require('./src/server');

(async () => {
  try {
    await server.start();
  } catch(err) {
    console.error(err)
  }
})();

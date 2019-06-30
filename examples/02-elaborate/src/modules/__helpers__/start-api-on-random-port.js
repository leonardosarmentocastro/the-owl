const detectPort = require('detect-port');

const { server } = require('../../server');

exports.startApiOnRandomPort = async (t) => {
  if (!t.context.endpointOriginalPath) {
    throw new Error(`The test context field "endpointOriginalPath" (e.g. "/users/:id") is mandatory for functional tests.`);
  }

  const availablePort = await detectPort();
  const baseUrl = `http://localhost:${availablePort}`;

  // Test url used for an specific functional test suit.
  t.context.endpointBaseUrl = `${baseUrl}${t.context.endpointOriginalPath}`;

  // API instance that will be closed at the end of each functional test suit.
  t.context.api = await server.start(availablePort);
};

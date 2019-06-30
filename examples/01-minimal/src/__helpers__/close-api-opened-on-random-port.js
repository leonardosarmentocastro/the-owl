const { server } = require('../server');

exports.closeApiOpenedOnRandomPort = (t) => server.close(t.context.api);

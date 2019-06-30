// Describes the test name, e.g: "(200) must return an user if it exists on database".
// Each test name refers to a topic on the written doc's summary.
// A md5 hash is generated from it and used to create an anchor tag to improve navigation.
exports.TEST_NAME_HEADER = 'x-test-name';

// Describes the request original path, e.g. "/users/:id".
// Its used to write the file name and title.
// NOTE: The Express.js request object only contains the path with each parameter interpolated ("/users/999"), unabling us
// from describing an endpoint as it is set on the application's router.
exports.REQ_ORIGINAL_PATH_HEADER = 'x-req-original-path';

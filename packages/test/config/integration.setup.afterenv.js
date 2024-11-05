const { setImmediate } = require('timers');

// Integration tests need increased timeout for server interactions
jest.setTimeout(60_000);

// mock-fs makes use of setImmediate() so expose it globally even though
// it is not natively available in JSDom environments.
// See https://github.com/tschaub/mock-fs/pull/360 and https://github.com/prisma/prisma/issues/8558
global.setImmediate = setImmediate;

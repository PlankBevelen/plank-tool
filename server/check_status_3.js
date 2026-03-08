const httpStatus = require('http-status');
console.log('default keys:', Object.keys(httpStatus.default || {}));
console.log('status keys:', Object.keys(httpStatus.status || {}));

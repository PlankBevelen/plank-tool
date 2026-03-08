const httpStatus = require('http-status');
console.log('Keys:', Object.keys(httpStatus));
console.log('Is OK in keys?', 'OK' in httpStatus);
console.log('Is 200 in keys?', '200' in httpStatus);

var crypto = require('crypto');

function getKA(cb) {
  return crypto.randomBytes(32, function(err, buf) {
    cb(null, buf.toString('hex'));
  });
}

function getDeviceId(cb) {
  return crypto.randomBytes(32, function(err, buf) {
    cb(null, buf.toString('hex'));
  });
}

module.exports = {
  getKA: getKA,
  getDeviceId: getDeviceId
};

var util = require('./util');

module.exports = function(db) {

  // creates a new device
  function create(user, cb) {
    util.getDeviceID(function (err, id) {
      var device = {
        user: user,
        latest_version: true,
        last_update: +new Date
      };
      db.set(id, device, function(err) {
        cb(err, id);
      });
    });
  }

  // returns device info
  function get(id, cb) {
    db.get(id, cb);
  }

  return { create: create, get: get };

};

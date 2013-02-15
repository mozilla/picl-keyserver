var uuid = require('node-uuid');
var util = require('./util.js');
var async = require('async');
var db = require('./db.js');
var devices = require('./devices.js');

// kv will be initialized once the database connection has been established
var kv;
db.onconnect(function(err, conn) { kv = conn; });

/* user account model
 *
 * user should have account id
 * <email>/userid = <userId>
 * <userId>/devices = {
 *  <deviceId> = {
 *    latestKey: <true/false>
 *    lastKeyRequest: <time>
 *  },
 *  <deviceId> = { },
 * <userId>/meta = {
 *  kA: <kA key>
 *  kA_version: <kA version>
 * }
 *
 * */

exports.create = db.wait(function(email, cb) {
  // generate user id
  var userId = uuid.v4();
  var metaKey = userId + '/meta';
  var devicesKey = userId + '/devices';
  var kA, deviceId;

  async.waterfall([
    // link email to userid
    function(cb) {
      kv.set(email + '/userid', userId, cb);
    },
    // get new class A key
    util.getKA,
    // create user account
    function(key, cb) {
      kA = key;
      kv.set(metaKey, { kA: key, kA_version: 1 }, cb);
    },
    // get new device id
    util.getDeviceId,
    // init devices
    function(id, cb) {
      deviceId = id;
      var devices = {};
      devices[deviceId] = initDevice();
      kv.set(devicesKey, devices, cb);
    },
    // return data
    function(cb) {
      cb(null, { kA: kA, deviceId: deviceId, version: 1 });
    }
  ], cb);
});

// This method returns the userId currently associated with an email address.
exports.getId = db.wait(function(email, cb) {
  kv.get(email + '/userid', function(err, result) {
    cb(err, result && result.value);
  });
});

// This method creates a new device for the user
exports.addDevice = db.wait(function(userId, cb) {
  var metaKey = userId + '/meta';
  var devicesKey = userId + '/devices';
  var id;
  async.waterfall([
    // get new device id
    util.getDeviceId,
    // get user devices
    function(deviceId, cb) {
      id = deviceId;
      kv.get(devicesKey, cb);
    },
    // save account
    function(devices, cb) {
      if (!devices) return cb('UnknownUser');
      devices.value[id] = initDevice();
      kv.set(devicesKey, devices.value, function(err) { cb(err, id); });
    }
  ], cb);
});

// Whenever a device requests the latest key, we update
// its meta data to show that it's up to date
exports.updateDevice = db.wait(function(userId, deviceId, cb) {
  var devicesKey = userId + '/devices';
  async.waterfall([

    // get device info
    function(cb) { kv.get(devicesKey, cb); },

    // update devices info and save
    function(devices, cb) {
      if (!devices) return cb('UnknownUser');
      if (!devices.value[deviceId]) return cb('UnknownDevice');
      // device has the latest version
      devices.value[deviceId].latestVersion = true;
      // device's last request was now
      devices.value[deviceId].lastKeyRequest = +new Date();
      kv.set(devicesKey, devices.value, cb);
    }
  ], cb);
});

// When a device bumps the user's class A key, we indicate that all other
// devices have a stale key
exports.outdateDevices = db.wait(function(userId, deviceId, cb) {
  var devicesKey = userId + '/devices';
  async.waterfall([

    // get device info
    function(cb) { kv.get(devicesKey, cb); },

    // update devices info and save
    function(devices, cb) {
      if (!devices) return cb('UnknownUser');
      if (!devices.value[deviceId]) return cb('UnknownDevice');

      for (var id in devices.value) {
        // all other devices have a stale key
        if (id !== deviceId) devices.value[id].latestVersion = false;
      }

      // device's last request was now
      devices.value[deviceId].lastKeyRequest = +new Date();
      kv.set(devicesKey, devices.value, cb);
    }
  ], cb);
});

// When a device bumps the user's class A key, we indicate that all other
// devices have a stale key
exports.bumpkA = db.wait(function(userId, cb) {
  var metaKey = userId + '/meta';
  var user;

  async.waterfall([

    // get user info
    function(cb) { kv.get(metaKey, cb); },
    function(meta, cb) { user = meta; cb(null); },

    // get new class A key
    util.getKA,

    // update devices info and save
    function(kA, cb) {
      if (!user) return cb('UnknownUser');

      // set new class A key and increment version
      user.value.kA = kA;
      user.value.kA_version++;
      kv.set(metaKey, user.value, function(err) { cb(err, user.value); });
    }
  ], cb);
});

// get meta data associated with a user
exports.getUser = db.wait(function(userId, cb) {
  kv.get(userId + '/meta', function(err, doc) {
    if (err) return cb(err);
    if (!doc) return cb('UnknownUser');
    cb(null, doc.value);
  });
});

// utility for returning a new device object
function initDevice() {
  return {
    hasLatestKey: true,
    lastKeyRequest: +new Date()
  };
}


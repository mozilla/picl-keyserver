const uuid = require('node-uuid');
const async = require('async');
const kvstore = require('picl-server/lib/kvstore');
const config = require('./config.js');
const util = require('./util.js');
const Hapi = require('hapi');

var internalError = Hapi.Error.internal;
var notFound = Hapi.Error.notFound;

var kv = kvstore.connect(config.get('kvstore'));

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

exports.create = function(email, cb) {
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
};

// This method returns the userId currently associated with an email address.
exports.getId = function(email, cb) {
  kv.get(email + '/userid', function(err, result) {
    if (err) return cb(internalError(err));
    cb(null, result && result.value);
  });
};

// This method creates a new device for the user
exports.addDevice = function(userId, cb) {
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
      kv.set(devicesKey, devices.value, function(err) {
        if (err) return cb(internalError(err));
        cb(null, id);
      });
    }
  ], cb);
};

// Whenever a device requests the latest key, we update
// its meta data to show that it's up to date
exports.updateDevice = function(userId, deviceId, cb) {
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
};

// When a device bumps the user's class A key, we indicate that all other
// devices have a stale key
exports.outdateDevices = function(userId, deviceId, cb) {
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
};

// When a device bumps the user's class A key, we indicate that all other
// devices have a stale key
exports.bumpkA = function(userId, cb) {
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
      kv.set(metaKey, user.value, function(err) {
        if (err) return cb(internalError(err));
        cb(null, user.value);
      });
    }
  ], cb);
};

// get meta data associated with a user
exports.getUser = function(userId, cb) {
  kv.get(userId + '/meta', function(err, doc) {
    if (err) return cb(internalError(err));
    if (!doc) return cb(notFound('UnknownUser'));
    cb(null, doc.value);
  });
};

// utility for returning a new device object
function initDevice() {
  return {
    hasLatestKey: true,
    lastKeyRequest: +new Date()
  };
}


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');
const users = require('../lib/users.js');
const prereqs = require('../lib/prereqs.js');

const S = Hapi.Types.String;
const B = Hapi.Types.Boolean;
const N = Hapi.Types.Number;

var routes = [
  {
    method: 'GET',
    path: '/__heartbeat__',
    config: {
      handler: heartbeat
    }
  },
  {
    method: 'PUT',
    path: '/user/create',
    handler: create,
    config: {
      description: 'create a new user',
      pre: [ prereqs.email ],
      validate: {
        schema: {
          assertion: S(),
          email: S()
        }
      },
      response: {
        schema: {
          success: B().required(),
          kA: S().required(),
          deviceId: S().required(),
          version: N().integer().required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/device/create',
    handler: device,
    config: {
      description: 'create a new device for the user',
      pre: [ prereqs.email, prereqs.userId, prereqs.user ],
      validate: {
        schema: {
          assertion: S(),
          email: S()
        }
      },
      response: {
        schema: {
          success: B().required(),
          kA: S().required(),
          deviceId: S().required(),
          version: N().integer().required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/user/get/{deviceId}',
    handler: get,
    config: {
      description: 'get user meta data',
      pre: [ prereqs.email, prereqs.userId, prereqs.user ],
      validate: {
        schema: {
          assertion: S(),
          email: S()
        }
      },
      response: {
        schema: {
          success: B().required(),
          kA: S().required(),
          version: N().integer().required()
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/user/bump/{deviceId}',
    handler: bump,
    config: {
      description: 'get user meta data',
      pre: [ prereqs.email, prereqs.userId ],
      validate: {
        schema: {
          assertion: S(),
          email: S()
        }
      },
      response: {
        schema: {
          success: B().required(),
          kA: S().required(),
          version: N().integer().required()
        }
      }
    }
  }
];

// heartbeat
function heartbeat(request) {
  request.reply.payload('ok').type('text/plain').send();
}

// create a user by assertion
function create(request) {
  users.create(request.pre.email, function(err, result) {
    if (err) return request.reply(Hapi.Error.badRequest(err));

    request.reply({
      success: true,
      kA: result.kA,
      deviceId: result.deviceId,
      version: result.version
    });
  });
}

// add a new device to a user's account
function device(request) {
  var user = request.pre.user;

  users.addDevice(request.pre.userId, function(err, deviceId) {
    if (err) return request.reply(Hapi.Error.badRequest(err));

    request.reply({
      success: true,
      kA: user.kA,
      deviceId: deviceId,
      version: user.kA_version
    });
  });
}

// get a user's class A key and its version number
function get(request) {
  var pre = request.pre;

  // update the device's last kA request time
  users.updateDevice(pre.userId, request.params.deviceId, function(err) {
    if (err) return request.reply(Hapi.Error.badRequest(err));

    request.reply({
      success: true,
      kA: pre.user.kA,
      version: pre.user.kA_version
    });
  });
}

// create a new class A key and bump the version number
function bump(request) {
  var pre = request.pre;

  // mark all other devices as having a stale key
  users.outdateDevices(pre.userId, request.params.deviceId, function(err) {
    if (err) return request.reply(Hapi.Error.badRequest(err));

    // create a new key and bump the version
    users.bumpkA(pre.userId, function(err, user) {
      if (err) return request.reply(Hapi.Error.badRequest(err));

      request.reply({
        success: true,
        kA: user.kA,
        version: user.kA_version
      });
    });
  });
}

module.exports = routes;


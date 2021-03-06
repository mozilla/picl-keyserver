/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');

const users = require('../lib/users.js');
const prereqs = require('../lib/prereqs.js');

const Str = Hapi.Types.String;
const Bool = Hapi.Types.Boolean;
const Num = Hapi.Types.Number;

var getConfig = {
  description: 'Get user meta data',
  pre: [ prereqs.assertionGet, prereqs.userId, prereqs.user ],
  validate: {
    query: {
      assertion: Str().without('email'),
      email: Str().without('assertion')
    }
  },
  response: {
    schema: {
      kA: Str().required(),
      version: Num().integer().required()
    }
  }
};

exports.routes = [
  {
    method: 'POST',
    path: '/user',
    handler: create,
    config: {
      description: 'Create a new user',
      pre: [ prereqs.assertion ],
      validate: {
        schema: {
          assertion: Str().without('email'),
          email: Str().without('assertion')
        }
      },
      response: {
        schema: {
          kA: Str().required(),
          deviceId: Str().required(),
          version: Num().integer().required()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/user',
    handler: get,
    config: getConfig
  },
  {
    method: 'GET',
    path: '/user/{deviceId?}',
    handler: get,
    config: getConfig
  },
  {
    method: 'POST',
    path: '/user/bump/{deviceId}',
    handler: bump,
    config: {
      description: 'Create a new class A key for the user and bump the version number',
      pre: [ prereqs.assertion, prereqs.userId ],
      validate: {
        schema: {
          assertion: Str().without('email'),
          email: Str().without('assertion')
        }
      },
      response: {
        schema: {
          kA: Str().required(),
          version: Num().integer().required()
        }
      }
    }
  }
];



// create a user by assertion
function create(request) {
  users.create(request.pre.email, function(err, result) {
    if (err) return request.reply(err);

    request.reply.payload({
      kA: result.kA,
      deviceId: result.deviceId,
      version: result.version
    }).created().send();
  });
}

// get a user's class A key and its version number
function get(request) {
  var pre = request.pre;

  // For NULL auth, deviceId is not required
  if (! request.params.deviceId) {
    return request.reply({
      kA: pre.user.kA,
      version: pre.user.kA_version
    });
  }

  // update the device's last kA request time
  users.updateDevice(pre.userId, request.params.deviceId, function(err) {
    if (err) return request.reply(err);

    request.reply({
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
    if (err) return request.reply(err);

    // create a new key and bump the version
    users.bumpkA(pre.userId, function(err, user) {
      if (err) return request.reply(err);

      request.reply({
        kA: user.kA,
        version: user.kA_version
      });
    });
  });
}


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');

const users = require('../lib/users.js');
const prereqs = require('../lib/prereqs.js');

const Str = Hapi.Types.String;
const Bool = Hapi.Types.Boolean;
const Num = Hapi.Types.Number;

exports.routes = [
  {
    method: 'POST',
    path: '/device',
    handler: create,
    config: {
      description: 'create a new device for the user',
      pre: [ prereqs.assertion, prereqs.userId, prereqs.user ],
      validate: {
        schema: {
          assertion: Str(),
          email: Str()
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
  }
];

// add a new device to a user's account
function create(request) {
  var user = request.pre.user;

  users.addDevice(request.pre.userId, function(err, deviceId) {
    if (err) return request.reply(err);

    request.reply.payload({
      kA: user.kA,
      deviceId: deviceId,
      version: user.kA_version
    }).created().send();
  });
}

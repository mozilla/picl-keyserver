/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');
const heartbeat = require('picl-server/routes/heartbeat');

const user = require('./user.js');
const device = require('./device.js');


module.exports = heartbeat.routes.concat(
                   user.routes,
                   device.routes
                 );


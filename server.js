/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Hapi = require('hapi');

var config = require('./lib/config.js');
var helpers = require('./lib/helpers.js');

// load array of routes
var routes = require('./routes');

// server settings
var settings = {
  monitor: true
};

// Create a server with a host and port
var port = config.get('bind_to.port');
var host = config.get('bind_to.host');
var server = new Hapi.Server(host, port, settings);


server.addHelper('email', helpers.email);
server.addHelper('verify', helpers.verify);
server.addHelper('userId', helpers.userId);
server.addHelper('user', helpers.user);

server.addRoutes(routes);


module.exports = server;


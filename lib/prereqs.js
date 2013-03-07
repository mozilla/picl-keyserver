/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Prerequesites can be included in a route's configuration and will run
// before the route's handler is called. Results are set on
// the request.pre object using the method's name for the property name,
// or otherwise using the value of the "assign" property.
//
// Methods specified as strings are helpers. Check ./helpers.js for
// definitions.

module.exports = {
  assertion: {
    method: 'verify(payload.assertion, payload.email)',
    assign: 'email'
  },
  // This is the same as the assertion prereq, but for GET requests
  assertionGet: {
    method: 'verify(query.assertion, query.email)',
    assign: 'email'
  },
  userId: {
    method: 'userId(pre.email)'
  },
  user: {
    method: 'user(pre.userId)'
  }
};

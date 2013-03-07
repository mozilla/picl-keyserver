var Hapi = require('hapi');
var verify = require('picl-server/lib/verify.js');
var config = require('./config.js');
var users = require('./users.js');

// fake auth just returns the email address
exports.email = function(email, next) {
  next(email);
};

// verify an assertion and return the email address
exports.verify = function(assertion, email, next) {
  if (email && config.get('enable_email_auth')) {
    next(email);
  } else {
    verify(assertion, config.get('audience'), config.get('verifier_url'),
      function(err, result) {
        // In Hapi, the convention is to return a single result
        // that may be a Hapi.Error or a valid result, instead
        // of returning a separate error parameter ala node.js
        if (err) next(Hapi.Error.badRequest(err));
        else next(result.email);
      });
  }
};

// retrieve the userId associated with an email address
// TODO add heavy cacheing of this. Changing email should be rare.
exports.userId = function(email, next) {
  users.getId(email, function(err, userId) {
    if (err) next(err);
    else next(userId);
  });
};

// retrieve the meta data for a user
exports.user = function(userId, next) {
  users.getUser(userId, function(err, user) {
    if (err) next(err);
    else next(user);
  });
};


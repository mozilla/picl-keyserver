const Hapi = require('hapi');
const kvstore = require('picl-server/lib/kvstore');
const config = require('./config.js');

/* Data is stored using the abstract 'kvstore' interface from picl-server.
 * We use a single, shared connection to the store, which is established
 * automatically but asynchronously.  Thus, there is a little bit of magic
 * here to ensure the API functions in this module will wait for a connection
 * to be established.  Just wrap any such functions with 'waitKV' like so:
 *
 *    var get_tabs = waitKV(function(user, device, cb) {
 *        // Calls will be delayed until the shared connection is ready.
 *        kv.get('whatever', function(err, res) {
 *            // ...do whatever with the result here...
 *        });
 *    });
 *
 */

var kv = null;
var kvErr = null;
var kvWaitlist = [];
var connectList = [];

function waitKV(func) {
  return function() {
    // If the kv connection is ready, immediately call the function.
    // It can safely use the shared global variable.
    if (kv !== null) {
      func.apply(this, arguments);
    }
    // If the connection errored out, immediately call the callback function
    // to report the error.  Callback is assumed to be the last argument.
    else if (kvErr !== null) {
      arguments[arguments.length - 1].call(this, kvErr);
    }
    // Otherwise, we have to wait for the database connection.
    // Re-wrap the function so that the above logic will be applied when ready.
    else {
      kvWaitlist.push(waitKV(func));
    }
  };
}


kvstore.connect(config.get('kvstore'), function(err, conn) {
  if (err) {
    kvErr = err;
  } else {
    kv = conn;
  }
  while (connectList.length) {
    connectList.pop()(kvErr, conn);
  }
  while (kvWaitlist.length) {
    process.nextTick(kvWaitlist.pop());
  }
});

function onconnect(cb) {
  if (kv || kvErr) {
    cb(kvErr, kv);
  } else {
    connectList.push(cb);
  }
}

module.exports = {
  wait: waitKV,
  onconnect: onconnect
};

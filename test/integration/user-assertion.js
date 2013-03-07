var assert = require('assert');
var config = require('../../lib/config');
var helpers = require('../helpers');

var server = helpers.server;
var makeRequest = helpers.makeRequest.bind(server);

var TEST_AUDIENCE = config.get('audience');
var TEST_EMAIL = 'foo@example.com';
var TEST_UNKNOWN_EMAIL = 'unknown@example.com';
var TEST_ASSERTION;
var TEST_UNKNOWN_ASSERTION;

describe('get user', function() {
  it('can get user email and assertion', function(done) {
    helpers.getUser(TEST_AUDIENCE, function(err, user) {

      TEST_EMAIL = user.email;
      TEST_ASSERTION = user.assertion;

      assert.ok(TEST_EMAIL);
      assert.ok(TEST_ASSERTION);

      done();
    });
  });

  it('can get another user email and assertion', function(done) {
    helpers.getUser(TEST_AUDIENCE, function(err, user) {

      TEST_UNKNOWN_EMAIL = user.email;
      TEST_UNKNOWN_ASSERTION = user.assertion;

      assert.ok(TEST_UNKNOWN_EMAIL);
      assert.ok(TEST_UNKNOWN_ASSERTION);

      done();
    });
  });
});

describe('user', function() {
  var kA, version, deviceId;

  it('should create a new account', function(done) {
    makeRequest('POST', '/user', {
      payload: { assertion: TEST_ASSERTION }
    }, function(res) {
      assert.equal(res.statusCode, 201);
      assert.ok(res.result.kA);
      assert.ok(res.result.deviceId);
      assert.equal(res.result.version, 1);

      kA = res.result.kA;

      done();
    });
  });

  it('should add a new device', function(done) {
    makeRequest('POST', '/device', {
      payload: { assertion: TEST_ASSERTION }
    }, function(res) {
      assert.equal(res.statusCode, 201);
      assert.equal(kA, res.result.kA);
      assert.ok(res.result.deviceId);
      assert.equal(res.result.version, 1);

      deviceId = res.result.deviceId;

      done();
    });
  });

  it('should get user info', function(done) {
    makeRequest('GET', '/user/' + deviceId + '?assertion=' + TEST_ASSERTION
    , function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(kA, res.result.kA);
      assert.equal(res.result.version, 1);

      done();
    });
  });

  it('should get user info without supplying a device ID', function(done) {
    makeRequest('GET', '/user?assertion=' + TEST_ASSERTION
    , function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(kA, res.result.kA);
      assert.equal(res.result.version, 1);

      done();
    });
  });

  it('should bump version', function(done) {
    makeRequest('POST', '/user/bump/' + deviceId, {
      payload: { assertion: TEST_ASSERTION }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.notEqual(kA, res.result.kA);
      assert.equal(res.result.version, 2);

      done();
    });
  });

  it('should 404 on unkown user', function(done) {
    makeRequest('GET', '/user?assertion=' + TEST_UNKNOWN_ASSERTION
    , function(res) {
      assert.equal(res.statusCode, 404);

      done();
    });
  });

});


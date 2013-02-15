var assert = require('assert');
var config = require('../../lib/config');
var helpers = require('../helpers');

var server = helpers.server;
var makeRequest = helpers.makeRequest.bind(server);

var TEST_AUDIENCE = config.get('public_url');
var TEST_EMAIL;
var TEST_ASSERTION;
var TEST_TOKEN = 'foobar';

/*describe('get user', function() {*/
  //it('can get user email and assertion', function(done) {
    //helpers.getUser(TEST_AUDIENCE, function(err, user) {

      //TEST_EMAIL = user.email;
      //TEST_ASSERTION = user.assertion;

      //assert.ok(TEST_EMAIL);
      //assert.ok(TEST_ASSERTION);

      //done();
    //});
  //});
/*});*/

describe('user', function() {
  var kA, version, deviceId;

  it('should create a new account', function(done) {
    makeRequest('PUT', '/user/create', {
      //payload: { assertion: TEST_ASSERTION }
      payload: { email: TEST_EMAIL }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.ok(res.result.kA);
      assert.ok(res.result.deviceId);
      assert.equal(res.result.version, 1);

      kA = res.result.kA;

      done();
    });
  });

  it('should add a new device', function(done) {
    makeRequest('PUT', '/device/create', {
      //payload: { assertion: TEST_ASSERTION }
      payload: { email: TEST_EMAIL }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(kA, res.result.kA);
      assert.ok(res.result.deviceId);
      assert.equal(res.result.version, 1);

      deviceId = res.result.deviceId;

      done();
    });
  });

  it('should get user info', function(done) {
    makeRequest('PUT', '/user/get/' + deviceId, {
      //payload: { assertion: TEST_ASSERTION }
      payload: { email: TEST_EMAIL }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(kA, res.result.kA);
      assert.equal(res.result.version, 1);

      done();
    });
  });

  it('should bump version', function(done) {
    makeRequest('PUT', '/user/bump/' + deviceId, {
      //payload: { assertion: TEST_ASSERTION }
      payload: { email: TEST_EMAIL }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.notEqual(kA, res.result.kA);
      assert.equal(res.result.version, 2);

      done();
    });
  });
});


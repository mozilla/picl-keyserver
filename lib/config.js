/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var convict = require('convict');

const AVAILABLE_BACKENDS = ["memory", "mysql"];


var conf = module.exports = convict({
  env: {
    doc: "The current node.js environment",
    default: "production",
    format: [ "production", "local", "test" ],
    env: 'NODE_ENV'
  },
  enable_email_auth: {
    doc: "When enabled, an email can be sent in place of a full assertion for account operations.",
    default: true,
    env: 'EMAIL_AUTH'
  },
  audience: {
    doc: "The audience we expect incoming assertions to use",
    default: "https://firefox.com"
  },
  persona_url: {
    doc: "Persona service",
    format: "url",
    default: "https://picl.personatest.org",
    env: 'PERSONA_URL'
  },
  public_url: {
    format: "url",
    // the real url is set by awsbox
    default: "http://127.0.0.1:8090"
  },
  verifier_url: {
    doc: "Service used to verify Persona assertions",
    format: "url",
    default: "https://picl.personatest.org/verify",
    env: 'VERIFIER_URL'
  },
  kvstore: {
    backend: {
      format: AVAILABLE_BACKENDS,
      default: "memory",
      env: 'KVSTORE_BACKEND'
    },
    available_backends: {
      doc: "List of available key-value stores",
      default: AVAILABLE_BACKENDS
    }
  },
  mysql: {
    user: {
      default: 'root',
      env: 'MYSQL_USERNAME'
    },
    password: {
      default: '',
      env: 'MYSQL_PASSWORD'
    },
    database: {
      default: 'picl',
      env: 'MYSQL_DATABASE'
    },
    host: {
      default: '127.0.0.1',
      env: 'MYSQL_HOST'
    },
    port: {
      default: '3306',
      env: 'MYSQL_PORT'
    },
    create_schema: {
      default: true,
      env: 'CREATE_MYSQL_SCHEMA'
    },
    max_query_time_ms: {
      doc: "The maximum amount of time we'll allow a query to run before considering the database to be sick",
      default: 5000,
      format: 'duration',
      env: 'MAX_QUERY_TIME_MS'
    },
    max_reconnect_attempts: {
      doc: "The maximum number of times we'll attempt to reconnect to the database before failing all outstanding queries",
      default: 3,
      format: 'nat'
    }
  },
  bind_to: {
    host: {
      doc: "The ip address the server should bind",
      default: '127.0.0.1',
      format: 'ipaddress',
      env: 'IP_ADDRESS'
    },
    port: {
      doc: "The port the server should bind",
      default: 8090,
      format: 'port',
      env: 'PORT'
    }
  }
});

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env.CONFIG_FILES) {
  var files = process.env.CONFIG_FILES.split(',');
  conf.loadFile(files);
}

if (conf.get('env') === 'test') {
  if (conf.get('kvstore.backend') === 'mysql') {
    conf.set('mysql.database', 'test_keyserver');
  }
}

conf.validate();

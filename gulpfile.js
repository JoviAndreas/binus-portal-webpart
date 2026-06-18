'use strict';

// When running inside Docker (DOCKER_ENV=1), gulp serve binds to localhost
// (127.0.0.1) by default - unreachable via Docker's port mapping which arrives
// on eth0. This patch intercepts the TCP listen() call and redirects the bind
// address from 'localhost' to '0.0.0.0' so Docker forwarding works, while
// keeping 'localhost' in the generated manifest URLs (required by SharePoint CSP).
if (process.env.DOCKER_ENV) {
  const net = require('net');
  const _listen = net.Server.prototype.listen;
  net.Server.prototype.listen = function (...args) {
    if (typeof args[1] === 'string' && args[1] === 'localhost') {
      args[1] = '0.0.0.0';
    }
    if (args[0] && typeof args[0] === 'object' && args[0].host === 'localhost') {
      args[0] = { ...args[0], host: '0.0.0.0' };
    }
    return _listen.apply(this, args);
  };
}

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// Suppress eslint warnings from failing the build (eslint plugin version mismatch:
// '@typescript-eslint/ban-types' rule removed upstream). These are warnings, not
// compile errors, but SPFx fails the build when any task writes to stderr.
build.addSuppression(/Warning - lint - /);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};


// Disable async chunk splitting to prevent chunk-load errors during deployment
build.configureWebpack.mergeConfig({
  additionalConfiguration: (config) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: false,
      runtimeChunk: false
    };
    return config;
  }
});

build.initialize(require('gulp'));


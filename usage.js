/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = function readmeDemo(require) {
  var flexiTimeout = require('callback-timeout-flexible'), noNameFunc,
    test = require('./test.js'), foretell = test.logWithTime.expectEntry;

  function greeting(cb) {
    setTimeout(function () { cb(null, 'greeting: Hello world!'); }, 50);
  }
  greeting(flexiTimeout(test.logWithTime, 0.5));
  foretell([ null, 'greeting: Hello world!' ]);

  noNameFunc = function (err) {
    if (err) { return test.logWithTime(err, 'fail @ anon receiver func'); }
    return test.logWithTime(null, 'success @ anon receiver func');
  };

  function dropTheChain(msg, cb) {
    test.logWithTime('dropTheChain: ' + (msg || cb));
  }
  dropTheChain('Not gonna care…', flexiTimeout(test.logWithTime, 0.25));
  foretell(['TimeoutError: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout for logWithTime(logEntry), '
    + 'set up at readmeDemo (/…/usage.js:23:35)]']);

  dropTheChain('… about my callbacks', flexiTimeout(noNameFunc, 0.5));
  foretell(['TimeoutError: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout for function (err), '
    + 'set up at readmeDemo (/…/usage.js:28:40)]',
    'fail @ anon receiver func']);

  function slowTask(cb) {
    test.logWithTime('slowTask: Gonna do lots of work!');
    cb.timeout.renew(2);
    setTimeout(function () {
      test.logWithTime('slowTask: woke up.');
      return cb(null, 'slowTask: Actually I just slept.');
    }, 1000);
  }
  slowTask(flexiTimeout(test.logWithTime, 0.5));
  foretell('slowTask: woke up.');

  function tooOptimistic(cb) {
    test.logWithTime('tooOptimistic: Just wait a sec.');
    cb.timeout.renew(1);
    setTimeout(function () {
      test.logWithTime('tooOptimistic: woke up.');
      return cb(null, 'tooOptimistic: Here you go.');
    }, 1500);
  }
  tooOptimistic(flexiTimeout(test.logWithTime, {
    limitSec: 0.5,
    name: 'nomen est omen',
    onLateCall: test.logWithTime.bind(null, 'too late:'),
  }));
  foretell(['TimeoutError: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout nomen est omen]']);

  foretell([ null, 'slowTask: Actually I just slept.' ]);

  foretell('tooOptimistic: woke up.');
  foretell([ 'too late:', null, 'tooOptimistic: Here you go.' ]);

  process.on('exit', test.logWithTime.verifyProphecies);
};

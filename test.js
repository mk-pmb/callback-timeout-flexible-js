/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function readmeDemo(require) {
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
  foretell(['Error: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout for logWithTime(logEntry), '
    + 'set up at readmeDemo (/…/test.js:23:35)]']);

  dropTheChain('… about my callbacks', flexiTimeout(noNameFunc, 0.5));
  foretell(['Error: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout for function (err), '
    + 'set up at readmeDemo (/…/test.js:28:40)]',
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
  foretell(['Error: Timeout while waiting for callback @ '
    + '[FlexibleCallbackTimeout nomen est omen]']);

  foretell([ null, 'slowTask: Actually I just slept.' ]);

  foretell('tooOptimistic: woke up.');
  foretell([ 'too late:', null, 'tooOptimistic: Here you go.' ]);

  process.on('exit', test.logWithTime.verifyProphecies);
}

var EX = module.exports, flexiTimeout = require('./ctf.js'),
  assert = require('assert'), eq = assert.deepStrictEqual;

EX.shortenStackTracePaths = (function () {
  var rx = /(^|\s|\x28)\/(?:[!-\.0-9=@-\[\]_a-z~]*\/+)+([a-z]+\.js)\b/g;
  return function (trace) { return String(trace).replace(rx, '$1/…/$2'); };
}());

EX.logWithTime = (function () {
  var lwt = function logWithTime(logEntry) {
    var dura = (Date.now() - lwt.since);
    if ((arguments.length === 1) && ((typeof logEntry) === 'string')) {
      if (EX.initMsgs) { EX.initMsgs.push(logEntry); }
    } else {
      logEntry = Array.prototype.slice.call(arguments);
      (function checkError(err) {
        if (!err) { return; }
        err = EX.shortenStackTracePaths(err).split(/( <- |\]$)/);
        if (err.length > 3) {
          err = err.slice(0, -4).concat(err.slice(-2));
        }
        logEntry[0] = err.join('');
      }(logEntry[0]));
    }
    lwt.duras.push(dura);
    dura = '@' + ('0000' + (dura / 1000).toFixed(3)).slice(-6);
    console.log(dura, logEntry);
    lwt.log.push(logEntry);
  };
  lwt.since = Date.now();
  lwt.initMsgs = [];
  lwt.log = [];
  lwt.duras = [];
  lwt.expected = [];
  lwt.expectEntry = lwt.expected.push.bind(lwt.expected);
  lwt.verifyProphecies = function () {
    var expected = lwt.expected;
    expected.forEach(function (entry, idx) {
      try {
        return eq(lwt.log[idx], entry);
      } catch (unequal) {
        console.log('');
        console.log({ actual: lwt.log[idx] });
        unequal.message = 'message log differs: entry #' + idx + ': '
          + unequal.message;
        throw unequal;
      }
    });
    if (expected.length < lwt.log.length) {
      eq('message log differs: additional entries starting at #'
        + expected.length, lwt.log.slice(expected.length));
    }
    console.log('+OK message log equals expectation');
  };
  return lwt;
}());



function demoRequire(n) { return demoRequire[n]; }
demoRequire['./test.js'] = EX;
demoRequire['callback-timeout-flexible'] = flexiTimeout;
demoRequire.assert = assert;
EX.initMsgs = [];
readmeDemo(demoRequire);
EX.logWithTime.expected = EX.initMsgs.concat(EX.logWithTime.expected);
EX.initMsgs = false;

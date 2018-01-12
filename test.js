/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, readmeDemo = require('./usage.js'),
  flexiTimeout = require('./ctf.js'),
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

/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */

module.exports = (function (CF, PT, ctf) {
  'use strict';
  var maxJsTimeoutSec = (Math.pow(2, 31) - 1) / 1e3;
  function ifObj(x, d) { return ((x && typeof x) === 'object' ? x : d); }

  ctf = function callbackTimeoutFlexible(origCb, timeoutSec) {
    var tmo = timeoutSec, cb = origCb, prx;
    if (ifObj(cb)) {
      tmo = cb;
      cb = tmo.cb;
    }
    tmo = new CF(tmo);
    prx = function callbackTimeoutFlexible_proxy() { tmo.called(arguments); };
    prx.timeout = tmo;
    prx.toString = ctf.proxyToString;
    tmo.reportTo = cb;
    if (tmo.name === undefined) {
      tmo.guessName = ctf.guessName.bind(tmo, origCb, (new Error(' ')).stack);
    }
    if (tmo.autostart !== false) { tmo.renew(true); }
    return prx;
  };
  ctf.proxyToString = function () {
    return '[proxyFunc ' + String(this.timeout) + ']';
  };
  ctf.guessName = function (origCb, stack) {
    var descr;
    stack = String(stack || '');
    if (stack) {
      stack = stack.replace(/\s*\n\s*(at\s+|)/g, '\n'
        ).replace(/^\s*(Error:|)\s+/, ''
        ).split(/\nModule\._compile \(module\.js:/)[0
        ].split(/\n/).slice(1).join(' <- ');
    } else {
      stack = 'stack trace not available';
    }
    descr = (String(origCb).split(/\s*\{/)[0
      ].replace(/^function\s+(\w)/, '$1'
      ) || 'anonymous function');
    return ('for ' + descr + ', set up at ' + stack);
  };

  CF = function FlexibleCallbackTimeout(limitSec) {
    if (!(this instanceof CF)) { return new CF(limitSec); }
    if (limitSec && limitSec.limitSec) {
      Object.assign(this, limitSec);
    } else {
      this.limitSec = limitSec;
    }
    this.limitSec = this.maybeParseDuration(this.limitSec);
    if (this.startTime || (this.startTime === 0)) {
      this.finishTime = false;
      if (this.startTime === true) { this.startTime = Date.now(); }
    }
  };
  ctf.Timeout = CF;
  PT = CF.prototype;
  PT.onLateCall = null;
  PT.onBeforeTimeout = null;
  PT.hadLateCalls = false;
  PT.hasTimedOut = false;
  PT.startTime = null;
  PT.finishTime = null;
  PT.parseDuration = null; // secret option for hrtmo-pmb
  PT.unref = false;
  PT.autostart = true;

  PT.toString = function () {
    if ((this.name === undefined) && this.guessName) {
      this.name = this.guessName();
    }
    return '['.concat(this.constructor.name, ' ', this.name, ']');
  };

  PT.errFac = function () {
    var errMsg = String(this.errMsg
      ).replace(/\v\{this\}/g, String(this)
      ).replace(/\v\{name\}/g, this.name);
    return new Error(errMsg);
  };
  PT.errMsg = 'Timeout while waiting for callback @ \v{this}';

  PT.maybeParseDuration = function (dura) {
    if (!this.parseDuration) { return dura; }
    if (typeof dura !== 'string') { return dura; }
    return this.parseDuration(dura);
  };

  PT.renew = function (sec) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (sec === null) { return; }
    if (sec === true) {
      this.limitSec = this.maybeParseDuration(this.limitSec);
      sec = this.limitSec;
    } else {
      sec = this.maybeParseDuration(sec);
    }
    if (Number.isFinite(sec)) {
      if (sec > maxJsTimeoutSec) {
        throw new RangeError('timespan too long for a JS timeout: '
          + String(sec));
      }
      if (sec > 0) {
        this.hasTimedOut = false;
        this.timer = setTimeout(this.timeIsUp.bind(this), sec * 1e3);
        if (this.unref === true) { this.timer.unref(); }
        return true;
      }
    }
    throw new Error('invalid timespan: ' + String(sec));
  };

  PT.abandon = function () { this.renew(null); };

  PT.called = function (args) {
    var tmo = this, onLate = tmo.onLateCall;
    tmo.renew(null);
    if (tmo.hadLateCalls === false) {
      if (this.startTime || (this.startTime === 0)) {
        this.finishTime = Date.now();
      }
      tmo.hadLateCalls = 0;
      setImmediate(function callbackTimeoutFlexible_proxyCalled() {
        tmo.reportTo.apply(null, args);
      });
    } else {
      tmo.hadLateCalls = (+tmo.hadLateCalls || 0) + 1;
      if (onLate) {
        if (onLate === true) { onLate = tmo.reportTo; }
        return onLate.apply(tmo, args);
      }
    }
  };

  PT.timeIsUp = function () {
    var tmo = this;
    tmo.renew(null);
    tmo.hadLateCalls = (tmo.hadLateCalls || 0);
    tmo.hasTimedOut = true;
    if (tmo.onBeforeTimeout) { tmo.onBeforeTimeout(tmo); }
    if (!tmo.hasTimedOut) { return; }
    return tmo.reportTo(tmo.errFac());
  };


















  return ctf;
}());


<!--#echo json="package.json" key="name" underline="=" -->
callback-timeout-flexible
=========================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Start with a short time limit and extend it dynamically.
<!--/#echo -->

Can be used to recover from broken callback chains that stop unexpectedly.
Start with a very short timeout, so you're notified when your function just
forgets to call back. The short limit won't be a problem for functions aware
of it, because they can dynamically extend/renew it.

Additional features:
  * Helps you determine which function timed out.



API
---

This module exports one function:

### callbackTimeoutFlexible(origCb, timeoutSec)

Immediately starts a timeout timer, then returns a timeout-aware
callback (proxy) function `prx`.
When `prx` is called within `timeoutSec` seconds, it schedules
function `origCb` to be called very soon, with the same arguments
that were passed to `prx`. (`this` context is not preserved.)

When the timeout expires before `prx` is invoked, `origCb` will be called
with one argument, an `Error` that describes which timeout has expired.
(Or whatever `opt.errFac` returned, see below.)

There's a timeout control object (TCO) in `prx.timeout`
which allows to extend the timeout (see below).

`timeoutSec` can be a config object instead of a number, with these options:

Mandatory options:

* `limitSec`: Timeout in seconds. Expected to be a positive number.

Optional options:

* `name`: A custom name for this timeout, to be used in or as its description.
* `onLateCall`: What to do when `prx` is called after `origCb` has
  already been notified, either because of a previous `prx` invocation,
  or because the timeout has expired.
  * any `false`-y value: Don't notify. Discard the arguments.
  * `true`: Forward the invocation to `origCb`.
  * any function: Forward the invocation to that function.
* `onBeforeTimeout`: A function to be called (with one argument: the TCO)
  just before `origCb` would be called with a timeout error.
  It's intended as a last-minute opportunity to extend the timeout.
* `startTime`: Set to `true` to request timestamps.
* `errFac`: Factory function to use for producing the timeout errors.
* `errMsg`: Template string for the default error factory's error messages.
  Supports these variable slots:
  * `\v{name}`: `tco.name`
  * `\v{this}`: `String(tco)`



Timeout control objects
-----------------------

### .renew(sec)

* With a positive number as `sec`: Extend the timeout so it triggers
  in `sec` seconds from now.
* `sec === true`: Extend timeout to now + the default timespan,
  which usually is the `timeoutSec` with which `prx` was created.
* `sec === null`: Just discard the timeout timer.


### Info and Stats

Treat these as read-only.

* `.hasTimedOut`: (boolean) Whether the timeout has expired.
* `.hadLateCalls`: `false` = `origCb` has not been notified yet;
  non-negative integer: late call counter.
* `.startTime`: If timestamps were requested, creation time of the TCO.
* `.finishTime`: If timestamps were requested, this starts as `false`,
  until the first call to `prx`, which then stores its current time here.


### Config options

These should be safe to modify after `prx` was created:

* `.limitSec`: __Has no effect__ on currently active timers but
  changes the the default timespan for follow-up `.renew`als.
* `.onLateCall`
* `.errFac`











Usage
-----

see [usage.js](usage.js).


<!--#toc stop="scan" -->


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->

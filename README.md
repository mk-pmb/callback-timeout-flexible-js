
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



Usage
-----
from [test.js](test.js):

<!--#include file="test.js" start="function readmeDemo(require) {" stop="}"
  code="javascript" -->
<!--#verbatim lncnt="63" -->
```javascript
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
```


<!--#toc stop="scan" -->


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->

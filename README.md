# mimock [![Build Status](https://travis-ci.org/mwri/mimock.svg?branch=master)](https://travis-ci.org/mwri/mimock) [![Coverage Status](https://coveralls.io/repos/github/mwri/mimock/badge.svg?branch=master)](https://coveralls.io/github/mwri/mimock?branch=master)

Mimock (mini mock) is a small simple mocking library with a low learning curve.

1. [Use guide](#use-guide).
   1. [Import](#import).
   2. [Creating a complete new object type](#creating-a-complete-new-object-type).
   3. [Object instrumentation](#object-instrumentation).
   4. [Object method wrapping](#object-method-wrapping).
      1. [Method stubbing wrappers](#method-stubbing-wrappers).
      2. [Method pass through wrappers](#method-pass-through-wrappers).
   5. [Layered wrappers](#layered-wrappers).
   6. [Wrapping a function](#wrapping-a-function).
   7. [Wrapping a module](#wrapping-a-module).
      1. [Modules exporting a function](#modules-exporting-a-function).
      2. [Modules exporting an object](#modules-exporting-an-object).
   8. [Module wrapping behaviours](#module-wrapping-behaviours).
2. [NodeJS and browser usage](#nodejs-and-browser-usage).
3. [Build](#build).

## Use guide

Test scenarios are illustrated with mocha/karma `it` and jasmine/chai
style `expect` assertions.

### Import

Import the `mockset` constructor as follows:

```javascript
let mimock  = require('mimock');
let mockset = mimock.mockset;
```

The `mockset` constructor creates objects which are essentially a set of mocks.
When mocking behaviour is introduced, it is done via the mock set object, and
this makes it easy to undo.

### Creating a complete new object type

```javascript
let mocks = new mockset();

let play_object = mockset.object_type({
    con: function (params) {
        this.foo_val = params.foo;
        this.bar_val = params.bar;
    },
    methods: {
        foo: function (new_val) {
            let orig_val = this.foo_val;
            if ('0' in arguments)
                this.foo_val = new_val;
            return orig_val;
        },
        bar: function (new_val) {
            let orig_val = this.bar_val;
            if ('0' in arguments)
                this.bar_val = new_val;
            return orig_val;
        },
    },
});
```

Now, objects of this type may be created as usual:

```javascript
let ball = new play_object({
    colour: 'blue',
    foo:    'round',
    bar:    'bouncy',
    });

let ball_foo     = ball.foo();
let old_ball_bar = ball.bar('fun');
let ball_bar     = ball.bar();
```

Constructor and methods are optional.

original state just by calling `restore()` on it.

### Object instrumentation

You can instrument an object method like this (`o` can be used instead
of `object and `m` instead of `method`):

```javascript
let mocks = new mockset();
let some_object = get_some_object();
let some_method = mocks.object(some_object).method('some_method');
```

That changes the `some_method` call on `some_object` so that calls to
the target method are 'observed' from then on.

The number of times the method has been called (after observation start)
is then available by calling `some_method.call_count()`. The calls themselves
can be accessed by calling `some_method.calls()`, which returns an array of
objects (sorted be 'called'), each object having the following keys:

Key       | Description
:--       | :--
called    | A Date object; when the call was made
returned  | A Date object; when the call returned
args      | An array comprising the arguments the caller passed
retval    | The return value, included unless it threw an exception
exception | An exception value, if it threw an exception

A call counting test can be done using a [wrap](#object-wrapping), like
this test that checks a method on an object is called twice:

```javascript
it('is called twice', function () {
    let mocks = new mockset();
    let call_count = 0;
    mocks.object(some_object).method('some_method').wrap(function () {
        call_count++;
    });
    do_the_thing();
    expect(call_count).toBe(2);
    mocks.restore();
});
```

Instrumention allows you to do it like this however:

```javascript
it('is called twice', function () {
    let mocks = new mockset();
    let some_method = mocks.object(some_object).method('some_method');
    do_the_thing();
    expect(some_method.call_count()).toBe(2);
    mocks.restore();
});
```

Instrumentation can be cancelled either by calling `some_method.restore()`, or
`mocks.restore()` will cancel all wrappers, and anything else, done with
`mocks`.

### Object method wrapping

A wrapper is a function that is called instead of an objects usual method. The
wrapper can effectively stub the call by returning some value of its choosing
to the caller, or invoke the original method (with or without modified
arguments, and optionally modifying the return value), or it could throw
an exception. Because the wrapper is invoked instead of the original method
it can really do anything it wants.

The objects original method is referred to below as the **target** method.

#### Method stubbing wrappers

This is the simplest possible type of wrapper; here this target method is
replaced with this function that always just returns `30` (`w` can be used
instead of `wrap`):

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method');
let wrap = some_method.wrap(function () {
    return 30;
});

mocks.restore();
```

#### Method pass through wrappers

The wrapper is passed an argument (`helper` in the examples
below), providing access to various things, including the original/target
function. A helper method called `continue` causes the target function
to be called (with whatever arguments were passed by the caller).
The return value is whatever is returned by the original/target. A
completely benign wrapper could be applied like this therefore:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method');
some_method.wrap(function (helper) {
    return helper.continue();
});

mocks.restore();
```

The arguments, conspicuously missing above, are accessible as an
array, `helper.args`, and modifying this array causes different
arguments to be passed on to the target method when `continue` is
called.

So, to cause the target method to be invoked with the first argument multipled
by ten, you could do this:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method');
some_method.wrap(function (helper) {
    helper.args[0] *= 10;
    return helper.continue();
});

mocks.restore();
```

Or you could throw an exception if the second argument is equal "dog":

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method');
some_method.wrap(function (helper) {
    if (helper.args[0] === 'dog')
        throw new Error('dogs not allowed');
    return helper.continue();
});

mocks.restore();
```

Modifying the return value is probably fairly obvious, here the return value
is multipled by five:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method');
let wrap = some_method.wrap(function (helper) {
    return helper.continue() * 5;
});

mocks.restore();
```

The wrapper can be cancelled. Calling `mocks.restore()` will cancel
everything created with the `mocks` object, `some_method.unwrap(function)`
or `wrap.restore()` will remove just that wrapper function, leaving
any other wraps and instrumentation operable, or `some_method.restore()`
will return that method to original service (all wrappers removed and
no instrumentation).

### Layered wrappers

What if you wrap a method already wrapped?

The answer is, it's wrapped again. The new wrapper is called first (think of it
a present you're wrapping in layers of wrapping paper, the latest layer goes on
top) then the previously set wrapper, then the real function (assuming both
wrappers call `helper.continue()` of course). If the first (to be called)
wrapper modifies the arguments, the second gets the modifications and sees
nothing of the originals. If the first returns (as a stub), or throws an
exception, the second wrapper will never see the light of day.

### Wrapping a function

A function, not on an object, can't be usefully changed as such, if something
already has a reference to it there's not much you can do, but it can be
substituted:

```javascript
let mocks = new mockset();

let orig_fun = get_callback();
let some_fun_mock = mocks.fun(orig_fun)
```

Calling `replacement()` will provide a replacement function which passes
control to the original after instrumentation:

```javascript
let new_fun = some_fun_mock.replacement();
let fun_wrap = some_fun_mock.wrap(function (helper) {
    return helper.continue();
});
new_fun();
expect(some_fun_mock.call_count()).toBe(1);

mocks.restore();
```

The call history (when, args, return value, etc) is also available by
calling `calls()`.

Instrumentation and all wraps are cancelled by calling
`some_fun_mock.restore()`, that one wrap can be removed with
`some_fun_mock.unwrap(function)` or `fun_wrap.restore()`, or everything
done with `mocks` can be cancelled with `mocks.restore()`.

### Wrapping a module

This functionality works for NodeJS but is not available in the browser.

If you want to wrap a function on an object that another function creates
that's a bit of a problem, because you never get your hands on the object
to instrument or wrapper it. You can solve this (probably) by wrapping the
whole module/library (these examples use real existing modules `testob`
(a test object module) and `polylock` (a multiple concurrent resource lock
module)):

```javascript
let mocks = new mockset();

let testob_lib = mocks.library('testob');
```

Once you've done this, first the library is instrumented, so you can check
how many times it has been required:

```javascript
let testob = require('testob');
expect(testob_lib.require_count()).toBe(1);

mocks.restore();
```

Bits of the module can now be wrapped. Modules can be anything of
course, some export a function, and others export an object, often with
functions in/on it, though it is perfectly possible for a module to export
a number or string too. You must tell mimock which elements of a module's
exports you want to mock.

#### Modules exporting a function

If the module exports a function (such as `polylock` or `PouchDB`) do
this (note `l` can be used instead of `library`):

```javascript
let mocks = new mockset();

let polylock_lib = mocks.library('polylock');
let root_export = polylock_lib.export();
```

The 'root' export, polylock's constructor, is now instrumented, and
you can wrap it just like functions or object methods:

```javascript
let polylock = require('polylock');

let locks = new polylock();
expect(root_export.call_count()).toBe(1);
root_export.wrap(function (helper) {
    return helper.continue();
});
```

Now if you want to wrap methods on the objects constructed you
can (here the `test_locks` methods on all new objects is wrapped):

```javascript
let polylock = require('polylock');

let test_locks_method;
root_export.wrap(function (helper) {
    let new_obj = helper.continue();
	test_locks_method = mocks.o(new_obj).m('test_locks');
    test_locks_method.w(function (helper) {
        throw new Error('gotcha');
	});
	return new_obj
});

let locks = new polylock();
expect(typeof test_locks_method).not.toBe('undefined');
expect(test_locks_method.call_count()).toBe(0);
try {
    let retval = locks.test_locks({});
    console.log('Return value: '+retval);
} catch (err) {
    console.log('Exception: '+err);
}
expect(test_locks_method.call_count()).toBe(1);

mocks.restore();
```

#### Modules exporting an object

If the module exports an object (such as `testob`) do this:

```javascript
let mocks = new mockset();

let testob_lib = mocks.library('testob');
let basic_export = testob_lib.export('basic');
```

The 'basic' export, references the 'basic' element from the testob
module exports. It is now (as of the above) instrumented, and
you can wrap it:

```javascript
let testob = require('testob');
let testob_basic = testob.basic;

let basic_object = new testob_basic();
expect(basic_export.call_count()).toBe(1);
basic_export.wrap(function (helper) {
    return helper.continue();
});
```

Wrapping methods on the objects constructed is the same as above, for 
modules exporting a function.

### Module wrapping behaviours

Any module required before a call to `(new mockset()).library(name)` is
entirely free from any Mimock influence.

Any module required after a call to `(new mockset()).library(name)` will
be affected.

Where a module exports a function, the function is replaced (and
instrumented) even if you don't ask for this. The reason this is done is
to ensure consistent behaviour as compared with modules that expport an
object... generally the principals of engineering here are that the order
things are done in should have as little impact as possible (i.e. A then
B yields the same result as B then A), and that performing an operation
on X should have the same (context allowing) impact as the same operation
on Y...

...thus where a module exports an object with functions on/in, those
functions can be changed later, substituted within the object, but where
a module exports a function, this can't be done... so the function is
wrapped regardless so that later a call to `lib.e(undefined)` will work
as well as `lib.e('name_of_function')`.

## NodeJS and browser usage

The module wrapping functionality is not available in the browser but all
other features are compatible.

## Build

run `npm install` to install the dev/build dependencies, and
`grunt build` to build.

This will build `dist/mimock.js` and run the unit tests in a webpack bundle
using Chrome, and again via mocha.

Running `grunt watch_dev` will invoke the most light weight possible file
watch lint build and test cycle (using mocha). Running `grunt watch_full`
will watch for file changes and do a full build including coverage reports.

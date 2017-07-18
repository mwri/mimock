# mimock [![Build Status](https://travis-ci.org/mwri/mimock.svg?branch=master)](https://travis-ci.org/mwri/mimock) [![Coverage Status](https://coveralls.io/repos/github/mwri/mimock/badge.svg?branch=master)](https://coveralls.io/github/mwri/mimock?branch=master)

Mimock is a small mocking library. No doubt some will say it should be called
'yamock' but 'mimock' stands for 'mini mock' and this hints at its philosophy.

Mimock aims for a very low learning curve by introducing few and simple
features, but making them powerful and flexible enough that a little glue
lets them do anything you need. There's no prejudice against extras; more
advanced finessing, but the idea is that anything you want can be done with
very little knowledge, and the extras just mean you might be able to do the
same thing a little more elegantly, or tersely.

1. [Quick start guide](#quick-start-guide).
   1. [Mocking object types](#mocking-object-types).
   2. [Object instrumentation](#object-instrumentation).
   3. [Object wrapping](#object-wrapping).
      1. [Method stubbing wrappers](#method-stubbing-wrappers).
      2. [Method pass through wrappers](#method-pass-through-wrappers).
      3. [Layered wrappers](#layered-wrappers).
2. [NodeJS and browser usage](#nodejs-and-browser-usage).
3. [Dist files](#dist-files).
4. [Build](#build).

## Quick start guide

This is a quick overview of how to do everything, all examples are implicitly
preceeded somewhere by the following if you are using NodeJS:

```javascript
let mimock  = require('mimock');
let mockset = mimock.mockset;
```

A 'mockset' is a set list of mocks, or a mocking state. Using a 'mockset'
object means that when you are ready you can restore everything to its
original state just by calling `restore()` on it.

Test scenarios are illustrated with mocha/karma `it` and jasmine/chai
style `expect` assertions.

### Mocking object types

To create a new object type on the fly (instances of which may then be
instantiated), use `mocker.object_type`.

Here's an example with a simple constructor and a couple of getter setter
methods called foo and bar:

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

Object types can be created by omitting either or both of the
constructor or methods, so the minimum type and object instantiations are:

```javascript
let useless_object_type = mocker.object_type();
let useless_object      = new useless_object_type();
```
## Object instrumentation

You can instrument an object method like this:

```javascript
let mocks = new mockset();
let some_method = mocks.object(some_object).method('some_method');
```

That changes the `some_method` call on `some_object` so that calls to
the target method are 'observed' from then on.

The number of times the method has been called (after observation start)
is then available by calling `some_method.call_count()`. The calls themselves
can be accessed by calling `some_method.calls()`, which retuens an array of
objects, each object having the following keys:

Key      | Description
:--      | :--
called   | A Date object; when the call was made
returned | A Date object; when the call returned
args     | An array comprising the arguments the caller passed
retval   | The return value

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

## Object wrapping

A wrapper is a function that is called instead of an objects usual method. The
wrapper can effectively stub the call by returning some value of its choosing
to the caller, or invoke the original method (with or without modified
arguments, and optionally modifying the return value), or it could throw
an exception. Because the wrapper is invoked instead of the original method
it can really do anything it wants.

The objects original method is referred to below as the **target** method.

### Method stubbing wrappers

This is the simplest possible type of wrapper; here this target method is
replaced with this function that always just returns `30`:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method').wrap(function () {
    return 30;
});

mocks.restore();
```

### Method pass through wrappers

An object is passed to the wrapper as an argument, called `helper` in
the examples below, providing access to various things, including the
original/target function. A method called 'continue' causes the target
function to be called (with whatever arguments were passed by the caller).
The return value is whatever is returned by the original/target. A
completely benign wrapper could be applied like this therefore:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
    return helper.continue();
});

mocks.restore();
```

The arguments, conspicuously missing above, are accessible as an
array, `helper.args`, and modifying this array causes different
arguments to be passed on to the target method when 'continue' is
called.

So, to cause the target method to be invoked with the first argument multipled
by ten, you could do this:

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
    helper.args[0] *= 10;
    return helper.continue();
});

mocks.restore();
```

Or you could throw an exception if the second argument is equal "dog":

```javascript
let mocks = new mockset();

let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
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

let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
    return helper.continue() * 5;
});

mocks.restore();
```

The wrapper can be cancelled, restoring the target function to normal
service, either by calling `some_method.restore()`, or `mocks.restore()`
will cancel all wrappers, and anything else, done with `mocks`.

### Layered wrappers

What if you wrap a method already wrapped?

The answer is, it's wrapped again. The new wrapper is called first (think of it
a present you're wrapping in layers of wrapping paper, the latest layer is
first) then the previously set wrapper, then the real function (assuming both
wrappers call `helper.continue()` of course). If the first (to be called)
wrapper modifies the arguments, the second gets the modifications and sees
nothing of the originals. If the first returns (as a stub), or throws an
exception, the second wrapper will never see the light of day.

## NodeJS and browser usage

Mimock works in node, just require it and access the `mocker` and `mockset`
elements:

```javascript
let mimock  = require('mimock');

let mocker  = mimock.mocker;
let mockset = mimock.mockset;
```

Mimock works in client side in at least most browsers as well, either
incorporate it with webpack or similar, or just load it, something like
this:

```html
<script src="lib/minimock/dist/minimock.js"></script>
```
Both `mocker` and `mockset` will be imported (added to window).

## Dist files

The `dist` folder has the following files available:

File | Description
:-- | :--
mimock.js | Limited ES6 features (works with Node.js v4+ and most browsers)
mimock_es5.js | ES5 translation (should work with anything)
mimock_es5.min.js | Minified ES5 translation

## Build

run `npm install` to install the dev/build dependencies, and
`grunt build` to build.

This will create ES5 `dist/mimock.js` and `dist/mimock.min.js`
files, and run the unit tests against them.

Running `grunt watch_dev` will invoke an ES6 NodeJS only continuous
file watch build test cycle, and generate coverage reports. Running
`grunt watch_full` will watch for file changes and do a full build.

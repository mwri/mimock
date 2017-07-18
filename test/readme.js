(function () {


"use strict";


let mockset;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	let mimock  = require('./../dist/mimock.js');
	mockset = mimock.mockset;
	require('chai-jasmine');
} else {
	mockset = window.mockset;
}

describe('readme', function () {

	let play_object;

	it('new object type instantiation', function () {

		let mocks = new mockset();

		play_object = mocks.object_type({
			cons: function (params) {
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

	});

	it('new object type object instantiation', function () {

		let ball = new play_object({
			colour: 'blue',
			foo:    'round',
			bar:    'bouncy',
			});

		let ball_foo     = ball.foo();
		let old_ball_bar = ball.bar('fun');
		let ball_bar     = ball.bar();

		expect(ball_foo).toBe('round');
		expect(old_ball_bar).toBe('bouncy');
		expect(ball_bar).toBe('fun');

	});

	it('mimimal new object type and object instantiation', function () {

		let mocks = new mockset();

		let useless_object_type = mocks.object_type();
		let useless_object      = new useless_object_type();

	});

	let some_object_type;
	let some_object;

	it('some object type and some object instantiation', function () {

		let mocks = new mockset();

		some_object_type = mocks.object_type({
			cons: function (params) {
			},
			methods: {
				some_method: function (arg) {
					return arg;
				},
			},
		});

		some_object = new some_object_type();

	});

	it('instrumentation', function () {

		let mocks = new mockset();
		let some_method = mocks.object(some_object).method('some_method');

	});

	it('is called twice (using wrap)', function () {

		let mocks = new mockset();
		let call_count = 0;
		mocks.object(some_object).method('some_method').wrap(function () {
			call_count++;
		});

		function do_the_thing () {
			some_object.some_method();
			some_object.some_method();
		}

		do_the_thing();
		expect(call_count).toBe(2);
		mocks.restore();

	});

	it('is called twice (using instrumentation)', function () {

		let mocks = new mockset();
		let some_method = mocks.object(some_object).method('some_method');

		function do_the_thing () {
			some_object.some_method();
			some_object.some_method();
		}

		do_the_thing();
		expect(some_method.call_count()).toBe(2);
		mocks.restore();

	});

	it('stubbing wrap', function () {

		let mocks = new mockset();

		let some_method = mocks.object(some_object).method('some_method').wrap(function () {
			return 30;
		});

		expect(some_object.some_method()).toBe(30);

		mocks.restore();

	});

	it('pass through wrap', function () {

		let mocks = new mockset();

		let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
			return helper.continue();
		});

		expect(some_object.some_method(15)).toBe(15);

		mocks.restore();

	});

	it('pass through wrap (x10)', function () {

		let mocks = new mockset();

		let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
			helper.args[0] *= 10;
			return helper.continue();
		});

		expect(some_object.some_method(15)).toBe(150);

		mocks.restore();

	});

	it('pass through wrap (dogs not allowed)', function () {

		let mocks = new mockset();

		let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
			if (helper.args[0] === 'dog')
				throw new Error('dogs not allowed');
			return helper.continue();
		});

		expect(some_object.some_method('cat')).toBe('cat');

		let retval;
		let err;
		try {
			retval = some_object.some_method('dog');
		} catch (caught) {
			err = caught;
		}
		expect(retval).toBe(undefined);
		expect(/dogs not allowed/.exec(err)).toBeTruthy();

		mocks.restore();

	});

	it('pass through wrap (return value changed)', function () {

		let mocks = new mockset();

		let some_method = mocks.object(some_object).method('some_method').wrap(function (helper) {
			return helper.continue() * 5;
		});

		expect(some_object.some_method(15)).toBe(75);

		mocks.restore();

	});

});


})();

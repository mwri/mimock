(function () {


"use strict";


let mimock  = require('./../dist/mimock.js');
let mockset = mimock.mockset;

if (typeof window === 'undefined')
	require('chai-jasmine');


describe('function', function () {

	it('instantiation with function', function () {
		let mocks = new mockset();
		let test_fun1 = function (a) { return a * 2; };
		let mm_fun = mocks.fun(test_fun1);
		mocks.restore();
	});

	it('instantiation with non name fails', function (done) {
		let mocks = new mockset();
		try {
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun = mocks.fun(5);
			throw new Error('exception should have been thrown');
		} catch (err) {
			if (/not a function/.exec(err))
				done();
			else
				throw err;
		}
		mocks.restore();
	});

	it('is per function/reference', function () {
		let mocks = new mockset();
		let test_fun1 = function (a) { return a * 2; };
		let test_fun2 = function (a) { return a * 3; };
		let mm_fun1 = mocks.f(test_fun1);
		let mm_fun2 = mocks.f(test_fun1);
		let mm_fun3 = mocks.f(test_fun2);
		expect(mm_fun1).toBe(mm_fun2);
		expect(mm_fun1).not.toBe(mm_fun3);
	});

	describe('instrumentation', function () {

		it('call count works', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			expect(mm_fun1.call_count()).toBe(0);
			replacement_fun1(1);
			expect(mm_fun1.call_count()).toBe(1);
			replacement_fun1(1);
			replacement_fun1(1);
			expect(mm_fun1.call_count()).toBe(3);
			mocks.restore();
		});

		it('call history works', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			expect(mm_fun1.calls().length).toBe(0);
			let caller_called = new Date();
			replacement_fun1(2);
			let calls = mm_fun1.calls();
			expect(calls.length).toBe(1);
			expect(calls[0].called.constructor).toBe(Date);
			expect(calls[0].returned.constructor).toBe(Date);
			expect(calls[0].called.getTime()-caller_called.getTime() >= 0).toBe(true);
			expect(calls[0].called.getTime()-caller_called.getTime() <= 100).toBe(true);
			expect(calls[0].returned.getTime()-calls[0].called.getTime() >= 0).toBe(true);
			expect(calls[0].returned.getTime()-calls[0].called.getTime() <= 100).toBe(true);
			expect(calls[0].args).toEqual([2]);
			expect(calls[0].retval).toBe(4);
			caller_called = new Date();
			replacement_fun1(4, 1);
			expect(mm_fun1.calls().length).toBe(2);
			calls = mm_fun1.calls();
			expect(calls.length).toBe(2);
			expect(calls[1].called.constructor).toBe(Date);
			expect(calls[1].returned.constructor).toBe(Date);
			expect(calls[1].called.getTime()-caller_called.getTime() >= 0).toBe(true);
			expect(calls[1].called.getTime()-caller_called.getTime() <= 100).toBe(true);
			expect(calls[1].returned.getTime()-calls[1].called.getTime() >= 0).toBe(true);
			expect(calls[1].returned.getTime()-calls[1].called.getTime() <= 100).toBe(true);
			expect(calls[1].args).toEqual([4, 1]);
			expect(calls[1].retval).toBe(8);
			mocks.restore();
		});

		it('args and retval unaffected', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			expect(replacement_fun1(5)).toBe(10);
			expect(replacement_fun1(11)).toBe(22);
			mocks.restore();
		});

		it('stops after fun restore', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			expect(mm_fun1.call_count()).toBe(0);
			replacement_fun1(0);
			expect(mm_fun1.call_count()).toBe(1);
			mm_fun1.restore();
			replacement_fun1(0);
			expect(mm_fun1.call_count()).toBe(1);
			mocks.restore();
		});

		it('stops after set restore', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			expect(mm_fun1.call_count()).toBe(0);
			replacement_fun1(0);
			expect(mm_fun1.call_count()).toBe(1);
			mocks.restore();
			replacement_fun1(0);
			expect(mm_fun1.call_count()).toBe(1);
		});

	});

	describe('wrap', function () {

		it('is called', function (done) {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			mm_fun1.wrap(function () {
				done();
			});
			replacement_fun1(0);
			mocks.restore();
		});

		it('stub masks real', function (done) {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			mm_fun1.wrap(function () {
				done();
				return 10;
			});
			expect(replacement_fun1(20)).toBe(10);
			mocks.restore();
		});

		it('exception is propogated', function (done) {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			mm_fun1.wrap(function () {
				throw new Error('spidoodle');
			});
			try {
				replacement_fun1(3);
			} catch (err) {
				if (/spidoodle/.exec(err))
					done();
				else
					throw err;
			}
			mocks.restore();
		});

		it('stops after unwrap', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			let wrap_seen = 0;
			let wrap_fun = function () {
				wrap_seen++;
			};
			mm_fun1.wrap(wrap_fun);
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			expect(mm_fun1.unwrap(wrap_fun)).toBe(1);
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mocks.restore();
		});

		it('alien function unwrap ignored', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			let wrap_seen = 0;
			let wrap_fun = function () {
				wrap_seen++;
			};
			mm_fun1.wrap(wrap_fun);
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			expect(mm_fun1.unwrap(function non_wrap () {})).toBe(0);
			replacement_fun1(0);
			expect(wrap_seen).toBe(2);
			mocks.restore();
		});

		it('stops after wrap restore', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			let wrap_seen = 0;
			let mm_restorable = mm_fun1.wrap(function () {
				wrap_seen++;
			});
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mm_restorable.restore();
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mocks.restore();
		});

		it('stops after fun restore', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			let wrap_seen = 0;
			let mm_restorable = mm_fun1.wrap(function () {
				wrap_seen++;
			});
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mm_fun1.restore();
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mocks.restore();
		});

		it('stops after set restore', function () {
			let mocks = new mockset();
			let test_fun1 = function (a) { return a * 2; };
			let mm_fun1 = mocks.f(test_fun1);
			let replacement_fun1 = mm_fun1.replacement();
			let wrap_seen = 0;
			let mm_restorable = mm_fun1.wrap(function () {
				wrap_seen++;
			});
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
			mocks.restore();
			replacement_fun1(0);
			expect(wrap_seen).toBe(1);
		});

		it('throws error after restored', function () {
			let mocks = new mockset();
			let fun = function (a) { return a * 2; };
			let mm_fun = mocks.f(fun);
			mm_fun.wrap(function (helper) { return helper.continue(); });
			mm_fun.restore();
			try {
				mm_fun.wrap(function (helper) { return helper.continue(); });
				throw new Error('should have thrown exception');
			} catch (err) {
				if (!/function is restored/.exec(err))
					throw err;
			}	   
		}); 

	});

});


})();

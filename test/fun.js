(function () {


"use strict";


let mockset;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	let mimock  = require('./../dist/mimock.js');
	mockset = mimock.mockset;
	require('chai-jasmine');
} else {
	mockset = window.mimock.mockset;
}


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

		it('stops after mocks restore', function () {
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

	});

});


})();

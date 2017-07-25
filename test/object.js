(function () {


"use strict";


let mimock  = require('./../dist/mimock.js');
let mockset = mimock.mockset;

if (typeof window === 'undefined')
	require('chai-jasmine');


let state_obj = (function () {
	let state_obj = function (params) {
		if (typeof params === 'undefined')
			params = {};
		let param_keys = Object.keys(params);
		for (let i = 0; i < param_keys.length; i++)
			this[param_keys[i]] = params[param_keys[i]];
	};
	state_obj.prototype.update = function (params) {
		if (typeof params === 'undefined')
			params = {};
		let change_count = 0;
		let param_keys = Object.keys(params);
		for (let i = 0; i < param_keys.length; i++) {
			if (this[param_keys[i]] !== params[param_keys[i]])
				change_count++;
			this[param_keys[i]] = params[param_keys[i]];
		}
		return change_count;
	};
	state_obj.prototype.get = function (name) {
		if (typeof name === 'undefined')
			throw new Error('incorrect usage, must specify name of attribute');
		return this[name];
	};
	state_obj.prototype.passthrough = function (val) {
		return val;
	};
	return state_obj;
}) ();


describe('object', function () {

	describe('instantiation', function () {

		it('with object works', function () {
			let mocks = new mockset();
			let test_state_obj = new state_obj({
				foo: function () {},
				});
			let mm_obj = mocks.object(test_state_obj);
			mocks.restore();
		});

		it('with non object fails', function (done) {
			let mocks = new mockset();
			try {
				let mock_obj = mocks.object(100);
				throw new Error('exception should have been thrown');
			} catch (err) {
				if (/not an object/.exec(err))
					done();
				else
					throw err;
			}
			mocks.restore();
		});

		it('is per object', function () {
			let mocks = new mockset();
			let test_state_obj_a = new state_obj({
				foo: function () {},
				});
			let test_state_obj_b = new state_obj({
				foo: function () {},
				});
			let mm_obj1 = mocks.object(test_state_obj_a);
			let mm_obj2 = mocks.object(test_state_obj_a);
			let mm_obj3 = mocks.object(test_state_obj_b);
			expect(mm_obj1).toBe(mm_obj2);
			expect(mm_obj1).not.toBe(mm_obj3);
			mocks.restore();
		});

	});

	describe('method', function () {

		describe('instantiation', function () {

			it('with method name', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({
					foo: function () {},
					});
				let mm_obj = mocks.object(test_state_obj);
				let mm_method = mm_obj.method('foo');
				mocks.restore();
			});

			it('with non name fails', function (done) {
				let mocks = new mockset();
				try {
					let test_state_obj = new state_obj({
						foo: function () {},
						});
					let mm_obj = mocks.object(test_state_obj);
					let mm_method = mm_obj.method(100);
					throw new Error('exception should have been thrown');
				} catch (err) {
					if (/not a function/.exec(err))
						done();
					else
						throw err;
				}
				mocks.restore();
			});

			it('with non method name fails', function (done) {
				let mocks = new mockset();
				try {
					let test_state_obj = new state_obj({
						foo: function () {},
						});
					let mm_obj = mocks.object(test_state_obj);
					let mm_method = mm_obj.method('bar');
					throw new Error('exception should have been thrown');
				} catch (err) {
					if (/not a function/.exec(err))
						done();
					else
						throw err;
				}
				mocks.restore();
			});

			it('is per name', function () {
				let mocks = new mockset();
				let test_state_obj_a = new state_obj({
					foo: function () {},
					bar: function () {},
					});
				let mm_obj_method1 = mocks.o(test_state_obj_a).m('foo');
				let mm_obj_method2 = mocks.o(test_state_obj_a).m('foo');
				let mm_obj_method3 = mocks.o(test_state_obj_a).m('bar');
				expect(mm_obj_method1).toBe(mm_obj_method2);
				expect(mm_obj_method1).not.toBe(mm_obj_method3);
			});

		});

		describe('instrumentation', function () {

			it('call count works', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				expect(mm_method.call_count()).toBe(0);
				test_state_obj.update({aa:'a3'});
				expect(mm_method.call_count()).toBe(1);
				test_state_obj.update({aa:'a4'});
				test_state_obj.update({aa:'a5'});
				expect(mm_method.call_count()).toBe(3);
				mocks.restore();
			});

			it('call history works', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				expect(mm_method.calls().length).toBe(0);
				let caller_called = new Date();
				test_state_obj.update({aa:'a3'});
				let calls = mm_method.calls();
				expect(calls.length).toBe(1);
				expect(calls[0].called.constructor).toBe(Date);
				expect(calls[0].returned.constructor).toBe(Date);
				expect(calls[0].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[0].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() >= 0).toBe(true);
				expect(calls[0].returned.getTime()-calls[0].called.getTime() <= 100).toBe(true);
				expect(calls[0].args).toEqual([{aa:'a3'}]);
				expect(calls[0].retval).toBe(1);
				caller_called = new Date();
				test_state_obj.update({aa:'a4'});
				expect(mm_method.calls().length).toBe(2);
				calls = mm_method.calls();
				expect(calls.length).toBe(2);
				expect(calls[1].called.constructor).toBe(Date);
				expect(calls[1].returned.constructor).toBe(Date);
				expect(calls[1].called.getTime()-caller_called.getTime() >= 0).toBe(true);
				expect(calls[1].called.getTime()-caller_called.getTime() <= 100).toBe(true);
				expect(calls[1].returned.getTime()-calls[1].called.getTime() >= 0).toBe(true);
				expect(calls[1].returned.getTime()-calls[1].called.getTime() <= 100).toBe(true);
				expect(calls[1].args).toEqual([{aa:'a4'}]);
				expect(calls[1].retval).toBe(1);
				mocks.restore();
			});

			it('args and retval unaffected', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				expect(test_state_obj.aa).toBe('a1');
				expect(test_state_obj.update({aa:'a3'})).toBe(1);
				expect(test_state_obj.aa).toBe('a3');
				expect(test_state_obj.update({aa:'a3'})).toBe(0);
				expect(test_state_obj.aa).toBe('a3');
				expect(test_state_obj.update({aa:'a4',ab:'a6'})).toBe(2);
				expect(test_state_obj.aa).toBe('a4');
				expect(test_state_obj.ab).toBe('a6');
				mocks.restore();
			});

			it('stops after method restore', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				expect(mm_method.call_count()).toBe(0);
				test_state_obj.update({aa:'a3'});
				expect(mm_method.call_count()).toBe(1);
				mm_method.restore();
				test_state_obj.update({aa:'a4'});
				expect(mm_method.call_count()).toBe(1);
				mocks.restore();
			});

			it('stops after object restore', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_obj = mocks.o(test_state_obj);
				let mm_method = mm_obj.m('update');
				expect(mm_method.call_count()).toBe(0);
				test_state_obj.update({aa:'a3'});
				expect(mm_method.call_count()).toBe(1);
				mm_obj.restore();
				test_state_obj.update({aa:'a4'});
				expect(mm_method.call_count()).toBe(1);
			});

			it('stops after set restore', function () {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				expect(mm_method.call_count()).toBe(0);
				test_state_obj.update({aa:'a3'});
				expect(mm_method.call_count()).toBe(1);
				mocks.restore();
				test_state_obj.update({aa:'a4'});
				expect(mm_method.call_count()).toBe(1);
			});

		});

		describe('wrap', function () {

			it('is called', function (done) {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				mm_method.wrap(function () {
					done();
				});
				test_state_obj.update({aa:'a3'});
				mocks.restore();
			});

			it('stub masks real', function (done) {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				mm_method.wrap(function () {
					done();
					return 10;
				});
				expect(test_state_obj.update({aa:'a3'})).toBe(10);
				expect(test_state_obj.aa).toBe('a1');
				mocks.restore();
			});

			it('exception is propogated', function (done) {
				let mocks = new mockset();
				let test_state_obj = new state_obj({aa:'a1',ab:'a2'});
				let mm_method = mocks.o(test_state_obj).m('update');
				mm_method.wrap(function () {
					throw new Error('spidoodle');
				});
				try {
					test_state_obj.update({aa:'a3'});
					throw new Error('exception should have been thrown');
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

});


})();

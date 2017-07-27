(function () {


"use strict";


let mimock  = require('./../dist/mimock.js');
let mockset = mimock.mockset;

if (typeof window === 'undefined')
	require('chai-jasmine');


describe('readme', function () {

	it('lib testob instrumentation', function () {

		let mocks = new mockset();

		let testob_lib = mocks.library('testob');

		let testob = require('testob');
		expect(testob_lib.require_count()).toBe(1);

		mocks.restore();

	});

	it('lib polylock wrap', function () {

		let mocks = new mockset();

		let polylock_lib = mocks.library('polylock');
		let root_export = polylock_lib.export();

		let polylock = require('polylock');

		let locks = new polylock();
		expect(root_export.call_count()).toBe(1);
		root_export.wrap(function (helper) {
			return helper.continue();
		});

	});

	it('lib polylock wrap in a wrap', function () {

		let mocks = new mockset();

		let polylock_lib = mocks.library('polylock');
		let root_export = polylock_lib.export();

		let polylock = require('polylock');

		let test_locks_method;
		root_export.wrap(function (helper) {
			let new_obj = helper.continue();
			test_locks_method = mocks.o(new_obj).m('test_locks');
			test_locks_method.w(function (helper) {
				throw new Error('gotcha');
			});
			return new_obj;
		});

		let locks = new polylock();
		expect(typeof test_locks_method).not.toBe('undefined');
		expect(test_locks_method.call_count()).toBe(0);

		let retval;
		let exception;
		try {
			retval = locks.test_locks({});
		} catch (err) {
			exception = err;
		}
		expect(test_locks_method.call_count()).toBe(1);

		expect(retval).toBe(undefined);
		expect(/gotcha/.exec(exception)).toBeTruthy();

		mocks.restore();

	});

	it('lib testob wrap', function () {

		let mocks = new mockset();

		let testob_lib = mocks.library('testob');
		let basic_export = testob_lib.export('basic');

		let testob = require('testob');
		let testob_basic = testob.basic;

		let basic_object = new testob_basic();
		expect(basic_export.call_count()).toBe(1);

		let wrap_seen = 0;

		basic_export.wrap(function (helper) {
			wrap_seen++;
			return helper.continue();
		});

		expect(wrap_seen).toBe(0);
		basic_object = new testob_basic();
		expect(wrap_seen).toBe(1);

	});

});


})();

// Package: mimock
// Copyright: (C) 2017 Michael Wright <mjw@methodanalysis.com>
// License: MIT


(function () {


'use strict';


let mimock_mockset = (function () {


	let mimock_mockset = function mimock_mockset () {

		this.mm_objs = [];
		this.mm_libs = [];
		this.mm_funs = [];

	};


	mimock_mockset.prototype.object_type = function (params) {

		if (typeof params === 'undefined')
			params = {};

		let cons = 'cons' in params
			? params.cons
			: function () {};

		let method_names = 'methods' in params
			? Object.keys(params.methods)
			: [];

		for (let i = 0; i < method_names.length; i++)
			cons.prototype[method_names[i]] = params.methods[method_names[i]];

		return cons;

	};


	mimock_mockset.prototype.object = function (raw_obj) {

		if (typeof raw_obj !== 'object')
			throw new Error('not an object');

		for (let i = 0; i < this.mm_objs.length; i++)
			if (this.mm_objs[i].raw_obj === raw_obj)
				return this.mm_objs[i];

		let mm_obj = new mimock_obj(this, raw_obj);
		this.mm_objs.push(mm_obj);

		return mm_obj;

	};

	mimock_mockset.prototype.o = mimock_mockset.prototype.object;


	mimock_mockset.prototype.library = function (lib_path) {

		if (typeof lib_path !== 'string')
			throw new Error('not a library/package path/name');

		for (let i = 0; i < this.mm_libs.length; i++)
			if (this.mm_libs[i].lib_path === lib_path)
				return this.mm_libs[i];

		let mm_lib = new mimock_lib(this, lib_path);
		this.mm_libs.push(mm_lib);

		return mm_lib;

	};

	mimock_mockset.prototype.l = mimock_mockset.prototype.library;


	mimock_mockset.prototype.fun = function (fun) {

		if (typeof fun !== 'function')
			throw new Error('not a function');

		for (let i = 0; i < this.mm_funs.length; i++)
			if (this.mm_funs[i].orig_fun === fun)
				return this.mm_funs[i];

		let mm_fun = new mimock_fun(this, fun);
		this.mm_funs.push(mm_fun);

		return mm_fun;

	};

	mimock_mockset.prototype.f = mimock_mockset.prototype.fun;


	mimock_mockset.prototype.restore = function () {

		let mm_objs = this.mm_objs;
		for (let i = mm_objs.length-1; i >= 0; i--)
			mm_objs[i].restore();

		let mm_libs = this.mm_libs;
		for (let i = mm_libs.length-1; i >= 0; i--)
			mm_libs[i].restore();

		let mm_funs = this.mm_funs;
		for (let i = mm_funs.length-1; i >= 0; i--)
			mm_funs[i].restore();

	};


	return mimock_mockset;


})();


let mimock_obj = (function () {


	let mimock_obj = function mimock_obj (mm_set, raw_obj) {

		this.mm_set     = mm_set;
		this.raw_obj    = raw_obj;
		this.mm_methods = [];

	};


	mimock_obj.prototype.method = function (method_name) {

		if (typeof this.raw_obj[method_name] !== 'function')
			throw new Error('not a function');

		for (let i = 0; i < this.mm_methods.length; i++)
			if (this.mm_methods[i].method_name === method_name)
				return this.mm_methods[i];

		let mm_method = new mimock_method(this.mm_set, this, method_name);
		this.mm_methods.push(mm_method);

		return mm_method;

	};

	mimock_obj.prototype.m = mimock_obj.prototype.method;


	mimock_obj.prototype.restore = function () {

		let mm_methods = this.mm_methods;
		for (let i = 0; i < mm_methods.length; i++)
			mm_methods[i].restore();

	};


	return mimock_obj;


})();


let mimock_method = (function () {


	let mimock_method = function mimock_method (mm_set, mm_obj, method_name) {

		let raw_obj = mm_obj.raw_obj;

		this.mm_set      = mm_set;
		this.mm_obj      = mm_obj;
		this.method_name = method_name;
		this.orig_fun    = raw_obj[this.method_name];
		this.wrap_chain  = [];
		this.call_hist   = [];
		this.active      = true;

		let mm_method = this;
		raw_obj[this.method_name] = function () {
			return mm_method.entry(this, Array.prototype.slice.call(arguments), this !== raw_obj);
		};
		Object.defineProperty(raw_obj[this.method_name], 'name', {value:this.orig_fun.name});

	};


	mimock_method.prototype.entry = function (this_bind, args, as_cons) {

		let result = {
			called: new Date(),
			args:   args,
			};

		let helper = new mimock_wrap_helper(this_bind, args, as_cons, this.wrap_chain, this.orig_fun);

		if (!this.active)
			return helper.continue();

		let retval;
		let exception;
		try {
			retval = helper.continue();
		} catch (caught) {
			exception = caught;
		}

		result.returned = new Date();
		this.call_hist.push(result);

		if (typeof exception === 'undefined') {
			result.retval = retval;
			return retval;
		} else {
			result.exception = exception;
			throw exception;
		}

	};


	mimock_method.prototype.wrap = function (wrap_fun) {

		this.wrap_chain.push(wrap_fun);

		return this;

	};


	mimock_method.prototype.call_count = function () {

		return this.call_hist.length;

	};


	mimock_method.prototype.calls = function () {

		return this.call_hist;

	};


	mimock_method.prototype.restore = function () {

		if (!this.active)
			return;

		this.mm_obj.raw_obj[this.method_name] = this.orig_fun;

		this.active     = false;
		this.wrap_chain = [];

	};


	return mimock_method;


})();


let mimock_wrap_helper = (function () {


	let mimock_wrap_helper = function mimock_wrap_helper (
			this_bind, args, as_cons,
			wrap_chain, orig_fun
			) {

		this.this_bind = this_bind;
		this.args      = args;
		this.as_cons   = as_cons;
		this.wrap_chain= wrap_chain;
		this.wrap_num  = wrap_chain.length;
		this.orig_fun  = orig_fun;

	};


	mimock_wrap_helper.prototype.continue = function () {

		function call_cons (cons_fun, args) {
			let cons_args = args.slice();
			cons_args.unshift(undefined);
			return new (Function.prototype.bind.apply(cons_fun, cons_args));
		}

		if (this.wrap_num == 0)
			return this.as_cons
				? call_cons(this.orig_fun, this.args)
				: this.orig_fun.apply(this.this_bind, this.args);

		this.wrap_num--;

		return this.wrap_chain[this.wrap_num].apply(this.this_bind, [this]);

	};


	return mimock_wrap_helper;


})();


let mimock_fun = (function () {


	let mimock_fun = function mimock_fun (mm_set, orig_fun) {

		this.mm_set     = mm_set;
		this.orig_fun   = orig_fun;
		this.wrap_chain = [];
		this.call_hist  = [];
		this.active     = true;

		let mm_fun = this;
		this.repl_fun = function () {
			return mm_fun.entry(this, Array.prototype.slice.call(arguments), this instanceof mm_fun.repl_fun);
		};
		Object.defineProperty(this.repl_fun, 'name', {value:this.orig_fun.name});

	};


	mimock_fun.prototype.replacement = function () {

		return this.repl_fun;

	};


	mimock_fun.prototype.entry = function (this_bind, args, as_cons) {

		let helper = new mimock_wrap_helper(this_bind, args, as_cons, this.wrap_chain, this.orig_fun);

		if (!this.active)
			return helper.continue();

		let result = {
			called: new Date(),
			args:   args,
			};

		this.call_hist.push(result);

		let retval;
		let exception;
		try {
			retval = helper.continue();
		} catch (caught) {
			exception = caught;
		}

		result.returned = new Date();

		if (typeof exception === 'undefined') {
			result.retval = retval;
			return retval;
		} else {
			result.exception = exception;
			throw exception;
		}

	};


	mimock_fun.prototype.wrap = function (wrap_fun) {

		this.wrap_chain.push(wrap_fun);

		return this;

	};


	mimock_fun.prototype.call_count = function () {

		return this.call_hist.length;

	};


	mimock_fun.prototype.calls = function () {

		return this.call_hist;

	};


	mimock_fun.prototype.restore = function () {

		this.active     = false;
		this.wrap_chain = [];

	};


	return mimock_fun;


})();


let mimock_lib = (function () {


	let mimock_lib = function mimock_lib (mm_set, lib_path) {

		this.mm_set     = mm_set;
		this.lib_path   = lib_path;
		this.req_count  = 0;
		this.mm_exports = [];
		this.instances  = [];

		function require_handler (module_exports, module_info) {

			if (module_info.error !== null)
				throw module_info.error;

			if (module_info.moduleId === lib_path) {
				this.req_count++;
				let inst = new mimock_lib_inst(this, module_exports);
				module_exports = inst.module_exports();
				this.instances.push(inst);
			}

			return module_exports;

		}

		let intercept_require = require("intercept-require");
		this.ir_restore = intercept_require(require_handler.bind(this));

		this.export(undefined);

	};


	mimock_lib.prototype.require_count = function () {

		return this.req_count;

	};


	mimock_lib.prototype.restore = function () {

		for (let i = 0; i < this.instances.length; i++)
			this.instances[i].restore();

		for (let i = 0; i < this.mm_exports.length; i++)
			this.mm_exports[i].restore();

		this.instances  = [];
		this.mm_exports = [];

		this.ir_restore();

	};


	mimock_lib.prototype.export = function (export_name) {

		if (typeof export_name !== 'string' && typeof export_name !== 'undefined')
			throw new Error('not an export name and not undefined');

		for (let i = 0; i < this.mm_exports.length; i++)
			if (this.mm_exports[i].export_name === export_name)
				return this.mm_exports[i];

		let mm_export = new mimock_export(this.mm_set, this, export_name);
		this.mm_exports.push(mm_export);

		return mm_export;

	};

	mimock_lib.prototype.e = mimock_lib.prototype.export;


	return mimock_lib;


})();


let mimock_lib_inst = (function () {


	let mimock_lib_inst = function mimock_lib_inst (mm_lib, module_exports) {

		this.inst_of      = mm_lib;
		this.export_insts = [];
		this.repl_exports = module_exports;

		for (let i = 0; i < mm_lib.mm_exports.length; i++) {
			let mm_export = mm_lib.mm_exports[i];
			let exp_inst = new mimock_export_inst(mm_export, this.repl_exports);
			mm_export.instances.push(exp_inst);
			this.export_insts.push(exp_inst);
			this.repl_exports = exp_inst.module_exports();
		}

	};


	mimock_lib_inst.prototype.module_exports = function () {

		return this.repl_exports;

	};


	mimock_lib_inst.prototype.restore = function () {

		for (let i = 0; i < this.export_insts.length; i++)
			this.export_insts[i].restore();

		this.export_insts = [];

	};


	return mimock_lib_inst;


})();


let mimock_export = (function () {


	let mimock_export = function mimock_export (mm_set, mm_lib, export_name) {

		this.mm_set      = mm_set;
		this.mm_lib      = mm_lib;
		this.instances   = [];
		this.export_name = export_name;
		this.wrap_funs   = [];
		this.active      = true;

		for (let i = 0; i < mm_lib.instances.length; i++) {
			let lib_inst = mm_lib.instances[i];
			let exp_inst = new mimock_export_inst(this, lib_inst.module_exports());
			lib_inst.repl_exports = lib_inst.module_exports();
			this.instances.push(exp_inst);
			lib_inst.export_insts.push(exp_inst);
		}

	};


	mimock_export.prototype.wrap = function (fun) {

		this.wrap_funs.push(fun);

		return this;

	};


	mimock_export.prototype.call_count = function () {

		let call_count = 0;
		for (let i = 0; i < this.instances.length; i++)
			call_count += this.instances[i].call_count();

		return call_count;

	};


	mimock_export.prototype.calls = function () {

		let call_hist = [];
		for (let i = 0; i < this.instances.length; i++) {
			let inst = this.instances[i];
			let inst_call_hist = inst.calls();
			for (let j = 0; j < inst_call_hist.length; j++)
				call_hist.push(inst_call_hist[j]);
		}

		return call_hist;

	};


	mimock_export.prototype.restore = function () {

		for (let i = 0; i < this.instances.length; i++)
			this.instances[i].restore();

		this.active    = false;
		this.wrap_funs = [];

	};


	return mimock_export;


})();


let mimock_export_inst = (function () {


	let mimock_export_inst = function mimock_export_inst (mm_export, module_exports) {

		let wrap;
		if (typeof module_exports === 'function') {
			if (typeof mm_export.export_name === 'undefined') {
				wrap = mm_export.mm_set.f(module_exports);
				module_exports = wrap.replacement();
			}
		} else if (typeof module_exports === 'object') {
			let export_name = mm_export.export_name;
			if (typeof export_name !== 'undefined')
				if (export_name in module_exports)
					wrap = mm_export.mm_set.o(module_exports).m(export_name);
		}

		this.inst_of      = mm_export;
		this.repl_exports = module_exports;
		this.wrap         = wrap;
		this.active       = true;

		if (mm_export.wrap_funs.length === 0)
			return;

		let mm_export_inst = this;

		for (let i = 0; i < mm_export.wrap_funs.length; i++)
			wrap.wrap(mm_export.wrap_funs[i]);

	};


	mimock_export_inst.prototype.module_exports = function () {

		return this.repl_exports;

	};


	mimock_export_inst.prototype.call_count = function () {

		return typeof this.wrap !== 'undefined'
			? this.wrap.call_count()
			: 0;

	};


	mimock_export_inst.prototype.calls = function () {

		return typeof this.wrap !== 'undefined'
			? this.wrap.calls()
			: [];

	};


	mimock_export_inst.prototype.restore = function () {

		if (typeof this.wrap !== 'undefined')
			this.wrap.restore();

		this.active = false;

	};


	return mimock_export_inst;


})();


module.exports = {
	mockset: mimock_mockset,
	};


})();

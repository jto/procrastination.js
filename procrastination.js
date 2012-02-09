/**
* Copyright Julien Tournay
*
* LICENCE
*   __________________ 
*  ( I'll do it later )
*   ------------------ 
*          o   ^__^
*           o  (oo)\_______
*              (__)\       )\/\
*                  ||----w |
*                  ||     ||
*/

function identity(a){ return a }
function noop(){}

var M = (function(){	
	function M(){}
	M.fn = {}

	M.clone = function(){
		var o = {}
		for (x in M.fn) o[x] = M.fn[x]
		return o
	}

	M.fn.unit		= function(ƒ){ throw "You must override the unit method" }
	M.fn.flatmap	= function(ƒ){ throw "You must override the flatmap method" }

	M.fn.map = function(ƒ){
		var me = this
		return this.flatmap(function(v){
			return me.unit(ƒ.call(me, v))
		})
	}

	M.fn.flatten	= function(){
		return this.flatmap(identity)
	}

	M.fn.filter = function(predicate){
		return this.flatmap(function(v){
			if(predicate(v))
				return this.unit(v)
			else
				return this.zero()
		})
	}

	// M.fn.sequence = function(){ throw "TODO: sequence" },
	// M.fn.replicate = function(){ throw "TODO: replicate" },
	M.fn.lift =	 function(ƒ){
		return this.map(ƒ)
	}
	M.fn.lift2 = function(ƒ, m1){
		return this.flatmap(function(v){
			return m1.map(function(v1){
				return ƒ(v, v1)
			})
		})
	}
	M.fn.lift3 = function(ƒ, m1, m2){
		return this.flatmap(function(v){
			return m1.flatmap(function(v1){
				return m2.map(function(v2){
					return ƒ(v, v1, v2)
				})
			})
		})
	}
	M.fn.lift4 = function(ƒ, m1, m2, m3){
		return this.flatmap(function(v){
			return m1.flatmap(function(v1){
				return m2.flatmap(function(v2){
					return m3.map(function(v3){
						return ƒ(v, v1, v2, v3)
					})
				})
			})
		})
	}
	M.fn.lift5 = function(ƒ, m1, m2, m3, m4){
		return this.flatmap(function(v){
			return m1.flatmap(function(v1){
				return m2.flatmap(function(v2){
					return m3.flatmap(function(v3){
						return m4.map(function(v4){
							return ƒ(v, v1, v2, v3, v4)
						})
					})
				})
			})
		})
	}

	M.fn.fold = function(ƒ, i){ throw "You must override the fold method" }
	M.fn.zero	= function(){ throw "You must override the zero method" },
	M.fn.append = function(){ throw "You must override the append method" },

	//M.fn.sum	= function(){ throw "TODO: sum" }
	M.fn.zip = function(other){ throw "You must override the zip method" }

	M.fn.zipWith = function(ƒ, stream){
		return this.zip(stream)
			.lift(function(v){
				return ƒ(v[0], v[1])
			})
	}

	M.fn.unzip = function(){
		var fst = function(v){return v[0]}
		var snd = function(v){return v[1]}
		return [this.lift(fst), this.lift(snd)]
	}

	return M
})()

var Action = function(act) {
	function A(ƒ, c) {
		this.ƒ = ƒ || identity
		this.complete = c || noop
	}

	A.prototype = M.clone()
	
	A.Empty = new A()
	A.prototype.zero = function(){ return A.Empty }
	A.prototype.unit = function(v){
		return new A(function(v2, next){
			next(v)
		})
	}

	A.prototype.onComplete = function(ƒ){
		var me = this
		return new A(this.ƒ, function(v){
			me.complete.call(me, v)
			ƒ.call(me, v)
		})
	}

	A.prototype.do = function(v){
		this.ƒ(v, this.complete)
	}

	A.prototype.flatmap = function(ƒ){
		var me = this
		return new A(function(v, next){
			me.onComplete(function (v2) {
				ƒ.call(me, v2).onComplete(next).do(v2)
			}).do(v)
		}, noop)
	}

	// A.prototype.fold = function(ƒ, i){ throw "You must override the fold method" }
	// A.prototype.append = function(){ throw "You must override the append method" }

	A.prototype.then = function(a){
		var me = this
		return new A(function(v, next){
			me.onComplete(function(v2){
				a.ƒ(v2, next)
			}).do(v)
		}, a.complete)
	}

	A.prototype.and = function(a){
		var me = this
		return new A(function(v, next){
			var values = [],
				action = this
			function sync(i){
				return function (v){
					values[i] = v
					if(values[0] && values[1])
						action.complete(values)
				}
			}
			me.onComplete(sync(0)).do(v)
			a.onComplete(sync(1)).do(v)
		}, noop)
	}
	
	A.prototype.wrap = function(a, b){
		return this.and(a)
			.then(b)
	}
	
	A.prototype.zip = A.prototype.and

	return new A(act)
}

var Reactive = (function() {
	function R(source, lambda) {
		this.lambda = lambda || identity
		this.source = source || noop
	}

	R.prototype = M.clone()

	R.Empty = new R()
	R.prototype.unit = function(v){
		return new R(function(n){ return n(v) })
	}

	R.prototype.on = function(s) {
		var me = this
		return new R(function (next){
			me.source(next)
			s(next)
		}, this.lambda)
	}

	/**
	Merges two reactive
	@param
	 r another reactive
	@return
	 another reactive with both merged
	*/
	R.prototype.merge = function(ot) {
		var me = this
		return new R(function(l) {
			me.source(me.lambda(l))
			ot.source(ot.lambda(l))
		}, identity)
	}

	R.prototype.group = function(i) {
		var vs = [],
			me = this
		return this.flatmap(function(v){
			if(vs.length == i - 1){
				var r = vs.concat([v])
				vs = []
				return me.unit(r)
			}
			else{
				vs.push(v)
				return R.Empty
			}
		})
	}
	
	R.prototype.sliding = function(s) {
		var vs = [],
			me = this
		return this.flatmap(function(v){
			if(vs.length == s)
				vs = vs.slice(1).concat(v)
			else
				vs = vs.concat(v)
			return me.unit(vs)
		})
	}
	
	R.prototype.drop = function(n) {
		var s = this.source
		return new R(function(next){
			s(function(v){
				if(n) n--
				else next(v)
			})
		}, this.lambda)
	}
		
	// TODO: add a dispose method
	R.prototype.subscribe = function() {
		//this.source(this.lambda)
		this.source.call(this, this.lambda)
	}

	// (R, (v => R)) => R
	// TODO: merge source && lambda ?
	R.prototype.flatmap = function(ƒ){
		var me = this
		return new R(function(next){
			var r = this
			me.source(function(v){
				var react = ƒ.call(r, me.lambda(v))
				react.source(function(v2){
					next(v2)
				})
			})
		})
	}

	R.prototype.await = function(a){
		var me = this
		return new R(function(next){
			me.source.call(this, function(v){
				a.onComplete(next).do(v)
			})
		})
	}
	
	R.prototype.zip = function(r){
		var src = this.source,
			lmbd = this.lambda
		return new R(function(next){
			var buffer = [],
				me = this
			src(function(v){ buffer.push(lmbd(v)) })
			r.source(function(v){
				if(buffer.length){
					me.lambda([buffer[0], r.lambda(v)])
					buffer = buffer.slice(1)
				}
			})
		})
	}

	R.prototype.fold = function(ƒ, i){
		throw "TODO"
	}

	R.prototype.zero = function(){ return R.Empty },
	R.prototype.append = function(){ throw "TODO" },

	R.prototype.foreach = function(ƒ){
		var me = this
		return new R(this.source, 
			function(e){
				var v = me.lambda(e)
				ƒ(v)
				return v
			})
	}
	
	R.prototype.match = function(c){
		return this.filter(function(v){
			if(v.length != c.length)
				return false
			for(var i = 0; i < v.length; i++)
				if(v[i] !== c[i]) return false
			return true
		})
	}
		
	return {
		on: function(s){
			return new R(s)
		}
	}
})()

var Match = (function(){
	function M(ts, lambda, def){
		this.predicates = ts || []
		this.lambda = lambda || identity
		this.def = def || Action() //returned valued if matched
	}

	M.prototype.action = function(){
		var u = Action(function(v, n){ n(v) }),
			ac = this
		return u.flatmap(function(v){
			for(var i = 0; i < ac.predicates.length; i++){
				var p = ac.predicates[i]
				if(p.predicate(ac.lambda(v))){
					return p.action
				}
			}
			return ac.def
		})
	}

	M.prototype.test = function(ƒ, a){
		return new M(this.predicates.concat([{
			predicate: ƒ,
			action: a
		}]), this.lambda, this.def)
	}

	var TODO = function(){
		throw 'NotImplemented'
	}

	M.prototype.value = function(r, a){
		return this.test(function(v){
			return v === r
		}, a)
	}

	M.prototype.array = function(as, a){
		return this.test(function(vs){
			if(vs.length != as.length)
				return false
			for(var i = 0; i < vs.length; i++)
				if(vs[i] !== as[i]) return false
			return true
		}, a)
	}

	M.prototype.regex = function(reg, a){
		return this.test(function(v){
			return reg.test(v)
		}, a)
	}
	M.prototype.type = TODO

	// THIS IS SPPPP... a map
	M.prototype.on = function(lambda){
		var me = this
		return new M(this.predicates, function(v){
			return lambda(me.lambda(v))
		}, this.def)
	}

	M.prototype.default = function(def){
		return new M(this.predicates, this.lambda, def)
	}

	return new M()
})()

// vim: noexpandtab ts=2 sw=2:

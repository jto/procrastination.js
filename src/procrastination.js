/**
*
*     ________________________________________________________________________
*   /                Copyright 2012 Julien Tournay                             \
*   |                                                                           |
*   |  Licensed under the Apache License, Version 2.0 (the "License");          |
*   |  you may not use this file except in compliance with the License.         |
*   |  You may obtain a copy of the License at                                  |
*   |                                                                           |
*   |      http://www.apache.org/licenses/LICENSE-2.0                           |
*   |                                                                           |
*   |  Unless required by applicable law or agreed to in writing, software      |
*   |  distributed under the License is distributed on an "AS IS" BASIS,        |
*   |  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
*   |  See the License for the specific language governing permissions and      |
*   |  limitations under the License.                                           |
*   \ under the License.                                                        /
*     -------------------------------------------------------------------------
*           \   ^__^
*            \  (oo)\_______
*               (__)\       )\/\
*                   ||----w |
*                   ||     ||
**/

(function(global){
	"use strict"

	// ## Helper functions

	/**
	 * Identity returns what you give him in parameter
	 * @parameter
	 *	 a - What you want me to return you
	 * @return
	 *	 What you have given me as parameter
	 */
	global.identity = function identity(a){ return a }

	/**
	 * Noop does nothing
	 */
	global.noop = function noop(){}

	var TODO = function(){
		throw 'NotImplemented'
	}

	// ## M
	var M = (function(){
		function M(){}
		M.fn = {}

		M.clone = function(){
			var o = {}
			for (var x in M.fn) o[x] = M.fn[x]
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

	// ## Action
	// Actions are triggered on events and may be chained
	var Action = global.Action = function(act) {
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

		A.prototype._do = function(v){
			this.ƒ(v, this.complete)
		}

		A.prototype.flatmap = function(ƒ){
			var me = this
			return new A(function(v, next){
				me.onComplete(function (v2) {
					ƒ.call(me, v2).onComplete(next)._do(v2)
				})._do(v)
			}, noop)
		}

		/*
		A.prototype.fold = function(ƒ, i){ throw "You must override the fold method" }
		A.prototype.append = function(){ throw "You must override the append method" }
		 */

	// ### Action composition
	// You may compose actions using different methods:


	// #### Action chaining (aka ">>>")
	// add another action to execute after completion
	// Consider following actions:
	// <pre>
	// var log = Action(function(event, next) {
	//	 console.log(event)
	//	 next(event)
	// })
	// var doRealStuff = Action(function(event, next) {
	//	 //do real stuff
	//	 doRealStuff(event)
	//	 next(event)
	// })
	// </pre>
	//
	// You may want to compose something like:
	// <pre>
	// var logThenDoStuffAction = log.then(doRealStuff)
	// </pre>
	// or 
	// <pre>
	// var thenDoStuffThenLogAction = doRealStuff.then(log)
	// </pre>
	//

		A.prototype.then = function(a){
			var me = this
			return new A(function(v, next){
				me.onComplete(function(v2){
					a.ƒ(v2, next)
				})._do(v)
			}, a.complete)
		}

	// #### Simultaneous Actions (aka "&&&")
	// Ok this is cool, but sometimes you want to do two concurrent things with
	// the same event, just as you did with javascript events and callbacks !
	//
	// then do something like:
	// <pre>
	// var doStuffAndLogInTheSameTime = doRealStuff.and(log)
	// </pre>

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
				me.onComplete(sync(0))._do(v)
				a.onComplete(sync(1))._do(v)
			}, noop)
		}

		A.prototype.zip = A.prototype.and

		// TODO: find a name
		// (***) :: SF b c -> SF b’ c’ -> SF (b,b’) (c,c’)
		A.prototype['***'] = function(a){
			return this.fst().then(this)
				.and(this.snd().then(a))
		}

		A.prototype.first = function(ƒ){
			return this.map(function(v){
				return [ƒ(v[0]), v[1]]
			})
		}

		A.prototype.fst = function(){
			return this.map(function(v){
				return v[0]
			})
		}
		
		A.prototype.snd = function(){
			return this.map(function(v){
				return v[1]
			})
		}

	// #### A step forward
	// You may even combine them
	// <pre>
	// var displayStuff = Action(function(event, next) {
	//	 $('body').append(event)
	//	 next(event)
	// })
	// </pre>
	//
	// then you may want after having logged and processed stuff, use those
	// actions and have another one synchronized:
	// <pre>
	// var wholeAction = doRealStuff.and(log).then(displayStuff)
	// </pre>
	//
	// Note: You will see displayStuff gets an array of event, on element for
	// each elements of parent branches
	//
	// You may want the diet version of Action.and.then:
	// <pre>
	// var wholeAction = doRealStuff.wrap(log, displayStuff)
	// </pre>

		A.prototype.wrap = function(a, b){
			return this.and(a)
				.then(b)
		}

	// 
		return new A(act)
	}

	// TODO: maybe events should be composable like Action
	// -- var swipe = touchstart.then(touchmove).then(touchend)
	// ## Reactive
	// Reactive are entry points where you route events from
	global.When = (function() {
		function R(source, lambda) {
			this.lambda = lambda || identity
			this.source = source || noop
		}

		R.prototype = M.clone()

		R.Empty = new R()
		R.prototype.unit = function(v){
			return new R(function(n){ return n(v) })
		}

		/**
		 * Get back a reactive listener on a specific event
		 * @param
		 *	 The event you want a reactive from
		 * @return
		 *	 The reactive you expect
		 */
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

		/**
		 * Get events from a reactive groups by N elements
		 * @param
		 * s How long you want groups to be
		 * @return
		 * The reactive giving elements by groups
		 */
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

		R.prototype.until = function(p) {
			var vs = [],
				me = this
			return this.flatmap(function(v){
				vs = vs.concat(v)
				if(p(v)){
					r = me.unit(vs)
					vs = []
					return r
				}
				else
					return R.Empty
			})
		}

		/**
		 * Drop first N elements from a reactive then listen for events from it
		 * @params
		 * n The number of elements you want to drop
		 * @return
		 * The reactive dropping N first elements
		 */
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

		R.prototype.mapVal = function(v){
			return this.map(function(){
				return v
			})
		}

		/**
		 * Add an Action you want to be called when events are triggered
		 * @param
		 * a Action you want to be called on events
		 * @return
		 * The new reactive calling action
		 */
		R.prototype.await = function(a){
			var me = this
			return new R(function(next){
				me.source.call(this, function(v){
					a.onComplete(next)._do(v)
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

		/**
		 * Returns an empty reactive
		 * May be used to stop processing a reactive
		 * @return
		 * An new empty Reactive
		 */
		R.prototype.zero = function(){ return R.Empty },

		R.prototype.append = function(){ throw "TODO" },

		/**
		 * Basic foreach
		 * When reactive is subscribe function will be called for each event reaching 
		 * this reactive
		 * @param
		 * ƒ the callback you want to be called
		 * @return
		 * A new reactive calling your callback
		 */ 
		R.prototype.foreach = function(ƒ){
			var me = this
			return new R(this.source, 
				function(e){
					var v = me.lambda(e)
					ƒ(v)
					return v
				})
		}

		R.prototype.match = function(m){
			return this.await(m.action())
		}
		
		return function(){
			var r = new R()
			return r.on.apply(r, Array.prototype.slice.call(arguments))
		}
	})()

	// ## Matchers
	var Match = global.Match = (function(){
		function M(ts, lambda, def){
			this.predicates = ts || []
			this.lambda = lambda || identity
			this.def = def || Action() //returned valued if matched
		}

		M.prototype._new = M

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
			return new this._new(this.predicates.concat([{
				predicate: ƒ,
				action: a
			}]), this.lambda, this.def)
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

		// THIS IS SPPPP... a map, almost
		M.prototype.on = function(lambda){
			var me = this
			return new this._new(this.predicates, function(v){
				return lambda(me.lambda(v))
			}, this.def)
		}

		M.prototype.dft = function(def){
			return new this._new(this.predicates, this.lambda, def)
		}

		M.prototype.specialized = function(obj){
			function S(){
				this.constructor.apply(this, arguments)
			}
			S.prototype = new M()
			S.prototype._new = S
			for(var k in obj)
				S.prototype[k] = obj[k]
			return new S()
		}

		return new M()
	})()

	// Utils
	global.Call = function Call(ƒ){
		return Action(function(v,n){
			n(ƒ(v))
		})
	}
	global.Id = Call(identity)
	global.Val = function(v){ return Call(function(){return v}) }
	global.Log = Call(function(v){
		console.log('-- %o', v)
		return v
	})
	global.Noop = Call(noop)
	global.Effect = function(ƒ){
		return Call(function(v){
			ƒ(v)
			return v
		})
	}
})(window)
// vim: noexpandtab ts=2 sw=2:

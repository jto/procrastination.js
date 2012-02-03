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

/**
* Iteratee
* @see: http://okmij.org/ftp/Haskell/Iteratee/DEFUN08-talk-notes.pdf
* 
* data Stream el = EOF (Maybe ErrMsg) | Chunk [el]
* data Iteratee el m a = IE done a
*						| IE cont (Maybe ErrMsg) (Stream el -> m (Iteratee el m a, Stream el))
* instance Monad m => Monad (Iteratee el m) instance MonadTrans (Iteratee el)
*/
// type Enumerator a	= Iteratee a -> Iteratee a 
// type EnumeratorM m a = Iteratee a -> m (Iteratee a)
var Enumerator = (function(){
	function E(){}
	E.fn = {}
	E.fn.enumerate = function(it){ throw "TODO" }
	// TODO: Enumerator composition
	return E
})()

// Default Iteratee inputs signals
// Note that nothing prevents you from creating other inputs
var Input = {
	EOF: function(){
		this.EOF = true
	},
	//ƒ: (Stream -> (Iteratee a, Stream))
	El: function(e){
		this.El = true
		this.e = e
	},
	
	Empty: function(){
		this.Empty = true
	},
	
	eof: function(){ return new Input.EOF() },
	el: function(e){ return new Input.El(e) },
	empty: function(){ return new Input.Empty() }
}
// data Iteratee a = IE done a
//					| IE cont (Maybe ErrMsg) (Stream -> (Iteratee a,Stream))
var Iteratee = (function(){
	function I(){}
	
	I.Done = function(e){
		this.e = e
		this.Done = true
		this.fold = function(done, cont){ return done(this.e) }
	}
	I.Cont = function(ƒ){
		this.Cont = true
		this.run = ƒ
		this.fold = function(done, cont){ return cont(ƒ) }
	}
	
	I.done = function(e){ return new I.Done(e) }
	I.cont = function(ƒ){ return new I.Cont(ƒ) }
	
	I.fn = {}
	I.fn.run = function(v){ throw "you must override the run method" }

	I.fn.flatmap = function(ƒ){
		var me = this
		return this.fold(
			function(e){
				return ƒ.call(me, e)
			},
			function(k){
				return I.cont(function(e2){ return k(e2).flatmap(ƒ) })
			}
		)
	}
	
	I.Done.prototype = I.Cont.prototype = I.fn
	
	return I
})()

// Stream adapters, or Enumeratees, handle nested – encapsulated – streams
// type Enumeratee a = Iteratee a -> Iteratee (Iteratee a)
var Enumeratee = (function(){
	function Ee(){}
	Ee.fn = {}
	// left to rigt composition
	Ee.fn.lrcompose = function(ƒ){ throw "TODO" }
	//Composition with an Iteratee
	Ee.fn.$$	= function(I){ throw "TODO" }
	return Ee
})()

var Stream = (function(){
	function Stream(h, t, empty){
		this.head = h
		this.tail = t
		this.isEmpty = !!empty
	}

	Stream.cons = function(h, t){
		return new Stream(h, t)
	}
		
	Stream.range = function(start, end){
		if(start > end) return Stream.Empty
		else return Stream.cons(start, function(){ return Stream.range(start + 1, end) })
	}
	Stream.unit = function(value){
		return new Stream.cons(value, function(){ return Stream.Empty })
	}

	Stream.prototype = M.clone()
	Stream.prototype.zero = function(){ return Stream.Empty }
	Stream.prototype.unit = Stream.unit

	Stream.prototype.flatmap = function(ƒ){
		var me = this
		if(this.isEmpty)
			return this
		var h = ƒ.call(me, me.head)
		return Stream.cons(h.head, function(){
			return h.tail().append(me.tail().flatmap(ƒ))
		})
	}

	Stream.prototype.fold = function(ƒ, i){
		if(this.isEmpty) return i
		return this.tail().fold(ƒ, ƒ(i, this.head))
	}

	Stream.prototype.append = function(stream){
		var me = this
		if(this.isEmpty) return stream
		return Stream.cons(this.head, function(){
			return me.tail().append(stream)
		})
	}

	Stream.prototype.zip = function(stream){
		var me = this
		if(this.isEmpty || stream.isEmpty)
			return Stream.Empty
		return Stream.cons([this.head, stream.head], function(){
			return me.tail().zip(stream.tail())
		})
	}

	Stream.prototype.drop = function(n){
		if(n > 0)
			return this.tail().drop(n - 1)
		else
			return this
	}

	Stream.Empty = new Stream(undefined, function(){ return this }, true)

	Stream.prototype.enumerate = function(it){
		var next = this.tail()
		if(this.isEmpty) return it.run(Input.eof())
		else if(it.Done) return it
		else if(it.Cont) return next.enumerate(it.run(Input.el(this.head)))
	}

	return Stream
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
				ƒ.call(me, v2).onComplete(next).do()
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
				vs.push(v)
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
			me.source(function(v){
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

// ============
// = Examples =
// ============
var fibs = function(){
	return Stream.cons(0, function(){
		return Stream.cons(1, function(){
			return fibs().zipWith(function(a, b){
				return a + b
			}, fibs().tail())
		})
	})
}

var ints = Stream.range(0, Infinity),
	pairedInt = ints.zip(ints)

var isum = function(v){
	return function(i){
		if(i.EOF)
			return Iteratee.done(v)
		else if(v > 6)
			return Iteratee.done(v)
		else if(i.Empty)
			return Iteratee.cont(isum(v))
		else if(i.El)
			return Iteratee.cont(isum(i.e + v))
	}
}

// Simple sum Iteratee, it stops when the sum is up to 6
var i0 = Iteratee.cont(isum(0))

var isqrt = Stream.range(1,100) // Get a stream of number from 1 to 10
			.enumerate(i0) // sum them until the sum is up to 10
			// fold the resulting iteratee, gives us the result ^ 2
			.fold(function(e){ return Iteratee.done(e * e) }, function(ƒ){ return Iteratee.cont(ƒ) })

// bind streams
var i0plus = i0.flatmap(function(e){
	return Iteratee.done(e + 1)
})

var sumPlus = Stream.range(1,100).enumerate(i0plus)

var iappend = function(v){
	return function(i){
		if(i.EOF)
			return Iteratee.done(v)
		else if(i.Empty)
			return Iteratee.cont(iappend(v))
		else if(i.El)
			if(i.e > 50)
				return Iteratee.done(v)
			else
				return Iteratee.cont(iappend(v + "," + i.e))
	}
}
var iAcc = Iteratee.cont(iappend(""))

var ireverse = function(v){
	return function(i){
		if(i.EOF)
			return Iteratee.done(v)
		else if(i.Empty)
			return Iteratee.cont(ireverse(v))
		else if(i.El)
			return Iteratee.cont(ireverse(v + "," + (i.e + '').split('').reverse().join('')))
	}
}
var iReversed = Iteratee.cont(ireverse(""))

var appendThenReverse = iAcc.flatmap(function(e){
	return Iteratee.cont(ireverse(e))
})

// ===================
// = Procrastination =
// ===================

// var Procrastination = (function($, S){
// 
//	var nodes = S.map(function(evt){ return evt.target }, nodeinserted)
//	function nodeinserted(next, stop){
//		$('*').live('DOMNodeInserted', next, false)
//	}
// 
//	function P(stream){
//		this.stream = stream || S.empty
//	}
// 
//	function noop(){}
// 
//	// ¨Pattern matching wouldn't hurt...
//	function $P(selector, context){
//		if(!selector) return new P()
//		else if(selector instanceof P) return selector
//		else if($.isArray(selector)) return new P(S.list.apply(this, selector))
//		else if($.isFunction(selector)) return new P(selector) // stream
//		else if(selector.selector){ //Zepto object
//			var inserted = S.filter(function(e){
//					return $(e).is(selector.selector) // TODO, test context
//			}, nodes)
//			return new P(S.append(S.list.apply(this, selector), inserted))
//		}
//		else{ return new P(S.list(selector)) }
//	}
// 
//	P.fn = {}
// 
//	/**
//	* streamer support
//	*/
//	//P.fn.append = function(s){}
//	P.fn.filter = function(ƒ){ return $P(S.filter(ƒ, this.stream))}
//	P.fn.map = function(ƒ){ return $P(S.map(ƒ, this.stream))}
//	P.fn.reduce = function(ƒ, initial){ return $P(S.reduce(ƒ, this.stream, initial))}
//	P.fn.merge = function(){ return $P(S.merge(this.stream))}
//	P.fn.head = function(n){ return $P(S.head(this.stream, n))}
//	P.fn.each = function(ƒ){
//		this.stream(ƒ,noop); return this
//	}
//	P.fn.flatmap = function(ƒ) {
//		var sp = this.map(ƒ).stream,
//		ss = S.map(function(e){ return e.stream }, sp)
//		merged = S.merge(ss)
//		return $P(merged)
//	}
// 
//	/**
//	* Zepto support
//	*/
//	P.fn.attr = function(name, value){
//		return this.flatmap(function(e){
//			return $P($(e).attr(name, value))
//		})
//	}
// 
//	P.fn.val = function(v){
//		return this.map(function(e){
//			return $(e).val(v)
//		})
//	}
// 
//	P.fn.bind = function(event) {
//		return this.flatmap(function(e){
//			var triggered = function(next, stop){ $(e).bind(event, next) }
//			return $P(triggered)
//		})
//	}
// 
//	P.fn.appendTo = function(selector){
//		return this.each(function(e){
//			$(e).appendTo(selector)
//		})
//	}
// 
//	P.prototype = P.fn
//	return $P
// 
// })(Zepto, {
//	list: list,
//	map: map,
//	filter: filter,
//	append: append,
//	reduce: reduce,
//	merge: merge,
//	head:head
// })

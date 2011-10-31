var M = (function(){
	function identity(a){ return a }
	function M(){}
	M.fn = {}
	
	M.fn.unit		= function(ƒ){ throw "You must override the unit method" }
	M.fn.flatmap 	= function(ƒ){ throw "You must override the flatmap method" }
	
	//Monadic functions
	M.fn.map = function(ƒ){
		var me = this
		return this.flatmap(function(v){
			return this.unit(ƒ.call(me, v))
		})
	}
	//aka: join
	M.fn.flatten  = function(){
		return this.flatmap(identity)
	},
	M.fn.filter = function(predicate){
		return this.map(predicate)
							.zip(this)
							.flatmap(function(xs){
								if(xs[0])
									return this.unit(xs[1])
								else
									return this.zero()
							})
	},

	// M.fn.sequence = function(){ throw "TODO: sequence" },
	// M.fn.replicate = function(){ throw "TODO: replicate" },
	// M.fn.liftM = function(){ throw "TODO: liftM" },
	
	//Monoid
	M.fn.zero  	= function(){ throw "You must override the zero method" },
	M.fn.append  	= function(){ throw "You must override the append method" }

	//Zip
	M.fn.zip = function(other){ throw "You must override the zip method" },
	M.fn.zipWith = function(ƒs){
		return this.zip(ƒs)
							.map(function(v){
								return (v[1])(v[0])
							})
	},
	// M.fn.unzip = function(other){ throw "You must override the unzip method" },
	return M
})()


// ======================
// = Scala like Streams =
// ======================
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
		else return Stream.cons(start, function(){ return Stream.range(start + 1, end)})
	}
	Stream.unit = function(value){
		return new Stream.cons(value, function(){ return Stream.Empty })
	}

	Stream.prototype = M.fn
	Stream.prototype.zero = function(){ return Stream.Empty }
	Stream.prototype.unit = Stream.unit

	Stream.prototype.flatmap = function(ƒ){
		var me = this
		
		if(this.isEmpty)
			return this

		var h = ƒ.call(me, me.head)

		if(h.isEmpty)
			return me.tail().flatmap(ƒ)

		return Stream.cons(h.head, function(){
			return h.tail().append(me.tail().flatmap(ƒ))
		})
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

	return Stream
})()

test = Stream.range(1, 10)
				.map(function(v){
			 		return v + 1
				})
				.drop(5)
				.filter(function(v){
					return !(v % 2)
				})
				.zip(Stream.range(1, 10))

// ===================
// = Procrastination =
// ===================
var Procrastination = (function($, S){
	
	var nodes = S.map(function(evt){ return evt.target }, nodeinserted)
	function nodeinserted(next, stop){
		$('*').live('DOMNodeInserted', next, false)
	}
	
	function P(stream){
		this.stream = stream || S.empty
	}
	
	function noop(){}
	
	// ¨Pattern matching wouldn't hurt...
	function $P(selector, context){
		if(!selector) return new P()
		else if(selector instanceof P) return selector
		else if($.isArray(selector)) return new P(S.list.apply(this, selector))
		else if($.isFunction(selector)) return new P(selector) // stream
		else if(selector.selector){ //Zepto object
			var inserted = S.filter(function(e){
				return $(e).is(selector.selector) // TODO, test context
			}, nodes)
			return new P(S.append(S.list.apply(this, selector), inserted))
		}
		else{ return new P(S.list(selector)) }
	}
	
	P.fn = {}
		
	/**
	* streamer support
	*/
	//P.fn.append = function(s){}
	P.fn.filter = function(ƒ){ return $P(S.filter(ƒ, this.stream))}
	P.fn.map = function(ƒ){ return $P(S.map(ƒ, this.stream))}
	P.fn.reduce = function(ƒ, initial){ return $P(S.reduce(ƒ, this.stream, initial))}
	P.fn.merge = function(){ return $P(S.merge(this.stream))}
	P.fn.head = function(n){ return $P(S.head(this.stream, n))}
	P.fn.each = function(ƒ){ 
		this.stream(ƒ,noop); return this
	}
	P.fn.flatmap = function(ƒ) {
		var sp = this.map(ƒ).stream,
				ss = S.map(function(e){ return e.stream }, sp)
				merged = S.merge(ss)
		return $P(merged)
	}
	
	
	/**
	* Zepto support
	*/
	P.fn.attr = function(name, value){
		return this.flatmap(function(e){
			return $P($(e).attr(name, value))
		})
	}
	
	P.fn.val = function(v){
		return this.map(function(e){
			return $(e).val(v)
		})
	}
	
	P.fn.bind = function(event) {
		return this.flatmap(function(e){
			var triggered = function(next, stop){ $(e).bind(event, next) }
			return $P(triggered)
		})
	}
	
	P.fn.appendTo = function(selector){
		return this.each(function(e){
			$(e).appendTo(selector)
		})
	}
	
	P.prototype = P.fn
	return $P
	
})(Zepto, {
	list: list,
	map: map,
	filter: filter,
	append: append,
	reduce: reduce,
	merge: merge,
	head:head
})
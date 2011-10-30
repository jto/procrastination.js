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
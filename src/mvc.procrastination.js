function Dispatch(ls){
	return Action(function(evt, n){
		ls.forEach(function(l){
			if(l[evt.type])
				l[evt.type].onComplete(n)._do(evt)
		})
	})
}

function Event(type, model, tmpl){
	return { type: type, model: model, tmpl: tmpl }
}

function Listen(){
	var ls = Array.prototype.slice.call(arguments)
	return Action(function(v, n){
		var r = function(v){
			Dispatch(ls).onComplete(r)._do(v)
			n(v)
		}
		r(v)
	})
}
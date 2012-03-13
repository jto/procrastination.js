function Views(){
	var vs = Array.prototype.slice.call(arguments),
		act = Keep
	// TODO: Should be a fold
	vs.forEach(function(view){
		act = act.and(view.render)
				.then(Action(function(v, n){
					n([v[1], vs])
				}))
	})
	return act
}

var Dispatch = Action(function(v, n){
	var evt = v[0],
		views = v[1]
	views.forEach(function(view){
		var m = view[evt.type] || noop
		m(evt)
	})
})

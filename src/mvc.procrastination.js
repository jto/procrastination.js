function Views(){
	var args = Array.prototype.slice.call(arguments)
	return Action(function(v, n){
		return [v, args.map(function(view){
			view.render(v, function(o){
				n([o, args])
			})
		})]
	})
}

var Dispatch = Action(function(v, n){
	var evt = v[0],
		views = v[1]
	views.forEach(function(view){
		var m = view[evt.type] || noop
		m(evt)
	})
})

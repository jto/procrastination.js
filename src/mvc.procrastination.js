function Views(){
	var vs = Array.prototype.slice.call(arguments),
		Dispatch = Action(function(evt, n){
			vs.forEach(function(view){
				view[evt.type]
					.onComplete(n)
					._do(evt)
			})
		})

	return Dispatch.then(Dispatch)
}

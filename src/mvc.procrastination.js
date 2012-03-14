function Views(){
	var vs = Array.prototype.slice.call(arguments)
	return Dispatch(vs)
}

function Dispatch(views){
	return Action(function(evt, n){
		views.forEach(function(view){
			view[evt.type]
				.onComplete(n)
				._do([evt, views])
		})
	})
}
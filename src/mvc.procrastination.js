function Views(){

	var views = Array.prototype.slice.call(arguments),
		next,
		calling = Action(function(e, n){
			views.forEach(function(view){
				view[e.type]
					.onComplete(n)
					._do(e)
			})
		})

		Reactive
			.on(function(n){
				next = n
			})
			.await(calling.then(calling))
			.subscribe()

	return Action(function(v,n){
		next({ type: 'render', model: v })
		n(v)
	})

}


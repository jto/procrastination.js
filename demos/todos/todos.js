$(function(){
	
	// Models
	function Todo(value){ return { text: value, done: false, since: new Date()} }
	
	// Inputs
	var values = new Reactive(function (next){ next($('#new-todo').val()) })
	var source = new Reactive(function (next){ $('#new-todo').keydown(next) })
		.filter(function(evt){
			return evt.keyCode == 13
		})
		.await(values)
		.map(function(v){ 
			return Todo(v[1])
		})
	
	
	// Outputs
	var save = new Reactive(function(next){ setTimeout(function(){ next('pif') }, 500) })

	source
		.map(function(t){
			return _.template($('#item-template').html())(t)
		})
		.foreach(function(t){
			$('#todo-list').append(t)
			$('#new-todo').val('')
		})
		.await(save)
		.foreach(function(v){
			console.log('saved >> %o', v)
		})
		.subscribe()
	
})
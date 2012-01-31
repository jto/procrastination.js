$(function(){
	
	// Models
	function Todo(value){ 
		return 
	}
	
	// Effects
	// TODO: find a name fot that (Task ?)
	var save = new Action()
		.map(...)
		.foreach(...)
	
	var addToList = new Action(function(todo){
			return _.template($('#item-template').html())(t)
		})
		.foreach(function(){
			
		})

	// Action()
	var spinner = new Action(showSpinner)
		.onComplete(removeSpinner) 

	var cleanForm = new Action()
		.foreach()

	function gimmeSpin('#toto'){
		return new Action(...)
	}

	var saveAndAdd = addToList
		.and(gimmeSpin('#wait'))
		.and(cleanForm)
		.await(save)

	// Sources
	var values = new Reactive(function (next){ 
		next($('#new-todo').val())
	})

	var source = new Reactive(function (next){ 
			$('#new-todo').keydown(next)
		})
		.filter(function(evt){
			return evt.keyCode == 13
		})
		.await(saveAndAdd)
		.map(function(v){ 
			return Todo(v[1])
		})

	// Controller
	source.await(saveAndAdd)
		.subscribe()
	
})
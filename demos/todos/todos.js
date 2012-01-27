$(function(){
	var $P = Procrastination
	var show = function(e){console.log(">> %o", e)}

	/**
	* Views
	*/
	var views = {
		todo: {
			render: function(t){
				var template = _.template($('#item-template').html())
				return template(t)
			}
		}
	}	
	
	/**
	* Controllers	
	*/
	var inputs = 	$P($('#new-todo'))
	var todos = inputs.bind('keydown')
				.filter(function(evt, val){ return evt.keyCode == 13 })
				.flatmap(function(evt){ 
					return inputs.map(function(e){ 
						return Todo($(e).val())
					})
				})

	todos.map(views.todo.render)
			.appendTo('#todo-list')
	
	/**
	* Models
	*/
	function Todo(value){
		return { text: value, done: false, since: new Date() }
	}
})
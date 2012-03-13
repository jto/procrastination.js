$(function(){
	/**
	* Views
	*/
	var Form = {
		input: $('#new-todo'),
		clear: Call(function(v){
			Form.input.val('')
			return v
		}),
		value: Call(function(v){ 
			return Form.input.val()
		})
	}
	
	// Views
	var Todo = {
		del: function(evt){
			$(evt.tmpl).remove()
		},
		render: function(todo, n){
			var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo)).appendTo('#todo-list')

			$('.todo-destroy', el).click(function(evt){
				n({type: 'del', model: todo, tmpl: el, target: evt.target})
			})
		}
	}

	Todo.key = function(next){ $('#new-todo').keydown(next) }

	/**
	* Events
	*/
	// Create
	Reactive.on(Todo.key)
		.map(function(evt){
			return evt.keyCode
		})
		.filter(function(code){
			return code == 13
		})
		.await(Form.value.then(Form.clear))
		.filter(function(v){
			return !!v.trim().length
		})
		.map(function(v){
			return { text: v, done: false, since: new Date() }
		})
		.await(Views(Todo)
			.then(Dispatch))
		.subscribe()
})
$(function(){
	var Todo = {
		del: Action(function(evt, n){
			$(evt.tmpl).remove()
		}),

		create: Action(function(evt, n){
			var todo = evt.model,
				tmpl = _.template($('#item-template').html()),
				el = $(tmpl(todo)).appendTo('#todo-list'),
				d = function(next){
					$('.todo-destroy', el).click(next)
				}

			Reactive.on(d)
				.map(function(v){ return Event('del', todo, el) })
				.await(Call(n))
				.subscribe()
		})
	}

	var Form = {
		_input: $('#new-todo'),
		clear: Effect(function(){
			Form._input.val('')
		}),
		value: Call(function(v){ 
			return Form._input.val()
		})
	}

	Form.init = Action(function(v, n){
		var key = function(next){ Form._input.keydown(next) }
		Reactive.on(key)
			.map(function(evt){
				return evt.keyCode
			})
			.filter(function(code){
				return code == 13
			})
			.await(Form.value.then(Form.clear)) // Humf
			.filter(function(v){
				return !!v.trim().length
			})
			.map(function(v){
				return Event('create', { text: v, done: false, since: new Date()})
			})
			.await(Call(n))
			.subscribe()
	})

	/**
	* Main
	*/
	Reactive.on($)
		.map(function(){
			return Event('init')
		})
		.await(Listen(Todo, Form).then(Log))
		.subscribe()
})
/*
$(function(){
	var Todo = {
		del: Action(function(evt, n){
			$(evt.tmpl).remove()
		}),

		create: Action(function(evt, n){
			var todo = evt.model,
				tmpl = _.template($('#item-template').html()),
				el = $(tmpl(todo)).appendTo('#todo-list'),
				d = function(next){ $('.todo-destroy', el).click(next) },
				dbl = function(next){ el.dblclick(next) }

			When(d)
				.mapVal(Event('del', todo, el))
				.await(Call(n))
				.subscribe()

			When(dbl)
				.mapVal(Event('edit', todo, el))
				.await(Call(n))
				.subscribe()
		}),

		edit: Action(function(evt, n){
			var t = $(evt.tmpl),
				inp = t.addClass('editing')
					.find(':input')
					.val(evt.model.text)
					.focus()
		})
	}

	var Form = {
		_input: $('#new-todo'),
		clear: Effect(function(){
			Form._input.val('')
		}),
		value: Call(function(v){ 
			return Form._input.val()
		}),
	}
	Form.cv = Form.value.then(Form.clear)

	Form.init = Action(function(v, n){
		var key = function(next){ Form._input.keydown(next) }
		When(key)
			.map(function(evt){
				return evt.keyCode
			})
			.filter(function(code){
				return code == 13
			})
			.await(Form.cv) // Humf
			.filter(function(v){
				return !!v.trim().length
			})
			.map(function(v){
				return Event('create', { text: v, done: false, since: new Date()})
			})
			.await(Call(n))
			.subscribe()
	})

	var Counter = {
		update: Action(function(c, n){
			var tmpl = _.template($('#stats-template').html()),
				el = $(tmpl({ remaining: c, total: true, done: false }))
			$('#todo-stats').html(el)
		})
	}

	// Model
	var Count = {
		init: Call(function(n){
			return 0
		}),

		create: Call(function(n){
			return n + 1
		}),

		del: Call(function(n){
			return n - 1
		})
	}

	When($)
		.mapVal(Event('init'))
		.await(
			Listen(Todo, Form)
				.then(State(Count)
					.then(Counter.update)))
		.subscribe()

	function State(m){
		var _value = null
		return Action(function(evt, n) {
			var action = m[evt.type] || Noop
			action.onComplete(function(v){
				_value = v
				n(v)
			})._do(_value)
		})
	}
})
*/
$(function(){
	//TODO: refactor form
	var Form = {
		_input: $('#new-todo'),
		clear: Effect(function(){
			Form._input.val('')
		}),
		value: Call(function(v){ 
			return Form._input.val()
		}),
	}
	Form.cv = Form.value.then(Form.clear)
	var key = function(next){ Form._input.keydown(next) }
	NewTodo = When(key)
			.map(function(evt){
				return evt.keyCode
			})
			.filter(function(code){
				return code == 13
			})
			.await(Form.cv) // Humf
			.filter(function(v){
				return !!v.trim().length
			})
			.map(function(v){
				return { text: v, done: false, since: new Date() }
			})


	var Todo = Call(function(todo){
		var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo)).appendTo('#todo-list')

		return Effect(function(){
			d = function(next){ $('.todo-destroy', el).click(next) }

			When(d)
				.await(Effect(function(){
					todo.text = "clicked at: " + new Date
				}))
				.subscribe()
		})
	}).flatten
	
	NewTodo
		.await(Todo)
		.subscribe()
})

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
		del: Call(function(evt){
			$(evt.tmpl).remove()
			return evt
		}),

		create: Action(function(evt, n){
			var todo = evt.model,
				tmpl = _.template($('#item-template').html()),
				el = $(tmpl(todo)).appendTo('#todo-list')
			$('.todo-destroy', el).click(function(evt){
				n({ type: 'del', model: todo, tmpl: el })
			})
		}),
	},

	Count = {
		_c: 0,
		update: Action(function(evt, n){
			var tmpl = _.template($('#stats-template').html()),
				el = $(tmpl({ remaining: Count._c, total: true, done: false }))

			$('#todo-stats').html(el)
		})
	}

	Count.del = Call(function(evt){
		Count._c--
		return evt
	}).then(Count.update)

	Count.create = Call(function(evt){
		Count._c++
		return evt
	}).then(Count.update)

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
		.await(Views(Todo, Count))
		.subscribe()
})

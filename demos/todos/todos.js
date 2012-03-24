$(function(){

	// shoul be in Action prototype
	function Dispatch(){
		var views = Array.prototype.slice.call(arguments)
		return Action(function(evt, n){
			views.forEach(function(view){
				view[evt.type]
					.onComplete(n)
					._do(evt)
			})
		})
	}

	function Event(type, model, tmpl){
		return { type: type, model: model, tmpl: tmpl }
	}

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
				el = $(tmpl(todo)).appendTo('#todo-list'),
				d = function(next){
					$('.todo-destroy', el).click(next)
				}

			Reactive.on(d)
				.map(function(v){
					return Event('del', todo, el)
				})
				.await(Call(n))
				.subscribe()
		}),

	},

	Count = {
		_c: 0, // XXX
		render: Action(function(evt, n){
			var tmpl = _.template($('#stats-template').html()),
				el = $(tmpl({ remaining: Count._c, total: true, done: false }))

			$('#todo-stats').html(el)
		})
	}

	Count.del = Call(function(v){
		Count._c--
		return v
	}).then(Count.render)

	Count.create = Call(function(v){
		Count._c++
		return v
	}).then(Count.render)

	var Render = Dispatch(Todo, Count)
	var Init = Call(function(m){
		return Event('create', m)
	}).then(Render)


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
		.await(Init.then(Render))
		.subscribe()
})
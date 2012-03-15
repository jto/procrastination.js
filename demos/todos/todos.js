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
		del: Call(function(v){
			$(v[0].tmpl).remove()
			return v
		}),

		create: Call(function(v){
			var evt = v[0],
				views = v[1],
				todo = evt.model,
				tmpl = _.template($('#item-template').html()),
				el = $(tmpl(todo)).appendTo('#todo-list')

			var d = function(next){
				$('.todo-destroy', el).click(next)
			}

			Reactive.on(d)
				.map(function(v){
					return { type: 'del', model: todo, tmpl: el }
				})
				.await(Dispatch(views))
				.subscribe()

			return evt
		}),

	},

	Count = {
		_c: 0, // XXX
		render: Call(function(v){
			var evt = v[0],
				views = v[1],
				tmpl = _.template($('#stats-template').html()),
				el = $(tmpl({ remaining: Count._c, total: true, done: false }))

			$('#todo-stats').html(el)
			return v
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
		.map(function(todo){
			return { type: 'create', model: todo }
		})
		.await(Views(Todo , Count)
			.then(Log))
		.subscribe()
})
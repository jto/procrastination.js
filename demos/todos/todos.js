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

			Reactive.on(d)
				.mapVal(Event('del', todo, el))
				.await(Call(n))
				.subscribe()

			Reactive.on(dbl)
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
		Reactive.on(key)
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
		update: Action(function(evt, n){
			var tmpl = _.template($('#stats-template').html()),
				el = $(tmpl({ remaining: Counter._c, total: true, done: false }))
			$('#todo-stats').html(el)
		})
	}
	Counter.del = Effect(function(evt){ Counter._c-- }).then(Counter.update)
	Counter.create = Effect(function(evt){ Counter._c++ }).then(Counter.update)
	Counter.init = Effect(function(){ Counter._c = 0 }).then(Counter.update)

	/**
	* Main
	*/
	Reactive.on($)
		.mapVal(Event('init'))
		.await(Listen(Todo, Form, Counter).then(Log))
		.subscribe()
})
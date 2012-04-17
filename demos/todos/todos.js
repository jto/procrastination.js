"use strict"
$(function(){
	var w = function(a){
		console.warn('TODO: replace w by a flatmap on map')
		return Id.map(function(e){return e.model}).then(a)
	} // TODO: flatmap on Match
	
	var Todo = {
		_tmpl: _.template($('#item-template').html()),

		route: function(){  // state monad ?
			var state
			return Match
				.on(function(evt){ return evt.type })
				.value('create', w(Todo.create).then(Call(function(m){
					state = m[1]
					return m[0]
				})))
				.value('del', w(Todo.del(state)))
				.value('edit', w(Todo.edit(state)))
				.action()
		},
		
		del: function(el){
			return Action(function(todo, n){ 
				$(el).remove()
				n([Event('del', todo), el]) // should be done implicitly by the fwk
			})
		},

		create: Action(function(todo, n){
			var el = $(Todo._tmpl(todo)).appendTo('#todo-list'),
				d = function(next){ $('.todo-destroy', el).click(next) },
				dbl = function(next){ el.dblclick(next) }
			Reactive.on(d)
				.await(Todo.del(el))
				.mapVal([Event('del', todo), el])
				.await(Call(n))
				.subscribe()
			
			Reactive.on(dbl)
				.await(Todo.edit(el, n))
				.mapVal([Event('edit', todo), el])
				.await(Call(n))
				.subscribe()

			n([Event('create', todo), el]) // should be done implicitly by the fwk
		}),

		edit: function(el){
			return Action(function(todo){
				var i = el.addClass('editing')
					.find(':input')
					.val(todo.text)
					.focus()
				Reactive.on(function(n){i.click(n)})
					.await(Todo.create)
					.then(Call(n))
					.subscribe()
			})
		}
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

	// Model
	var Count = (function(){
		var tmpl = _.template($('#stats-template').html()),
			render = Effect(function(c){
				var el = $(tmpl({ remaining: c, total: true, done: false }))
				$('#todo-stats').html(el)
			}),
			c = 0
		return Match
			.on(function(evt){ return evt.type })
			.value('create', Call(function(){return c++}).then(render))
			.value('del', Call(function(){return c--}).then(render))
			.value('init', Call(function(){return c}).then(render))
			.action()
	})()

	/**
	* Main
	*/
	Reactive.on($)
		.mapVal(Event('init'))
		.await(Form.init
			.then(Todo.route()
				.then(Count)))
		.subscribe()
})
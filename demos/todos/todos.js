$(function(){


	function Dispatch(ls){
		return Action(function(evt, n){
			ls.forEach(function(l){
				if(l[evt.type])
					l[evt.type].onComplete(n)._do(evt)
			})
		})
	}

	function Event(type, model, tmpl){
		return { type: type, model: model, tmpl: tmpl }
	}

	var Effect = function(ƒ){
		return Call(function(v){
			ƒ(v)
			return v
		})
	}

	function Listen(){
		var ls = Array.prototype.slice.call(arguments)
		// TODO: recursive Dispatch
		return Action(function(v, n){
			var r = function(v){
				Dispatch(ls).onComplete(r)._do(v)
				n(v)
			}
			r(v)
		})
	}

	/**
	* Views
	*/
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
	* Events
	*/
	// Create
	Reactive.on($)
		.map(function(){
			return Event('init')
		})
		.await(Listen(Todo, Form).then(Log))
		.subscribe()
})
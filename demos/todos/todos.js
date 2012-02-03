$(function(){
	
	/**
	* Utilities Actions
	* Should be provided by procrastination.js
	*/
	var P = {
		req: function (method, url){
			return Action(function(data, next){
				console.log('%s -> %o', method, data)
				setTimeout(function(){ next(data) }, 500)
			})
		},
		PUT :function(url){ return P.req('PUT', url) },
		POST: function(url){ return P.req('POST', url) },
		DELETE: function(url){ return P.req('DELETE', url) },
		log: Action(function(v, n){
			console.log('LOG: %o', v)
			n(v)
		})
	}
	
	/**
	* Views
	*/
	function Spin(a){
		var sp = new Spinner({
				lines: 6,
				length: 1,
				width: 5,
				radius: 11,
				color: '#000',
				speed: 1,
				trail: 50,
				shadow: false,
				hwaccel: true
			}),
			show = Action(function(v, next){
				sp.spin(document.getElementById('create-todo'))
				next(v)
			}),
			hide = Action(function(v, next){
				sp.stop()
				next(v)
			})
		return a.and(show).then(hide)
	}

	var Form = {
		input: $('#new-todo'),
		clear: Action(function(v, next){
			Form.input.val('')
			next(v)
		}),
		value: Action(function(v, next){ 
			next(Form.input.val())
		})
	}
	
	var Todo = {}	
	Todo.tmpl = Action(function(todo, next){
		var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo))
				.appendTo('#todo-list')
		next([todo, el])
	})
	
	Todo.remove = function(v){
		var el = v[1]
		return Todo.del
			.and(Action(function(v, next){
				$(el).remove()
				next(v)
			}))
	} 
	
	Todo.bind = Action(function(v, n){
		var el = v[1]
		Reactive
			.on(function(next){
				$('.todo-destroy', el[1]).click(next, false)
			})
			.map(function(evt){ return v })
			.await(Todo.remove(v))
			.subscribe()
		n(v)
	})
	
	Todo.add = Todo.tmpl.then(Todo.bind)
	Todo.create = Spin(Todo.add.and(P.PUT('/todo')))
	Todo.postpone = Spin(P.POST('/todo'))
	Todo.del = Spin(P.DELETE('/todo'))

	Todo.key = function(next){ $('#new-todo').keydown(next, false) }

	/**
	* Events
	*/
	// Create
	Reactive
		.on(Todo.key)
		.filter(function(evt){
			return evt.keyCode == 13
		})
		.await(Form.value)
		.filter(function(v){
			return !!v.trim().length
		})
		.map(function(v){
			return { text: v, done: false, since: new Date() }
		})
		.await(Form.clear.and(Todo.create))
		.subscribe()

})
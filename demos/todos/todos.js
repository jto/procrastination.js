$(function(){

	// TODO: Add this to procrastination.js
	var Keep = Action(function(v, n){
		n(v)
	})

	function Views(){
		var args = Array.prototype.slice.call(arguments)
		return Action(function(v, n){
			return [v, args.map(function(view){
				view.render(v)
			})]
		})
	}

	var Log = Action(function(v, n){
		console.log('-- %o', v)
		n(v)
	})
	
	/**
	* Views
	*/
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
	
	// Views
	var Todo = {
		delete: function(evt){
			console.log('delete %o', evt)
		},
		render: function(todo, n){
			var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo)).appendTo('#todo-list')

			$(el).find('.todo-destroy').click(function(evt){
				n({type: 'delete', model: todo, tmpl: el, target: evt.target})
			})
		}
	}

	Todo.key = function(next){ $('#new-todo').keydown(next, false) }

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
		.await(Form.value)
		.filter(function(v){
			return !!v.trim().length
		})
		.map(function(v){
			return { text: v, done: false, since: new Date() }
		})
		.await(Views(Todo).then(Log))
		.subscribe()
})
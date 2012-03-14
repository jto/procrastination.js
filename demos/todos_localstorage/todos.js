$(function(){

	/**
	* Views
	*/

	// Form
	var Form = {
		input: $('#new-todo'),
		submit: function(n){
			$('form').submit(function(e){
				e.preventDefault()
				n(e)
			})
		},
		clear: Call(function(v){
			Form.input.val('')
			return v
		}),
		value: Call(function(v){ 
			return Form.input.val()
		})
	}

	// Todo item
	var Todo = {
		del: Call(function(e){
			$(e.tmpl).remove()
			return e
		}),
		toggle: Call(function(e){
			$(e.tmpl).toggleClass("done", e.model.done)
			return e
		}),
		render: Action(function(e, n){
			var todo = e.model
			var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo)).appendTo('#todo-list')

			$('.check', el).change(function(e){
				todo.done = $(e.target).is(":checked")
				n({type: 'toggle', model: todo, tmpl: el, target: e.target})
			})
			$('.todo-destroy', el).click(function(e){
				n({type: 'del', model: todo, tmpl: el, target: e.target})
			})
		})
	}

	// Localstorage are views
	var TodoStore = new Store("todos")
	var Todos = {
		del: Call(function(e){
			TodoStore.destroy(e.model)
			return e
		}),
		toggle: Call(function(e){
			TodoStore.update(e.model)
			return e
		}),
		render: Action(function(e, n){
			var todo = e.model
			if (!todo.id) todo = TodoStore.create(todo)
		})
	}

	/**
	 * Models
	 */

	// Todo
	var TodoData = function(v){
		return { text: v, done: false, since: new Date() }
	}

	/**
	* Events
	*/

	// Create todo from input form
	Reactive.on(Form.submit)
		.await(Form.value.then(Form.clear))
		.filter(function(v){
			// not empty value
			return !!v.trim().length
		})
		.map(TodoData)
		.await(Views(Todo, Todos))
		.subscribe()

	Reactive.on(function(n){
			// not a nicer way ?!
			var list =  TodoStore.findAll()
			for( todo in list){
				n( list[todo] )
			}
		})
		.await(Views(Todo, Todos))
		.subscribe()

})


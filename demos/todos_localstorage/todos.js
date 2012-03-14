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
		toggle: Action(function(e,n){
			$(".todo",e.tmpl).toggleClass("done", e.model.done)
			n(e)
		}),
		render: Action(function(e, n){
			var todo = e.model
			var tmpl = _.template($('#item-template').html()),
			el = $(tmpl(todo)).appendTo('#todo-list')

			$('.check', el).change(function(evt){
				todo.done = $(evt.target).is(":checked")
				n({type: 'toggle', model: todo, tmpl: el, target: evt.target})
			})
			$('.todo-destroy', el).click(function(evt){
				n({type: 'del', model: todo, tmpl: el, target: evt.target})
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




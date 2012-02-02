$(function(){
	
	/**
	* Utilities Actions
	* Should be provided by procrastination.js
	*/
	function PUT(url){
		return new Action(function(data, next){
			console.log('PUT %o', data)
			setTimeout(function(){ next(data) }, 500)
			//$.put(url, data, next)
		})
	}
	
	function POST(url){
		return new Action(function(data, next){
			console.log('POST %o', data)
			setTimeout(function(){ next(data) }, 500)
			//$.put(url, data, next)
		})
	}

	var Append = new Action(function(view, next){
		view.render()
		next(view)
	})
	
	/**
	* Views
	*/
	var TodoIn = {
		el: $('#new-todo'),

		value: new Action(function(v, next){ 
			next(TodoIn.el.val())
		}),

		clear: new Action(function(v, next){
			TodoIn.el.val('')
			next(v)
		}),
		
		key: function(next){ $('#new-todo').keydown(next, false) }
	}
	
	function Line(todo){
		this.el = undefined
		this.parent = $('#todo-list')
		this.tmpl = _.template($('#item-template').html())
		this.todo = todo
	}
	Line.prototype = {
		render: function(){
			this.el = $(this.tmpl(this.todo)).appendTo(this.parent)
			return this
		},
		
		del: function(next){
			$('.todo-destroy', this.el).click(next)
		},
		
		postpone: function(next){
			$('.check', this.el).click(next)
		}
	}

	/**
	* Actions
	*/
	var Spinner = {
		show: new Action(function(v, next){
			console.log('doing stuff')
			next(v)
		}),
		
		hide: new Action(function(v, next){
			console.log('Finished')
			next(v)
		})
	}

	var NewTodo = Append
		.and(TodoIn.clear)
		.and(Spinner.show)
		.and(PUT('/todo'))
		.then(Spinner.hide)

	var Postpone = POST('/todo')
		.and(Spinner.show)
		.then(Spinner.hide)

	/**
	* Events
	*/
	new Reactive()
		.on(TodoIn.key)
		.filter(function(evt){
			return evt.keyCode == 13
		})
		.await(TodoIn.value)
		.map(function(v){
			return new Line({ text: v, done: false, since: new Date()})
		})
		.await(NewTodo)
		.subscribe()
})
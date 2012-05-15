$(function(){
	"use strict"
	
	// Should be part of MVC
	// åTODO
	var DummyView = function(tmpl, parent, binder){ 
		var b = binder || noop
		return Call(function(model){
				function D(model){
					this._t = model
					this.tmpl = tmpl
					this.el = this.render().appendTo(parent)
					b(this.el, model)
				}
				D.prototype = {
					update: function(){ this.el.replaceWith(this.render()) },
					render: function(){ return $(this.tmpl(this._t)) },
					del : function() { this.el.remove() }
				}
				var d = new D(model)
				return Call(function(v){
					d.update.call(d, v)
				})
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
	
	Form.cv = Form.value.then(Form.clear)

	Form.init = When(function(next){ Form._input.keydown(next) })
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
			return Var({text: v, done: false, since: new Date()})
		})


	var Todo = DummyView(_.template($('#item-template').html()), '#todo-list', function(rendered, model){
		When(function(n){ rendered.find('.todo-destroy').click(n) })
			//.await(this._t.delete)
			.await(Effect(function(v){
				model.text = "deleted"
			}))
			.subscribe()
			// TODO: bind deletion
	})
	var Debug = DummyView(_.template('<li><%=text%></li>'), '#debug')

	var Sub = Effect(function(as){
		var model = as[0],
			views = as[1]
		model.await(views[0].and(views[1])).subscribe()
	})

	Form.init
		.await(Id.and(Todo.and(Debug))
			.then(Sub))
		.subscribe()
	

	/**
	* TODO: Refactor, it's ugly
	* TODO: put that into procrastination.js
	*/
	var Var = function Var(obj){
		var S = { data: obj }
		
		/**
		* Q is used to create pushable reactives,
		* This may (probably?) be an overcomplicated way of doing this...
		*/
		var Q = function(){ this._n = function(){throw "NotYetSubscribed"} }
		Q.prototype.ƒ = function(next){
			this._n = next
		}
		Q.prototype.push = function(value){ this._n(value) }
	
		var q = new Q(),
			R = When(function(n){q.ƒ(n)}), // TODO: why is this dereferenced, might be the same issue with jQuery
			qdel = new Q()

		R.onDelete = When(function(n){qdel.ƒ(n)}),
		R.delete = Action(function(){ qdel.push('delete') })

		var oldSub = R.subscribe
		R.subscribe = function(){
			oldSub.call(this)
			R.onDelete.subscribe()
			console.log(qdel._n)
		}
		
		// TODO: bulk update (+ support new getter setters if necessary)
		for(var i in obj){
			// wtf safari ?
			(function(i){
				Object.defineProperty(R, i, {
					enumerable : true,
					configurable : true,
					get : function(){
						return S.data[i]
					},
					set : function(v){
						S.data[i] = v;
						q.push(S.data)
					}
				})
			})(i)
		}
		return R;
	}	
})
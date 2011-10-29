$(function(){
	var $P = Procrastination
	var show = function(e){console.log(">> %o", e)}
	
	// Controllers	
	$P($('#new-todo'))
		.bind('keydown')
		.filter(function(evt, val){
			return evt.keyCode == 13
		})
		.map(function(evt){
			return Todo("TODO: find how to keep track of the original input")
		})
		.each(show)
		
	
	// Models
	function Todo(value){
		return { title: value, done: false, since: new Date() }
	}
})
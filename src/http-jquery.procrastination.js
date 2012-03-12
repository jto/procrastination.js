var Http = {
	m: Match.specialized({
		OK: function(a){ return this.value(200, a) },
		ERROR: function(a){ return this.value(500, a) }
	}).on(function(r){ return r.status }),
	
	GET: function(url){
		return Action(function(v, n){
			$.get(url, n)
		})
	},
	
	POST: function(url){
		return Action(function(v, n){
			$.post(url, n)
		})
	},

}
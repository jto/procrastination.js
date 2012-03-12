$(function(){
	
function gimme(start, stop, ratio) {
	return Math.round(start + ratio * (stop - start))
}

var all = document.querySelector("header"),
	mask = document.querySelector("#sheet"),
	sheet = document.querySelector("#sheet div"),
	download = document.querySelector("#download"),
	fork = document.querySelector("#fork"),
	content = document.querySelector("#content")

var scroll = function(next){ document.onscroll = next }

var animateSheet = Action(function(ratio, next, n){
		if (ratio < 1){
			n = gimme(0, 20, ratio)/100
			mask.style.webkitTransform = 'translate3d('+ gimme(-20,-286, ratio) +'px, '+ gimme(22, -50, ratio) +'px, 0) rotateZ(15deg)'
			sheet.style.webkitTransform = 'translate3d('+ gimme(293,18, ratio) +'px, 26px, 0) rotateZ(15deg)'
			download.style.webkitMask = "url(mask.png) -"+ gimme(55, 345, ratio) +"px 0 no-repeat"
			download.style.backgroundColor = "rgba(0,0,0,"+n+")"
			fork.style.webkitMask = "url(mask2.png) -"+ gimme(55, 345, ratio) +"px 0 no-repeat"
			fork.style.backgroundColor = "rgba(0,0,0,"+(.2-n)+")"
		} else if (ratio < 1.3 && ratio > 1){
			ratio = (ratio - 1)*3
			mask.style.webkitTransform = 'translate3d('+ gimme(-286,-400, ratio) +'px, '+ gimme(-50, -80, ratio) +'px, 0) rotateZ(15deg)'
		}
		next()
	})
	, animateWrapper = Action(function(ratio, next){
		if (ratio < 1.3 && ratio > 1){
			ratio = (ratio - 1)*3
			all.style.top = gimme(0, -200, ratio) + 'px'
			content.style.top = gimme(1600, 1300, ratio) + 'px'
		}
		next()
	})

Reactive
	.on(scroll)
	.map(function(){
		// We animate the first 1000 pixels to scroll
		// this gives u the ratio
		return  window.scrollY / 1000
	})
	.await( animateSheet.and(animateWrapper) )
	.subscribe()

var clickLogo = function(next){ 
	all.addEventListener('click',next, true)
	all.addEventListener('click',next, false)
}

Reactive
	.on(clickLogo)
	.await( Action(function(e){
		console.log(e)
		sheet.style.display = sheet.style.display == "none" ? "block" : "none"
	}))
	.subscribe()

});


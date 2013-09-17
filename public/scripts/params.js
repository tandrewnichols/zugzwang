(function($, wgbc, undefined){
	
	$(function(){
		wgbc.params = {};
		window.location.search.substring(1).split('&').forEach(function(v, i, a){
			var pair = v.split('=');
			wgbc.params[pair[0]] = pair[1];
		});
	});
	
})(jQuery, (window.wgbc = window.wgbc || {}));

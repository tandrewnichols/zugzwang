(function($, wgbc, undefined){
	
	// Setup vars
	var History = window.History,
		current = 0,
		highest = 0,
		songCount = 0;
	
	// Make sure the browser is compatible with History API	
	if (!History.enabled) {
		return false;
	}
	
	$(function(){
		
		/*
		 * Push initial state to history. This is important to ensure that the back
		 * button transitions content in the correct direction. This does NOT trigger
		 * a second load of the page, so we don't have to mess with detection in the
		 * statechange handler.
		 */
		History.pushState({
			template: $("html").html(), 
			vars: {
				active: $("#top-nav ul li.active").length ? $("#top-nav ul li.active").attr('id').replace('nav-', '') : '',
				title: $("title").html(),
				scripts: $('script[scr]').map(function(){
					return $(this).attr('src');
				})
			}, 
			id: 0
		}, $("title").html(), window.location.href);
		
		/*
		 * Handles rendering of templates and decides on the correct slide direction,
		 * based on the history id, when loading 'new' pages. 
		 */
		$(window).bind('statechange', function(e){
			var dir = 'left';
			var data = History.getState().data;
			if (data.id < current) dir = 'right';
			current = data.id;
			render(data, dir);
		});
		
		/*
		 * When any ajax button is clicked, we want to navigate to the appropriate page
		 * via ajax content loading and history.js. So we get the url and method, see if
		 * there's a deferred form, and then either submit the form with a redirect to
		 * the new page, or get the template and push the new state to history.
		 */
		$(document).on('click', '.ajax-btn', function(e){
			e.preventDefault();
			var url = $(this).attr('data-url') || $(this).attr('href');
			var method = $(this).attr('data-method') || 'GET';
			ajaxRequest(url, method.toUpperCase());
		});
		
		/*
		 * Generalized handler for ajax requests.
		 */	
		var ajaxRequest = wgbc.ajaxRequest = function (url, method, data, opts) {
			if (!url || !method) return;
			var defaults = {
				url: url,
				type: method,
				dataType: 'json',
				success: function(data){
					data.id = ++highest;
					History.pushState(data, data.swig.title, url);
				},
				error: function(data) {
					console.log(data);
				},
				data: {}
			};
			var options = $.extend({}, defaults, opts);
			$.ajax(options);
		};
		
		/*
		 * When an ajax form is submitted, we want to do it via ajax if possible.
		 * Some browsers can't handle files via ajax, so in those cases, we'll just
		 * submit the form (or a pending deferred form) per normal.
		 */
		$(document).on('submit', '.ajax-form', function(e){
			// If we can, submit the form through ajax; otherwise, let it submit normally
			if (window.FormData) {
				e.preventDefault();
				xhrRequest($(this));
			}
		});
		
		/*
		 * Generalized handler for xhr requests
		 */
		var xhrRequest = wgbc.xhrRequest = function (form, opts) {
			if (!form) return;
			var defaults = {
				method: 'POST',
				async: true,
				action: form.attr('action'),
				callback: function(data) {
					var content, alert;
					if (data.success) {
						content = "Data was successfully uploaded to the server.";
						alert = "alert-info";
					} else {
						content = "Office down! " + data.error;
						alert = "alert-danger";
					}
					
					var info = $("<div />", {
						id: "upload-complete",
						"class": "alert " + alert,
					}).append($("<button />", {
						type: "button",
						"class": "close",
						"data-dismiss": "alert",
						html: "&times;"
					})).append(content).insertBefore(form)
					setTimeout(function(){
						$("#upload-complete").fadeOut('slow', function(){
							$("#upload-complete").remove();
						});
					}, 3000);
					
					var reset = form.find("#btn-reset");
					if (reset.length) reset.click();
					$(window).scrollTop(0);
					form.trigger('xhr-complete', data);
				}
			};
			var options = $.extend({}, defaults, opts);
			var data = new FormData(form[0]);
			var xhr = new XMLHttpRequest();
			xhr.open(options.method, options.action, options.async);
			xhr.send(data);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) options.callback(JSON.parse(xhr.responseText));
			}
		}
		
		/*
		 * Render a template returned by the server.
		 */
		var render = wgbc.render = function (data, hide, show) {
			$('#main-inner').hide('slide', hide, 500, function(){
				var template = $(data.template);
				var inner = template.attr('id') == "main-inner" ? template : template.find("#main-inner");
				inner.hide();
				var upload = inner.find("#upload-complete");
				if (upload.length) upload.remove();
				$('#main').empty().append(inner);
				$("#main-inner").show('slide', show, 500, function(){
					if (data.vars.scripts) {
						$.each(data.vars.scripts, function(i, s){
							$.getScript(s);
						});
					}
				});
				if ($("#top-nav ul li.active").length) $("#top-nav ul li.active").removeClass("active");
				$("#nav-" + data.vars.active).addClass("active");
			});
		};
		
		var defer = tilde.defer = function(target, form){
			var files = form.find("input[type='file']").clone();
			ajaxRequest(form.attr('action'), form.attr('method'), form.serialize(), {success: function(data){
				if (!tilde.deferredForm) 
					tilde.deferredForm = $("<form>").attr("method", self.attr("data-method")).attr("action", self.attr("data-url"));
				files.each(function(i, k){
					k.attr("name", k.attr("name") + data.id);
					tilde.deferredForm.append(k);
				});
				if ($(".btn-reset").length) 
					$(".btn-reset").click();
			}});
		};
		
		/*
		 * General form reset behavior. Clear inputs and textareas, remove added elements (may
		 * 	not happen on every form), and reset selects to their default values
		 */
		$(".btn-reset").click(function(){
			var form = $(this).closest('form');
			form.find(".added").remove();
			form.find("input, textarea").val("");
			form.find("select").each(function(){
				$(this).val($(this).children("option.default").val());
			});
			form.find("input[autofocus]").focus();
		});
	});
})(jQuery, (window.wgbc = window.wgbc || {}));

exports.register = function(app, cb) {
	
	// Extend view data
	app.use(function(req, res, next){
		req.swig = extendView(req);			
		next();
	});
	
	// Build template and send response
	app.use(function (req, res, next) {
		var template = req.template || 'error/404';
		var vars = req.vars || {};
		if (req.xhr) {
			var template = __dirname + '/views/' + template + '.html';
			var tmpl = swig.compileFile(template);
			res.send(200, {template: tmpl.render(vars), vars: vars});
		} else {
			res.render(template, vars);
		}
	});
	
	// Error Handler
	app.use(function (err, req, res, next) {
		req.swig = extendView(req);
		req.logger.error((typeof err === 'string') ? err : JSON.stringify(err, null, 4));
		if (req.xhr) res.send(500, {error: err});
		else res.render('error/500', {error: err});
	});
	
	cb();
}

var extendView = function(req){
	return _.extend({
		member: req.member,
		js: req.js.renderTags(),
		css: req.css.renderTags()
	}, req.swig || {})
}
var argv = require('optimist')
	.usage('Start the web server.\nUsage $0')
	.describe('debug', 'Turn on debugging')
	.alias('d', 'debug')
	['boolean']('debug')
	.argv;
	
var express = require('express')
  , path = require('path')
  , http = require('http')
  , app = express()
  , cons = require('consolidate')
  , swig = require('swig')
  , fs = require('fs')
  , os = require('os')
  , async = require('async');
  
if (os.platform().match(/^win/) === null) {
	fs.exists('/var/tmp/zugzwang', function(exists){
		if (!exists) {
			fs.mkdir('/var/tmp/zugzwang', function(err){
				if (err) console.warn(err);
			});
		}
	});
}

swig.init({ 
	root: path.join(__dirname, 'views'),
	allowErrors: true,
	// filters: require(path.join(__dirname, 'lib/filters.js'))
});

app.configure(function(){
	app.set('port', process.env.PORT || process.env.NODE_PORT || 3001);
	app.set('debug', argv.debug);
	app.engine('html', cons.swig)
	app.set('view engine', 'html');
	app.set('views', path.join(__dirname, '/views'));
	app.set('view options', {layout: false});
	app.use(express.cookieParser("I'm a little teapot, short and stout"));
	app.use(express.bodyParser({keepExtensions: true, uploadDir: '/var/tmp/zugzwang'}));
	app.use(express.methodOverride());
	app.use(express['static'](path.join(__dirname, 'public')));
	
	// Error handler
	app.use(function(err, req, res, next){
		console.warn((typeof err === 'string') ? err : JSON.stringify(err, null, 4));
		if (req.xhr) res.send(500, {error: err});
		else res.render('error/500', {error: err});
	});
});

// Routing
var routes = require('./routes');

// Loop over each route
async.each(routes, function(item, cb){
	app[item.method](item.path, item.func);
	cb();
}, function(err){
	if (err) console.warn(err);
	
	// Global middleware for determining the type of response to send.
	// Set in callback to ensure it's the LAST matching route for any request.
	app.use(function(req, res, next) {
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
	
	// Also in callback to ensure all routes are set before creating the server
	http.createServer(app).listen(app.get('port'), function(){
		console.warn('Zugzwang app listening on port ' + app.get('port'));
	});
});
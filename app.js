// Get args
var argv = require('optimist').usage('Start the web server.\nUsage $0')
	.describe('winston', 'Set winston logging to a particular level').alias('w', 'winston').default('w', 'error')
	.describe('logpath', 'Logging path for file transport').alias('l', 'logpath')
	.describe('profile', 'Turn winston profiling on').alias('p', 'profile').boolean('p')
	.argv;
	
// Initial processing
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Core modules
var path = require('path')
  , http = require('http')
  , os = require('os')
  , fs = require('fs');
  
// Configure express
var express = require('express')
  , app = express()
  , server = http.createServer(app);
  
// Installed modules
var cons = require('consolidate')
  , swig = require('swig')
  , async = require('async')
  , cluster = require('cluster')
  , mongoose = require('mongoose')
  , piler = require('piler')
  , io = require('socket.io').listen(server);

// Local modules
var utils = require('./lib/utils')
  , config = require('./config').fetch();
  
// Configure winston
var winston = require('winston')
  , l = {
		console: {
			level: argv.winston,
			label: 'Winston.main'
		}
	};
if (argv.logpath) l.file = { level: argv.winston, filename: argv.logpath };
winston.loggers.add('main', l);
var logger = winston.loggers.get('main');

// Other configuration
var cpus = os.cpus().length || 1
  , js = piler.createJSManager()
  , css = piler.createCSSManager();
mongoose.connect(config.mongo.connection, function onMongooseError(err) {
	if(err) winston.error(err);
});
utils.extendPrototypes();
var dirs = ['/var/tmp/zugzwang', '/var/log/zugzwang'];
if (argv.logpath) dirs.push(argv.logpath);
utils.checkdir(dirs);
swig.init({ 
	root: path.join(__dirname, 'views'),
	allowErrors: true,
	filters: require(path.join(__dirname, 'lib/filters.js'))
});

// Configure app
app.configure(function(){
	js.bind(app, server);
	css.bind(app, server);
	app.set('port', process.env.PORT || process.env.NODE_PORT || 3000);
	app.engine('html', cons.swig)
	app.set('view engine', 'html');
	app.set('views', path.join(__dirname, '/views'));
	app.set('view options', {layout: false});
	app.use(express.cookieParser(config.secrets.cookie));
	app.use(express.bodyParser({keepExtensions: true, uploadDir: config.uploadDir}));
	app.use(express.methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
	
	// Add common components
	app.use(function(req, res, next){
		req.models = mongoose.models;
		req.config = config;
		req.logger = logger;
		req.js = js;
		req.css = css;
		req.io = io;
		next();
	});
});

// Configure development
app.configure("development", function(){
	js.liveUpdate(css, io);
});

// Routing
var routes = require('./routes');

async.eachSeries(routes, function(route, f){
	route.register(app, f);
}, function(err){
	if (err) logger.error(err);
			
	// Setup threading
	if (cluster.isMaster) {
		async.times(cpus, function(n, next){
			cluster.fork();
			next(null, null);
		}, function(err){
			if (err) winston.error(err);
			cluster.on('exit', function(worker){
				logger.warn('Worker ' + worker.process.pid + ' died (' + worker.process.exitCode + ') - restarting');
				cluster.fork();
			});
		});
	} else {
		// And listen
		server.listen(app.get('port'), function(){
			logger.info('Listening on port ' + app.get('port'));
		});
	}
});

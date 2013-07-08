var async = require('async')
  , routes = []
  , routing = [
  		require('./game'),
  		require('./user'),
  		require('./move')
  	];

async.each(routing, function(item, cb){
	async.each(item, function(r, f){
		routes.push(r);
		f();
	}, cb)
}, function(err){
	module.exports = routes;
});

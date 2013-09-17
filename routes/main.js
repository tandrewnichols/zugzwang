var controllers = require('../controllers');

exports.register = function(app, cb) {
	
	// main page
	app.get('/', controllers.home.index);
	
	// user routes
	app.get('/user/:uid', controllers.user.fetch);
	app.get('/user/:uid/games', controllers.user.getGames);
	app.post('/user', controllers.user.create);
	app.put('/user/:uid', controllers.user.update);
	app.del('/user/:uid', controllers.user.remove);
	app.del('/user/:uid/games', controllers.user.removeGames);
	app.get('/login', controllers.user.login);
	app.get('/logout', controllers.user.logout);
	
	// game routes
	app.get('/game/:id', controllers.game.fetch);
	app.post('/game', controllers.game.create);
	app.del('/game/:id', controllers.game.remove);
	
	// move routes
	app.get('/game/:id/moves', controllers.move.all);
	app.get('/game/:id/move/:num', controllers.move.fetch);
	app.post('/game/:id/move', controllers.move.create);
	
	cb();
}

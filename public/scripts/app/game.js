'use strict';

var game = angular.module('game', [])
	.config(function($routeProvider){
		$routeProvider.when('/game/:id', {
			templateUrl: 'partials/game.html',
			controller: GameCtrl
		})
		.when('/game/:id/move/:num', {
			templateUrl: 'partials/game.html',
			controller: GameCtrl
		})
	});

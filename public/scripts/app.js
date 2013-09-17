'use strict';

var app = angular.module('zugzwang', [
		'game'
	])
	.config(['$locationProvider', function($locationProvider) {
		$locationProvider.html5Mode(true);
	}]);


var _ = require('underscore');
var async = require('async');
var winston = require('winston');
var logger = winston.loggers.get('main');
var fs = require('fs');

exports.extendPrototypes = function() {
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
	
	String.prototype.normalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
	}
	
	String.prototype.bookCase = function() {
		return this.split(' ').map(function(v, i){
			return v.normalize();
		}).join(' ');
	}
}

var checkdir = exports.checkdir = function(dir, cb) {
	if (_.isArray(dir)) {
		async.each(dir, checkdir, function(err){
			if (typeof cb === 'function') cb(err);
			else logger.warn(err);
		});
	} else {
		var parts = dir.split('/');
		var check = function(d, f){
			fs.exists(d, function(exists){
				if (!exists) {
					logger.info('Creating ' + d);
					fs.mkdir(d, f);
				}
			});
		}
		
		var current = '';
		async.eachSeries(parts, function(part, g){
			current += '/' + part;
			check(current, g);
		}, function(err){
			if (typeof cb === 'functoin') cb(err);
			else logger.warn(err);
		});
	}
}

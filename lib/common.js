var mongoose = require('mongoose');

exports.findByWid = function(wid, cb) {
	return this.findOne({ wid: wid }, cb);
}

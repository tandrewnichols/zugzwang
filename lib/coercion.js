var moment = require('moment');

exports.toDate = function (val) {
	return moment(val).format('MM.DD.YYYY');
}

exports.fromDate = function (val) {
	return moment(val, 'X');
}
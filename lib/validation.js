var _ = require('underscore');

exports.password = function (pw) {
	var total = 0;
	total += (/[A-Z]/.test(pw) ? 1 : 0);
	total += (/[a-z]/.test(pw) ? 1 : 0);
	total += (/[0-9]/.test(pw) ? 1 : 0);
	total += (/[^0-9a-zA-Z]/.test(pw) ? 1 : 0);
	if (pw.length >= 7 && total >= 3) return true;
	else return false;
}

exports.assets = function(assets) {
	if (_.isArray(assets)) return assets.every(function(val){
		return /\.(js|css)$/.test(val);
	});
	else return false;
}

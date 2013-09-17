exports.fetch = function(){
	return /^prod/i.test(process.env.NODE_ENV) ? require('./prod.json') : require('./dev.json');
}

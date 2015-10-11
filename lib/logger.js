var	colors = require('colors/safe');

module.exports = 
	 function Logger(verbose){
		this.verbose = function(text){
			if(verbose)
			{
				console.log(text);
			}
		}
		this.error = function (err){
			console.log(colors.red(err));
		}
		this.log = function(text, color){
			if(color){
				console.log(colors[color](text));
			} else {
				console.log(text);
			}
		}
	};
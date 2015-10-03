module.exports = 
	 function Logger(verbose){
		this.verbose = function(text){
			if(verbose)
			{
				console.log(text);
			}
		}
		this.error = function (err){
			console.log(err);
		}
		this.log = function(text){
			console.log(text);
		}
	};
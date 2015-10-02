var expect = require('chai').expect;
var folders = require('../lib/folders');

describe('folders', function(){
	describe('constructFolderpathsArray', function(){
		it('should get from SiteAssets/test1 to ["SiteAssets", "SiteAssets/test1"]', function(done){
			var result = folders.getFolderPathsArray('SiteAssets/test1/super2/omg3');
			expect(result).to.deep.equal(['SiteAssets', 'SiteAssets/test1', 'SiteAssets/test1/super2', 'SiteAssets/test1/super2/omg3']);
			done();
		})
	})
});
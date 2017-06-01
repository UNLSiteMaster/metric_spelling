
var plugin = require(__dirname + '/../headless.js');
var assert = require('assert');

var testResults = [
	{
		'html': 'test',
		'text': 'this text includes some words'
	},
	{
		'html': 'test',
		'text': 'this text includes some words not words. http://www.google.com http://www.facebook.com one@gmail.com two@gmail.com mfairchild365 11 11+2 1 + 1 / 2 <test> something [test] (another word) speeeeel a b c d 1 2 3 4 + @ I II XII UNL entreé 💩💩💩 jalapeño jalapaño'
	}
];

var expectedResults = [
	{
		'html': 'test',
		'text': 'this text includes some words not words. http://www.google.com http://www.facebook.com one@gmail.com two@gmail.com mfairchild365 11 11+2 1 + 1 / 2 <test> something [test] (another word) speeeeel a b c d 1 2 3 4 + @ I II XII UNL entreé 💩💩💩 jalapeño jalapaño',
		'errors': ['speeeeel', 'entreé', 'jalapaño']
	}
];

var results = plugin.postProcess(testResults);
console.log(results);

describe('Array', function() {
	describe('#indexOf()', function() {
		it('The correct errors should be found', function() {
			assert.deepEqual(expectedResults, results);
		});
	});
});

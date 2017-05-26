
/**
 * Must define an evaluate function that is compatible with nightmare.use()
 *
 * This essentially defines a nightmare.js plugin which should run the tests and return a result object (see code for an example of the result object)
 *
 * @param metric_name the metric's machine name will be passed so that the results object can set the name correctly
 * @returns {Function}
 */
exports.evaluate = function(options) {
	//using the given nightmare instance

	var fs = require('fs');

	return function(nightmare) {
		nightmare
			.inject('js', __dirname+'/text-on-page.js')
			.evaluate(function(options) {
				//Now we need to return a result object

				var results = window.siteMasterTextOnPage.getAllText();

				return {
					//The results are stored in the 'results' property
					'results': results,

					//The metric name is stored in the 'name' property with the same value used in Metric::getMachineName()
					'name': 'metric_spelling'
				};
			}, options);
	};
};

exports.postProcess = function(results) {

	var dictionary = require('dictionary-en-us');
	var nspell = require('nspell');
	var fs = require('fs');
	var path = require('path');
	
	var base = path.dirname(require.resolve('dictionary-en-us'));
	
	// NEVER USE `readFileSync` IN PRODUCTION (This is fine, because there are not other tasks being ran on this process).
	var enDic = fs.readFileSync(path.join(base, 'index.dic'), 'utf-8');
	var enAff = fs.readFileSync(path.join(base, 'index.aff'), 'utf-8');
	
	var spell = nspell(enAff, enDic);
	
	var newResults = [];

	var emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;
	var urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/gi;

	var node, word;
	while (node = results.shift()) {
		node.errors = [];
		
		var text = node.text;

		text = text.replace(emailRegex, '');
		text = text.replace(urlRegex, '');
		
		var words = text.match(/\b(\w+)\b/g);
		
		if (!words) {
			continue;
		}
		
		while (word = words.shift()) {
			var matches = word.match(/([\d_\.@])/g);
			
			if (matches) {
				//Most likely not an actual word because it contains numbers and/or symbols
				continue;
			}
			
			if (word === word.toUpperCase()) {
				//Most likely an acronym, so skip it
				continue;
			}
			
			if (!spell.correct(word)) {
				node.errors.push(word);
			}
		}
		
		if (node.errors.length) {
			newResults.push(node);
		}
	}

	return newResults;
};

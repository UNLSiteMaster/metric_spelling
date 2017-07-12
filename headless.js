
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

	const XRegExp = require('xregexp');
	const nspell = require('nspell');
	const fs = require('fs');
	
	// Load up the english dictionary
	var enDic = fs.readFileSync(__dirname+'/en_us/en_US-large.dic', 'utf-8');
	var enAff = fs.readFileSync(__dirname+'/en_us/en_US-large.aff', 'utf-8');
	
	//Set up the spell checker with the english dictionary
	var spell = nspell(enAff, enDic);

	//load the names dictionary
	spell.personal(fs.readFileSync(__dirname+'/names.dic', 'utf8'));

	//load the geo names dictionary
	spell.personal(fs.readFileSync(__dirname+'/geo.dic', 'utf8'));
	
	//Load the custom dictionary if it exists
	var custom_dictionary_path = __dirname+'/custom.dic';
	if (fs.existsSync(custom_dictionary_path)) {
		spell.personal(fs.readFileSync(custom_dictionary_path, 'utf8'));;
	}
	
	var newResults = [];

	//Various regex patters to match strings that should be ignored
	var emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;
	var urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/gi;
	var mentionRegex = /\B(@[A-Za-z0-9_-]+)/gi;

	var node, word;
	
	//Loop though all of the nodes that were found
	while (node = results.shift()) {
		node.errors = [];
		
		//Replace ligatures with ASCII
		node.text = exports.replaceLigatures(node.text);
		
		//Now, ignore certain patterns
		var text = node.text;
		//Replace these strings that we want to ignore (to reduce false positives)
		text = XRegExp.replace(text, emailRegex, '');
		text = XRegExp.replace(text, urlRegex, '');
		text = XRegExp.replace(text, mentionRegex, '');
		text = XRegExp.replace(text, /([‘’“”])/g, '\'');
		//Now, remove any words that have a . in them (unl.edu) for example.
		text = XRegExp.replace(text, /\b(\w+\.\w+)\b/g, '');
		//Replace filenames
		text = XRegExp.replace(text, /([/\/\w]*\.(\w+))/g, '');
		
		//Match utf8 safe words (letters, numbers, and _)
		var words = XRegExp.match(text, XRegExp('([\\p{L}\\p{N}_\']+)', 'g'));
		
		if (!words) {
			//No words were found
			continue;
		}
		
		//Loop though all of the words
		while (word = words.shift()) {
			//Trim any white space, just in case
			word = word.trim();
			word = word.replace(/^[\\'"“”‘]+|[\\'"“”’]+$/g, '');
			
			if (0 === word.length) {
				//Empty word, skip
				continue;
			}
			
			var matches = word.match(/([\d_\.@])/g);
			
			if (matches) {
				//Most likely not an actual word because it contains numbers and/or symbols
				continue;
			}
			
			if (word === word.toUpperCase()) {
				//All uppercase, Most likely an acronym, so skip it
				continue;
			}
			
			if (-1 !== word.slice(1).search(/[A-Z]/)) {
				//This word contains an upper case letter after the first character. Likely humpCase or something.
				continue;
			}

			if (!spell.correct(word)) {
				//console.log(word);
				//This word is not correct, so add it as an error
				node.errors.push({
					word: word,
					suggestions: spell.suggest(word)
				});
			}
		}
		
		if (node.errors.length) {
			newResults.push(node);
		}
	}

	return newResults;
};


exports.replaceLigatures = function(text) {
	//based on this list https://en.wikipedia.org/wiki/Typographic_ligature
	var map = [
		{
			'text': 'AA',
			'match': /(\uA732)/g
		},
		{
			'text': 'aa',
			'match': /(\uA733)/g
		},
		{
			'text': 'AE',
			'match': /(\u00C6)/g
		},
		{
			'text': 'ae',
			'match': /(\u00E6)/g
		},
		{
			'text': 'AO',
			'match': /(\uA734)/g
		},
		{
			'text': 'ao',
			'match': /(\uA735)/g
		},
		{
			'text': 'AU',
			'match': /(\uA736)/g
		},
		{
			'text': 'au',
			'match': /(\uA737)/g
		},
		{
			'text': 'AV',
			'match': /(\uA738)/g
		},
		{
			'text': 'av',
			'match': /(\uA739)/g
		},
		{
			'text': 'AY',
			'match': /(\uA73C)/g
		},
		{
			'text': 'ay',
			'match': /(\uA73D)/g
		},
		{
			'text': 'ff',
			'match': /(\uFB00)/g
		},
		{
			'text': 'ffi',
			'match': /(\uFB03)/g
		},
		{
			'text': 'ffl',
			'match': /(\uFB04)/g
		},
		{
			'text': 'fi',
			'match': /(\uFB01)/g
		},
		{
			'text': 'fl',
			'match': /(\uFB02)/g
		},
		{
			'text': 'OE',
			'match': /(\u0152)/g
		},
		{
			'text': 'oe',
			'match': /(\u0153)/g
		},
		{
			'text': 'OO',
			'match': /(\uA74E)/g
		},
		{
			'text': 'oo',
			'match': /(\uA74F)/g
		},
		{
			'text': 'st',
			'match': /(\uFB06)/g
		},
		{
			'text': 'ft',
			'match': /(\uFB05)/g
		},
		{
			'text': 'ue',
			'match': /(\u1D6B)/g
		},
		{
			'text': 'VY',
			'match': /(\uA760)/g
		},
		{
			'text': 'vy',
			'match': /(\uA761)/g
		}
	];

	for(var i=0; i<map.length; i++) {
		text = text.replace(map[i].match, map[i].text);
	}
	
	return text;
};

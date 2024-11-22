window.siteMasterTextOnPage = {
	/**
	 * Get the language of an element
	 * @param textNode or element
	 */
	getLang: function (textNode) {
		var element;

		if (textNode.nodeType === 3) {
			//this is a text node
			element = textNode.parentNode;
		} else {
			element = textNode;
		}

		//Check the current element
		if (element.lang) {
			return element.lang;
		}
		
		while (element.parentNode) {
			//display, log or do what you want with element
			element = element.parentNode;

			if (element.lang) {
				return element.lang;
			}
		}
	},

	/**
	 *
	 * @param textNode or element
	 * @returns {boolean}
	 */
	isIgnoredByAttribute: function(textNode) {
		var element;
		
		if (textNode.nodeType === 3) {
			//this is a text node
			element = textNode.parentNode;
		} else {
			element = textNode;
		}
		
		
		const attribute = 'data-sitemaster-ignore-spelling';

		//Check the current element
		if (element.hasAttribute(attribute)) {
			return true;
		}

		while (element.parentNode) {
			//display, log or do what you want with element
			element = element.parentNode;
			
			if (element.nodeType === 9) {
				//We reached the document node
				return false;
			}
			
			if (element.hasAttribute(attribute)) {
				return true;
			}
		}

		return false;
	},
	/**
	 * Truncate a given string
	 * 
	 * @param str
	 * @returns {*}
	 */
	truncate: function (str) {
		if (str.length > 400) {
			str = str.substring(0, 400) + '...';
		}

		return str;
	},

	/**
	 * Get the HTML source of an element
	 * 
	 * @param element
	 * @returns {*}
	 */
	getSource: function (element) {
		var source = element.outerHTML;
		if (!source && typeof XMLSerializer === 'function') {
			source = new XMLSerializer().serializeToString(element);
		}
		return this.truncate(source || '');
	},

	/**
	 * Get all of the text nodes on a page
	 * @returns {Array}
	 */
	getTextNodes: function () {
		var walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		var node;
		var textNodes = [];

		//Ignore these elements because they likely contain words that are not in a dictionary
		var blackList = ['STYLE', 'NOSCRIPT', 'SCRIPT', 'CODE', 'ABBR', 'DATA', 'TIME', 'RUBY', 'RB', 'RT', 'RTC', 'VAR', 'PARAM', 'SOURCE', 'CANVAS', 'TEMPLATE', 'SUP'];

		//Walk over all text nodes
		while (node = walker.nextNode()) {
			if (blackList.indexOf(node.parentNode.nodeName) !== -1) {
				//Not in an element that we support, so skip
				continue;
			}

			var lang = this.getLang(node);

			if (typeof lang !== 'undefined' && !String(lang).startsWith('en')) {
				//Not a language that we support, so skip
				continue;
			}

			var text = node.nodeValue.trim();

			if (text.length) {
				var details = {
					text: text,
					isIgnoredByAttribute: this.isIgnoredByAttribute(node),
					html: this.getSource(node.parentNode)
				};

				textNodes.push(details);
			}
		}

		return textNodes;
	},

	/**
	 * Get all text that is in attributes that can be be read by AT or via other interactions
	 * 
	 * @param attributeName
	 * @returns {Array}
	 */
	getTextInAttribute: function (attributeName) {
		var results = [];
		var elements = document.querySelectorAll('*[' + attributeName + ']');

		for (var i = 0; i < elements.length; ++i) {
			var text = elements[i].getAttribute(attributeName);
			text = text.trim();

			if (text.length === 0) {
				continue;
			}

			results.push({
				'text': text,
				html: this.getSource(elements[i]),
				isIgnoredByAttribute: this.isIgnoredByAttribute(elements[i])
			});
		}
		return results;
	},

	/**
	 * Get all text on a page
	 * @returns {Array}
	 */
	getAllText: function () {
		var results = [];

		results = results.concat(this.getTextNodes());
		results = results.concat(this.getTextInAttribute('aria-label'));
		results = results.concat(this.getTextInAttribute('title'));
		results = results.concat(this.getTextInAttribute('alt'));

		return results;
	}
};

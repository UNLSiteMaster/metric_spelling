window.siteMasterTextOnPage = {
	getLang: function (element) {
		while (element.parentNode) {
			//display, log or do what you want with element
			element = element.parentNode;

			if (element.lang) {
				return element.lang;
			}
		}
	},

	truncate: function (str) {
		var maxLength = 400;

		if (str.length > maxLength) {
			var index = str.indexOf('>');
			str = str.substring(0, index + 1);
		}

		return str;
	},

	getSource: function (element) {
		var source = element.outerHTML;
		if (!source && typeof XMLSerializer === 'function') {
			source = new XMLSerializer().serializeToString(element);
		}
		return this.truncate(source || '');
	},

	getTextNodes: function () {
		var walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		var node;
		var textNodes = [];

		var blackList = ['STYLE', 'SCRIPT', 'CODE', 'ABBR', 'DATA', 'TIME', 'RUBY', 'RB', 'RT', 'RTC', 'VAR', 'PARAM', 'SOURCE', 'CANVAS', 'TEMPLATE'];

		while (node = walker.nextNode()) {
			if (blackList.indexOf(node.parentNode.nodeName) !== -1) {
				continue;
			}

			var lang = this.getLang(node);

			if (typeof lang !== 'undefined' && !lang.startsWith('en')) {
				continue;
			}

			var text = node.nodeValue.trim();

			if (text.length) {
				console.log([node]);
				var details = {
					text: text,
					html: this.getSource(node.parentNode)
				};

				textNodes.push(details);
			}
		}

		return textNodes;
	},

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
				html: this.getSource(elements[i])
			});
		}
		return results;
	},

	getAllText: function () {
		var results = [];

		results = results.concat(this.getTextNodes());
		results = results.concat(this.getTextInAttribute('aria-label'));
		results = results.concat(this.getTextInAttribute('title'));
		results = results.concat(this.getTextInAttribute('alt'));

		return results;
	}
};

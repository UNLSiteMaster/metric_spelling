# Spelling Metric

This is an english spell checker for SiteMaster

## requirements

You need to install these npm libraries

2. nspell
3. xregexp

run npm install at the SiteMaster root to install them, without saving to the tracked package.json file. This will install for the full project.

## Details

This metric will try to identify words that are spelled incorrectly. However, such a task is impossible. To minimize the number of words that are falsely identified as misspelled, we do the following:

* Only use text nodes from the DOM that are
  * In HTML elements that are meant for text (not `style`, `script`, `template`, `code`, `time`, etc elements)
  * Only check the spelling of elements identified by the en-US language via the HTML `lang` attribute.
* Use the en_US large dictionary from wordlist.sourceforge.net
* Generate and use a names dictionary based on popular names in the US
* Errors can be 'overridden' in SiteMaster. If enough sites make a side-wide override for the same word, it will be added to a custom dictionary and ignored across all sites.

## Tests

Run `mocha tests/test.js`

## sources and credits

* The english dictionary is provided by http://wordlist.sourceforge.net 'Copyright 2000-2015 by Kevin Atkinson'
* The names dictionary is generated via US Government data, from the Social Security Administration (for first names) and Census data for last names.

## BSD License Agreement

The software accompanying this license is available to you under the BSD license, available here and within the LICENSE file accompanying this software.

Copyright (c) 2017, Regents of the University of Nebraska

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the University of Nebraska nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
 BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
 DAMAGE.
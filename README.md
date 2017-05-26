You need to install two npm libraries

1. dictionary-en-us
2. nspell

run npm install at the SiteMaster root to install them, without saving to the tracked package.json file. This will install for the full project.


TODO:
* Support 'global' overrides. When enough sites have created a site override, override it everywhere else too. (5 sites)
* Show a list of these global overrides
* This metric should make 'errors' so that people will pay attention, but SiteMaster should allow metrics to opt-in to overriding errors. This setting should default to false, so that other metric's errors can NOT be overridden.



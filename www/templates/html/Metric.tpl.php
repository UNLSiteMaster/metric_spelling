<p>
    This spell checking metric is based on combined data from <a href="http://wordlist.aspell.net/">SCOWL</a> and U.S. government name data. If there are any words that are incorrectly marked as an error, please create a site-wide override for it. When enough site-wide overrides have been created, the word will be added to a custom dictionary.
</p>

<?php
$included_file = __DIR__.'/../../../custom-message.html';
if (file_exists($included_file)) {
    include $included_file;
}

?>
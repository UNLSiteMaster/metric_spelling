<p>
    This spell checking metric uses several sources including <a href="http://wordlist.aspell.net/">SCOWL</a>, <a href="http://www.wordnik.com/">wordnik</a>, and U.S. government name data. If there are any words that are incorrectly marked as an error, please create a site-wide override for it. When enough site-wide overrides have been created, the word will be added to a custom dictionary. <a href="http://wdn.unl.edu/documentation/unl-webaudit/metric-spelling">View more documentation on the spelling metric</a>.
</p>

<?php
$included_file = __DIR__.'/../../../custom-message.html';
if (file_exists($included_file)) {
    include $included_file;
}

?>


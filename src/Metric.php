<?php
namespace SiteMaster\Plugins\Metric_spelling;

use Monolog\Logger;
use SiteMaster\Core\Auditor\Logger\Metrics;
use SiteMaster\Core\Auditor\Metric\Mark;
use SiteMaster\Core\Auditor\MetricInterface;
use SiteMaster\Core\Auditor\Override;
use SiteMaster\Core\Auditor\Site\Page;
use SiteMaster\Core\RuntimeException;
use SiteMaster\Core\Util;

class Metric extends MetricInterface
{
    const WORDNIK_API_ERROR = 'api_error';
    
    /**
     * @param string $plugin_name
     * @param array $options
     */
    public function __construct($plugin_name, array $options = array())
    {
        $options = array_replace_recursive([
            'help_text' => [],
            'wordnik_api_key' => false,
            'wordnik_api_curl_opts' => [],
        ], $options);
        
        parent::__construct($plugin_name, $options);
    }
    
    public function getSpellingMarkID()
    {
        static $id;
        
        if (null !== $id) {
            return $id;
        }
        
        //Get the spelling mark ID (used during auditing)
        $metric_id = $this->getMetricRecord()->id;
        if (!$marks_id = Mark::getByMachineNameAndMetricID('spelling_error', $metric_id)->id) {
            //The mark hasn't been created before, so lets set it up
            $mark = $this->getMark('spelling_error', 'Spelling Error', 0, '', '',true);
            $marks_id = $mark->id;
        }
        
        //Save it statically
        $id = $marks_id;
        
        return $id;
    }

    /**
     * Get the human readable name of this metric
     *
     * @return string The human readable name of the metric
     */
    public function getName()
    {
        return 'Spelling (beta)';
    }

    /**
     * Get the Machine name of this metric
     *
     * This is what defines this metric in the database
     *
     * @return string The unique string name of this metric
     */
    public function getMachineName()
    {
        return 'metric_spelling';
    }

    /**
     * Determine if this metric should be graded as pass-fail
     *
     * @return bool True if pass-fail, False if normally graded
     */
    public function isPassFail()
    {
        if (isset($this->options['pass_fail']) && $this->options['pass_fail'] == true) {
            //Simulate a pass/fail metric grade
            return true;
        }

        return false;
    }

    /**
     * Scan a given URI and apply all marks to it.
     *
     * All that this
     *
     * @param string $uri The uri to scan
     * @param \DOMXPath $xpath The xpath of the uri
     * @param int $depth The current depth of the scan
     * @param \SiteMaster\Core\Auditor\Site\Page $page The current page to scan
     * @param \SiteMaster\Core\Auditor\Logger\Metrics $context The logger class which calls this method, you can access the spider, page, and scan from this
     * @throws \Exception
     * @return bool True if there was a successful scan, false if not.  If false, the metric will be graded as incomplete
     */
    public function scan($uri, \DOMXPath $xpath, $depth, Page $page, Metrics $context)
    {
        if (false === $this->headless_results || isset($this->headless_results['exception'])) {
            //mark this metric as incomplete
            throw new RuntimeException('headless results are required for the spelling metric');
        }
        
        $description = 'This word might be a spelling error. Please either correct it, or create an override for it.';
        $help_text = 'To fix this error, either correct it and rescan the page, or create an override for it. If enough site-wide overrides are created for this spelling error, it will be added to the custom dictionary.';
        $spelling_mark = $this->getMark('spelling_error', 'Spelling Error', 0, $description, $help_text,true);

        foreach ($this->headless_results as $result) {
            
            if ($result['isIgnoredByAttribute']) {
                $ignored_mark = $this->getMark(
                    'spelling_ignored',
                    'Text was ignored', 
                    0,
                    'Content can be ignored by adding a `data-sitemaster-ignore-spelling` attribute. This is usually done to suppress temporary filler text and example content.', 
                    'Please verify that the content should be ignored.'
                );
                $page->addMark($ignored_mark, array(
                    'value_found' => $result['text'],
                    'context' => $result['html']
                ));
                continue;
            }
            
            //errors are grouped by blocks of text, so iterate over the block of text
            foreach ($result['errors'] as $error) {
                
                $variants = [];
                $variants[] = $error['word'];
                if (strtolower($error['word']) !== $error['word']) {
                    //Also try lowercase
                    $variants[] = strtolower($error['word']);
                }
                
                $is_okay = false;
                foreach ($variants as $variant) {
                    if ($this->isFoundOnWordNik($variant)) {
                        //found on wordnik, so break out
                        $is_okay = true;
                        break;
                    }
                }
                
                if ($is_okay) {
                    //nothing else to do here
                    continue;
                }
                
                $help = '';
                
                if (!empty($error['suggestions'])) {
                    $help .= 'Suggestions: ' . implode(', ',$error['suggestions']) . PHP_EOL . PHP_EOL;
                }
                
                //Now iterate over the errors found in that block of text
                $page->addMark($spelling_mark, array(
                    'value_found' => $error['word'],
                    'context' => $result['html'],
                    'help_text' => $help,
                ));
            }
        }
        
        return true;
    }

    /**
     * @param $word
     * @return bool
     */
    public function isFoundOnWordNik($word)
    {
        if ($result = WordNikCache::getByWord($word)) {
            //Was already checked by wordnik (to reduce the number of calls to the API)
            return $result->isOkay();
        }
        
        //Perform a wordnik check
        $result = $this->performWorkNikAPICall($word);
        
        if (true === $result) {
            $marks_id = $this->getSpellingMarkID();
            //Store in cache
            WordNikCache::createNewRecord($word, WordNikCache::RESULT_OKAY);
            
            //Create a site wide override so that the word is added to the custom dictionary
            Override::createGlobalOverride($marks_id, $word, 'found via the wordnik api');
            
            return true;
        } else if (false === $result) {
            //This means that there was actually an error
            WordNikCache::createNewRecord($word, WordNikCache::RESULT_ERROR);
        } else {
            //API Error (error connecting, timeout, or something else).
            //Silent for now
        }
        
        return false;
    }
    
    protected function performWorkNikAPICall($word)
    {
        if (!$this->options['wordnik_api_key']) {
            //Skip if there is not api key
            return self::WORDNIK_API_ERROR; 
        }
        
        $url = 'http://api.wordnik.com:80/v4/word.json/'.urlencode($word).'/definitions?limit=1&includeRelated=false&useCanonical=false&includeTags=false&api_key='.urlencode($this->options['wordnik_api_key']);
        
        //If found add a global override
        $curl = curl_init($url);

        $default_options = array(
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_USERAGENT      => 'UNL_SITEMASTER/1.0',
            CURLOPT_RETURNTRANSFER => true,
        );

        $options = $this->options['wordnik_api_curl_opts'] + $default_options;

        curl_setopt_array($curl, $options);

        if (!$result = curl_exec($curl)) {
            Util::log(Logger::NOTICE, 'Wordnik api call failed to exec', array(
                'uri' => $url
            ));
            return self::WORDNIK_API_ERROR;
        }

        curl_close($curl);

        $result = json_decode($result);

        if (false === $result) {
            Util::log(Logger::NOTICE, 'Wordnik api call failed. Invalid JSON', array(
                'uri' => $url
            ));
            return self::WORDNIK_API_ERROR;
        }
        
        if (count($result) === 0) {
            return false;
        }
        
        return true;
    }


    /**
     * Get the help text for a mark by machine_name
     *
     * @param string $machine_name
     * @return null|string
     */
    public function getHelpText($machine_name)
    {
        if (isset($this->options['help_text'][$machine_name])) {
            return $this->options['help_text'][$machine_name];
        }

        return null;
    }
    
    public function allowOverridingErrors()
    {
        return true;
    }
    
    public function allowGlobalOverrides()
    {
        return true;
    }
}

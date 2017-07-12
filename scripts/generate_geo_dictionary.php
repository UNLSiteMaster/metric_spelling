<?php
/**
 * This script will generate the geo.dic file from outside sources.
 */

ini_set('display_errors', true);

//Initialize all settings and autoloaders
require_once(__DIR__ . '/../vendor/autoload.php');

$geonames_username = readline ('Please provide your geonames.org API username: ');

if (empty($geonames_username)) {
    $geonames_username = 'demo';
}

$dictionary = [];

/**
 * Add a location to the dictionary array
 * 
 * @param $name
 * @param $dictionary
 */
function addLocation($name, &$dictionary) {
    //Grab all unicode words (3 or more characters)
    
    
    preg_match_all(
        '/[\w\']{3,}/u',
        $name,
        $matches
    );

    if ($matches[0]) {
        foreach ($matches[0] as $part) {
            //Strip trailing 's from from words (those don't belong in a dictionary)
            $part = str_replace('\'s', '', $part);
            
            $dictionary[] = trim($part);
        }
    }
    
}

//Get all county names via the geonames.org api
$base_url = "http://api.geonames.org/searchJSON?q=county&maxRows=1000&country=US&featureCode=ADM2&username=".$geonames_username;
$results_found = 0;
$total_result_count = 0;
$start_row = 0;
$county_names = [];

$iterations = 0;
while ($results_found < $total_result_count || $results_found == 0) {
    if (count($county_names)) {
        $start_row = count($county_names)-1;
    }
    
    $json = json_decode(file_get_contents($base_url.'&startRow='.$start_row), true);
    $total_result_count = $json['totalResultsCount'];
 
    foreach ($json['geonames'] as $result) {
        $name = str_replace(' County', '', $result['name']);
        addLocation($name, $dictionary);
    }

    $results_found += 1000;
    $iterations++;
    if ($iterations > 4) {
        echo 'uhhhh.... something broke';
        break;
    }
}

//Now add everything else via an api that doesn't depend on geonames.org (speedier)
$earth = new \MenaraSolutions\Geographer\Earth();


//Loop through all known countries, states, and cities and add them to the dictionary
foreach ($earth->getCountries() as $country) {
    /**
     * @var \MenaraSolutions\Geographer\Country $country
     */

    //Now add the long name
    $country->useLongNames();
    addLocation($country->getName(), $dictionary);
    
    //now add the short name
    $country->useShortNames();
    addLocation($country->getName(), $dictionary);
    
    if ($country->getName() !== 'United States') {
        //Only dive into the US for more geo names, to reduce the number of results
        continue;
    }
    
    foreach ($country->getStates() as $state) {
        /**
         * @var \MenaraSolutions\Geographer\State $state
         */
        //
        addLocation($state->getName(), $dictionary);
        
        foreach ($state->getCities() as $city) {
            /**
             * @var \MenaraSolutions\Geographer\City $city
             */
            addLocation($city->getName(), $dictionary);
        }
    }
}

//Remove any duplicates
$dictionary = array_unique($dictionary);

//Sort it
sort($dictionary);

//Save it
file_put_contents(__DIR__.'/../geo.dic', implode("\n", $dictionary));

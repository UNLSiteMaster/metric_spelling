<?php

use SiteMaster\Core\Auditor\Override;

ini_set('display_errors', true);

//Initialize all settings and autoloaders
require_once(__DIR__ . '/../../../init.php');

if (!isset($argv[1])) {
    echo 'you must pass a word' . PHP_EOL;
    exit();
}

$metric = \SiteMaster\Core\Auditor\Metric::getByMachineName('metric_spelling');

$mark = \SiteMaster\Core\Auditor\Metric\Mark::getByMachineNameAndMetricID('spelling_error', $metric->id);

Override::createGlobalOverride($mark->id, $argv[1]);

echo 'DONE' . PHP_EOL;

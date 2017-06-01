<?php

use SiteMaster\Core\Auditor\Override;

ini_set('display_errors', true);

//Initialize all settings and autoloaders
require_once(__DIR__ . '/../../../init.php');

$metric = \SiteMaster\Core\Auditor\Metric::getByMachineName('metric_spelling');
$mark = \SiteMaster\Core\Auditor\Metric\Mark::getByMachineNameAndMetricID('spelling_error', $metric->id);

$marks = new \SiteMaster\Core\Auditor\Site\Overrides\ByScope([
    'scope'=>Override::SCOPE_GLOBAL,
    'marks_id'=>$mark->id
]);

$words = [];

foreach ($marks as $mark) {
    $words[] = $mark->value_found;
}

file_put_contents(__DIR__ . '/../custom.dic', implode("\n", $words));

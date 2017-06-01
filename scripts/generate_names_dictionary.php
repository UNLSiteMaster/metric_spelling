<?php

/**
 * Baby names are retrieved from https://www.ssa.gov/oact/babynames/limits.html
 *  - two files are chosen, one for old names (~50 years ago) and one for recent names (last year)
 * Surnames are retrieved from https://www.census.gov/topics/population/genealogy/data/2010_surnames.html
 */

$names = [];

$files = [
    __DIR__ . '/../docs/surnames.csv',
    __DIR__ . '/../docs/firstnames_new.txt',
    __DIR__ . '/../docs/firstnames_old.txt'
];

foreach ($files as $file) {
    $contents = file_get_contents($file);
    $contents = mb_convert_encoding($contents, 'UTF-8');
    $rows =  explode("\n", $contents);

    foreach ($rows as $row) {
        $data = str_getcsv($row, ",", '"');

        $name = $data[0];
        
        if (empty($name)) {
            continue;
        }
        
        if ($name == strtoupper($name)) {
            $name = ucfirst(strtolower($name));
        }
        
        if ($name == 'name') {
            continue;
        }
        
        $names[] = $name;
    }
}

$names = array_unique($names);

file_put_contents(__DIR__.'/../names.dic', implode("\n", $names));

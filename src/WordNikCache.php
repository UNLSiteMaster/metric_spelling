<?php
namespace SiteMaster\Plugins\Metric_spelling;

use DB\Record;
use SiteMaster\Core\Registry\Site\Member;
use Sitemaster\Core\Util;

class WordNikCache extends Record
{
    public $id; //int required
    public $word; //str(256), UNIQUE
    public $date_created; //DATETIME
    public $result;
    
    const RESULT_OKAY = 'OKAY';
    const RESULT_ERROR = 'ERROR';

    public function keys()
    {
        return array('id');
    }

    public static function getTable()
    {
        return 'metric_spelling_wordnik_cache';
    }

    /**
     * Get a PageAttributes object for a scan.
     * 
     * Inserting into the cache simply means that we have looked up this word before and stored the result
     * 
     * Only words that can not be found should be cached in this table
     *
     * @param $word string - the word to look up
     * @return bool|WordNikCache
     */
    public static function getByWord($word)
    {
        return self::getByAnyField(__CLASS__, 'word', $word);
    }

    /**
     * Create a new record
     *
     * * @param $word string - the word to look up
     * 
     * @return bool|WordNikCache
     */
    public static function createNewRecord($word, $result)
    {
        $record = new self();

        $record->word = $word;
        $record->result = $result;
        $record->date_created = Util::epochToDateTime();

        if (!$record->insert()) {
            return false;
        }

        return $record;
    }
    
    public function isOkay()
    {
        return $this->result === self::RESULT_OKAY;
    }
}

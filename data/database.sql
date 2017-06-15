CREATE TABLE IF NOT EXISTS `metric_spelling_wordnik_cache` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `word` VARCHAR(256) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `date_created` DATETIME NOT NULL,
  `result` ENUM('OKAY', 'ERROR') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `scan_html_version_index` (`word` ASC)
)
ENGINE = InnoDB;

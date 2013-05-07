<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
* Retrieve database tables from configuration file tables.php
*
* @return	string	$tabelinimi 		
*/
function table($tableName)
{
	$CI =& get_instance();
	return $CI->config->item($tableName);
}
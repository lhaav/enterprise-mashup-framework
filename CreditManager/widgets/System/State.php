<?php

  $mashupId = $_POST['mashupId'];
  if (!$mashupId) {
    die('No state selected');
  }

  $ini_file_path = realpath('conf.ini');
  $configs = parse_ini_file($ini_file_path, true);

  if (!$configs) {
    die('Missing configuration');
  }
  
  $link = mysql_connect($configs['session']['hostname'], $configs['session']['username'], $configs['session']['password']);
  if (!$link) {
    die('Could not connect: ' . mysql_error());
  }
  mysql_select_db($configs['session']['database']);
  
  if ($_POST['func'] == "getMashup") {
    $result['mashup'] = getMashup($mashupId);
    $result['socketioconfig'] = $configs['socketio'];
  }
  else if ($_POST['func'] == "setMashupMessage") {
    $topic = $_POST['topic'];
    $message = $_POST['message'];
    if (!$topic || !$message) {
      die('No message to save');
    }
    $result = setMashupMessage($mashupId, $topic, mysql_real_escape_string($message));
  }
  
  mysql_close($link);
  echo json_encode($result);
  
  function getMashup($mashupId) {
    $query = 'SELECT topic, message FROM sessions WHERE sessionid = "' . $mashupId . '"';
    $result = mysql_query($query);
    if (!$result) {
      createSessionsTable();
      $result = mysql_query($query);
      if (!$result) {
        die('Could not retrieve data');
      }
    }
    while ($row = mysql_fetch_assoc($result)) {
      $rows[] = $row;
    }
    return $rows;
  }
  
  function setMashupMessage($mashupId, $topic, $message) {
    $timestamp = date('Y-m-d H:i:s');
    $query = 'INSERT INTO sessions (timestamp, sessionid, topic, message) VALUES ("' . $timestamp . '", "' . $mashupId . '", "' . $topic . '", "' . $message . '")';
    $result = mysql_query($query);
    if (!$result) {
      createSessionsTable();
      $result = mysql_query($query);
      if (!$result) {
        die('Could not insert data');
      }
    }
    return $result;
  }

  function createSessionsTable() {
    $query = 'CREATE TABLE IF NOT EXISTS `sessions` (
                `id` int(10) unsigned NOT NULL auto_increment,
                `sessionid` varchar(255) NOT NULL,
                `topic` varchar(255) NOT NULL,
                `message` text NOT NULL,
                `timestamp` datetime NOT NULL,
                PRIMARY KEY  (`id`)
              ) AUTO_INCREMENT=0';
    mysql_query($query);
  }
?>
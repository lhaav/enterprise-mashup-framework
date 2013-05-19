<?php
  $ini_file_path = realpath('conf.ini');
  $configs = parse_ini_file($ini_file_path, true);

  if (!$configs) {
    die('Missing configuration');
  }
  
  echo json_encode($configs);
?>
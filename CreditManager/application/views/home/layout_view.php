<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="et">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-15" />
    <title><?php echo $page_title; ?></title>
    <link rel="stylesheet" type="text/css" href="<?php echo site_url('css/creditmanagement.css'); ?>" />
    <script type="text/javascript" src="<?php echo site_url('applicationutils/livevalidation-1.3.min.js'); ?>"></script>
    <script type="text/javascript" src="<?php echo site_url('applicationutils/jquery-1.9.1.min.js'); ?>"></script>    
  </head>

  <body>
    <div id="main">
      <div id="header">
        <center><a href="<?php echo site_url(); ?>"><img src="<?php echo site_url('images/logo.png'); ?>" alt="Main Page" class="<?php echo $pngfix; ?>" /></a></center>
      </div>   
       
      <div id="middle">
        <div id="content">
          <?php echo $content; ?>        
          <div class="clear"></div>     
        </div>      
        <div id="right">
          <?php echo $right; ?>
          <div class="clear"></div>  
        </div>     
      </div>     
     </div>   
  </body>
</html>
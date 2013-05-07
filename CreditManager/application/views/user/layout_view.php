<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="et">
  <head>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-15" />
    <title><?php echo $page_title; ?></title>
    <link rel="stylesheet" type="text/css" href="<?php echo site_url('css/creditmanagement.css'); ?>" />
    <script type="text/javascript" src="<?php echo site_url('applicationutils/livevalidation-1.3.min.js'); ?>"></script>
    <script type="text/javascript" src="<?php echo site_url('applicationutils/upload.min.js'); ?>"></script>  
    <script type="text/javascript" src="<?php echo site_url('applicationutils/jquery-1.9.1.min.js'); ?>"></script>
    <script type="text/javascript" src="<?php echo site_url('applicationutils/googleAPI.js'); ?>"></script>
  </head>

  <body>
    <div id="main" username='<?php echo $user; ?>' usertype='<?php echo $usertype; ?>'>  
      <div id="header">
        <center><a href="<?php echo site_url('user'); ?>"><img src="<?php echo site_url('images/logo.png'); ?>" alt="Main Page" class="<?php echo $pngfix; ?>" /></a></center>
        <span>User: <b><?php echo $user; ?></b><br />
        [ <a href="<?php echo site_url('user/logout'); ?>">Log out</a> ]</span>
      </div>  
      <div id="mashup">
        <?php echo $mashup; ?> 
      </div>
      <div id="middle">
        <?php echo $content; ?>            
        <?php echo $right; ?>     
      </div>
    </div>  
  </body>
</html>

<script type="text/javascript">
function selectHandler() {
  var selection = table.getSelection();
  var item = selection[0];
  if (item.row != null) {
    mashupID = data.getFormattedValue(item.row, 0);
  }
  $("#main").load("<?php echo site_url('user/mashup/'); ?>/" + mashupID).fadeIn('normal');
}
</script>
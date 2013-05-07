<?php echo validation_errors(); ?>
<form method="post" action="<?php echo site_url('home/login'); ?>">
  <fieldset> 
    <legend>Sign in</legend>
    <label for="email">E-mail:</label><br />
    <input type="text" class="username" name="email" id="email" value="<?php echo set_value('email'); ?>" /><br />
    <label for="password">Password:</label><br />
    <input type="password" class="password" name="password" id="password" value="" /><br /><br />
    <input type="submit" name="login" value="Login" class="button" /><br /><br />   
  </fieldset>
</form>

<br />

<fieldset> 
  <legend>Need an account?</legend>
  <br />
  <center><a href="<?php echo site_url('home/register'); ?>"><img src="<?php echo site_url('images/register.jpg'); ?>" alt="Register" title="Register" /></a></center>
  <br />
</fieldset>

<br />

<script type="text/javascript" src="<?php echo site_url('applicationutils/login.js'); ?>"></script>
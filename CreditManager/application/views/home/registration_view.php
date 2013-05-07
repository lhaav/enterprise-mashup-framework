<h1>Registration</h1>

<p><span class="note"><b>Note!</b></span> We will send a validation email to this address and you will be asked to complete the validation process.</p>

<form method="post" action="<?php echo site_url('home/register'); ?>">
  
  <label for="reg_email">Your email:</label><br />
  <input type="text" class="username" name="reg_email" tabindex=1 id="reg_email" value="<?php echo set_value('reg_email'); ?>" /><br />
  
  <label for="reg_password">Password:</label><br />
  <input type="password" class="password" name="reg_password" tabindex=2 id="reg_password" value="" /><br />
  
  <label for="reg_password2">Confirm password:</label><br />
  <input type="password" class="password" name="reg_password2" tabindex=3 id="reg_password2" value="" /><br /><br />
  
  <input type="submit" name="register" value="Register!" class="button" />
  
</form>

<script type="text/javascript" src="<?php echo site_url('applicationutils/register.js'); ?>"></script>


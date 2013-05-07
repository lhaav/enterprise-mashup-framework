<div id="right">
  <?php echo validation_errors(); ?>
  <form onSubmit="return addInvoice();">
    <fieldset> 
      <legend>New invoice upload</legend>
      <br />
      <label for="upload_button">Invoice CSV file:</label><br />
      <input type="button" id="upload_button" value="Choose file" class="button" />
      <span id="filename">No file chosen</span>
      
      <div id="uploading"><br />
        <img src="<?php echo site_url('images/loadingAnimation.gif'); ?>" alt="Uploading" />  
      </div>

      <br /><br />
      
      <label for="invoiceowner">Owner:</label><br />
      <select name="invoiceowner" id="invoiceowner" class="invoiceowner">
        <option value="default"></option>
        <?php foreach ($accounts as $account): ?>
        <option value="<?php echo $account->id; ?>"><?php echo $account->email; ?></option>
        <?php endforeach; ?>
      </select>
      
      <br /><br />
      
      <label for="invoicenotes">Notes:</label>
      <br />
      <input type="text" class="invoicenotes" name="invoicenotes" id="invoicenotes" value="<?php echo set_value('invoicenotes'); ?>" /><br />
      <input id="addinvoice" type="submit" value="Add" class="button"/><br /><br />   
    </fieldset>
  </form>

  <script type="text/javascript" src="<?php echo site_url('applicationutils/upload.js'); ?>"></script>

  <script type="text/javascript">

  function addInvoice() {
    var span = document.getElementById('filename'); 
    var spanValue = span.innerText;
    if (spanValue != 'No file chosen') {
      uploadButton.submit();
    }
    return false;
  }

  $(document).ready(function() {
    // Upload
    uploadButton = new AjaxUpload('upload_button', {
      // Location of the server-side upload script
      action: 'user/uploadCSV',
      // File upload name
      name: 'file',

      // Submit file after selection
      autoSubmit: false,
      
      // The type of data that you're expecting back from the server.
      // Html (text) and xml are detected automatically.
      // Only useful when you are using json data as a response.
      // Set to "json" in that case.
      responseType: false,
      
      // Fired after the file is selected
      // Useful when autoSubmit is disabled
      // You can return false to cancel upload
      // @param file basename of uploaded file
      // @param extension of that file
      onChange: function(file, extension){
        if (!(extension && /^csv$/.test(extension))) {
          // extension is not allowed
          alert('Only CSV format files are allowed.');
          return false;
        }

        var span = document.getElementById('filename');
        while(span.firstChild) {
          span.removeChild(span.firstChild);
        }
        span.appendChild(document.createTextNode(file));
      },
      
      // Fired before the file is uploaded
      // You can return false to cancel upload
      // @param file basename of uploaded file
      // @param extension of that file
      onSubmit: function(file, extension) {
        if (!(extension && /^csv$/.test(extension))) {
          // extension is not allowed
          alert('Only CSV format files are allowed.');
          return false;
        }

        $('#uploading').show();

      },

      // Fired when file upload is completed
      // @param file basename of uploaded file
      // @param response server response
      onComplete: function(file, data) {
        data = JSON.parse(data);
        $('#uploading').fadeOut('normal');
        var owner = document.getElementById('invoiceowner').value;
        var notes = document.getElementById('invoicenotes').value;
        jQuery.post('user/addInvoice', 
          {filenameunique: data.filenameunique, filenamealias: file, invoiceowner: owner, invoicenotes: notes},
          function() {
            document.location.reload(true);  
          }
        );
      }
    });
  });
  </script>
  <div class="clear"></div>  
</div>
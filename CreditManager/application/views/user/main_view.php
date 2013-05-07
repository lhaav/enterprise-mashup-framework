<div id="content<?php echo $mode; ?>">
  <fieldset>  
    <legend>Invoices:</legend>
    <?php 
    $flowsessioncount = sizeof($flowsessions);
    if ($flowsessioncount > 0):
    ?>

    <div id="table_div"></div>
    
    <?php else: ?>
      <p align="center" class="error">No existing sessions.</p>
    <?php endif; ?>
    
  </fieldset>

  <script type="text/javascript">

  window.onload = onLoad;
  google.load('visualization', '1', {packages:['table']});

  function drawTable(flowsessions) {
    data = new google.visualization.DataTable();
    data.addColumn('string', 'FilenameUnique');
    data.addColumn('string', 'Filename');
    data.addColumn('string', 'Uploaded');
    data.addColumn('string', 'Owner');
    data.addColumn('string', 'Uploader');
    data.addColumn('string', 'Notes');

    var rows = new Array();
    var i = 0;
    while (flowsessions[i]) {
      var filenameunique = flowsessions[i]['filenameunique'];
      var filenamealias = flowsessions[i]['filenamealias'];
      var uploadtimestamp = flowsessions[i]['uploadtimestamp'];
      var owner = flowsessions[i]['owner'];
      var uploader = flowsessions[i]['uploader'];
      var notes = flowsessions[i]['notes'];
   
      rows[i] = new Array(filenameunique, filenamealias, uploadtimestamp, owner, uploader, notes);
      i++;
    }
    data.addRows(rows);
    
    var view = new google.visualization.DataView(data);
    view.hideColumns([0]);
    table = new google.visualization.Table(document.getElementById('table_div'));
    
    table.draw(view, {showRowNumber: true});
    // Add our selection handler.
    google.visualization.events.addListener(table, 'select', selectHandler);
  }
    
  function onLoad() {
    jQuery.get("<?php echo site_url('user/getFlowSessions'); ?>/",
      function(data) {
        if (data != null) {
          drawTable(data);
        }
      },
      "json"
    );
  }
  </script>
  <div class="clear"></div>    
</div>  
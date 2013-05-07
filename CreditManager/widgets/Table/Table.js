

if (typeof(CreditManager) == "undefined") {
  CreditManager = {};
}
if (typeof(CreditManager.Widget) == "undefined") {
  CreditManager.Widget = {};
}

/**
  * Constructor
  */
CreditManager.Widget.Table = function() {
  this.widgetId = null;
  this.widgetOwner = '';
  
  this.table = null;
  this.rawData = null;
  this.visualTableObj = null;
  
  this.actionFields = [];
  this.inputFields = [];

  this.inputFieldNames = [];
};

/**
  * Other
  */
CreditManager.Widget.Table.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Table loaded. Widget ID: ' + this.widgetId);
    this.widgetOwner = this.OpenAjax.getPropertyValue('user');
    
    this.OpenAjax.hub.subscribe('**', 
      function(topic, message) {
        console.log('***************************' + topic);
      }
    );
    
    this.form = document.getElementById(this.widgetId + "widget");
    this.table = document.getElementById(this.widgetId + "datatable");
    this.configOptions = JSON.parse(this.OpenAjax.getPropertyValue('configoptions'));
    for (i = 0; i < this.configOptions.length; i++) {
      var configOption = this.configOptions[i];
      if (configOption['type'] == 'button') {
        this.actionFields.push(configOption);
      }
      else {
        this.inputFields.push(configOption);
      }
    }
    
    this.initForm();

    google.load('visualization', '1', {'callback':'console.log("Google Visualization Table Loaded")', packages:['table']});
    
    var thisWidget = this;
    var subscribeTopics = JSON.parse(this.OpenAjax.getPropertyValue('subscribetopics'));
    for (var i = 0; i < subscribeTopics.length; i++) {
      this.OpenAjax.hub.subscribe(subscribeTopics[i], function(topic, receivedData) {
        thisWidget.rawData = JSON.parse(receivedData);
        thisWidget.drawTable();
      });
      var outsideTopic = subscribeTopics[i].replace('.Data.', '.OutData.');
      this.OpenAjax.hub.subscribe(outsideTopic, function(topic, receivedData) {
        thisWidget.rawData = JSON.parse(receivedData);
        thisWidget.drawTable();
      });
    }
  },

  /**
   * Widget content initializing
   */  
  initForm: function() {
    // Legend
    var legend = document.getElementById(this.widgetId + "legend");
    if (legend != null) {
      legend.innerHTML = this.OpenAjax.getPropertyValue('widgetName');
    }
    
    // Extra input fields
    for (var i = 0; i < this.inputFields.length; i++) {
      var inputField = this.inputFields[i];
      this.inputFieldNames.push(inputField.text);
    }

    // Extra action fields
    for (var i = 0; i < this.actionFields.length; i++) {
      var actionField = this.actionFields[i];
      var element = document.createElement("input");
      element.disabled = true;
      element.setAttribute('class', this.widgetId + 'input');
      for (var key in actionField) {
        if (actionField[key] != '') {
          element.setAttribute(key, actionField[key]);
        }
      }
      this.form.appendChild(element);
    }
  },
  
  /**
   * Only when content is received the action fields will be enabled
   */
  enableActionFields: function() {
      // Enable buttons
    if (this.rawData) {
      var btns = document.getElementsByClassName(this.widgetId + 'input');
      var thisWidget = this;
      for (var j = 0; j < btns.length; j++) {
        btns[j].disabled = false;
        if (btns[j].type == 'button') {
          btns[j].onclick = function() { return thisWidget.handleButtonClick(this, thisWidget) };
        }
      }
    }
  },
 
  /**
   * Table header drawing
   */   
  drawHeader: function(rowObj) {
    var columnCount = this.visualTableObj.getNumberOfColumns();
    
    // Get existing columns
    var existingColumns = new Array();
    for (var i = 0; i < columnCount; i++) {
      existingColumns.push(this.visualTableObj.getColumnLabel(i));
    }
    
    // Get columns from message
    var neededColumns = new Array();
    for (var key in rowObj){
      neededColumns.push(key);
    }    
 
    // Get additional columns from pattern
    for (var i = 0; i < this.inputFieldNames.length; i++) {
      var inputFieldName = this.inputFieldNames[i];
      if ($.inArray(inputFieldName, neededColumns) == -1) {
        neededColumns.push(inputFieldName);
      }
    }
    
    for (var i = 0; i < neededColumns.length; i++) {
      if ($.inArray(neededColumns[i], existingColumns) == -1) {
        this.visualTableObj.addColumn('string', neededColumns[i]);
      }
    }
  },

  /**
   * Table row drawing
   */ 
  drawRow: function(rowObj) {
    var changed = false;

    var rowIDs = this.visualTableObj.getFilteredRows([{column: 0, value: rowObj['ID']}]);
    // If row doesn't exist then add, otherwise edit existing row
    if (rowIDs == '') {
      this.visualTableObj.addRows(1);
      rowID = this.visualTableObj.getNumberOfRows() - 1;
    }
    else {
      rowID = rowIDs[0];
    }
    
    var columnID = 0;
    this.visualTableObj.setCell(rowID, columnID, rowObj['ID']);

    for (var i = 0; i < this.inputFieldNames.length; i++) {
      var inputFieldName = this.inputFieldNames[i];
      var inputField = this.inputFields[i];

      var value = rowObj[inputFieldName] == null ? '' : rowObj[inputFieldName];

      if (inputField.type == 'select') {
        var values = inputField.value.split("|");
        var html = '<select class="' + inputField.name + '"';
        html = html + ' id="' + inputField.name + rowObj['ID'] + '"><option value=""></option>';
        for (var j = 0; j < values.length; j++) {
          html = html + '<option ';
          if (values[j] == value) {
            html = html + 'selected="selected" ';
          }
          html = html + 'value="' + values[j] + '">' + values[j] + '</option>';
        }
        html = html + '</select>';
        rowObj[inputFieldName] = html;
      }
    }

    var row = new Array();
    for (var key in rowObj) {
      var currentValue = this.visualTableObj.getValue(rowID, columnID);
      if (currentValue != rowObj[key]) {
        this.visualTableObj.setCell(rowID, columnID, rowObj[key]);
        changed = true;
      }
      columnID++;
    }
    return changed;
  },

  /**
   * Initializing change listeners for input fields
   */
  initExtraFieldListeners: function(thisWidget) {
    for (var i = 0; i < thisWidget.inputFields.length; i++) {
      var inputField = thisWidget.inputFields[i];
      var inputElements = document.getElementsByClassName(inputField.name);
      for (var j = 0; j < inputElements.length; j++) {
        var element = inputElements[j];
        element.onchange = function() { thisWidget.handleInputOnChange(this, thisWidget); };
      }
    }
  },
  
  /**
   * Table drawing
   */ 
  drawTable: function() {  
    // no data
    if (!this.rawData) {
      return;
    }

    if (this.visualTableObj == null) {
      // Table
      this.visualTableObj = new google.visualization.DataTable();
    }

    // multiple rows
    var tableChanged = false;
    var tableData = this.rawData['route'];
    if ($.isArray(tableData)) {
      // Based on the first element build the table columns
      this.drawHeader(tableData[0]);
      for (var i = 0; i < tableData.length; i++) {
        tableChanged = this.drawRow(tableData[i]) || tableChanged;
      }
    }
    // one row
    else {
      this.drawHeader(tableData);
      tableChanged = this.drawRow(tableData);
    }

    if (tableChanged) {
      var view = new google.visualization.DataView(this.visualTableObj);
      view.hideColumns([0]);
      var table = new google.visualization.Table(this.table);
      
      table.draw(view, {allowHtml: true, showRowNumber: true });
      
      var thisWidget = this;
      // Add select listeners for input fields
      this.initExtraFieldListeners(thisWidget);
      // Re-init select listeners after sort
      google.visualization.events.addListener(table, 'sort', function() { thisWidget.initExtraFieldListeners(thisWidget); } );
      
      this.enableActionFields();
      
      // send all rows
      var publishTopics = JSON.parse(this.OpenAjax.getPropertyValue('publishtopics'));
      if (publishTopics.length > 0) {
        this.triggerPublishTopics(publishTopics);
      }
    }
  },

  /**
   * Publish entire table for each publish topic
   */  
  triggerPublishTopics: function(publishTopics) {
    var message = this.createTableMessage(this);
    
    for (var i = 0; i < publishTopics.length; i++) {
      this.OpenAjax.hub.publish(publishTopics[i], JSON.stringify(message));
    }
  },
  
  /**
   * Input on change handler
   */
  handleInputOnChange: function(element, thisWidget) {
    var elementId = element.id.replace(element.className, '');
    var selection = thisWidget.visualTableObj.getFilteredRows([{column: 0, value: elementId}]);;
    if (selection.length > 0) {
      var columnCount = thisWidget.visualTableObj.getNumberOfColumns();
      
      var row = selection[0];
      var sendTopics = {};
      var data = {};
      // Construct publishable data
      for (var i = 0; i < columnCount; i++) {
        var column = thisWidget.visualTableObj.getColumnLabel(i);
        var value  = thisWidget.visualTableObj.getValue(row, i);

        var inputFieldIndex = $.inArray(column, thisWidget.inputFieldNames);
        // Extra field handling
        if (inputFieldIndex > -1) {
          var inputField = thisWidget.inputFields[inputFieldIndex];
          var inputElement = document.getElementById(element.id);
          if (inputElement.value != null) {
            sendTopics[inputField.publishtopic] = true;
            if (inputElement.value != '') {
              value = inputElement.value;
              data[column] = value;
            }
          }
        }
        else {
          data[column] = value;
        }
      }
      for (var key in sendTopics) {
        var message = {};
        message['user'] = thisWidget.widgetOwner;
        message['route'] = data;
        
        thisWidget.OpenAjax.hub.publish(key, JSON.stringify(message));
      }
    }
  },
  
  /**
   * Button click handler
   */   
  handleButtonClick: function(btnObj, thisWidget) {
    var message = this.createTableMessage(thisWidget);
    console.log(btnObj.getAttribute('publishtopic'));
    thisWidget.OpenAjax.hub.publish(btnObj.getAttribute('publishtopic'), JSON.stringify(message));
  },
  
  /**
   * Building message of entire table
   */
  createTableMessage: function(thisWidget) {
    var data = new Array();
    var rowCount = thisWidget.visualTableObj.getNumberOfRows();
    var columnCount = thisWidget.visualTableObj.getNumberOfColumns();
    
    // Get column labels
    var columnLabels = new Array();
    for (var i = 0; i < columnCount; i++) {
      columnLabels.push(thisWidget.visualTableObj.getColumnLabel(i));
    }
    
    // Get all rows
    for (var i = 0; i < rowCount; i++) {
      var rowObj = {};
      for (var j = 0; j < columnCount; j++) {
        var key = columnLabels[j];
        var value = thisWidget.visualTableObj.getValue(i, j);
        rowObj[key] = value;
      }
      data.push(rowObj);
    }  

    var message = {};
    message['user'] = thisWidget.widgetOwner;
    message['route'] = data;
    
    return message;
  }
};
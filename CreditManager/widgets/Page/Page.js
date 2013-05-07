

if (typeof(CreditManager) == "undefined") {
  CreditManager = {};
}
if (typeof(CreditManager.Widget) == "undefined") {
  CreditManager.Widget = {};
}

/**
  * Constructor
  */
CreditManager.Widget.Page = function() {
  this.widgetId = null;
  this.widgetOwner = '';
  
  this.form = null;
  this.rawData = null;
  this.tableData = {};
  
  this.actionFields = [];
  this.inputFields = [];
  
  this.dataId = '';
  this.pages = [];
  this.currentPage = 0;
};

/**
  * Other
  */
CreditManager.Widget.Page.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Page Loaded. Widget ID: ' + this.widgetId);
    this.widgetOwner = this.OpenAjax.getPropertyValue('user');
      
    this.form = document.getElementById(this.widgetId + 'widget');
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
    
    var thisWidget = this;
    var subscribeTopics = JSON.parse(this.OpenAjax.getPropertyValue('subscribetopics'));
    for (var i = 0; i < subscribeTopics.length; i++) {
      this.OpenAjax.hub.subscribe(subscribeTopics[i], function(topic, receivedData) {
        thisWidget.rawData = JSON.parse(receivedData);
        thisWidget.initData();
        thisWidget.fillForm();
        thisWidget.initPagination();
      });
      
      var outsideTopic = subscribeTopics[i].replace('.Data.', '.OutData.');
      this.OpenAjax.hub.subscribe(outsideTopic, function(topic, receivedData) {
        thisWidget.rawData = JSON.parse(receivedData);
        thisWidget.initData();
        thisWidget.fillForm();
        thisWidget.initPagination();
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
    
    // Table placeholder
    var tbl = document.createElement("table");
    tbl.id = this.widgetId + "table";
    this.form.appendChild(tbl);
    
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
   * Adding extra input fields
   */   
  initExtraFields: function(tblB) {
    for (var i = 0; i < this.inputFields.length; i++) {
      var inputField = this.inputFields[i];

      var row = document.createElement("tr");
      var cell = document.createElement("td");
      var txtCell = document.createTextNode(inputField.text);
      cell.appendChild(txtCell);
      row.appendChild(cell);
      
      var cell = document.createElement("td");      
      var element = document.createElement("input");
      element.disabled = true;
      element.setAttribute('class', this.widgetId + 'input');
      for (var key in inputField) {
        if (inputField[key] != '') {
          element.setAttribute(key, inputField[key]);
        }
      }
      cell.appendChild(element);
      row.appendChild(cell);
      tblB.appendChild(row);
    }
  },
  
  /**
   * Initializing underlying datastructure record
   */
  initRecordData: function(rowObj) {
    var rowID = rowObj['ID'];
    if (this.tableData[rowID] == null) {
      this.tableData[rowID] = {};
      this.pages.push(rowID);
    }
    // Store first message as currently displayed record
    if (this.dataId == '') {
      this.dataId = rowID;
    }
    
    var dataRow = {};
    for (var key in rowObj){
      dataRow[key] = rowObj[key];
    }
    
    this.tableData[rowID] = dataRow;
  },

  /**
   * Initializing underlying datastructure
   */
  initData: function() {
    /*[0 => [Arve saaja => Kreedex, Arve väljastaja => Kreedex, Krediidirisk => Madal],
       4 => [Arve saaja => Kreedex, Arve väljastaja => Kreedex, Krediidirisk => Keskmine],
       2 => [Arve saaja => Kreedex, Arve väljastaja => Kreedex, Krediidirisk => Kõrge]
      ]
    */
    var data = this.rawData['route'];
    
    if (data != null) {
      if ($.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          this.initRecordData(data[i]);
        }
      }
      else {
        this.initRecordData(data);
      }
    }
  },
  
  /**
   * Widget content drawing
   */   
  fillForm: function() {
    // Even if no data still need to create extra fields
    var tbl = document.getElementById(this.widgetId + "table");
    var tblB = document.getElementById(this.widgetId + "tbody");
    if (tblB != null) {
      tbl.removeChild(tblB);
    }
    var tblB = document.createElement("tbody"); 
    tblB.id = this.widgetId + "tbody";

    if (this.dataId != '') {
      var record = this.tableData[this.dataId];
      for (var key in record){
        var row = document.createElement('tr');
        if (key == 'ID') {
          row.style.display = 'none';
        }
        // Name column
        var cell = document.createElement('td');
        var txtCell = document.createTextNode(key);
        cell.appendChild(txtCell);
        row.appendChild(cell);
        // Value column
        var cell = document.createElement('td');
        var txtCell = document.createTextNode(record[key]);
        cell.appendChild(txtCell);
        row.appendChild(cell);
        // Attach row to table body
        tblB.appendChild(row);
      }     
    }
    
    // Add extra fields that are always visible
    this.initExtraFields(tblB);
    // Attach table body to table
    tbl.appendChild(tblB);
    
    if (this.dataId != '') {
      this.enableActionFields();
    }
  },
  
  /**
   * Initializing pagination element
   */
  initPagination: function() {
    // Add page controls
    var thisWidget = this;
    var pageCount = this.pages.length; //Object.keys(this.tableData).length;

    $('#' + this.widgetId + 'pagination').pagination(pageCount, {
      items_per_page: 1,
      current_page: this.currentPage,
      callback: function(current_page, container) { return thisWidget.handlePaginationClick(current_page, container) }
    });
  },
  
  /**
   * Pagination click handler
   */
  handlePaginationClick: function(currentPage, container) {
    this.currentPage = currentPage;
    this.dataId = this.pages[currentPage]; //Object.keys(this.tableData)[currentPage];
    this.fillForm();
    return false;
  },
  
  /**
   * Button click handler
   */   
  handleButtonClick: function(btnObj, thisWidget) {
    var data = {};
    var table = document.getElementById(this.widgetId + "table");
    for (var i = 0, row; row = table.childNodes[0].rows[i]; i++) {
      var key;
      if (row.childNodes[0].firstChild != null) {
        key = row.childNodes[0].firstChild.nodeValue;
      } else {
        key = row.childNodes[0].innerText;
      }
      var valueObject = row.childNodes[1];
      
      var value = '';
      if (valueObject.firstChild != null) {
        valueObject = valueObject.firstChild;
        if (valueObject.value != null) {
          value = valueObject.value;
        } else {
          value = valueObject.nodeValue;
        }
      } else {
        value = valueObject.innerText;
      }
      data[key] = value;
    }
    
    if (btnObj.getAttribute('name') != null) {
      var key = btnObj.getAttribute('name');
      data[key] = btnObj.getAttribute('value');
    }
    
    var message = {};
    message['user'] = thisWidget.widgetOwner;
    message['route'] = data;
    console.log(btnObj.getAttribute('publishtopic'));
    thisWidget.OpenAjax.hub.publish(btnObj.getAttribute('publishtopic'), JSON.stringify(message));
  }
  
};
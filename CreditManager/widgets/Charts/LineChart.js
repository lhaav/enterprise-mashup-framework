/**
 * Line Chart widget
 *
 * @author Liisi
 */

if (typeof(CreditManager) == "undefined") {
  CreditManager = {};
}
if (typeof(CreditManager.Widget) == "undefined") {
  CreditManager.Widget = {};
}

/**
  * Constructor
  */
CreditManager.Widget.LineChart = function() {
  this.widgetId = null;
  this.widgetOwner = '';
  
  this.form = null;
  this.lineDiv = null;
  this.choiceDiv = null;
  
  this.rawData = null;
  this.dataSets = {};
  this.dataSets['All'] = {};
  this.dataCounts = {};
  this.dataCounts['All'] = {};
  
  this.actionFields = [];
  this.inputFields = [];
};

/**
 * Other
 */
CreditManager.Widget.LineChart.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Line loaded. Widget ID: ' + this.widgetId);
    this.widgetOwner = this.OpenAjax.getPropertyValue('user');
		
    this.form = document.getElementById(this.widgetId + 'widget');
    this.lineDiv = document.getElementById(this.widgetId + "line");
    this.choicesDiv = document.getElementById(this.widgetId + "choices");
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
        thisWidget.drawLine();
      });
    }
    
    // Property change messages
    this.OpenAjax.hub.subscribe('CreditManager.Property.Change', function(topic, receivedData) {
      var rawData = JSON.parse(receivedData);
      var property = rawData['route']['property'];
      var value = rawData['route']['value'];
      if (property != '' && (value == true || value == false || value != '')) {
        thisWidget.handlePropertyChange(property, value);
      }
    });
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
    
    // Extra action fields
    for (var i = 0; i < this.actionFields.length; i++) {
      var actionField = this.actionFields[i];
      var element = document.createElement('input');
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
   * Initializing checkboxes for filtering by label
   */
  initLabelChoice: function(key) {
  	// insert checkboxes 
    var choiceContainer = $('#' + this.widgetId + 'choices');
    choiceContainer.append("<br/><input type='checkbox' name='" + key +
      "' checked='checked' id='" + this.widgetId + key + "'></input>" +
      "<label for='id" + key + "'>" + key + "</label>");
  },
  
  /**
   * Initializing dropdown list for filtering by datax
   */
  initLineFilter: function(key) {
    var selectFilter = document.getElementById(this.widgetId + 'filterSelect');
    if (!selectFilter) {
      var thisWidget = this;
      selectFilter = document.createElement('select');
      selectFilter.setAttribute('id', this.widgetId + 'filterSelect');
      selectFilter.setAttribute('name', 'filterSelect');
      selectFilter.setAttribute('type', 'select');
      selectFilter.onchange = function() {
        thisWidget.handleFilterOnChange(this, thisWidget);
      };
      this.form.appendChild(selectFilter);
      selectFilter.options[selectFilter.options.length] = new Option('All', 'All');
    }
    selectFilter.options[selectFilter.options.length] = new Option(key, key);
  },
  
  /**
   * Underlying datastructure initializing
   */
  initdataCounts: function(label, datax, datay) {
    // Default type All
    if (this.dataCounts['All'][label] == null) {
      this.dataCounts['All'][label] = {};
      this.initLabelChoice(label);
    }
    if (this.dataCounts['All'][label][datax] == null) {
      this.dataCounts['All'][label][datax] = 0;
    }
    this.dataCounts['All'][label][datax]++;
    
    // Other types
    if (this.dataCounts[datay] == null) {
      this.dataCounts[datay] = {};
      this.initLineFilter(datay);
    }
    if (this.dataCounts[datay][label] == null) {
      this.dataCounts[datay][label] = {};
    }
    if (this.dataCounts[datay][label][datax] == null) {
      this.dataCounts[datay][label][datax] = 0;
    }
    this.dataCounts[datay][label][datax]++;
    
  },
  
  /**
   * Building dataset for chart
   */
  initData: function() {
    if (!this.rawData) {
      return;
    }
    
    var label = this.rawData['route']['Label'];
    var datax  = this.rawData['route']['Datax'];
    var datay  = this.rawData['route']['Datay'];
    
    this.initdataCounts(label, datax, datay);
    
    this.dataSets = {};
    for (var type in this.dataCounts) {
      this.dataSets[type] = {};
      var dataCountsObj = this.dataCounts[type];
      for (var label in dataCountsObj) {
        var labelCountsObj = dataCountsObj[label];
        this.dataSets[type][label] = {};
        this.dataSets[type][label]['label'] = label;
        this.dataSets[type][label]['data'] = new Array();
        var keys = Object.keys(labelCountsObj);
        keys.sort();
        
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var data = new Array();
          data.push(key);
          data.push(labelCountsObj[key]);
          this.dataSets[type][label]['data'].push(data);
        }
      }
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
          btns[j].onclick = function() {
            return thisWidget.handleButtonClick(this, thisWidget);
          };
        }
      }
    }
  },

  /**
   * Chart drawing
   */   
  drawLine: function() {
    var selectElement = document.getElementById(this.widgetId + 'filterSelect');
    if (selectElement != null) {
      var filter = selectElement.value;
    }
    else {
      var filter = 'All';
    }
    
    dataset = this.dataSets[filter];
    // hard-code color indices to prevent them from shifting as filters are switched on/off
    var i = 0;
    $.each(dataset, function(key, val) {
      val.color = i;
      ++i;
    });
    
    var thisWidget = this;
    var choiceContainer = document.getElementById(this.widgetId + 'choices');
    var choiceContainerInputs = choiceContainer.getElementsByTagName("input");
    for (var i = 0; i < choiceContainerInputs.length; i++) {
      var inputItem = choiceContainerInputs[i];
      inputItem.onclick = function() {
        return thisWidget.handleLabelOnChange(this, thisWidget, dataset)
      };
    }
    
    this.drawPlotByChoices(dataset);
    this.enableActionFields();
    
  },

  /**
   * Chart drawing based on filter checkboxes
   */
  drawPlotByChoices: function(dataset) {
    var data = [];
    
    var choiceContainer = $('#' + this.widgetId + 'choices');
    choiceContainer.find("input:checked").each(function () {
      var key = $(this).attr("name");
      if (key && dataset[key]) {
        data.push(dataset[key]);
      }
    });

    if (data.length > 0) {
      $.plot('#' + this.widgetId + 'line', data, {
        xaxis: { 
          mode: "time",
          minTickSize: [1, "day"]
        },
        yaxis: {
          tickDecimals: 0
        },
        lines: { show: true },
        points: { show: true }
      });
    }
  },

  /**
   * Dropdown filter change handler
   */
  handleFilterOnChange: function(filterObj, thisWidget) {
    var filterOption = filterObj.value;
    thisWidget.drawPlotByChoices(thisWidget.dataSets[filterOption]);
    thisWidget.publishPropertyChange(filterObj.name, filterOption);
  },

  /**
   * Checkbox filter change handler
   */  
  handleLabelOnChange: function(labelObj, thisWidget, dataset) {
    thisWidget.drawPlotByChoices(dataset);
    thisWidget.publishPropertyChange(labelObj.name, labelObj.checked);
  },

  /**
   * Publish message to notify of property change
   */ 
  publishPropertyChange: function(property, value) {
    var data = {};
    data['property'] = property;
    data['value'] = value;
    
    var message = {};
    message['route'] = data;
    this.OpenAjax.hub.publish('CreditManager.Property.Change',  JSON.stringify(message));
  },

  /**
   * Property change handler
   */ 
  handlePropertyChange: function(property, value) {
    var elementId = this.widgetId + property;
    var element = document.getElementById(elementId);
    if (element != null) {
      if (element.type == 'checkbox') {
        element.checked = value;
      }
      else {
        element.value = value;
      }
      this.drawLine();
    }
  },
  
  /**
   * Button click handler
   */   
  handleButtonClick: function(btnObj, thisWidget) {
    var report = '';
    for (var labelKey in this.dataCounts) {
      var dataObjs = this.dataCounts[labelKey];
      for (var dataObj in dataObjs) {
        var value = parseFloat(dataObjs[dataObj]).toFixed(2); 
        report = report + labelKey + ';' + dataObj + ';' + value + ';\n';
      }
    }
    
    var fileNameToSaveAs = "LineChart.csv";
    var textFileAsBlob = new Blob([report], {type:'text/csv'});
    var urlCreator = window.URL || window.webkitURL;

    var element = document.createElement('a');  
    element.href = urlCreator.createObjectURL(textFileAsBlob);
    element.download = fileNameToSaveAs;
    this.form.appendChild(element);
    element.click();
    this.form.removeChild(element);
  }
  
};
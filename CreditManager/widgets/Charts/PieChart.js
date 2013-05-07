/**
 * Pie Chart widget
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
CreditManager.Widget.PieChart = function() {
  this.widgetId = null;
  this.widgetOwner = '';
  
  this.form = null;
  this.pieDiv = null;
  this.choiceDiv = null;
  
  this.rawData = null;
  this.dataSets = {};
  this.dataLabels = {};
  this.dataSets['All'] = {};
  this.colors = {};
  this.colorArray = new Array();
  
  this.actionFields = [];
  this.inputFields = [];
};

/**
 * Other
 */
CreditManager.Widget.PieChart.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Pie loaded. Widget ID: ' + this.widgetId);
    this.widgetOwner = this.OpenAjax.getPropertyValue('user');
		
    this.form = document.getElementById(this.widgetId + 'widget');
    this.pieDiv = document.getElementById(this.widgetId + "pie");
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
        thisWidget.drawPie();
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
    choiceContainer.append("<input type='checkbox' name='" + key +
      "' checked='checked' id='" + this.widgetId + key + "'></input>" +
      "<label for='id" + key + "'>" + key + "</label><br/>");
  },
  
  /**
   * Initializing dropdown list for filtering by datax
   */
  initPieFilter: function(key) {
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
  initDataCounts: function(label, datax, color) {
    if (this.dataLabels[label] == null) {
      this.dataLabels[label] = {};
      this.initLabelChoice(label);
    }
    if (this.dataSets['All'][label] == null) {
      this.colors[label] = color;
      this.dataSets['All'][label] = {};
      this.dataSets['All'][label]['label'] = label;
      this.dataSets['All'][label]['data'] = 0;
    }
    var value = this.dataSets['All'][label]['data'];
    this.dataSets['All'][label]['data'] = (typeof datax == "number") ? (value + datax) : (value + 1);
    
    if (typeof datax == "string") {
      if (this.dataSets[datax] == null) {
        this.dataSets[datax] = {};
        this.initPieFilter(datax);
      }
      if (this.dataSets[datax][label] == null) {
        this.dataSets[datax][label] = {};
        this.dataSets[datax][label]['label'] = label;
        this.dataSets[datax][label]['data'] = 0;
      }
      var value = this.dataSets[datax][label]['data'];
      this.dataSets[datax][label]['data'] = (typeof datax == "number") ? (value + datax) : (value + 1);
    }
  },

  /**
   * Building dataset for chart
   */
  initData: function() {
    if (!this.rawData) {
      return;
    }
    
    if ($.isArray(this.rawData['route'])) {
      // start with fresh bar chart
      this.dataSets = {};
      this.dataSets['All'] = {};
      this.colors = {};
      var rows = this.rawData['route'];
      for (var i = 0; i < rows.length; i++) {
        var label = rows[i]['Label'];
        var datax = rows[i]['Datax'];
        var color = rows[i]['Color'];
        this.initDataCounts(label, datax, color);
      }
    }
    else {
      var label = this.rawData['route']['Label'];
      var datax = this.rawData['route']['Datax'];
      var color = this.rawData['route']['Color'];
      this.initDataCounts(label, datax, color);
    }
    
    this.colorArray = new Array();
    for (var labelKey in this.colors) {      
      this.colorArray.push(this.colors[labelKey]);
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
  drawPie: function() {
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
      $.plot('#' + this.widgetId + 'pie', data, {
        series: {
          pie: {
            show: true
          }
        },
        legend: {
          show: true
        },
        grid: {
          hoverable: true
        },
        colors: this.colorArray
      });
    }
    var thisWidget = this;
    $('#' + this.widgetId + 'pie').bind("plothover", function(event, pos, obj) {
      thisWidget.handleHover(event, pos, obj, thisWidget);
    });
  },
  
  /**
   * Chart hovering handler
   */
  handleHover: function(event, pos, obj, thisWidget) {
    if (!obj)
      return;
    var color = obj.series.color;
    var label = obj.series.label;
    var data = parseFloat(obj.series.data[0][1]).toFixed(2);
    var percent = parseFloat(obj.series.percent).toFixed(2);
    $('#' + thisWidget.widgetId + 'piehover').html('<span style="font-weight: bold; color: '+color+'">'+label+' total '+data+' ('+percent+'%)</span>');
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
    this.OpenAjax.hub.publish('CreditManager.Property.Change', JSON.stringify(message));
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
      this.drawPie();
    }
  },

  /**
   * Button click handler
   */   
  handleButtonClick: function(btnObj, thisWidget) {
    var dataset = thisWidget.dataSets['All'];
    var labels = [];
    var choiceContainer = $('#' + thisWidget.widgetId + 'choices');
    labels.push('');
    choiceContainer.find("input:checked").each(function () {
      var key = $(this).attr("name");
      if (key && dataset[key]) {
        labels.push(dataset[key].label);
      }
    });

    var keys = [];
    var selectElement = document.getElementById(thisWidget.widgetId + 'filterSelect');
    if (selectElement.value == 'All') {
      for (var key in thisWidget.dataSets) {
        if (key != 'All') {
          keys.push(key);
        }
      }
      keys.push('All');
    } else {
      keys.push(selectElement.value);
    }
    
    var report = '';
    
    // Header row
    for (var i = 0; i < labels.length; i++) {
      report = report + labels[i] + ';';
    }
    report = report + '\n';

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      report = report + key + ';';
      for (var j = 1; j < labels.length; j++) {
        var data;
        if (thisWidget.dataSets[key][labels[j]] != null) {
          data = thisWidget.dataSets[key][labels[j]]['data'];
        } else {
          data = '';
        }
        report = report + data + ';'
      }
      report = report + '\n';
    }
    
    var fileNameToSaveAs = "PieChart.csv";
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
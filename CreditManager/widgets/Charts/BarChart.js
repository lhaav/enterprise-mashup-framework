/**
 * Bar Chart widget
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
CreditManager.Widget.BarChart = function() {
  this.widgetId = null;
  this.widgetOwner = '';
  
  this.form = null;
  this.barDiv = null;
  
  this.rawData = null;
  this.dataSets = new Array();
  this.dataCounts = {};
  this.colors = {};
  this.colorArray = new Array();
  this.ticks = {};
  this.tickArray = new Array();
  
  this.actionFields = [];
  this.inputFields = [];
};

/**
 * Other
 */
CreditManager.Widget.BarChart.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Bar loaded. Widget ID: ' + this.widgetId);
    this.widgetOwner = this.OpenAjax.getPropertyValue('user');
		
    this.form = document.getElementById(this.widgetId + 'widget');
    this.barDiv = document.getElementById(this.widgetId + "bar");
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
        thisWidget.drawBar();
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
   * Underlying datastructure initializing
   */
  initDataCounts: function(label, datax, datay, color) {
    // All assigned values
    if (this.dataCounts[label] == null) {
      this.colors[label] = color;
      this.dataCounts[label] = {};
    }
    if (this.dataCounts[label][datax] == null) {
      this.dataCounts[label][datax] = 0;
      this.ticks[datax] = true;
    }
    if (typeof datay == "number") {
      this.dataCounts[label][datax] = this.dataCounts[label][datax] + datay;
    }
    else {
      this.dataCounts[label][datax]++;
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
      this.dataSets = [];
      this.dataCounts = {};
      var rows = this.rawData['route'];
      for (var i = 0; i < rows.length; i++) {
        var label = rows[i]['Label'];
        var datax = rows[i]['Datax'];
        var datay = rows[i]['Datay'];
        var color = rows[i]['Color']; 
        this.initDataCounts(label, datax, datay, color);
      }
    }
    else {
      // add to existing bar chart
      var label = this.rawData['route']['Label'];
      var datax = this.rawData['route']['Datax'];
      var datay = this.rawData['route']['Datay'];
      var color = this.rawData['route']['Color'];
      this.initDataCounts(label, datax, datay, color);
    }
    
    this.colorArray = new Array();
    this.tickArray = new Array();
    
    // Prepare tick array
    var tickKeys = Object.keys(this.ticks);
    tickKeys.sort();
    for (var i = 0; i < tickKeys.length; i++) {
      var keyLabel = tickKeys[i];
      this.ticks[keyLabel] = i + 1;
      var tickInfo = [i + 1, keyLabel];
      this.tickArray.push(tickInfo);
    }
    
    var labelKeys = Object.keys(this.dataCounts);
    labelKeys.sort();
    for (var i = 0; i < labelKeys.length; i++) {
      var labelKey = labelKeys[i];
      this.colorArray.push(this.colors[labelKey]);      
      var dataCountObjs = this.dataCounts[labelKey];
      var dataCountArray = new Array();
      for (var j = 0; j < tickKeys.length; j++) {
        var key = tickKeys[j];
        var value = dataCountObjs[key] == null ? 0 : dataCountObjs[key];
        dataCountArray.push([j + 1, value]);
      }
      var dataObj = {};
      dataObj['label'] = labelKey;
      dataObj['data'] = dataCountArray;
      this.dataSets.push(dataObj);
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
   * Bar chart drawing
   */
  drawBar: function() {
    $.plot('#' + this.widgetId + 'bar', this.dataSets, {
      series: {
        stack: true,
        bars: {
          show: true,
          barWidth: 0.4,
          lineWidth: 0,
          align: 'center',
          fill: 1
        }
      },
      xaxis: {
        ticks: this.tickArray,
        autoscaleMargin: 0.05
      },
      colors: this.colorArray
    });
    
    this.enableActionFields();
    
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
    
    var fileNameToSaveAs = "BarChart.csv";
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
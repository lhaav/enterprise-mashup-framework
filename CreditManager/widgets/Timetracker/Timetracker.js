/**
 * Timetracker widget
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
  * Widget constructor
  */
CreditManager.Widget.Timetracker = function() {
  this.widgetId = null;
  this.rawData = '';
};

/**
  * Add additional methods to widget
  */
CreditManager.Widget.Timetracker.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('TimeTrack Loaded. Widget ID: ' + this.widgetId);
    var subscribeTopics = JSON.parse(this.OpenAjax.getPropertyValue('subscribetopics'));

    var thisWidget = this;
    this.OpenAjax.hub.subscribe('CreditManager.InternalData.StateFinished', function(topic, receivedData) {
      for (var i = 0; i < subscribeTopics.length; i++) {
        thisWidget.OpenAjax.hub.subscribe(subscribeTopics[i], function(topic, receivedData) {
          thisWidget.rawData = JSON.parse(receivedData);
          thisWidget.trackTime(thisWidget, topic);
        });
      }
    });
  },

  /**
   * Publishing time track messages based on incoming messages
   */
  trackTime: function(thisWidget, topic) {
    var data = {};
    
    var date = new Date();
    var y = date.getFullYear();
    var m = this.pad(date.getMonth()+1);
    var d = this.pad(date.getDate());
    var h = this.pad(date.getHours());
    var min = this.pad(date.getMinutes());
    data['ID'] = 'id' + date.getTime();
    
    data['Record ID'] = (! $.isArray(thisWidget.rawData['route'])) ? thisWidget.rawData['route']['ID'] : '';

    data['Timestamp'] = y + '-' + m + '-' + d + ' ' + h + ':' + min;
    data['Action'] = topic;
    data['User'] = this.rawData['user'];
    
    var message = {};
    message['route'] = data;

    var publishTopics = JSON.parse(thisWidget.OpenAjax.getPropertyValue('publishtopics'));
    for (var i = 0; i < publishTopics.length; i++) {
      console.log(publishTopics[i]);
      thisWidget.OpenAjax.hub.publish(publishTopics[i], JSON.stringify(message));
    }
  },
  
  /**
   * Padding value with zeros for length 2
   */
  pad: function(value) {
    var valueStr = value.toString();
    valueStr = valueStr.length == 1 ? "0" + valueStr : valueStr;
    return valueStr;
  }
};
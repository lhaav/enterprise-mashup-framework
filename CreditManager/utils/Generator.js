/**
 * Widgets generator based on mashup description file
 *
 * @author Liisi
 */

function Generator(viewId, url) {
  this.viewId = viewId;
  this.url = url;
}

Generator.prototype.GenerateView = function() {
  var view = new Array();
  var config = this.ReadConfiguration();
  
  // Get current view config
  var viewConfig = config.GetViewByID(this.viewId);
  var viewComponents = viewConfig.components[0].component;
  for (var i = 0; i < viewComponents.length; i++) {
    var componentId = viewComponents[i].id;
    
    // Get component config
    var componentConfig = config.GetComponentByID(componentId);
    
    // Input and output topics
    var inputTopics = this.GetTopics(componentConfig, 'input');
    var outputTopics = this.GetTopics(componentConfig, 'output');

    // Configuration options
    var configOptions = new Array();
    if (componentConfig.hasOwnProperty('config')) {
      var options = componentConfig.config[0].option;
      for (var j = 0; j < options.length; j++) {
        var option = options[j];
        var optionObj = {};
        for (var optionName in option) {
          var optionValue = option[optionName];
          if (optionName == 'publishtopic') { // replacing topic id with actual topic value
            optionObj[optionName] = outputTopics[optionValue];
          }
          else {
            optionObj[optionName] = optionValue;
          }
        }
        configOptions.push(optionObj);
      }
    }
    
    // Create Widget object for view array
    var widgetProperties = {
      'widgetName': componentConfig.name,
      'subscribetopics': inputTopics,
      'publishtopics': outputTopics,
      'configoptions': configOptions      
    };  
    var widgetUrl = 'widgets/' + componentConfig.source + '.oam.xml';
    var widget = new Widget(componentConfig.id, widgetUrl, widgetProperties);
    view[i] = widget;
  }
  
  return view;
}

Generator.prototype.ReadConfiguration = function() {
  var xmlUrl = this.url + "MashupModel.xml";
  var xmlParser = new XmlParser(xmlUrl);
  xmlParser.LoadXml();
  return xmlParser;
}

Generator.prototype.GetTopics = function(componentConfig, type) {
  var topicArray = new Array();
  if (!componentConfig.hasOwnProperty(type)) {
    return topicArray;
  }
  if (componentConfig.hasOwnProperty(type)) {
    var topics = componentConfig[type];
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].hasOwnProperty('id')) {
        topicArray[topics[i].id] = topics[i].topic;
      }
      else {
        topicArray.push(topics[i].topic);
      }
    }
  }
  return topicArray;
}

function Widget(widgetName, widgetUrl, widgetProperties) {
  this.widgetName = widgetName;
  this.widgetUrl = widgetUrl;
  this.widgetProperties = widgetProperties;
}

function WidgetField(type, text, name, value, publishtopic) {
  this.type = type;
  this.text = text;
  this.name = name;
  this.value = value;
  this.publishtopic = publishtopic;
}
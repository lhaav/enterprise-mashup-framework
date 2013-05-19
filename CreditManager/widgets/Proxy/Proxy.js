dojo.require("dojo.io.script");
dojo.require("dojox.rpc.Service");
dojo.require("dojox.rpc.JsonRPC");

if (typeof(CreditManager) == "undefined") {
  CreditManager = {};
}
if (typeof(CreditManager.Widget) == "undefined") {
  CreditManager.Widget = {};
}

/**
  * Widget constructor
  */
CreditManager.Widget.Proxy = function() {
  this.widgetId = null;
  this.rawData = '';
  
  this.configOptions = [];
  this.subscribeTopics = [];
  this.publishTopics = [];
  
  this.wsdl = '';
  this.operation = '';
  this.proxy = '';
  
  this.mappingUrl = '';
  this.smdUrl = '';
};

/**
  * Add additional methods to widget
  */
CreditManager.Widget.Proxy.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('ProxyWidget Loaded. Widget ID: ' + this.widgetId);
    
    this.subscribeTopics = JSON.parse(this.OpenAjax.getPropertyValue('subscribetopics'));
    this.publishTopics = JSON.parse(this.OpenAjax.getPropertyValue('publishtopics'));
    this.configOptions = JSON.parse(this.OpenAjax.getPropertyValue('configoptions'));
    
    this.wsdl = this.configOptions[0]['wsdl'];
    this.operation = this.configOptions[0]['operation'];
    this.proxy = this.configOptions[0]['proxy'];
    
    this.mappingUrl = this.proxy + '/mapping?wsdl=' + this.wsdl + '&operation=' + this.operation;
    this.smdUrl = this.proxy + '/smd?wsdl=' + this.wsdl + '&operation=' + this.operation;
    
    // publish mappings URL when transformer has finished loading
    var thisWidget = this;
    this.OpenAjax.hub.subscribe('ee.stacc.transformer.hasfinished', function(topic, publisherData) {
      thisWidget.OpenAjax.hub.publish('ee.stacc.transformer.mapping.add.url', thisWidget.mappingUrl);
    });

    var thisWidget = this;
    for (var i = 0; i < this.subscribeTopics.length; i++) {
      this.OpenAjax.hub.subscribe(this.subscribeTopics[i], function(topic, receivedData) {
        thisWidget.onData(JSON.parse(receivedData), thisWidget.smdUrl, thisWidget.operation, thisWidget);
      });
    }
  },

  onData: function(publisherData, smdUrl, operation, thisWidget) {
    var smdDeferred = dojo.io.script.get({
      url: smdUrl,
      jsonp: "callback"}
    );
    smdDeferred.addCallback(function(result) {
      thisWidget.callService(result, publisherData, operation, thisWidget);
    });
  },

  callService: function(smd, requestData, operation, thisWidget){
    var services = new dojox.rpc.Service(smd);
    // lets try to specify the request ID
    var d = new Date();
    services._requestId = d.valueOf();
    var deferred = services[operation](requestData);
    deferred.addCallback(function(result){
      for (var i = 0; i < thisWidget.publishTopics.length; i++) {
        thisWidget.OpenAjax.hub.publish(thisWidget.publishTopics[i], JSON.stringify(result));
      }
    });
    deferred.addErrback(function (){
      console.log("SOAP response error.");
    });
    return deferred;
  }
};
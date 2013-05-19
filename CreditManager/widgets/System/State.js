

if (typeof(CreditManager) == "undefined") {
  CreditManager = {};
}
if (typeof(CreditManager.Widget) == "undefined") {
  CreditManager.Widget = {};
}

/**
 * Widget constructor
 */
CreditManager.Widget.State = function() {
  this.data = [];
  this.socket = {};
  
  this.mashupId = '';
  this.rootUrl = '';
};

CreditManager.Widget.State.prototype = {
  
  /**
   * Widget loaded
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('State loaded. Widget ID: ' + this.widgetId);
    this.rootUrl = this.OpenAjax.getPropertyValue('rootUrl');
    var thisWidget = this;
   
    window.setTimeout(function() {
      thisWidget.publishAllMessages();
    }, 2000);
  },
  
  publishAllMessages: function() {
    var thisWidget = this;
    this.mashupId = this.OpenAjax.getPropertyValue('mashupId');
    $.post(this.rootUrl + "widgets/System/State.php", 
      { "func": "getMashup", mashupId: thisWidget.mashupId },
      function(response) {
        try {
          response = JSON.parse(response);
        }
        catch(e) {
          console.log('ERROR: ' + response);
          return;
        }

        var socketIOConf = response['socketioconfig'];
        var messages = response['mashup'];
        
        if (messages != null) {
          for (var i = 0; i < messages.length; i++) {
            var topic = messages[i].topic;
            var message = messages[i].message;
            if (topic != '' && message != '') {
              thisWidget.OpenAjax.hub.publish(topic, message);
            }
          }
        }
        
        thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.StateFinished');
        // Subscribe to all messages after all state messages have been published
        // (not to pick up its own messages)
        if (socketIOConf != null) {
          if (socketIOConf.port != null) {
            console.log('Creating Socket.IO: hostname = ' + socketIOConf.hostname + ' port = ' + socketIOConf.port);
            thisWidget.socket = new io.connect(socketIOConf.hostname, { port: socketIOConf.port });
          } else {
            console.log('Creating Socket.IO: hostname = ' + socketIOConf.hostname + ' resource = ' + socketIOConf.proxy);
            thisWidget.socket = new io.connect(socketIOConf.hostname, { resource: socketIOConf.proxy });          
          }
          thisWidget.socket.on('CreditManager.OutData', function(data) {
            console.log('--------------------------->' + data['mashupId'] + '=?' + thisWidget.mashupId);
            if (data['mashupId'] == thisWidget.mashupId) {
              console.log('--------------------------->' + data['topic']);
              thisWidget.OpenAjax.hub.publish(data['topic'], data['message']); 
            }
          });
        }
        thisWidget.OpenAjax.hub.subscribe("CreditManager.Data.**", function(topic, message) { 
          return thisWidget.saveMessage(topic, message, thisWidget);
        });
      }
    );
  },

  /**
   * 
   */
  saveMessage: function(topic, message, thisWidget) {
    if (typeof message === "string") {
      // do nothing
    } else {
      // convert to JSON before saving
      message = JSON.stringify(message);
    }
    $.post(this.rootUrl + "widgets/System/State.php", 
      { "func": "setMashupMessage", mashupId: thisWidget.mashupId, topic: topic, message: message },
      function(response) {
        //alert(response);
      }
    );
    
    var outsideTopic = topic.replace('.Data.', '.OutData.');
    thisWidget.socket.emit('CreditManager.OutData', { 'mashupId': thisWidget.mashupId, 'topic': outsideTopic, 'message': message } );
  }

};
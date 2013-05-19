/**
 * Controller widget
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
CreditManager.Widget.Controller = function() {
  this.widgetId = null;
  this.rawData = '';
  this.soapData = [];
  this.regCodes = [];
};

/**
  * Add additional methods to widget
  */
CreditManager.Widget.Controller.prototype = {

  /**
   * Widget has finished loading
   */
  onLoad: function() {
    this.widgetId = this.OpenAjax.getId();
    console.log('Controller Loaded. Widget ID: ' + this.widgetId);
    var thisWidget = this;
    
    this.OpenAjax.hub.subscribe('CreditManager.Data.TimeTrack', function(topic, receivedData) {
      thisWidget.rawData = JSON.parse(receivedData);
      thisWidget.timeTrackToTimeTrackPie(thisWidget, topic);
      thisWidget.timeTrackToTimeTrackLine(thisWidget, topic);
    });
    this.OpenAjax.hub.subscribe('CreditManager.OutData.TimeTrack', function(topic, receivedData) {
      thisWidget.rawData = JSON.parse(receivedData);
      thisWidget.timeTrackToTimeTrackPie(thisWidget, topic);
      thisWidget.timeTrackToTimeTrackLine(thisWidget, topic);
    });
    
    this.OpenAjax.hub.subscribe('CreditManager.Data.InvoiceList', function(topic, receivedData) {
      thisWidget.rawData = JSON.parse(receivedData);
      thisWidget.summaryDataToCreditRiskPie(thisWidget, topic);
      thisWidget.summaryDataToDebtPie(thisWidget, topic);
    });
    this.OpenAjax.hub.subscribe('CreditManager.OutData.InvoiceList', function(topic, receivedData) {
      thisWidget.rawData = JSON.parse(receivedData);
      thisWidget.summaryDataToCreditRiskPie(thisWidget, topic);
      thisWidget.summaryDataToDebtPie(thisWidget, topic);
    });    

    this.OpenAjax.hub.subscribe('CreditManager.InternalData.CompanySummary', function(topic, receivedData) {
      thisWidget.rawData = JSON.parse(receivedData);
      thisWidget.summaryDataToCreditRiskPie(thisWidget, topic);
      thisWidget.summaryDataToDueDateDebtPie(thisWidget, topic);
      thisWidget.summaryDataToActionDebtBar(thisWidget, topic);
    });  
    
    // SOAP
    this.OpenAjax.hub.subscribe('CreditManager.Data.InvoiceList', function(topic, receivedData) {
      var rawData = JSON.parse(receivedData);
      thisWidget.initOrganizationDetailsData(thisWidget, rawData);
    });
    
    this.OpenAjax.hub.subscribe('CreditManager.InternalData.StateFinished', function(topic, receivedData) {
      thisWidget.OpenAjax.hub.subscribe('CreditManager.Data.DebtCollection', function(topic, receivedData) {
        var rawData = JSON.parse(receivedData);
        thisWidget.parseSoapDebtCollectionRequest(thisWidget, rawData);
      }); 

      thisWidget.OpenAjax.hub.subscribe('CreditManager.Data.DebtCollectionResponse', function(topic, receivedData) {
        var rawData = JSON.parse(receivedData);
        thisWidget.parseSoapDebtCollectionResponse(thisWidget, rawData);
      });

      // Only when state is finished start initializing SOAP requests
      thisWidget.OpenAjax.hub.subscribe('CreditManager.InternalData.OrganizationDetailsResponse', function(topic, receivedData) {
        // receiving SOAP result
        var rawData = JSON.parse(receivedData);
        thisWidget.parseSoapOrganizationDetailsResponse(thisWidget, rawData);
      });      
      thisWidget.sendSoapOrganizationDetailsRequests(thisWidget);
    });
  },

  /**
   * TimeTrack message transfered to TimeTrackPie
   */
  timeTrackToTimeTrackPie: function(thisWidget, topic) {
    var data = {};
    
    data['Label'] = this.rawData['route']['User'];
    data['Datax'] = this.rawData['route']['Action'];
    
    var message = {};
    message['route'] = data;
    
    thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.TimeTrackPie', JSON.stringify(message));
  },

  /**
   * TimeTrack message transfered to TimeTrackLine
   */
  timeTrackToTimeTrackLine: function(thisWidget, topic) {
    var data = {};
    
    var origTimestamp = this.rawData['route']['Timestamp'];
    var date = new Date(Date.parse(origTimestamp));
    date.setHours(12);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    data['Label'] = this.rawData['route']['User'];
    data['Datax'] = date.getTime();
    data['Datay'] = this.rawData['route']['Action'];
    
    var message = {};
    message['route'] = data;
    
    thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.TimeTrackLine', JSON.stringify(message));
  },
  
  /**
   * CompanySummary message transfered to CreditRiskPie
   */
  summaryDataToCreditRiskPie: function(thisWidget, topic) {
    var sendMsg = false;
    
    // multiple values at a time
    if ($.isArray(this.rawData['route'])) {
      var data = [];
      var rowsObj = this.rawData['route'];
      for (var i = 0; i < rowsObj.length; i++) {
        var rowData = {};
        var label = rowsObj[i]['Credit Risk'] == null ? 'Not applied' : rowsObj[i]['Credit Risk'];
        var datax = rowsObj[i]['Balance due'];
        if (datax != null) {
          datax = parseFloat(datax.replace(' ', '').replace(',', '.'));
          rowData['Label'] = label;
          rowData['Datax'] = datax;
          rowData['Color'] = this.getColorByCreditRisk(label);
          data.push(rowData);
          sendMsg = true;
        }
      }
    }
    // one value at a time
    else {
      var data = {};
      var label = this.rawData['route']['Action'] == null ? 'Not applied' : this.rawData['route']['Action'];
      var datax = this.rawData['route']['Balance due'];
      
      if (datax != null) {
        datax = parseFloat(datay.replace(' ', '').replace(',', '.'));
        data['Label'] = label;
        data['Datax'] = datax;
        data['Color'] = this.getColorByCreditRisk(label);
        sendMsg = true;
      }
    }
    
    if (sendMsg == true) {
      var message = {};
      message['route'] = data;
      thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.CreditRiskPie', JSON.stringify(message));
    }
  },
  
  /**
   * CompanySummary message transfered to DebtPie
   */
  summaryDataToDueDateDebtPie: function(thisWidget, topic) {
    var sendMsg = false;
    
    // multiple values at a time
    if ($.isArray(this.rawData['route'])) {
      var data = [];
      var rowsObj = this.rawData['route'];
      for (var i = 0; i < rowsObj.length; i++) {
        var rowData = {};
        var label = rowsObj[i]['Due date'];
        var datax = rowsObj[i]['Balance due'];
        if (label != null && datax != null) {
          label = this.getLabelByDueDate(label);
          rowData['Label'] = label;
          rowData['Datax'] = parseFloat(datax.replace(' ', '').replace(',', '.'));
          rowData['Color'] = this.getColorByDueDateLabel(label);
          data.push(rowData);
          sendMsg = true;
        }
      }
    }
    // one value at a time
    else {
      var data = {};
      var label = this.rawData['route']['Due date'];
      var datax = this.rawData['route']['Balance due'];
      
      if (label != '' && datax != null) {
        label = this.getLabelByDueDate(label);
        data['Label'] = this.getLabelByDueDate(label);
        data['Datax'] = parseFloat(datay.replace(' ', '').replace(',', '.'));
        data['Color'] = this.getColorByDueDateLabel(label);
        sendMsg = true;
      }
    }
    
    if (sendMsg == true) {
      var message = {};
      message['route'] = data;
      thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.DebtPie', JSON.stringify(message));
    }
  },
  
  /**
   * CompanySummary message transfered to ActionBar
   */
  summaryDataToActionDebtBar: function(thisWidget, topic) {
    var sendMsg = false;
    
    // multiple values at a time
    if ($.isArray(this.rawData['route'])) {
      var data = [];
      var rowsObj = this.rawData['route'];
      for (var i = 0; i < rowsObj.length; i++) {
        var rowData = {};
        var label = rowsObj[i]['Action'] == null ? 'Not applied' : rowsObj[i]['Action'];
        var datax = rowsObj[i]['Debtor regcode'];
        var datay = rowsObj[i]['Balance due'];
        if (datax != null && datay != null) {
          datay = parseFloat(datay.replace(' ', '').replace(',', '.'));
          rowData['Label'] = label;
          rowData['Datax'] = datax;
          rowData['Datay'] = datay;
          rowData['Color'] = this.getColorByAction(label);
          data.push(rowData);
          sendMsg = true;
        }
      }
    }
    // one value at a time
    else {
      var data = {};
      var label = this.rawData['route']['Action'] == null ? 'Not applied' : this.rawData['route']['Action'];
      var datax = this.rawData['route']['Debtor regcode'];
      var datay = this.rawData['route']['Balance due'];
      
      if (datax != null && datay != null) {
        datay = parseFloat(datay.replace(' ', '').replace(',', '.'));
        data['Label'] = label;
        data['Datax'] = datax;
        data['Datay'] = datay;
        data['Color'] = this.getColorByAction(label);
        sendMsg = true;
      }
    }
    
    if (sendMsg == true) {
      var message = {};
      message['route'] = data;
      thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.ActionBar', JSON.stringify(message));
    }
  },

  /**
   * Color assignment by action
   */  
  getColorByAction: function(action) {
    switch(action) {
      case 'Monitor':
        return '#AEE27A'; //'#66CC00'; // Green
        break;
      case 'Call client':
        return '#F4DB77'; //'#FFCC00'; // Yellow
        break;
      case 'Debt Collection':
        return '#F2878C'; //'#F62229'; // Red
      default:
        return '#8BC0F4'; //'#3399FF'; // Blue
    }
  },

  /**
   * Calculation of due months
   */    
  getDueMonths: function(dueDate) {
    var dateParts = dueDate.split(".");
    var dateObj = new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
    var todayObj = new Date();

    var dif = dateObj.getTime() - todayObj.getTime();

    if (dif <= 0) {
      dateObj.setMonth(dateObj.getMonth() + 1);
      var value = 1 + this.getDueMonths(dateObj.getDate() + "." + (dateObj.getMonth() + 1) + "." + dateObj.getFullYear());
      return value;
    }
    else {
      return 0;
    }
  },

  /**
   * Label assignment by due date
   */    
  getLabelByDueDate: function(dueDate) {
    var monthsDue = this.getDueMonths(dueDate);
    switch (monthsDue) {
      case 0:
        return 'No debt';
        break;
      case 1:
        return '1 month';
        break;
      case 2:
        return '2 months';
        break;
      default:
        return '3+ months';
    }
  },

  /**
   * Color assignment by due date label
   */    
  getColorByDueDateLabel: function(label) {
    switch(label) {
      case '1 month':
        return '#F4DB77'; // Yellow
        break;
      case '2 months':
        return '#FFA060'; // Oranz
        break;
      case '3+ months':
        return '#F2878C'; // Red
      default:
        return '#AEE27A'; // Green
    }
  },

  /**
   * Color assignment by credit risk
   */    
  getColorByCreditRisk: function(action) {
    switch(action) {
      case 'Normal':
        return '#AEE27A'; // Green
        break;
      case 'Low':
        return '#F4DB77'; // Yellow
        break;
      case 'High':
        return '#F2878C'; // Red
      default:
        return '#8BC0F4'; // Blue
    }
  },

  /**
   * Initializing underlying datastructure record
   */  
  initOrganixationRecordData: function(rowObj) {
    var rowID = rowObj['ID'];
    if (this.soapData[rowID] == null) {
      this.soapData[rowID] = {};
    }
    
    var dataRow = {};
    for (var key in rowObj){
      dataRow[key] = rowObj[key];
    }
    
    this.soapData[rowID] = dataRow;
  },

  /**
   * Initializing underlying datastructure
   */
  initOrganizationDetailsData: function(thisWidget, rawData) {
    var data = rawData['route'];
    
    if (data != null) {
      if ($.isArray(data)) {
        for (var i = 0; i < data.length; i++) {
          this.initOrganixationRecordData(data[i]);
        }
      }
      else {
        this.initOrganixationRecordData(data);
      }
    }
  },
  
  /**
   * Sending records that have no SOAP request done yet
   */
  sendSoapOrganizationDetailsRequests: function(thisWidget) {
    for (var i = 1; i < thisWidget.soapData.length; i++) {
      var record = thisWidget.soapData[i];
      var regCode = record['Debtor regcode'];
      if ((thisWidget.regCodes.indexOf(regCode) == -1) && ((record['Reputation Score'] == null) || (record['Reputation Score'] == ''))) {
        thisWidget.regCodes.push(regCode);
      }
    }

    for (var i = 0; i < thisWidget.regCodes.length; i++) {
      var message = {};
      message['Header'] = {};
      message['Header']['AccessKey'] = '?';
      message['Body'] = {};
      message['Body']['getOrganizationDetails'] = {};
      message['Body']['getOrganizationDetails']['getOrganizationDetails'] = {};
      message['Body']['getOrganizationDetails']['getOrganizationDetails']['registrationCode'] = thisWidget.regCodes[i];
      message['Body']['getOrganizationDetails']['getOrganizationDetails']['registrationCountryCode'] = 'EE';
      thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.OrganizationDetailsRequest', JSON.stringify(message));
    }
  },
  
  /**
   * Parsing organization details SOAP result
   */
  parseSoapOrganizationDetailsResponse: function(thisWidget, rawData) {
    var regCode = rawData['Body']['getOrganizationDetailsResponse']['organizationDetails']['registrationCode']['_value_'];

    for (var i = 1; i < thisWidget.soapData.length; i++) {
      var record = thisWidget.soapData[i];
      var repScore = rawData['Body']['getOrganizationDetailsResponse']['organizationDetails']['reputationScore']['_value_'];
      if (record['Debtor regcode'] == regCode) {
        var message = {};
        message['route'] = {"ID" : record['ID'], "Reputation Score" : repScore};
        thisWidget.OpenAjax.hub.publish('CreditManager.Data.OrganizationDetails', JSON.stringify(message));
      }
    }
  },

  /**
   * Sending organization registration code to debt collection registry
   */
  parseSoapDebtCollectionRequest: function(thisWidget, rawData) {
    return;
    var message = {};
    message['Header'] = {};
    message['Header']['AccessKey'] = '?';
    message['Body'] = {};
    message['Body']['registerDebtCollection'] = {};
    message['Body']['registerDebtCollection']['registerDebtCollection'] = {};
    message['Body']['registerDebtCollection']['registerDebtCollection']['registrationCode'] = rawData['route']['Debtor regcode'];
    thisWidget.OpenAjax.hub.publish('CreditManager.InternalData.DebtCollectionRequest', JSON.stringify(message));
  },

  /**
   * Parsing debt collection registration SOAP result
   */
  parseSoapDebtCollectionResponse: function(thisWidget, rawData) {
    // No response needed from Debt Collection SOAP request
  }
};
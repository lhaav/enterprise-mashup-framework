/**
 * Generating mashup URL
 *
 * @author Liisi
 */

window.onload = loadEventHandler;

var rootUrl = '';

function loadEventHandler() {
  // host url
  tokens = window.location.pathname.split("/", 2);
  rootUrl = (window.location.protocol + "//" + window.location.host + "/" + tokens.join("") + "/");
  
  loadMashupView();
}

function loadMashupView() {
  var params = window.location.search.substring(1).split("&");
  for (var i = 0; i < params.length; i++) {
    var param = params[i].split('=');
    switch (param[0]) {
      case "username":
        var user = decodeURIComponent(param[1]);
        break;
      case "usertype":
        var usertype = decodeURIComponent(param[1]);
        break;
      case "mashupid":
        var mashupId = decodeURIComponent(param[1]);
        break;
    }
  }
  
  // Generate widgets for view
  var generator = new Generator(user, usertype, rootUrl);
  var view = generator.GenerateView();
  var url = '';

  for (var i = 0; i < view.length; i++) {
    var widgetName = view[i].widgetName;
    var widgetUrl = view[i].widgetUrl;
    var widgetProperties = view[i].widgetProperties;

    url = url + composeUrl(i, widgetUrl, widgetProperties, user, usertype, mashupId);
  }

  url = 'http://deepweb.ut.ee/automicrosite/?' + url;
  url = url + encodeURIComponent('widget[' + (view.length) + ']') + '=' + encodeURIComponent(rootUrl + 'widgets/System/Session.oam.xml') + '&';
  url = url + encodeURIComponent('property[' + (view.length) + '][mashupId]') + '=' + encodeURIComponent(mashupId) + '&';
  url = url + encodeURIComponent('property[' + (view.length) + '][rootUrl]') + '=' + encodeURIComponent(rootUrl) + '&';
  
  url = url + encodeURIComponent('widget[' + (view.length + 1) + ']') + '=' + encodeURIComponent(rootUrl + 'widgets/Proxy/Proxy.oam.xml') + '&';
  url = url + encodeURIComponent('property[' + (view.length + 1) + '][wsdl]') + '=http://deepweb.ut.ee/creditmanager/WSDLs/krdxInterfaceService-liisi.wsdl&';
  url = url + encodeURIComponent('property[' + (view.length + 1) + '][operation]') + '=getOrganizationDetails&';
  url = url + encodeURIComponent('property[' + (view.length + 1) + '][proxy]') + '=123&';

  //url = url + encodeURIComponent('widget[' + (view.length + 2) + ']') + '=' + encodeURIComponent(rootUrl + 'widgets/Transformer/Transformer.oam.xml') + '&';
  
  console.log(url);

  window.location.href = url;
}

function composeUrl(i, widgetUrl, widgetProperties, user, view, mashupId) {
  var result = encodeURIComponent('widget[' + i + ']') + '=' + encodeURIComponent(rootUrl + widgetUrl) + '&';
  result = result + encodeURIComponent('property[' + i + '][user]') + '=' + encodeURIComponent(user) + '&';
  result = result + encodeURIComponent('property[' + i + '][view]') + '=' + encodeURIComponent(view) + '&';
  result = result + encodeURIComponent('property[' + i + '][mashupId]') + '=' + encodeURIComponent(mashupId) + '&';

  for (var property in widgetProperties) {
    var propertyValue;
    if (typeof(widgetProperties[property]) != "string") {
      propertyValue = JSON.stringify(widgetProperties[property]);
    } else {
      propertyValue = widgetProperties[property];
    }
    result = result + encodeURIComponent('property[' + i + '][' + property + ']') + '=' + encodeURIComponent(propertyValue) + '&';    
  }

  return result;
}
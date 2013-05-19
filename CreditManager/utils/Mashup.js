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
      case "role":
        var role = decodeURIComponent(param[1]);
        break;
      case "mashupid":
        var mashupId = decodeURIComponent(param[1]);
        break;
    }
  }
  
  // Generate widgets for view
  var generator = new Generator(role, rootUrl);
  var view = generator.GenerateView();
  var url = '';
  var modelWidgetsUrl = '';

  for (var i = 0; i < view.length; i++) {
    var widgetName = view[i].widgetName;
    var widgetUrl = view[i].widgetUrl;
    var widgetProperties = view[i].widgetProperties;

    modelWidgetsUrl = modelWidgetsUrl + composeUrl(i, widgetUrl, widgetProperties, user);
  }

  $.post(this.rootUrl + "utils/Conf.php",
    function(response) {
      try {
        response = JSON.parse(response);
      }
      catch(e) {
        console.log('ERROR: ' + response);
        return;
      }

      url = response['layout_generator']['url'] + '/?' ;

      url = url + modelWidgetsUrl;
      
      url = url + encodeURIComponent('widget[' + (view.length) + ']') + '=' + encodeURIComponent(rootUrl + 'widgets/System/State.oam.xml') + '&';
      url = url + encodeURIComponent('property[' + (view.length) + '][mashupId]') + '=' + encodeURIComponent(mashupId) + '&';
      url = url + encodeURIComponent('property[' + (view.length) + '][rootUrl]') + '=' + encodeURIComponent(rootUrl) + '&';

      url = url + encodeURIComponent('widget[' + (view.length + 1) + ']') + '=' + encodeURIComponent(rootUrl + 'widgets/System/Transformer.oam.xml') + '&';  
      
      console.log(url);

      window.location.href = url;
    }
  );
}

function composeUrl(i, widgetUrl, widgetProperties, user) {
  var result = encodeURIComponent('widget[' + i + ']') + '=' + encodeURIComponent(rootUrl + widgetUrl) + '&';
  result = result + encodeURIComponent('property[' + i + '][user]') + '=' + encodeURIComponent(user) + '&';

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
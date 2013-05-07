/**
 * Parser for xml mashup description file
 *
 * @author Liisi
 */

function XmlParser(xmlUrl) {
  this.xmlUrl = xmlUrl;
  this.xmlDoc = null;
}

XmlParser.prototype.LoadXml = function() {
  var xmlDoc = null;
  $.ajax({
    async: false,
    type: "GET",
    url: this.xmlUrl,
    dataType: "xml",
    success: function(xml){
      xmlDoc = xml;
    },
    error: function(xhr, textStatus, error) {
      console.log('Status: ' + textStatus);
      console.log(xhr.responseText);
      alert('An unknown error occurred while trying to fetch the feed: ' + xhr.status);
    }
  });
  this.xmlDoc = xmlDoc;
}

XmlParser.prototype.CleanWhitespace = function(node) {
  for (var i = 0; i < node.childNodes.length; i++) {
    var child = node.childNodes[i];
    if(child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
      node.removeChild(child);
      i--;
    }
    if(child.nodeType == 1) {
      this.CleanWhitespace(child);
    }
  }
  return node;
}

XmlParser.prototype.GetMashupNode = function() {
  var result = this.xmlDoc.firstChild;
  result = this.CleanWhitespace(result);
  return result;
}

XmlParser.prototype.GetMashupComponents = function() {
  var result = this.GetMashupNode().firstChild.childNodes;
  return result;
}

XmlParser.prototype.GetMashupViews = function() {
  var result = this.GetMashupNode().lastChild.childNodes;
  return result;
}

XmlParser.prototype.ProcessChild = function(parent) {
  var result = new Object();

  var attribute;
  for (var j = 0; j < parent.attributes.length; j++) {
    attribute = parent.attributes[j];
    result[attribute.name] = attribute.value;
  }

  var childItem;
  var childItemObject;
  for (var j = 0; j < parent.childNodes.length; j++) {
    childItem = parent.childNodes[j];
    
    childItemObject = this.ProcessChild(childItem);

    if (result.hasOwnProperty(childItem.nodeName) == false) {
      result[childItem.nodeName] = new Array();
    }

    result[childItem.nodeName].push(childItemObject);
  }
  return result;
}

XmlParser.prototype.ChildNodeToObjectByID = function(id, parent) {
  id = id.toUpperCase();
  var childId;
  for (var i = 0; i < parent.length; i++) {
    childId = parent[i].getAttribute("id").toUpperCase();
    if (childId == id) {
      var result = this.ProcessChild(parent[i]);
      return result;
    }
  }
}

XmlParser.prototype.GetComponentByID = function(id) {
  var components = this.GetMashupComponents();
  var result = this.ChildNodeToObjectByID(id, components);
  return result;
}

XmlParser.prototype.GetViewByID = function(id) {
  var views = this.GetMashupViews();
  var result = this.ChildNodeToObjectByID(id, views);
  return result;
}

XmlParser.prototype.GetAttribute = function(component, attribute) {
    if (component.hasOwnProperty(attribute)) {
      return component[attribute];
    }
    else {
      return '';
    }
}
var xmlDomDoc;

function InitializeXMLNodes()
{
	// create the nodeType constants if the Node object is not defined
	if (!window.Node)
	{
		var Node =
		{
			ELEMENT_NODE                :  1,
			ATTRIBUTE_NODE              :  2,
			TEXT_NODE                   :  3,
			CDATA_SECTION_NODE          :  4,
			ENTITY_REFERENCE_NODE       :  5,
			ENTITY_NODE                 :  6,
			PROCESSING_INSTRUCTION_NODE :  7,
			COMMENT_NODE                :  8,
			DOCUMENT_NODE               :  9,
			DOCUMENT_TYPE_NODE          : 10,
			DOCUMENT_FRAGMENT_NODE      : 11,
			NOTATION_NODE               : 12
		}
	}
}

function checkXMLValidity(xmlFile)
{
	if (xmlFile && xmlFile.type == "text/xml")
	{
		readXML(xmlFile);
	}
	else
	{
		alert("Failed to load file.");
	}
}

function readXML(xmlFile)
{
	var reader = new FileReader();
	waitForTextReadComplete(reader);
	reader.readAsText(xmlFile);
}

function waitForTextReadComplete(reader)
{
    reader.onloadend = function(event)
    {
        var text = event.target.result;

        parseTextAsXml(text);
    }
}

function parseTextAsXml(text)
{
    var parser = new DOMParser();
    var xmlDomDoc = parser.parseFromString(text, "text/xml");
	
	if(!!document.documentMode)	// Is IE. Implement CustomEvent.
	{
		(function () 
		{
	      function CustomEvent ( event, params ) {
	        params = params || { bubbles: false, cancelable: false, detail: undefined };
	        var evt = document.createEvent( 'CustomEvent' );
	        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
	        return evt;
	      };
	
	      CustomEvent.prototype = window.Event.prototype;
	      window.CustomEvent = CustomEvent;
	    })();
	}
    
	var event = new CustomEvent('xmlLoaded', {'detail': xmlDomDoc});
	document.dispatchEvent(event);
}

/** Test function to traverse the whole xml node tree. */
function traverse(tree) 
{
	if(tree.hasChildNodes()) 
	{ 
		document.write('<ul><li>');
		document.write('<b>' + tree.tagName + '</b>');

		for(var i=0; i<tree.childNodes.length; i++)
			traverse(tree.childNodes[i]);
		document.write('</li></ul>'); 
	}
}

/** Finds inside a node the required name from the attributes. */
function findName (node, name) 
{
	var childNodes = node.childNodes;
	for (var i = 0; i < childNodes.length; i++)
	{
		// Check if node and if folder.
		if (childNodes[i].nodeType == Node.ELEMENT_NODE && childNodes[i].nodeName == "folder")
		{
			// Check if it is the name we are searching for
			if (childNodes[i].getAttribute('name') == name)
			{
				// return it
				return childNodes[i];
			}
		}
	}

	console.log("Houston, we have a problem");
	return null;
}
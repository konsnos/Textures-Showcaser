window.addEventListener("load", initialize);
var thumbsTooltips = document.getElementsByClassName('thumbTooltip'); // Retrieve all thumb tooltips.

// If api is supported this is true.
var apiSupported;
// If xml is laoded this is true.
var xmlLoaded;

var xmlFile;
var xmlDomDoc;
var nodeNamesDepth;

var containedMaps;
var containedMats;

function initialize()
{
    document.getElementById("path").style.display = 'none';
    document.getElementById('xmlInput').addEventListener('change', handleFileSelect, false);

    window.onmousemove = toolTipsFollowMouse;
    
    supportsFileAPI();
    
    InitializeXMLNodes();
}

function supportsFileAPI()
{
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) 
    {
        apiSupported = true;    // All the File APIs are supported.
    } 
    else 
    {
        apiSupported = false;
        alert("This browser doesn't support the required functions.");

        // Hide all page
        document.getElementById("xmlLoad").style.display = 'none';
        document.getElementById("list").style.display = 'none';
    }
}

function handleFileSelect(evt)
{
    xmlFile = evt.target.files[0]; // FileList object
    xmlLoaded = false;

    if (xmlFile && xmlFile.type == "text/xml")
    {
        document.getElementById("xmlLoad").style.display = 'none';
        document.addEventListener('xmlLoaded', xmlLoadedSuccessfully);
        checkXMLValidity(xmlFile);
    }
}

function xmlLoadedSuccessfully(e)
{
    xmlLoaded = true;
    xmlDomDoc = e.detail;
    
    //now, extract items from xmlDomDoc and assign to appropriate text input fields
    nodeNamesDepth = [xmlDomDoc.documentElement.nodeName];
    //document.write(xmlDomDoc.documentElement.textContent); // Test xml

    document.getElementById("path").style.display = 'block';
    //traverse(xmlDomDoc);
    showCurrentFolderContents();
}

/** Returns all folders contained in the node. */
function getFolders(node)
{
    var childNodes = node.childNodes;
    var folders = [];
    
    for(var cn = 0; cn < childNodes.length; cn++)
    {
        if (childNodes[cn].nodeType == Node.ELEMENT_NODE && childNodes[cn].nodeName == "folder")
        {
            folders.push(childNodes[cn].getAttribute('name'));
        }
    }
    
    return folders;
}

/**
 * Returns all materials contained in the node.
 * A 2d array is returned which contains the names of the materials and the maps.
 */
function getMaterials(node)
{
    var childNodes = node.childNodes;
    var mats = [];
    
    for(var cn = 0; cn < childNodes.length; cn++)
    {
        if(childNodes[cn].nodeType == Node.ELEMENT_NODE && childNodes[cn].nodeName == "material")
        {
            mats.push([childNodes[cn].getAttribute('name'), getMaps(childNodes[cn])])
        }
    }
    
    return mats;
}

/** 
 * Return all maps contained in the node.
 * The returned variable is a 2D array of the source to the thumb, the text content, and the type.
 */
function getMaps (node)
{
    var childNodes = node.childNodes;
    var maps = [];

    for (var cn = 0; cn < childNodes.length; cn++) 
    {
        // Handle maps
        if (childNodes[cn].nodeType == Node.ELEMENT_NODE && childNodes[cn].nodeName == "map")
        {
            if(childNodes[cn].hasAttribute('thumb'))
            {
                maps.push([childNodes[cn].getAttribute('thumb'), childNodes[cn].textContent, childNodes[cn].getAttribute('type')]);
            }
            else
            {
                maps.push([childNodes[cn].textContent, childNodes[cn].textContent, childNodes[cn].getAttribute('type')]);
            }
        }
        // Handle materials
        if (childNodes[cn].nodeType == Node.ELEMENT_NODE && childNodes[cn].nodeName == "material")
        {
            var newMaps = getMaps(childNodes[cn]);
            maps = maps.concat(newMaps);
        }
    }
    
    return maps;
}

/** Returns the full path of the folder. */
function getFolderFullPath(nestedNode)
{
    var path = nestedNode.getAttribute("path");
    for(var p = 1;p < nodeNamesDepth.length;p++)
    {
        path += "\\" + nodeNamesDepth[p];
    }
    
    return path;
}

/** Returns the path from the xml root. */
function getFolderPath()
{
    var path = nodeNamesDepth[0];
    for(var p = 1;p < nodeNamesDepth.length;p++)
    {
        path += "\\" + nodeNamesDepth[p];
    }
    
    return path;
}

function showCurrentFolderContents()
{
    var nestedNode = xmlDomDoc.getElementsByTagName(nodeNamesDepth[0])[0];
    
    document.getElementById("currentPath").innerHTML = getFolderFullPath(nestedNode); 

    //traverse(nestedNode);
    
    for (var i = 1; i < nodeNamesDepth.length; i++)
    {
        nestedNode = findName(nestedNode, nodeNamesDepth[i]);
    }

    showContents(getFolders(nestedNode), getMaps(nestedNode), getMaterials(nestedNode));
}

function showContents(folders, maps, materials)
{
    containedMaps = maps;
    containedMats = materials;
    
    // Remove previous elements
    var prevList = document.getElementById('containerList');
    if(prevList)
    {
        document.getElementById("list").removeChild(prevList);
    }
    
    // Render thumbnail.
    var newList = document.createElement('div');
    newList.setAttribute("id","containerList");
    var innerHtml = "";
    
    var title;
    if(nodeNamesDepth.length > 1)
    {
        title = nodeNamesDepth[nodeNamesDepth.length - 1];
        innerHtml += '<div class="thumbTitle"><img class="thumb parentFolder" src="./images/folder_up.png" id="parentFolder" title="' + title + '" /><div class="thumbSubtitle">' + title + '</div></div>';
    }
    
    for(var f = 0; f < folders.length; f++)
    {
        title = folders[f];
        innerHtml += '<div class="thumbTitle"><img class="thumb subfolder" src="./images/folder.png" title="' + title + '" /><div class="thumbSubtitle">' + title + '</div></div>';	
    }
    
    for(var m = 0; m < materials.length; m++)
    {
        innerHtml += getMaterialHtml(materials[m], m);
    }
    // get name from path: .replace(/^.*[\\\/]/, '')
    newList.innerHTML = innerHtml;

    
    thumbsTooltips = document.getElementsByClassName('thumbTooltip');
    document.getElementById('list').insertBefore(newList, null);

    // add folder listeners
    if(nodeNamesDepth.length > 1)
    {
        document.getElementById("parentFolder").addEventListener("click", goToParentFolder);
    }

    var folders = document.getElementsByClassName("subfolder");
    for(var i =0;i<folders.length;i++)
    {
        folders[i].addEventListener("click", function(e){
                goToFolder(e.currentTarget.getAttribute("title"));
            });
    }

    // add preview listeners
    var previews = document.getElementsByClassName('preview');
    for(var i =0;i<previews.length;i++)
    {
        previews[i].addEventListener("click", function(e){
                var matId = e.currentTarget.getAttribute("matId");
                var mapId = e.currentTarget.getAttribute("mapId");
                openImg(matId, mapId);
            });
    }
}

/** Returns the index of the map that is diffuse. Or -1 if there is none. */
function getMapTypeFromMaterial(material, mapType)
{
    for(var m = 0; m < material[1].length; m++)
    {
        if(material[1][m][2] == mapType)
        {
            return m;
        }
    }
    
    return -1;
}

// A 2d array is returned which contains the names of the materials and the maps.
function getMaterialHtml(material, index)
{
    var name = material[0];
    var innerHtml = '<div class="matContainer">';
    
    // get thumbnail
    var difIndex = getMapTypeFromMaterial(material, 'diffuse');
    if (difIndex == -1)
    {
        difIndex = getMapTypeFromMaterial(material, 'other');
    }
    if(difIndex == -1)
    {
        difIndex = 0;
    }
    
    // Show preview
    if(difIndex > -1)
    {
        innerHtml += '<img class="thumb preview" matId="' + index + '" mapId="' + difIndex + '" src="file:///' + material[1][difIndex][0] + '" />';
    }
    for(var m = 0; m < material[1].length; m++)
    {
        innerHtml += '<div class="mapType preview" matId="' + index + '" mapId="' + m + '" >' + material[1][m][2] + '<span class="thumbTooltip"><img class="thumbTooltipImage" src="file:///' + material[1][m][0] + '" /></span></div>';
    }
    
    innerHtml += '<div class="thumbSubtitle">' + name + '</div>';
    innerHtml += '</div>';
    return innerHtml;
}

/** Open parent folder. */
function goToParentFolder()
{
    nodeNamesDepth.pop();
    showCurrentFolderContents();
}

/** Open folder. */
function goToFolder(node)
{
    nodeNamesDepth.push(node);
    showCurrentFolderContents();
}

/** Retrieve the path of the map and if IE then open windows explorer to the map, or if any other browser then offer to copy the path. */
function openImg(matIndex, mapIndex)
{
    var folderPathIndex = containedMats[matIndex][1][mapIndex][1].lastIndexOf('\\');
    var folderPath = containedMats[matIndex][1][mapIndex][1].substr(0, folderPathIndex);
    
    if(!!document.documentMode)	// Is IE
    {
        window.open("file:" + folderPath);
    }
    else	// Other browser
    {
        prompt("Folder path", folderPath);
    }
}

/** Makes tooltips follow mouse position and aligns it to be visible. */
function toolTipsFollowMouse(e)
{
    var x = e.clientX, y = e.clientY;
    var width = 224;
    var height = 224;
    
    var widthMargin = 18;
    var heightMargin = 8;
    
    var availWidth = screen.availWidth;
    
    var posX;
    var posY;
    
    if(x + width > availWidth)
    {
        posX = (x - width - widthMargin) + 'px';
    }
    else
    {
        posX = x + 'px';
    }
    
    if(y - height < 0)
    {
        posY = y + 'px';
    }
    else
    {
        posY = (y - height - heightMargin) + 'px';
    }
    
    for(var i = 0;i<thumbsTooltips.length;i++)
    {
        thumbsTooltips[i].style.top = posY;
        thumbsTooltips[i].style.left = posX;
    }
}
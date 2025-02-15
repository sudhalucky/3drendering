import Rusha from "./rusha";
import uids from "./uids"
import dicomParser from "./dicomParser"

var dataSet; // the parsed dataSet as global so we can interact with it from console

var maxLength = 128;
var untilTag = "";
var showPrivateElements = false;
var showP10Header = false;
var showEmptyValues = false;
var showLength = false;
var showVR = false;
var showGroupElement = false;
var showFragments = false;
var showFrames = false;
var showSHA1 = false;
var file = undefined;
var sha1Hash = "";
var rusha = new Rusha();

// helper function to see if a string only has ascii characters in it
function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

function sha1(byteArray, position, length) {
    position = position || 0;
    length = length || byteArray.length;
    var subArray = dicomParser.sharedCopy(byteArray, position, length);
    return rusha.digest(subArray);
}

function sha1Text(byteArray, position, length) {
    if(showSHA1 === false) {
        return "";
    }
    var text = "; SHA1 " + sha1(byteArray, position, length);
    return text;
}

function mapUid(str) {
    var uid = uids[str];
    if(uid) {
        return ' [ ' + uid + ' ]';
    }
    return '';
}

function escapeSpecialCharacters(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function dataDownloadLink(element, text) {
    var linkText = "<a class='dataDownload' href='#' data-tag='" + element.tag + "'";
        linkText += " data-dataOffset='" + element.dataOffset + "'";
        linkText += " data-length='" + element.length + "'";
        linkText += ">" + text + "</a>";
    return linkText;
}


// This function iterates through dataSet recursively and adds new HTML strings
// to the output array passed into it
function dumpDataSet(dataSet, output)
{
    function getTag(tag)
    {
        var group = tag.substring(1,5);
        var element = tag.substring(5,9);
        var tagIndex = ("("+group+","+element+")").toUpperCase();
        var attr = TAG_DICT[tagIndex];
        return attr;
    }


    try{
        var keys = [];
        for(var propertyName in dataSet.elements) {
            keys.push(propertyName);
        }
        keys.sort();


        // the dataSet.elements object contains properties for each element parsed.  The name of the property
        // is based on the elements tag and looks like 'xGGGGEEEE' where GGGG is the group number and EEEE is the
        // element number both with lowercase hexadecimal letters.  For example, the Series Description DICOM element 0008,103E would
        // be named 'x0008103e'.  Here we iterate over each property (element) so we can build a string describing its
        // contents to add to the output array
        for(var k=0; k < keys.length; k++) {
            var propertyName = keys[k];
            var element = dataSet.elements[propertyName];

            if(showP10Header === false && element.tag <= "x0002ffff") {
                continue;
            }
            if(showPrivateElements === false && dicomParser.isPrivateTag(element.tag)) {
                continue;
            }
            if(showEmptyValues === false && element.length <= 0) {
                continue;
            }
            var text = "";
            var title = "";

            var color = 'black';

            var tag = getTag(element.tag);
            // The output string begins with the element name (or tag if not in data dictionary), length and VR (if present).  VR is undefined for
            // implicit transfer syntaxes
            if (tag === undefined) {
                text += element.tag;
                text += " : ";

                var lengthText = "length=" + element.length;
                if (element.hadUndefinedLength) {
                    lengthText += " (-1)";
                }
                if(showLength === true) {
                    text += lengthText + "; ";
                }

                title += lengthText;

                var vrText = "";
                if (element.vr) {
                    vrText += "VR=" + element.vr;
                }

                if(showVR) {
                    text += vrText + "; ";
                }
                if(vrText) {
                    title += "; " + vrText;
                }

                title += "; dataOffset=" + element.dataOffset;
                // make text lighter since this is an unknown attribute
                color = '#C8C8C8';
            }
            else {
                text += tag.name;
                if(showGroupElement === true) {
                    text += "(" + element.tag + ")";
                }
                text += " : ";

                title += "(" + element.tag + ")";

                var lengthText = " length=" + element.length;
                if (element.hadUndefinedLength) {
                    lengthText += " (-1)";
                }

                if(showLength === true) {
                    text += lengthText + "; ";
                }
                title += "; " + lengthText;

                var vrText = "";
                if (element.vr) {
                    vrText += "VR=" + element.vr;
                }

                if(showVR) {
                    text += vrText + "; ";
                }
                if(vrText) {
                    title +="; " + vrText;
                }

                title += "; dataOffset=" + element.dataOffset;

            }

            // Here we check for Sequence items and iterate over them if present.  items will not be set in the
            // element object for elements that don't have SQ VR type.  Note that implicit little endian
            // sequences will are currently not parsed.
            if (element.items) {
                output.push('<li>' + text + '</li>');
                output.push('<ul>');

                // each item contains its own data set so we iterate over the items
                // and recursively call this function
                var itemNumber = 0;
                element.items.forEach(function (item) {
                    output.push('<li>Item #' + itemNumber++ + ' ' + item.tag);
                    var lengthText = " length=" + item.length;
                    if (item.hadUndefinedLength) {
                        lengthText += " (-1)";
                    }

                    if(showLength === true) {
                        text += lengthText + "; ";
                        output.push(lengthText);
                    }
                    output.push('</li>');
                    output.push('<ul>');
                    dumpDataSet(item.dataSet, output);
                    output.push('</ul>');
                });
                output.push('</ul>');
            }
            else if (element.fragments) {
                text += "encapsulated pixel data with " + element.basicOffsetTable.length + " offsets and " +
                        element.fragments.length + " fragments";
                text += sha1Text(dataSet.byteArray, element.dataOffset, element.length);

                output.push("<li title='" + title + "'=>" + text + '</li>');

                if(showFragments && element.encapsulatedPixelData) {
                    output.push('Fragments:<br>');
                    output.push('<ul>');
                    var itemNumber = 0;
                    element.fragments.forEach(function (fragment) {
                        var str = '<li>Fragment #' + itemNumber++ + ' dataOffset = ' + fragment.position;
                        str += '; offset = ' + fragment.offset;
                        str += '; length = ' + fragment.length ;
                        str += sha1Text(dataSet.byteArray, fragment.position, fragment.length);
                        str += '</li>';

                        output.push(str);
                    });
                    output.push('</ul>');
                }
                if(showFrames && element.encapsulatedPixelData) {
                    output.push('Frames:<br>');
                    output.push('<ul>');
                    var bot = element.basicOffsetTable;
                    // if empty bot and not RLE, calculate it
                    if(bot.length === 0) {
                        bot = dicomParser.createJPEGBasicOffsetTable(dataSet, element);
                    }

                    function imageFrameLink(frameIndex) {
                        var linkText = "<a class='imageFrameDownload' ";
                        linkText += "data-frameIndex='" + frameIndex + "'";
                        linkText += " href='#'> Frame #" + frameIndex + "</a>";
                        return linkText;
                    }

                    for(var frameIndex=0; frameIndex < bot.length; frameIndex++) {
                        var str = "<li>";
                        str += imageFrameLink(frameIndex, "Frame #" + frameIndex);
                        str += ' dataOffset = ' + (element.fragments[0].position + bot[frameIndex]);
                        str += '; offset = ' + (bot[frameIndex]);
                        var imageFrame = dicomParser.readEncapsulatedImageFrame(dataSet, element, frameIndex, bot);
                        str += '; length = ' + imageFrame.length ;
                        str += sha1Text(imageFrame);
                        str += '</li>';
                        output.push(str);
                    }
                    output.push('</ul>');
                }
            }
            else {
                // use VR to display the right value
                var vr;
                if (element.vr !== undefined) {
                    vr = element.vr;
                }
                else {
                    if (tag !== undefined) {
                        vr = tag.vr;
                    }
                }

                // if the length of the element is less than 128 we try to show it.  We put this check in
                // to avoid displaying large strings which makes it harder to use.
                if (element.length < maxLength) {
                    // Since the dataset might be encoded using implicit transfer syntax and we aren't using
                    // a data dictionary, we need some simple logic to figure out what data types these
                    // elements might be.  Since the dataset might also be explicit we could be switch on the
                    // VR and do a better job on this, perhaps we can do that in another example

                    // First we check to see if the element's length is appropriate for a UI or US VR.
                    // US is an important type because it is used for the
                    // image Rows and Columns so that is why those are assumed over other VR types.
                    if (element.vr === undefined && tag === undefined) {
                        if (element.length === 2) {
                            text += " (" + dataSet.uint16(propertyName) + ")";
                        }
                        else if (element.length === 4) {
                            text += " (" + dataSet.uint32(propertyName) + ")";
                        }


                        // Next we ask the dataset to give us the element's data in string form.  Most elements are
                        // strings but some aren't so we do a quick check to make sure it actually has all ascii
                        // characters so we know it is reasonable to display it.
                        var str = dataSet.string(propertyName);
                        var stringIsAscii = isASCII(str);

                        if (stringIsAscii) {
                            // the string will be undefined if the element is present but has no data
                            // (i.e. attribute is of type 2 or 3 ) so we only display the string if it has
                            // data.  Note that the length of the element will be 0 to indicate "no data"
                            // so we don't put anything here for the value in that case.
                            if (str !== undefined) {
                                text += '"' + escapeSpecialCharacters(str) + '"' + mapUid(str);
                            }
                        }
                        else {
                            if (element.length !== 2 && element.length !== 4) {
                                color = '#C8C8C8';
                                // If it is some other length and we have no string
                                text += "<i>binary data</i>";
                            }
                        }
                    }
                    else {
                        function isStringVr(vr) {
                            if (vr === 'AT'
                                    || vr === 'FL'
                                    || vr === 'FD'
                                    || vr === 'OB'
                                    || vr === 'OF'
                                    || vr === 'OW'
                                    || vr === 'SI'
                                    || vr === 'SQ'
                                    || vr === 'SS'
                                    || vr === 'UL'
                                    || vr === 'US'
                            ) {
                                return false;
                            }
                            return true;
                        }
                        if (isStringVr(vr)) {
                            // Next we ask the dataset to give us the element's data in string form.  Most elements are
                            // strings but some aren't so we do a quick check to make sure it actually has all ascii
                            // characters so we know it is reasonable to display it.
                            var str = dataSet.string(propertyName);
                            var stringIsAscii = isASCII(str);

                            if (stringIsAscii) {
                                // the string will be undefined if the element is present but has no data
                                // (i.e. attribute is of type 2 or 3 ) so we only display the string if it has
                                // data.  Note that the length of the element will be 0 to indicate "no data"
                                // so we don't put anything here for the value in that case.
                                if (str !== undefined) {
                                    text += '"' + escapeSpecialCharacters(str) + '"' + mapUid(str);
                                }
                            }
                            else {
                                if (element.length !== 2 && element.length !== 4) {
                                    color = '#C8C8C8';
                                    // If it is some other length and we have no string
                                    text += "<i>binary data</i>";
                                }
                            }
                        }
                        else if (vr === 'US') {
                            text += dataSet.uint16(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/2; i++) {
                                text += '\\' + dataSet.uint16(propertyName, i);
                            }
                        }
                        else if (vr === 'SS') {
                            text += dataSet.int16(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/2; i++) {
                                text += '\\' + dataSet.int16(propertyName, i);
                            }
                        }
                        else if (vr === 'UL') {
                            text += dataSet.uint32(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/4; i++) {
                                text += '\\' + dataSet.uint32(propertyName, i);
                            }
                        }
                        else if (vr === 'SL') {
                            text += dataSet.int32(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/4; i++) {
                                text += '\\' + dataSet.int32(propertyName, i);
                            }
                        }
                        else if (vr == 'FD') {
                            text += dataSet.double(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/8; i++) {
                                text += '\\' + dataSet.double(propertyName, i);
                            }
                        }
                        else if (vr == 'FL') {
                            text += dataSet.float(propertyName);
                            for(var i=1; i < dataSet.elements[propertyName].length/4; i++) {
                                text += '\\' + dataSet.float(propertyName, i);
                            }
                        }
                        else if (vr === 'OB' || vr === 'OW' || vr === 'UN' || vr === 'OF' || vr === 'UT') {
                            color = '#C8C8C8';
                            // If it is some other length and we have no string
                            if(element.length === 2) {
                                text += "<i>" + dataDownloadLink(element, "binary data") + " of length " + element.length + " as uint16: " +dataSet.uint16(propertyName) + "</i>";
                            } else if(element.length === 4) {
                                text += "<i>" + dataDownloadLink(element, "binary data") + " of length " + element.length + " as uint32: " +dataSet.uint32(propertyName) + "</i>";
                            } else {
                                text += "<i>" + dataDownloadLink(element, "binary data") + " of length " + element.length + " and VR " + vr + "</i>";
                            }
                        }
                        else if(vr === 'AT') {
                            var group = dataSet.uint16(propertyName, 0);
                            var groupHexStr = ("0000" + group.toString(16)).substr(-4);
                            var element = dataSet.uint16(propertyName, 1);
                            var elementHexStr = ("0000" + element.toString(16)).substr(-4);
                            text += "x" + groupHexStr + elementHexStr;
                        }
                        else if(vr === 'SQ') {
                        }
                        else {
                            // If it is some other length and we have no string
                            text += "<i>no display code for VR " + vr + " yet, sorry!</i>";
                        }
                    }

                    if (element.length === 0) {
                        color = '#C8C8C8';
                    }
                }
                else {
                    color = '#C8C8C8';

                    // Add text saying the data is too long to show...
                    text += "<i>" + dataDownloadLink(element, "data");
                    text += " of length " + element.length + " for VR " + vr + " too long to show</i>";
                    text += sha1Text(dataSet.byteArray, element.dataOffset, element.length);
                }
                // finally we add the string to our output array surrounded by li elements so it shows up in the
                // DOM as a list
                output.push('<li style="color:' + color + ';" title="' + title + '">' + text + '</li>');

            }
        }
    } catch(err) {
        var ex = {
            exception: err,
            output: output
        }
        throw ex;
    }
}


// This function will read the file into memory and then start dumping it
function dumpFile()
{
    if(file === undefined) {
        return;
    }

    var reader = new FileReader();
    reader.onload = function(file) {
        var arrayBuffer = reader.result;
        // Here we have the file data as an ArrayBuffer.  dicomParser requires as input a
        // Uint8Array so we create that here
        var byteArray = new Uint8Array(arrayBuffer);
        var kb = byteArray.length / 1024;
        var mb = kb / 1024;
        var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";
//        document.getElementById('statusText').innerHTML = 'Status: Parsing ' + byteStr + ' bytes, please wait..';
        // set a short timeout to do the parse so the DOM has time to update itself with the above message
        setTimeout(function() {
            var sha1Hash = sha1(byteArray, 0, byteArray.length);

            // Invoke the parseDicom function and get back a DataSet object with the contents
            try {
                var start = new Date().getTime();
                var options = {
                    untilTag: untilTag,
                    vrCallback(tag) {
                        const formatted = `(${tag.substring(1, 5).toUpperCase()},${tag.substring(5, 9).toUpperCase()})`;
                        return !!TAG_DICT[formatted] ? TAG_DICT[formatted].vr : undefined;
                    }
                };

                dataSet = dicomParser.parseDicom(byteArray, options);
                // dump dataSet to console to aid debugging.
                if(console) {
                    console.log(dataSet);
                }
                // Here we call dumpDataSet to recursively iterate through the DataSet and create an array
                // of strings of the contents.
                var output = [];
                dumpDataSet(dataSet, output);
                // Combine the array of strings into one string and add it to the DOM
                document.getElementById('dropZone').innerHTML = '<ul>' + output.join('') + '</ul>';

                function downloadData(data, fileName) {
                    var blob = new Blob([data], {type: 'application/octet-stream'});
                    var objectURL = URL.createObjectURL(blob);
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    a.href = objectURL;
                    a.download = fileName;
                    a.click();
                    window.URL.revokeObjectURL(objectURL);
                    $(a).remove();
                }

                function extractEncapsulatedImageFrame(frameIndex) {
                    var element = dataSet.elements.x7fe00010;
                    var isRLE = dataSet.string('x00020010') === '1.2.840.10008.1.2.5';
                    var imageFrame;
                    if(isRLE) {
                        // RLE cannot be fragmented so frameIndex = fragmentIndex
                        imageFrame = dicomParser.readEncapsulatedPixelDataFromFragments(dataSet, element, frameIndex);
                    } else {
                        var bot = element.basicOffsetTable;
                        // if basic offset table is empty, calculate it
                        if(bot.length === 0) {
                            bot = dicomParser.createJPEGBasicOffsetTable(dataSet, element);
                        }
                        imageFrame = dicomParser.readEncapsulatedImageFrame(dataSet, element, frameIndex, bot);
                    }
                    return imageFrame;
                }

                $('.imageFrameDownload').click(function(ev) {
                    var frameIndex = parseInt($(ev.currentTarget).attr('data-frameIndex'));
                    var imageFrame = extractEncapsulatedImageFrame(frameIndex);
                    var sopInstanceUid = dataSet.string('x00080018');
                    var fileName = sopInstanceUid + "-imageFrame-" + frameIndex + ".dat";
                    downloadData(imageFrame,fileName);
                    ev.preventDefault();
                    ev.stopPropagation();
                });

                $('.dataDownload').click(function(ev) {
                    var tag = $(ev.currentTarget).attr('data-tag');
                    var dataOffset = parseInt($(ev.currentTarget).attr('data-dataOffset'));
                    var length = parseInt($(ev.currentTarget).attr('data-length'));
                    var data = dicomParser.sharedCopy(dataSet.byteArray, dataOffset, length);
                    var sopInstanceUid = dataSet.string('x00080018');
                    var fileName = sopInstanceUid + "-" + tag + "-" + dataOffset + ":" + length + ".dat";
                    downloadData(data,fileName);
                    ev.preventDefault();
                    ev.stopPropagation();
                });

                var end = new Date().getTime();
                var time = end - start;
                var statusText = 'Status:';
                if(dataSet.warnings.length > 0)
                {
                    $('#status').removeClass('alert-success alert-info alert-danger').addClass('alert-warning');
                    statusText += 'Warnings encountered while parsing file';

                    dataSet.warnings.forEach(function(warning) {
                        $("#warnings").append('<li>' + warning +'</li>');
                    });
                }
                else
                {
                    var pixelData = dataSet.elements.x7fe00010;
                    if(pixelData) {
                        $('#status').removeClass('alert-warning alert-info alert-danger').addClass('alert-success');
                        statusText += 'Ready';
                    }
                    else
                    {
                        $('#status').removeClass('alert-warning alert-info alert-danger').addClass('alert-success');
                        statusText += 'Ready - no pixel data found';
                    }
                }
                statusText += '; file size ' + byteStr;
                statusText += '; parse time ' + time + 'ms';
                statusText += '; SHA1 = ' + sha1Hash;
                statusText += '<br>';
                statusText += uids[(dataSet.string('x00020002'))];
                statusText += '; ' + uids[(dataSet.string('x00020010'))];

                $('#statusText').html(statusText);

            }
            catch(err)
            {
                var message = err;
                if(err.exception) {
                    message = err.exception;
                }

                $('#status').removeClass('alert-success alert-info alert-warning').addClass('alert-danger');
                document.getElementById('statusText').innerHTML = 'Status: Error - ' + message + ' (file of size ' + byteStr + ' )';
                if(err.output) {
                    document.getElementById('dropZone').innerHTML = '<ul>' + output.join('') + '</ul>';
                }
                else if(err.dataSet) {
                    var output = [];
                    dumpDataSet(err.dataSet, output);
                    document.getElementById('dropZone').innerHTML = '<ul>' + output.join('') + '</ul>';
                }
            }
        },10);
    };

    reader.readAsArrayBuffer(file);
}


// this function gets called once the user drops the file onto the div
function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    // Get the FileList object that contains the list of files that were dropped
    var files = evt.dataTransfer.files;

    // this UI is only built for a single file so just dump the first one
    file = files[0]
    dumpFile();
}


$('#version').text(dicomParser.version);

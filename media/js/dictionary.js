var apiBaseUrl = "https://api.wordnik.com/v4";
var meaningDisplayFlag = false;
var meaning, word, context;
var backend = chrome.runtime.connect({name: "connectionToBackend"});
var noMeaningFoundError = "No meaning found";
var otherError = "Some error occurred. Please try later";

$(document).ready(function () {
    $(document).dblclick(function(e){
        var wordObject = window.getSelection();
        word = $.trim(wordObject.toString());
        var result = word.split(/[\n\r\s]+/);

        // To disable multiple words selection
        // and null selection
        if (result.length != 1) {
            return;
        }

        showQtip(document, e);
        fetchMeaning(word.toLowerCase(), function(message){
            meaning = message;
            changeQtipText(document, meaning);
            meaningDisplayFlag = true;
        });

        context = getContext(wordObject);
        console.log(context);
    });

    $(document).on('mousedown', function(){
        if (!meaningDisplayFlag) {
            return;
        }

        if (meaning === noMeaningFoundError) {
            // Don't save the word
            return;
        }

        backend.postMessage({type: "saveWord", word: word, meaning: meaning, context: context});
        meaningDisplayFlag = false;
    });
});

function showQtip(selector, e) {
    $(selector).qtip({
        content: {
            text: "Searching for meaning....."
            // text: $('#zingerHiddenDiv')
        },

        position: {
            target: [e.pageX, e.pageY],
            viewport: $(window),
            adjust: {
                y: 12,
                mouse: false
            }
        },

        show: {
            ready: true
        },

        style: {
            width: "250px"
        },

        hide: {
            event: 'mousedown'
        },

        events: {
            hide: function(event, api) {
                api.destroy();
            }
        }
    });

    meaningDisplayFlag = true;
}


function changeQtipText(selector, newText) {
    $(selector).qtip('option', 'content.text', newText);
}

function fetchMeaning(word, callback) {
    var requestUrl = apiBaseUrl + "/word.json/" + word + "/definitions?";
    var data = {
        "limit": 1,
        "includeRelated": false,
        "sourceDictionaries": "all",
        "useCanonical": true,
        "includeTags": false,
        "api_key": config.apiKey
    }

    $.ajax({
        url: requestUrl,
        data: data,
        dataType: "json",
        success: function (response) {
            if (response.length == 0 || response == null) {
                callback(noMeaningFoundError);
            } else {
                callback(response[0].text);
            }
        },

        statusCode: {
            404: function() {
                callback(otherError);
            }
        }
    });
}

// Listen for incoming requests from browser_action script
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSelection") {
        sendResponse({data: window.getSelection().toString(), context:getContext(window.getSelection())});
    } else {
        sendResponse({}); // snub them.
    }
});

// Problems:
// 1. If we view the meaning at bottom of page... there will be no space for the box.
// 2. If we show tooltip on top.. speech bubble orientation is not correct
// 3. We should not display text on double click inside text area (what say?)
// 4. If mouse not near word when double clicking then tooltip is coming at wrong place.
//    try clicking outside the line and let it select the first word automatically
// 5. Middle click twice
// 6. Moving the window from one screen to another, the tooltip is present at old location
var meaningDisplayFlag = false;
var meaning, word, context;

var backend = chrome.runtime.connect({name: "connectionToBackend"});

$(document).ready(function () {
    $(document).dblclick(function(e){
        var wordObject = window.getSelection();
        word = $.trim(wordObject.toString());
        var result = word.split(/[\n\r\s]+/);
        // To disable multiple words selection
        // and null selection
        if (result.length != 1 || word == '') {
            return;
        }

        showQtip(document, e);
        fetchMeaningCambridge(word.toLowerCase(), function(message){
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

        if (meaning === noMeaningFoundError || meaning == otherError) {
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
            width: "250px",
            height: "100px"
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
    $(selector).qtip('option', 'style.tip.height', "100px");
}


// Listen for incoming requests from browser_action script
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSelection") {
        sendResponse({data: window.getSelection().toString(), context:getContext(window.getSelection())});
    } else {
        sendResponse({}); // snub them.
    }
});

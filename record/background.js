console.log("background.js");

let contentPort = null;
let popupPort = null;

chrome.runtime.onConnect.addListener(onConnect);

// FUN FACT: port.onMessage.addListener() REQUIRES that you either do .bind(this) on your named
// function or use an arrow function, probably because of some opaque internal implementation
function onConnect(port) {
    switch (port.name) {
        case "content":
            if (contentPort !== null) {
                contentPort.onMessage.removeListener(onReceivedContentMessage.bind(this));
            }
            contentPort = port;
            contentPort.onMessage.addListener(onReceivedContentMessage.bind(this));
            contentPort.onDisconnect.addListener(onContentDisconnect);
            break;
        case "popup":
            if (popupPort !== null) {
                popupPort.onMessage.removeListener(onReceivedPopupMessage.bind(this));
            }
            popupPort = port;
            popupPort.onMessage.addListener(onReceivedPopupMessage.bind(this));
            popupPort.onDisconnect.addListener(onPopupDisconnect);
            // TODO: Maybe popup wants to know the current status of background considering
            // that popup loses all context when it closes.
            break;
    }
}

function onContentDisconnect() {
    console.log("content disconnected");
    contentPort.onMessage.removeListener(onReceivedContentMessage.bind(this));
    contentPort = null;
}

function onPopupDisconnect() {
    console.log("popup disconnected");
    popupPort.onMessage.removeListener(onReceivedPopupMessage.bind(this));
    popupPort = null;
}

function onReceivedPopupMessage(message) {
    console.log("Received popup", message);

    switch (message.type) {
        case "record":
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        files: ["content.js"],
                    });
                }
            });
            break;
        case "export":
            contentPort.postMessage({ type: "export" });
            break;
    }
}

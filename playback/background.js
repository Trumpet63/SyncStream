console.log("background.js");

let commentaryPort = null;
let commentaryTabId = null;
let targetPort = null;
let targetTabId = null;
let targetActions = null;
let popupPort = null;

chrome.runtime.onConnect.addListener(onConnect);

let commentaryUrl = null;
let targetUrl = null;

// FUN FACT: port.onMessage.addListener() REQUIRES that you either do .bind(this) on your named
// function or use an arrow function, probably because of some opaque internal implementation
function onConnect(port) {
    switch (port.name) {
        case "content":
            let tabId = port.sender?.tab?.id;
            if (tabId === commentaryTabId) {
                console.log("Connected to commentary");
                if (commentaryPort !== null) {
                    commentaryPort.onMessage.removeListener(onReceivedCommentaryMessage.bind(this));
                }
                commentaryPort = port;
                commentaryPort.onMessage.addListener(onReceivedCommentaryMessage.bind(this));
                commentaryPort.postMessage({ type: "identification", tabType: "commentary" });
            } else if (tabId === targetTabId) {
                console.log("Connected to target");
                if (targetPort !== null) {
                    targetPort.onMessage.removeListener(onReceivedTargetMessage.bind(this));
                }
                targetPort = port;
                targetPort.onMessage.addListener(onReceivedTargetMessage.bind(this));
                targetPort.postMessage({ type: "identification", tabType: "target" });
                targetPort.postMessage({ type: "actions", actions: targetActions });
            } else {
                console.log("Received a connection from a tab that wasn't known to be target or commentary");
            }
            break;
        case "popup":
            if (popupPort !== null) {
                popupPort.onMessage.removeListener(onReceivedPopupMessage.bind(this));
            }
            popupPort = port;
            popupPort.onMessage.addListener(onReceivedPopupMessage.bind(this));
            // TODO: Maybe popup wants to know the current status of background considering
            // that popup loses all context when it closes.
            break;
    }
}

// TODO: onDisconnect needs to be set on each port
function onDisconnect(port) {
    switch (port.name) {
        case "content":
            let tabId = port.sender?.tab?.id;
            if (tabId === commentaryTabId) {
                console.log("commentary disconnected");
                commentaryPort.onMessage.removeListener(onReceivedCommentaryMessage.bind(this));
                commentaryPort = null;
            } else if (tabId === targetTabId) {
                console.log("target disconnected");
                targetPort.onMessage.removeListener(onReceivedTargetMessage.bind(this));
                targetPort = null;
            } else {
                console.log("Disconnected from a tab that wasn't known to be target or commentary");
            }
            break;
        case "popup":
            popupPort.onMessage.removeListener(onReceivedPopupMessage.bind(this));
            popupPort = null;
            break;
    }
}

function onReceivedPopupMessage(message) {
    console.log("Received popup", message);

    switch (message.type) {
        case "upload":
            targetActions = message.actions;
            commentaryUrl = message.commentaryUrl;
            targetUrl = message.targetUrl

            chrome.tabs.create({ url: message.commentaryUrl }, (tab) => {
                commentaryTabId = tab.id;
            });
            
            // Now wait until the commentary tab sends the "ready" message
            // before opening the target tab.
            break;
        case "play":
            console.log("actions", targetActions);
            commentaryPort.postMessage({ type: "play" });
            targetPort.postMessage({ type: "play" });
            break;
        case "pause":
            commentaryPort.postMessage({ type: "pause" });
            targetPort.postMessage({ type: "pause" });
            break;
    }
}

function onReceivedCommentaryMessage(message) {
    console.log("onReceivedCommentaryMessage");

    switch (message.type) {
        case "ready":
            // Whichever tab is opened last will be the focused tab
            chrome.tabs.create({ url: targetUrl }, (tab) => {
                targetTabId = tab.id;
            });
            break;
    }
}

function onReceivedTargetMessage(message) {
    console.log("onReceivedTargetMessage");
}

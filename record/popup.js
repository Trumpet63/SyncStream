let backgroundPort = chrome.runtime.connect({ name: "popup" });

let recordButton = document.getElementById("recordButton");
recordButton.addEventListener("click", onRecordClick);

let exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", onExportClick);

function onRecordClick() {
    console.log("Record clicked");
    backgroundPort.postMessage({ type: "record" });
}

function onExportClick() {
    console.log("Export clicked");
    backgroundPort.postMessage({ type: "export" });
}

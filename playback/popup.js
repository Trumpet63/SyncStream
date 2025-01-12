let backgroundPort = chrome.runtime.connect({ name: "popup" });

let dropzone = document.getElementById("dropzone");
dropzone.addEventListener("dragover", onDragOver);
dropzone.addEventListener("drop", onDrop);

let playButton = document.getElementById("playButton");
playButton.addEventListener("click", onPlayClick);

let pauseButton = document.getElementById("pauseButton");
pauseButton.addEventListener("click", onPauseClick);

function onDragOver(event) {
    event.preventDefault();
}

function onDrop(event) {
    event.preventDefault();

    let files = event.dataTransfer.files;
    if (files.length != 1) {
        console.log("Can't process this drop event");
        return;
    }

    let file = files[0];
    file.text()
        .then((content) => {
            // TODO: Handle line breaks more generically
            let lines = content.split("\r\n");

            // TODO: SECURITY RISK MUCH? Could I do something to check that these are youtube urls?
            let commentaryUrl = lines[0].split(" ")[1];
            let targetUrl = lines[1].split(" ")[1];

            let actions = [];
            for (let i = 2; i < lines.length; i++) {
                if (lines[i] === "") {
                    continue;
                }
                let parts = lines[i].split(" ");
                let type = parts[0]; // play, pause, or seeked
                let timelineTimeSeconds = parseFloat(parts[1]);
                let videoTimeSeconds = parseFloat(parts[2]);
                actions.push({
                    type: type,
                    timelineTimeSeconds: timelineTimeSeconds,
                    videoTimeSeconds: videoTimeSeconds,
                });
            }

            backgroundPort.postMessage({
                type: "upload",
                commentaryUrl: commentaryUrl,
                targetUrl: targetUrl,
                actions: actions
            });
        });
}

function onPlayClick() {
    backgroundPort.postMessage({ type: "play" });
}

function onPauseClick() {
    backgroundPort.postMessage({ type: "pause" });
}

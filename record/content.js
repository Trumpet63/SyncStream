console.log("Commentary Sync Record");

let backgroundPort = chrome.runtime.connect({ name: "content" });
backgroundPort.onMessage.addListener(onBackgroundMessage);

let previousTimeMillis = null;
let recordStartTimeMilllis = null;
let isRecording = false;

let actions = [];

let video = null;
let findVideoElementIntervalId = setInterval(findVideoElement, 200);

window.requestAnimationFrame(draw);

function onBackgroundMessage(message) {
    switch(message.type) {
        case "export":
            console.log("Export");
            let currentDate = new Date();
            let year = currentDate.getUTCFullYear();
            let month = String(currentDate.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
            let day = String(currentDate.getUTCDate()).padStart(2, '0');
            let hours = String(currentDate.getUTCHours()).padStart(2, '0');
            let minutes = String(currentDate.getUTCMinutes()).padStart(2, '0');
            let seconds = String(currentDate.getUTCSeconds()).padStart(2, '0');
            let filename = `recording_export_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.txt`;

            let text = "";
            for (let i = 0; i < actions.length; i++) {
                let action = actions[i];
                text += `${action.type} ${action.timelineTimeSeconds} ${action.videoTimeSeconds}\n`;
            }

            let element = document.createElement('a');
            element.style.display = 'none';
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);
            
            document.body.appendChild(element);
            
            element.click();
            
            document.body.removeChild(element);
            break;
    }
}

function findVideoElement() {
    video = document.querySelector("video");
    if (video !== null) { // if the video has finished loading
        clearInterval(findVideoElementIntervalId);
        
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("seeked", onSeeked);

        recordStartTimeMilllis = previousTimeMillis;
        isRecording = true;
        console.log("Beginning recording");
    }
}

function draw(currentTimeMillis) {       
    previousTimeMillis = currentTimeMillis;
    window.requestAnimationFrame(draw);
}

function onPlay() {
    if (isRecording) {
        let elapsedTimeSeconds = (previousTimeMillis - recordStartTimeMilllis) / 1000;
        let action = {
            type: "play",
            timelineTimeSeconds: elapsedTimeSeconds,
            videoTimeSeconds: video.currentTime,
        };
        console.log(action);
        actions.push(action);
    }
}

function onPause() {
    if (isRecording) {
        let elapsedTimeSeconds = (previousTimeMillis - recordStartTimeMilllis) / 1000;
        let action = {
            type: "pause",
            timelineTimeSeconds: elapsedTimeSeconds,
            videoTimeSeconds: video.currentTime,
        };
        console.log(action);
        actions.push(action);
    }
}

function onSeeked() {
    if (isRecording) {
        let elapsedTimeSeconds = (previousTimeMillis - recordStartTimeMilllis) / 1000;
        let action = {
            type: "seeked",
            timelineTimeSeconds: elapsedTimeSeconds,
            videoTimeSeconds: video.currentTime,
        };
        console.log(action);
        actions.push(action);
    }
}

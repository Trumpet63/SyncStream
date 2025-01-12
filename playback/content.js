console.log("Commentary Sync Playback");

// TODO:
// auto-pause doesn't always work - could be happening because youtube remembers my old seek position
// add initial seek position to the input videos
// actually properly support the seeked action (it requires two numbers)
// play and pause actions should have second numbers as well - the time in the video when that action occurred
// I should try to measure desync between the commenary and target videos - it may accumulate with multiple play/pauses, or after multiple actions
// IS using the service worker for persistent storage actually not going to work?

let backgroundPort = chrome.runtime.connect({ name: "content" });
backgroundPort.onMessage.addListener(onBackgroundMessage);

let firstPlay = true;
let lastPauseTimeMillis = null;
let timelineOffsetMillis = 0;
let previousTimeMillis = null;
let nextTimelineStepIndex = 0;

let video = null;
let findVideoElementIntervalId = setInterval(findVideoElement, 200);
let videoDesiredState = null;

let tabType = null;
let actionTimeline = null;

let timelinePaused = true;

window.requestAnimationFrame(draw);

function onBackgroundMessage(message) {
    switch(message.type) {
        case "identification":
            tabType = message.tabType;
            console.log("I'm a " + tabType + " tab!");
            break;
        case "actions":
            actionTimeline = message.actions;
            console.log("I have actions", actionTimeline);
            break;
        
        // when the user hits play, send a message to commentary and target tabs
        // commentary tab just starts playing
        // target tab continues increasing the time count and sets the current state to whatever it should be
        case "play":
            if (tabType === "commentary") {
                video.play();
            } else {
                if (lastPauseTimeMillis === null) {
                    lastPauseTimeMillis = previousTimeMillis;
                }
                timelinePaused = false;
                if (videoDesiredState === "play") {
                    video.play();
                }
            }
            break;

        // when the user hits pause, send a message to commentary and target tabs
        // commentary tab just pauses
        // target tab stops increasing the time count and pauses the video only if it's not already paused
        case "pause":
            if (tabType === "commentary") {
                video.pause();
            } else {
                timelineOffsetMillis += previousTimeMillis - lastPauseTimeMillis;
                timelinePaused = true;
                if (videoIsPlaying()) {
                    video.pause();
                }
            }
            break;
    }
}

function findVideoElement() {
    video = document.querySelector("video");
    if (video !== null) { // if the video has finished loading
        clearInterval(findVideoElementIntervalId);
        
        // pause the video to prevent autoplay
        video.pause();

        backgroundPort.postMessage({ type: "ready" });
    }
}

// https://stackoverflow.com/questions/6877403/how-to-tell-if-a-video-element-is-currently-playing
function videoIsPlaying() {
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)
}

function draw(currentTimeMillis) {
    if (tabType === "target") {
        if (timelinePaused) {
            lastPauseTimeMillis = currentTimeMillis;
        } else {
            let elapsedTimeSeconds = (currentTimeMillis - lastPauseTimeMillis + timelineOffsetMillis) / 1000;
            if (nextTimelineStepIndex < actionTimeline.length
                && elapsedTimeSeconds > actionTimeline[nextTimelineStepIndex].timelineTimeSeconds
            ) {
                let actionIsPlay = actionTimeline[nextTimelineStepIndex].type === "play";
                
                if (actionIsPlay) {
                    video.play();
                    videoDesiredState = "play";
                } else {
                    video.pause();
                    videoDesiredState = "pause";
                }
                
                nextTimelineStepIndex++;
            }
        }
    }
        
    previousTimeMillis = currentTimeMillis;
    window.requestAnimationFrame(draw);
}

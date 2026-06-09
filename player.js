/* ==========================
   GLOBAL
========================== */

let hls = null;
let controlsTimer = null;

let reconnectCount = 0;
let reconnectDelay = 2000;

let spinnerTimer;

const video = document.getElementById("video");
const playerArea = document.getElementById("videoArea");

const playIcon = document.getElementById("playIcon");
const bigIcon = document.getElementById("bigIcon");

const volumeIcon = document.getElementById("volumeIcon");
const volumeSlider = document.getElementById("volumeSlider");

const progressBar = document.getElementById("progressBar");

const remainTime = document.getElementById("remainTime");

const settingsMenu =
    document.getElementById(
        "settingsMenu"
    );

const qualityList =
    document.getElementById(
        "qualityList"
    );

const bufferSpinner =
    document.getElementById(
        "bufferSpinner"
    );

const pipBtn =
    document.getElementById(
        "pipBtn"
    );

const isMobile =

    /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );


/* ==========================
   URL PARAMS
========================== */

const params =
    new URLSearchParams(
        location.search
    );

const SRC =
    params.get("src")
        ?
        decodeURIComponent(
            params.get("src")
        )
        :
        "";

const TITLE =
    params.get("title")
        ?
        decodeURIComponent(
            params.get("title")
        )
        :
        "Live Stream";

document.getElementById(
    "channelTitle"
).textContent = TITLE;


/* ==========================
   INIT
========================== */

if (SRC) {

    initPlayer(
        SRC
    );

}


/* ==========================
   HLS INIT
========================== */

function initPlayer(src) {

    showSpinner();

    if (

        hls

    ) {

        hls.destroy();

        hls = null;

    }

    if (

        Hls.isSupported()

    ) {

        hls = new Hls({

            autoStartLoad: true,

            startLevel: 0,

            capLevelToPlayerSize: true,

            maxBufferLength: 30,

            maxMaxBufferLength: 60,

            backBufferLength: 30,

            liveSyncDurationCount: 3,

            liveMaxLatencyDurationCount: 8,

            lowLatencyMode: false,

            enableWorker: true

        });

        hls.loadSource(
            src
        );

        hls.attachMedia(
            video
        );


        hls.on(

            Hls.Events.MANIFEST_PARSED,

            () => {

                reconnectCount = 0;

                reconnectDelay = 2000;

                buildQualityMenu();

                video.play();

                hideSpinner();

                setTimeout(

                    () => {

                        if (

                            hls

                        ) {

                            hls.currentLevel = -1;

                        }

                    },

                    3000

                );

            }

        );


        hls.on(

            Hls.Events.ERROR,

            (
                event,
                data
            ) => {

                if (

                    data.fatal

                ) {

                    reconnectStream();

                }

            }

        );

    }

    else if (

        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )

    ) {

        video.src = src;

        video.play();

    }

}


/* ==========================
   RECONNECT
========================== */

function reconnectStream() {

    if (

        reconnectCount >= 6

    ) {

        return;

    }

    reconnectCount++;

    if (

        hls

    ) {

        hls.destroy();

    }

    setTimeout(

        () => {

            initPlayer(
                SRC
            );

        },

        reconnectDelay

    );

    reconnectDelay =

        Math.min(

            reconnectDelay * 2,

            30000

        );

}


/* ==========================
   PLAY / PAUSE
========================== */

function togglePlay() {

    if (video.paused) {

        video.play();

    }

    else {

        video.pause();

    }

}


video.addEventListener(

    "play",

    () => {

        playIcon.className =
            "ti ti-player-pause";

        bigIcon.className =
            "ti ti-player-pause";

        showControls();

    }

);


video.addEventListener(

    "pause",

    () => {

        playIcon.className =
            "ti ti-player-play";

        bigIcon.className =
            "ti ti-player-play";

        playerArea.classList.remove(
            "hide-ui"
        );

    }

);


/* ==========================
   SEEK
========================== */

function seekBackward() {

    video.currentTime = Math.max(

        0,

        video.currentTime - 10

    );

}


function seekForward() {

    if (

        video.duration

        &&

        video.currentTime + 10 >

        video.duration - 2

    ) {

        video.currentTime =
            video.duration;

    }

    else {

        video.currentTime += 10;

    }

}


/* ==========================
   PROGRESS
========================== */

video.addEventListener(

    "timeupdate",

    () => {

        updateProgress();

        updateRemain();

    }

);


function updateProgress() {

    if (

        !video.duration

    ) return;

    progressBar.value =

        (

            video.currentTime

            /

            video.duration

        ) * 100;

}


progressBar.addEventListener(

    "input",

    () => {

        if (

            video.duration

        ) {

            video.currentTime =

                (

                    progressBar.value

                    / 100

                )

                *

                video.duration;

        }

    }

);


/* ==========================
   REMAIN TIME
========================== */

function updateRemain() {

    if (

        !video.duration

    ) return;

    const remain =

        video.duration

        -

        video.currentTime;

    remainTime.innerText =

        "-"

        +

        formatTime(
            remain
        );

}


function formatTime(sec) {

    sec = Math.floor(sec);

    let h =
        Math.floor(sec / 3600);

    let m =
        Math.floor(
            (sec % 3600) / 60
        );

    let s =
        sec % 60;

    if (

        h > 0

    ) {

        return (

            h < 10 ? "0" + h : h

        )

            +

            ":"

            +

            (

                m < 10 ? "0" + m : m

            )

            +

            ":"

            +

            (

                s < 10 ? "0" + s : s

            );

    }

    return (

        m < 10 ? "0" + m : m

    )

        +

        ":"

        +

        (

            s < 10 ? "0" + s : s

        );

}


/* ==========================
   VOLUME
========================== */

video.volume = 1;

volumeSlider.value = 100;


volumeSlider.addEventListener(

    "input",

    function () {

        video.volume =
            this.value / 100;

        video.muted =
            this.value == 0;

        updateVolumeIcon();

    }

);


function toggleMute() {

    video.muted =
        !video.muted;

    updateVolumeIcon();

}


function updateVolumeIcon() {

    if (

        video.muted ||

        video.volume === 0

    ) {

        volumeIcon.className =
            "ti ti-volume-off";

    }

    else {

        volumeIcon.className =
            "ti ti-volume";

    }

}


/* ==========================
   BUFFER SPINNER
========================== */

video.addEventListener(

    "waiting",

    () => {

        spinnerTimer =

            setTimeout(

                showSpinner,

                500

            );

    }

);


video.addEventListener(

    "playing",

    () => {

        clearTimeout(
            spinnerTimer
        );

        hideSpinner();

    }

);


function showSpinner() {

    bufferSpinner.style.display =
        "flex";

}


function hideSpinner() {

    bufferSpinner.style.display =
        "none";

}


/* ==========================
   SAVE POSITION
========================== */

const STORAGE_KEY =
    "player_" + SRC;


function savePlayback() {

    localStorage.setItem(

        STORAGE_KEY,

        video.currentTime

    );

}


function restorePlayback() {

    const saved =

        localStorage.getItem(
            STORAGE_KEY
        );

    if (

        saved

    ) {

        video.currentTime =

            parseFloat(
                saved
            );

    }

}


video.addEventListener(

    "loadedmetadata",

    restorePlayback

);


/* ==========================
   SAVE EVERY 5 SEC
========================== */

setInterval(

    () => {

        if (

            !video.paused

        ) {

            savePlayback();

        }

    },

    5000

);


/* ==========================
   SETTINGS
========================== */

function toggleSettings() {

    settingsMenu.style.display =

        settingsMenu.style.display === "block"

            ?

            "none"

            :

            "block";

}


document.addEventListener(

    "click",

    e => {

        if (

            !e.target.closest("#settingsMenu")

            &&

            !e.target.closest(".ti-settings")

        ) {

            settingsMenu.style.display =

                "none";

        }

    }

);


/* ==========================
   QUALITY MENU
========================== */

function buildQualityMenu() {

    if (!hls) return;

    qualityList.innerHTML = "";

    addQualityItem(
        "Auto",
        -1
    );

    const uniqueHeights =

        [...new Set(

            hls.levels.map(

                level => level.height

            )

        )]

            .sort(
                (a, b) => b - a
            );


    uniqueHeights.forEach(

        height => {

            const levelIndex =

                hls.levels.findIndex(

                    x =>

                        x.height === height

                );

            addQualityItem(

                height + "p",

                levelIndex

            );

        }

    );

}


function addQualityItem(

    label,

    level

) {

    const item =

        document.createElement(
            "div"
        );

    item.className =
        "quality-item";

    item.innerText =
        label;

    item.onclick = () => {

        if (

            hls

        ) {

            hls.currentLevel =
                level;

        }

        settingsMenu.style.display =
            "none";

    };

    qualityList.appendChild(
        item
    );

}


/* ==========================
   FULLSCREEN
========================== */

function toggleFullscreen() {

    if (

        !document.fullscreenElement

    ) {

        playerArea.requestFullscreen();

    }

    else {

        document.exitFullscreen();

    }

}


document.addEventListener(

    "fullscreenchange",

    () => {

        const icon =

            document.getElementById(
                "fullscreenIcon"
            );

        if (

            document.fullscreenElement

        ) {

            icon.className =
                "ti ti-minimize";

        }

        else {

            icon.className =
                "ti ti-maximize";

        }

    }

);


/* ==========================
   PiP
========================== */

async function togglePiP() {

    if (

        isMobile

    ) return;

    try {

        if (

            document.pictureInPictureElement

        ) {

            await document.exitPictureInPicture();

        }

        else {

            await video.requestPictureInPicture();

        }

    }

    catch (err) {

        console.log(err);

    }

}


/* ==========================
   BACK BUTTON
========================== */

function goBack() {

    savePlayback();

    if (hls) {

        hls.destroy();

    }

    const backUrl =
        sessionStorage.getItem(
            "player_back"
        );

    console.log(backUrl);

    if (backUrl) {

        location.href = backUrl;

    }

    else {

        history.back();

    }

}


/* ==========================
   ANDROID LANDSCAPE
========================== */

video.addEventListener(

    "play",

    async () => {

        if (

            isMobile

        ) {

            try {

                await playerArea.requestFullscreen();

            }

            catch (err) { }

        }

    }

);


/* ==========================
   MEMORY CLEANUP
========================== */

document.addEventListener(

    "visibilitychange",

    () => {

        if (

            document.hidden

        ) {

            clearTimeout(
                controlsTimer
            );

        }

    }

);


window.addEventListener(

    "beforeunload",

    () => {

        savePlayback();

        if (

            hls

        ) {

            hls.destroy();

        }

    }

);


/* ==========================
   AUTO HIDE CONTROLS
========================== */

function showControls() {

    playerArea.classList.remove(
        "hide-ui"
    );

    if (!isMobile) {

        document.body.style.cursor =
            "default";

    }

    clearTimeout(
        controlsTimer
    );

    if (

        !video.paused

    ) {

        controlsTimer =

            setTimeout(

                () => {

                    playerArea.classList.add(
                        "hide-ui"
                    );

                    if (

                        !isMobile

                    ) {

                        document.body.style.cursor =
                            "none";

                    }

                },

                3000

            );

    }

}


/* ==========================
   DESKTOP HOVER
========================== */

if (

    !isMobile

) {

    let moveTimer;

    playerArea.addEventListener(

        "mousemove",

        () => {

            clearTimeout(
                moveTimer
            );

            moveTimer =

                setTimeout(

                    showControls,

                    100

                );

        }

    );

}


/* ==========================
   MOBILE TAP
========================== */

if (

    isMobile

) {

    playerArea.addEventListener(

        "touchstart",

        () => {

            if (

                playerArea.classList.contains(
                    "hide-ui"
                )

            ) {

                showControls();

            }

            else {

                playerArea.classList.add(
                    "hide-ui"
                );

            }

        }

    );

}


/* ==========================
   DOUBLE TAP SEEK
========================== */

let lastTapLeft = 0;
let lastTapRight = 0;

playerArea.addEventListener(

    "touchend",

    e => {

        const now =
            Date.now();

        if (

            e.changedTouches[0].clientX

            <

            window.innerWidth / 2

        ) {

            if (

                now - lastTapLeft < 300

            ) {

                seekBackward();

            }

            lastTapLeft = now;

        }

        else {

            if (

                now - lastTapRight < 300

            ) {

                seekForward();

            }

            lastTapRight = now;

        }

    }

);


/* ==========================
   KEYBOARD SHORTCUTS
========================== */

document.addEventListener(

    "keydown",

    e => {

        switch (

        e.code

        ) {

            case "Space":

                e.preventDefault();

                togglePlay();

                break;

            case "ArrowLeft":

                seekBackward();

                break;

            case "ArrowRight":

                seekForward();

                break;

            case "KeyM":

                toggleMute();

                break;

            case "KeyF":

                toggleFullscreen();

                break;

            case "KeyP":

                if (

                    !isMobile

                ) {

                    togglePiP();

                }

                break;

        }

    }

);


/* ==========================
   UI ON PLAY
========================== */

video.addEventListener(

    "play",

    showControls

);


/* ==========================
   UI ON PAUSE
========================== */

video.addEventListener(

    "pause",

    () => {

        playerArea.classList.remove(
            "hide-ui"
        );

        document.body.style.cursor =
            "default";

    }

);


/* ==========================
   INITIAL STATE
========================== */

showControls();
/* ==========================
   RK IP TV PLAYER
========================== */

let hls = null;
let playing = false;
let controlsTimer = null;

const video = document.getElementById("video");

const params = new URLSearchParams(location.search);

const SRC =
    params.get("src")
        ? decodeURIComponent(params.get("src"))
        : "";

const TITLE =
    params.get("title")
        ? decodeURIComponent(params.get("title"))
        : "Live Stream";

document.getElementById(
    "channelTitle"
).textContent = TITLE;


/* ==========================
   INIT
========================== */

if (SRC) {

    initPlayer(SRC);

}


/* ==========================
   HLS
========================== */

function initPlayer(src) {

    showSpinner();

    if (Hls.isSupported()) {

        hls = new Hls({

            autoStartLoad: true,

            startLevel: -1,

            capLevelToPlayerSize: true,

            maxBufferLength: 20

        });

        hls.loadSource(src);

        hls.attachMedia(video);

        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                hideSpinner();

                buildQualityMenu();

            }
        );

        hls.on(
            Hls.Events.ERROR,
            (event, data) => {

                if (data.fatal) {

                    showRetry();

                }

            }
        );

    }

    else {

        video.src = src;

    }

    video.volume = 1;

    bindVideoEvents();

}


/* ==========================
   PLAY / PAUSE
========================== */

function togglePlay() {

    if (!playing) {

        video.play();

        playing = true;

        setPlayIcons(true);

        hideCenter();

    }

    else {

        video.pause();

        playing = false;

        setPlayIcons(false);

        showCenter();

    }

}


function setPlayIcons(state) {

    document.getElementById(
        "playIcon"
    ).className =
        state
            ?
            "ti ti-player-pause"
            :
            "ti ti-player-play";

    document.getElementById(
        "bigIcon"
    ).className =
        state
            ?
            "ti ti-player-pause"
            :
            "ti ti-player-play";

}


/* ==========================
   SEEK
========================== */

function seekBackward() {

    video.currentTime -= 10;

}

function seekForward() {

    video.currentTime += 10;

}


/* ==========================
   TIME
========================== */

function bindVideoEvents() {

    video.addEventListener(

        "timeupdate",

        () => {

            updateProgress();

            updateRemain();

        }

    );

    video.addEventListener(

        "waiting",

        showSpinner

    );

    video.addEventListener(

        "playing",

        hideSpinner

    );

}


function updateProgress() {

    if (!video.duration)
        return;

    const progress =
        (
            video.currentTime
            /
            video.duration
        ) * 100;

    document.getElementById(
        "progressBar"
    ).value = progress;

    document.getElementById(
        "currentTime"
    ).innerText =
        formatTime(
            video.currentTime
        );

    document.getElementById(
        "duration"
    ).innerText =
        formatTime(
            video.duration
        );

}


function updateRemain() {

    const remain =
        video.duration
        -
        video.currentTime;

    document.getElementById(
        "remainTime"
    ).innerText =
        "-" +
        formatTime(remain);

}


function formatTime(sec) {

    sec = Math.floor(sec);

    let m =
        Math.floor(sec / 60);

    let s =
        sec % 60;

    return (
        m < 10
            ? "0" + m
            : m
    )
        +
        ":"
        +
        (
            s < 10
                ? "0" + s
                : s
        );

}


/* ==========================
   VOLUME
========================== */

document
    .getElementById(
        "volumeSlider"
    )
    .addEventListener(

        "input",

        function () {

            video.volume =
                this.value / 100;

        }

    );


function toggleMute() {

    video.muted =
        !video.muted;

}


/* ==========================
   SETTINGS
========================== */

function toggleSettings() {

    const menu =
        document.getElementById(
            "settingsPopup"
        );

    menu.style.display =
        menu.style.display === "block"
            ?
            "none"
            :
            "block";

}


/* ==========================
   QUALITY
========================== */

function buildQualityMenu() {

    const box =
        document.getElementById(
            "qualityList"
        );

    box.innerHTML = "";

    addQuality(
        box,
        "Auto",
        -1
    );

    hls.levels.forEach(

        (
            level,
            index
        ) => {

            addQuality(

                box,

                level.height
                + "p",

                index

            );

        }

    );

}


function addQuality(

    box,
    label,
    value

) {

    const div =
        document.createElement(
            "div"
        );

    div.className =
        "quality-item";

    div.innerText =
        label;

    div.onclick =
        () => {

            hls.currentLevel =
                value;

        };

    box.appendChild(div);

}


/* ==========================
   FULLSCREEN
========================== */

function toggleFullscreen() {

    const area =
        document.getElementById(
            "videoArea"
        );

    if (
        !document.fullscreenElement
    ) {

        area.requestFullscreen();

    }

    else {

        document.exitFullscreen();

    }

}


/* ==========================
   PIP
========================== */

async function togglePiP() {

    try {

        if (
            document.pictureInPictureElement
        ) {

            await
                document.exitPictureInPicture();

        }

        else {

            await
                video.requestPictureInPicture();

        }

    }

    catch (err) {

        console.log(err);

    }

}


/* ==========================
   BUFFER
========================== */

function showSpinner() {

    document.getElementById(
        "bufferSpinner"
    ).style.display =
        "flex";

}


function hideSpinner() {

    document.getElementById(
        "bufferSpinner"
    ).style.display =
        "none";

}


/* ==========================
   RETRY
========================== */

function showRetry() {

    document.getElementById(
        "retryBtn"
    ).style.display =
        "block";

}


function retryStream() {

    location.reload();

}


/* ==========================
   CENTER
========================== */

function hideCenter() {

    document.getElementById(
        "centerControls"
    ).style.display =
        "none";

}


function showCenter() {

    document.getElementById(
        "centerControls"
    ).style.display =
        "flex";

}


/* ==========================
   AUTO HIDE CONTROLS
========================== */

const playerArea =
    document.getElementById(
        "videoArea"
    );

function showControls() {

    playerArea.classList.remove(
        "hide-ui"
    );

    document.body.style.cursor =
        "default";

    clearTimeout(
        controlsTimer
    );

    if (playing) {

        controlsTimer =
            setTimeout(

                () => {

                    playerArea.classList.add(
                        "hide-ui"
                    );

                    document.body.style.cursor =
                        "none";

                },

                3000

            );
    }

}

playerArea.addEventListener(
    "mousemove",
    showControls
);

playerArea.addEventListener(
    "touchstart",
    showControls
);

showControls();


/* ==========================
   DOUBLE TAP SEEK
========================== */

let lastTapLeft = 0;
let lastTapRight = 0;

document
    .getElementById(
        "tapLeft"
    )
    .addEventListener(

        "touchend",

        () => {

            const now =
                Date.now();

            if (
                now - lastTapLeft
                < 300
            ) {

                seekBackward();

            }

            lastTapLeft =
                now;

        }

    );


document
    .getElementById(
        "tapRight"
    )
    .addEventListener(

        "touchend",

        () => {

            const now =
                Date.now();

            if (
                now - lastTapRight
                < 300
            ) {

                seekForward();

            }

            lastTapRight =
                now;

        }

    );


/* ==========================
   KEYBOARD
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "Space"
        ) {

            e.preventDefault();

            togglePlay();

        }

        if (
            e.code === "ArrowLeft"
        ) {

            seekBackward();

        }

        if (
            e.code === "ArrowRight"
        ) {

            seekForward();

        }

        if (
            e.code === "KeyF"
        ) {

            toggleFullscreen();

        }

        if (
            e.code === "KeyP"
        ) {

            togglePiP();

        }

    }

);


/* ==========================
   PLAYBACK SPEED
========================== */

document
    .querySelectorAll(
        ".speed-item"
    )
    .forEach(

        item => {

            item.onclick = () => {

                document
                    .querySelectorAll(
                        ".speed-item"
                    )
                    .forEach(

                        x =>
                            x.classList.remove(
                                "active"
                            )

                    );

                item.classList.add(
                    "active"
                );

                video.playbackRate =
                    parseFloat(
                        item.dataset.speed
                    );

            };

        }

    );


/* ==========================
   AUTO LANDSCAPE
========================== */

video.addEventListener(

    "play",

    async () => {

        if (
            window.innerWidth
            <
            900
        ) {

            try {

                await document
                    .getElementById(
                        "videoArea"
                    )
                    .requestFullscreen();

            }

            catch (err) { }

        }

    }

);


/* ==========================
   AUTO RECONNECT
========================== */

let reconnectCount = 0;

function reconnectStream() {

    if (
        reconnectCount >= 5
    ) {

        showRetry();

        return;

    }

    reconnectCount++;

    if (hls) {

        hls.destroy();

    }

    setTimeout(

        () => {

            initPlayer(
                SRC
            );

        },

        2000

    );

}


if (hls) {

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


/* ==========================
   SETTINGS CLOSE
========================== */

document.addEventListener(

    "click",

    e => {

        if (

            !e.target.closest(
                ".settings-popup"
            )

            &&

            !e.target.closest(
                ".ti-settings"
            )

        ) {

            document
                .getElementById(
                    "settingsPopup"
                )
                .style.display =
                "none";

        }

    }

);


/* ==========================
   LONG PRESS
========================== */

let pressTimer;

playerArea.addEventListener(

    "touchstart",

    () => {

        pressTimer =
            setTimeout(

                () => {

                    video.playbackRate =
                        2;

                },

                600

            );

    }

);


playerArea.addEventListener(

    "touchend",

    () => {

        clearTimeout(
            pressTimer
        );

        if (
            video.playbackRate
            === 2
        ) {

            video.playbackRate =
                1;

        }

    }

);


/* ==========================
   EXIT FULLSCREEN
========================== */

document.addEventListener(

    "fullscreenchange",

    () => {

        if (

            !document.fullscreenElement

        ) {

            document.body.style.cursor =
                "default";

            playerArea.classList.remove(
                "hide-ui"
            );

        }

    }
);


/* ==========================
   SETTINGS ANIMATION
========================== */

function toggleSettings() {

    const menu =
        document.getElementById(
            "settingsPopup"
        );

    if (
        menu.classList.contains(
            "open"
        )
    ) {

        menu.classList.remove(
            "open"
        );

    }

    else {

        menu.classList.add(
            "open"
        );

    }

}


/* ==========================
   SETTINGS AUTO CLOSE
========================== */

document.addEventListener(

    "click",

    e => {

        if (

            !e.target.closest(
                "#settingsPopup"
            )

            &&

            !e.target.closest(
                ".ti-settings"
            )

        ) {

            document
                .getElementById(
                    "settingsPopup"
                )
                .classList.remove(
                    "open"
                );

        }

    }

);


/* ==========================
   LOCK CONTROLS
========================== */

let controlsLocked = false;

function toggleLock() {

    controlsLocked =
        !controlsLocked;

    if (controlsLocked) {

        playerArea.classList.add(
            "locked"
        );

    }

    else {

        playerArea.classList.remove(
            "locked"
        );

    }

}


/* ==========================
   VOLUME BOOST
========================== */

video.volume = 1;

video.muted = false;

document.getElementById(
    "volumeSlider"
).value = 100;


/* ==========================
   HIDE CENTER BUTTON
========================== */

video.addEventListener(

    "playing",

    () => {

        document
            .getElementById(
                "centerControls"
            )
            .style.opacity =
            "0";

    }

);


video.addEventListener(

    "pause",

    () => {

        document
            .getElementById(
                "centerControls"
            )
            .style.opacity =
            "1";

    }

);


/* ==========================
   SMOOTH BUTTON EFFECT
========================== */

document
    .querySelectorAll(
        ".ctrl-btn"
    )
    .forEach(

        btn => {

            btn.addEventListener(

                "click",

                () => {

                    btn.animate(

                        [

                            {

                                transform:
                                    "scale(1)"

                            },

                            {

                                transform:
                                    "scale(.9)"

                            },

                            {

                                transform:
                                    "scale(1)"

                            }

                        ],

                        {

                            duration: 180

                        }

                    );

                }

            );

        }

    );


/* ==========================
   AUTO HIDE SETTINGS
========================== */

let settingsTimer;

document
    .getElementById(
        "settingsPopup"
    )
    .addEventListener(

        "mouseenter",

        () => {

            clearTimeout(
                settingsTimer
            );

        }

    );


document
    .getElementById(
        "settingsPopup"
    )
    .addEventListener(

        "mouseleave",

        () => {

            settingsTimer =
                setTimeout(

                    () => {

                        document
                            .getElementById(
                                "settingsPopup"
                            )
                            .classList.remove(
                                "open"
                            );

                    },

                    3000

                );

        }

    );


/* ==========================
   ANDROID FULLSCREEN
========================== */

video.addEventListener(

    "play",

    async () => {

        if (

            window.innerWidth
            <

            900

        ) {

            try {

                await document
                    .getElementById(
                        "videoArea"
                    )
                    .requestFullscreen();

            }

            catch (err) { }

        }

    }

);


/* ==========================
   FULLSCREEN ICON
========================== */

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
   SHOW UI ON PAUSE
========================== */

video.addEventListener(

    "pause",

    () => {

        playerArea.classList.remove(
            "hide-ui"
        );

    }

);


/* ==========================
   SPACE
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "Space"
        ) {

            e.preventDefault();

            togglePlay();

        }

    }

);


/* ==========================
   ARROWS
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "ArrowLeft"
        ) {

            seekBackward();

        }

        if (
            e.code === "ArrowRight"
        ) {

            seekForward();

        }

    }

);


/* ==========================
   MUTE
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "KeyM"
        ) {

            toggleMute();

        }

    }

);


/* ==========================
   FULLSCREEN
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "KeyF"
        ) {

            toggleFullscreen();

        }

    }

);


/* ==========================
   PiP
========================== */

document.addEventListener(

    "keydown",

    e => {

        if (
            e.code === "KeyP"
        ) {

            togglePiP();

        }

    }
);

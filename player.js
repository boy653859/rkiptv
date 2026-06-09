/* =========================
   PLAYER STATE
========================= */

let hls = null;
let playing = false;
let controlsTimer = null;

const params = new URLSearchParams(location.search);

const SRC =
    params.get("src")
        ? decodeURIComponent(params.get("src"))
        : "";

const TITLE =
    params.get("title")
        ? decodeURIComponent(params.get("title"))
        : "Live Stream";

document.getElementById("pageTitle").textContent = TITLE;
document.getElementById("channelTitle").textContent = TITLE;

/* =========================
   INIT
========================= */

if (SRC) {

    initPlayer(SRC);

}

/* =========================
   PLAYER
========================= */

function initPlayer(src) {

    const video =
        document.getElementById("video");

    if (Hls.isSupported()) {

        hls = new Hls();

        hls.loadSource(src);

        hls.attachMedia(video);

        hls.on(
            Hls.Events.MANIFEST_PARSED,
            function () {

                buildQualityMenu();

            }
        );

        hls.on(
            Hls.Events.ERROR,
            function (event, data) {

                if (data.fatal) {

                    showRetry();

                }

            }
        );

    }

    else {

        video.src = src;

    }

    video.volume = .8;

    video.addEventListener(
        "timeupdate",
        updateProgress
    );

    video.addEventListener(
        "waiting",
        showSpinner
    );

    video.addEventListener(
        "playing",
        hideSpinner
    );

    setupControls();

}

/* =========================
   PLAY
========================= */

function togglePlay() {

    const video =
        document.getElementById("video");

    if (!playing) {

        video.play();

        playing = true;

        document
            .getElementById("playIcon")
            .className =
            "ti ti-player-pause";

        document
            .getElementById("bigIcon")
            .className =
            "ti ti-player-pause";

        hideCenter();

    }

    else {

        video.pause();

        playing = false;

        document
            .getElementById("playIcon")
            .className =
            "ti ti-player-play";

        document
            .getElementById("bigIcon")
            .className =
            "ti ti-player-play";

        showCenter();

    }

}

/* =========================
   SEEK
========================= */

function seekBackward() {

    const video =
        document.getElementById("video");

    video.currentTime -= 10;

}

function seekForward() {

    const video =
        document.getElementById("video");

    video.currentTime += 10;

}

/* =========================
   PROGRESS
========================= */

function updateProgress() {

    const video =
        document.getElementById("video");

    const bar =
        document.getElementById("progressBar");

    if (!video.duration)
        return;

    bar.value =
        (video.currentTime /
            video.duration)
        * 100;

}

document
    .getElementById(
        "progressBar"
    )
    .addEventListener(
        "input",
        function () {

            const video =
                document.getElementById(
                    "video"
                );

            video.currentTime =
                (this.value / 100)
                *
                video.duration;

        }
    );

/* =========================
   VOLUME
========================= */

document
    .getElementById(
        "volumeSlider"
    )
    .addEventListener(
        "input",
        function () {

            document
                .getElementById(
                    "video"
                )
                .volume =
                this.value / 100;

        }
    );

function toggleMute() {

    const video =
        document.getElementById(
            "video"
        );

    video.muted =
        !video.muted;

}

/* =========================
   SETTINGS
========================= */

function toggleSettings() {

    const menu =
        document.getElementById(
            "settingsMenu"
        );

    menu.style.display =
        menu.style.display ===
            "block"
            ? "none"
            : "block";

}

/* =========================
   QUALITY
========================= */

function buildQualityMenu() {

    if (!hls)
        return;

    const box =
        document.getElementById(
            "qualityList"
        );

    box.innerHTML = "";

    const auto =
        document.createElement(
            "div"
        );

    auto.innerText =
        "Auto";

    auto.onclick =
        () => {

            hls.currentLevel = -1;

        };

    box.appendChild(auto);

    hls.levels.forEach(
        (
            level,
            index
        ) => {

            const div =
                document.createElement(
                    "div"
                );

            div.innerText =
                level.height
                + "p";

            div.onclick =
                () => {

                    hls.currentLevel =
                        index;

                };

            box.appendChild(
                div
            );

        }
    );

}

/* =========================
   FULLSCREEN
========================= */

function toggleFullscreen() {

    const player =
        document.querySelector(
            ".video-area"
        );

    if (
        !document
            .fullscreenElement
    ) {

        player.requestFullscreen();

    }

    else {

        document.exitFullscreen();

    }

}

/* =========================
   PiP
========================= */

async function togglePiP() {

    const video =
        document.getElementById(
            "video"
        );

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

    catch (e) {

        console.log(e);

    }

}

/* =========================
   SPINNER
========================= */

function showSpinner() {

    document
        .getElementById(
            "bufferSpinner"
        )
        .style.display =
        "flex";

}

function hideSpinner() {

    document
        .getElementById(
            "bufferSpinner"
        )
        .style.display =
        "none";

}

/* =========================
   RETRY
========================= */

function showRetry() {

    document
        .getElementById(
            "retryBtn"
        )
        .style.display =
        "block";

}

function retryStream() {

    location.reload();

}

/* =========================
   CENTER
========================= */

function hideCenter() {

    document
        .getElementById(
            "centerOverlay"
        )
        .style.display =
        "none";

}

function showCenter() {

    document
        .getElementById(
            "centerOverlay"
        )
        .style.display =
        "flex";

}

/* =========================
   SHOW/HIDE CONTROLS
========================= */

function setupControls() {

    const area =
        document.getElementById(
            "videoArea"
        );

    area.addEventListener(
        "mousemove",
        showControls
    );

    area.addEventListener(
        "touchstart",
        showControls
    );

}

function showControls() {

    document
        .getElementById(
            "controls"
        )
        .style.opacity =
        "1";

    document
        .getElementById(
            "topOverlay"
        )
        .style.opacity =
        "1";

    clearTimeout(
        controlsTimer
    );

    controlsTimer =
        setTimeout(
            hideControls,
            3000
        );

}

function hideControls() {

    if (!playing)
        return;

    document
        .getElementById(
            "controls"
        )
        .style.opacity =
        "0";

    document
        .getElementById(
            "topOverlay"
        )
        .style.opacity =
        "0";

}

/* =========================
   SHORTCUTS
========================= */

document.addEventListener(
    "keydown",
    function (e) {

        if (
            e.code === "Space"
        ) {

            e.preventDefault();

            togglePlay();

        }

        if (
            e.code ===
            "ArrowLeft"
        ) {

            seekBackward();

        }

        if (
            e.code ===
            "ArrowRight"
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

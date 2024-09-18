/**
 * name: bespoken-audio-player
 * version: v1.0.0
 * description: This is a template repo that will create a Vite workflow to ease creation of Javascript modules with a dev server, GitHub Pages support and automated publishing to NPM.
 * author: John F. Morton <john@johnfmorton.com> (https://supergeekery.com)
 * repository: https://github.com/johnfmorton/bespoken-audio-player
 * build date: 2024-09-18T11:36:00.471Z 
 */
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global["bespoken-audio-player"] = {}));
})(this, function(exports2) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  class BespokenAudioPlayer extends HTMLElement {
    constructor() {
      super();
      // Shadow DOM root
      __publicField(this, "shadow");
      // Container for all player elements
      __publicField(this, "playerContainer");
      // Audio element
      __publicField(this, "audio");
      // Playlist data including titles
      __publicField(this, "playlistData");
      // Current track index
      __publicField(this, "currentTrackIndex");
      // Controls
      __publicField(this, "playPauseButton");
      __publicField(this, "nextButton");
      __publicField(this, "prevButton");
      __publicField(this, "playbackRateSelect");
      // Progress bar elements
      __publicField(this, "controlsProgressTimeContainer");
      // Container for progress bar and time display
      __publicField(this, "progressBar");
      // Time display element
      __publicField(this, "timeDisplay");
      // Playlist UI elements
      __publicField(this, "playlistContainer");
      // Attributes
      __publicField(this, "isPlaylistVisible");
      __publicField(this, "isLoopEnabled");
      __publicField(this, "isOnlyCurrentTrackVisible");
      // Keyboard shortcuts map
      __publicField(this, "keyboardShortcuts");
      // Add to your class properties
      __publicField(this, "trackErrorStates", []);
      this.shadow = this.attachShadow({ mode: "open" });
      this.playlistData = [];
      this.currentTrackIndex = 0;
      this.keyboardShortcuts = {};
      this.isPlaylistVisible = false;
      this.isLoopEnabled = false;
      this.isOnlyCurrentTrackVisible = false;
      this.createPlayerContainer();
      this.createAudioElement();
      this.createPlaylist();
      this.createControlsProgressAndTimeContainer();
      this.attachEventListeners();
      this.setupKeyboardShortcuts();
    }
    /**
     * Specifies the observed attributes so that
     * attributeChangedCallback will work
     */
    static get observedAttributes() {
      return ["tracks", "playlist-visible", "loop", "only-current-track-visible"];
    }
    /**
     * Called when the component is added to the DOM
     */
    connectedCallback() {
      if (this.hasAttribute("tracks")) {
        this.parseTracksAttribute();
      } else {
        console.error('The "tracks" attribute is required and must be a valid JSON array.');
        this.updateControlsState(false);
      }
      this.isOnlyCurrentTrackVisible = this.hasAttribute("only-current-track-visible");
      this.isPlaylistVisible = this.hasAttribute("playlist-visible");
      this.isLoopEnabled = this.hasAttribute("loop");
      this.render();
    }
    /**
     * Called when an observed attribute has been added, removed, updated, or replaced.
     * @param name The attribute's name.
     * @param oldValue The previous value.
     * @param newValue The new value.
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "tracks" && oldValue !== newValue) {
        this.parseTracksAttribute();
      } else if (name === "playlist-visible") {
        this.isPlaylistVisible = this.hasAttribute("playlist-visible");
        this.updatePlaylistVisibility();
      } else if (name === "loop") {
        this.isLoopEnabled = this.hasAttribute("loop");
      } else if (name === "only-current-track-visible") {
        this.isOnlyCurrentTrackVisible = this.hasAttribute("only-current-track-visible");
        this.updatePlaylistVisibility();
      }
    }
    /**
     * Parses the 'tracks' attribute and updates the playlist data.
     */
    parseTracksAttribute() {
      const tracksAttr = this.getAttribute("tracks");
      this.trackErrorStates = new Array(this.playlistData.length).fill(false);
      if (tracksAttr) {
        try {
          const tracks = JSON.parse(tracksAttr);
          if (Array.isArray(tracks)) {
            this.playlistData = tracks.filter((track) => typeof track.src === "string");
            if (this.playlistData.length === 0) {
              console.error('The "tracks" attribute must contain at least one valid track with a "src" property.');
              this.updateControlsState(false);
              this.hidePlayer(true);
            } else {
              this.hidePlayer(false);
              this.currentTrackIndex = 0;
              this.loadCurrentTrack();
              this.updatePlaylistUI();
              this.updateControlsState(true);
              this.updateControlsVisibility();
            }
          } else {
            console.error('Invalid "tracks" attribute format. Expected a JSON array.');
            this.updateControlsState(false);
            this.hidePlayer(true);
          }
        } catch (e) {
          console.error('Failed to parse "tracks" attribute as JSON.', e);
          this.updateControlsState(false);
          this.hidePlayer(true);
        }
      } else {
        console.error('The "tracks" attribute is required and must be a valid JSON array.');
        this.updateControlsState(false);
        this.hidePlayer(true);
      }
    }
    hidePlayer(hide) {
      var _a, _b;
      if (hide) {
        (_a = this.playerContainer) == null ? void 0 : _a.classList.add("hidden");
      } else {
        (_b = this.playerContainer) == null ? void 0 : _b.classList.remove("hidden");
      }
    }
    /**
     * Create a container for all the player elements
     */
    createPlayerContainer() {
      this.playerContainer = document.createElement("div");
      this.playerContainer.setAttribute("class", "player-container");
      this.shadow.appendChild(this.playerContainer);
    }
    /**
     * Creates the audio element and appends it to the shadow DOM
     */
    createAudioElement() {
      var _a;
      this.audio = document.createElement("audio");
      this.audio.setAttribute("aria-hidden", "true");
      this.audio.preload = "metadata";
      (_a = this.playerContainer) == null ? void 0 : _a.appendChild(this.audio);
    }
    /**
     * Creates the playlist UI and appends it to the shadow DOM
     */
    createPlaylist() {
      var _a;
      this.playlistContainer = document.createElement("div");
      this.playlistContainer.setAttribute("class", "playlist-container");
      (_a = this.playerContainer) == null ? void 0 : _a.appendChild(this.playlistContainer);
    }
    /**
     * Creates the container for progress bar and time display
     */
    createControlsProgressAndTimeContainer() {
      var _a;
      this.controlsProgressTimeContainer = document.createElement("div");
      this.controlsProgressTimeContainer.setAttribute("class", "controls-progress-time-container");
      this.createControls();
      this.createProgressBar();
      this.createTimeDisplay();
      (_a = this.playerContainer) == null ? void 0 : _a.appendChild(this.controlsProgressTimeContainer);
    }
    /**
     * Creates the progress bar and appends it to the progress-time container
     */
    createProgressBar() {
      var _a;
      this.progressBar = document.createElement("input");
      this.progressBar.type = "range";
      this.progressBar.min = "0";
      this.progressBar.max = "100";
      this.progressBar.value = "0";
      this.progressBar.step = "0.1";
      this.progressBar.setAttribute("part", "progress-bar");
      this.progressBar.setAttribute("role", "slider");
      this.progressBar.setAttribute("aria-label", "Seek Slider");
      this.progressBar.setAttribute("aria-valuemin", "0");
      this.progressBar.setAttribute("aria-valuemax", "100");
      this.progressBar.setAttribute("aria-valuenow", "0");
      this.progressBar.setAttribute("aria-valuetext", "0% played");
      this.progressBar.addEventListener("input", () => this.onSeek());
      this.progressBar.addEventListener("change", () => this.onSeek());
      this.progressBar.addEventListener("keydown", (event) => this.onSeekKeyDown(event));
      const progressContainer = document.createElement("div");
      progressContainer.setAttribute("class", "progress-container");
      progressContainer.appendChild(this.progressBar);
      (_a = this.controlsProgressTimeContainer) == null ? void 0 : _a.appendChild(progressContainer);
    }
    /**
     * Creates the time display element and appends it to the progress-time container
     */
    createTimeDisplay() {
      var _a;
      this.timeDisplay = document.createElement("div");
      this.timeDisplay.setAttribute("class", "time-display");
      this.timeDisplay.setAttribute("part", "time-display");
      this.timeDisplay.setAttribute("aria-live", "off");
      this.timeDisplay.textContent = "0:00/0:00";
      (_a = this.controlsProgressTimeContainer) == null ? void 0 : _a.appendChild(this.timeDisplay);
    }
    /**
     * Creates control buttons and other UI elements
     */
    createControls() {
      var _a;
      const controlsContainer = document.createElement("div");
      controlsContainer.setAttribute("role", "group");
      controlsContainer.setAttribute("aria-label", "Audio Player Controls");
      const prevNextContainer = document.createElement("div");
      prevNextContainer.setAttribute("class", "prev-next-container");
      const createIcon = (iconId) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "14");
        svg.setAttribute("height", "14");
        svg.classList.add("default-icon");
        svg.setAttribute("viewBox", "0 0 24 24");
        const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconId);
        svg.appendChild(useElement);
        return svg;
      };
      const playIconSvg = createIcon("#play-icon");
      const pauseIconSvg = createIcon("#pause-icon");
      const prevIconSvg = createIcon("#previous-icon");
      const nextIconSvg = createIcon("#next-icon");
      this.playPauseButton = document.createElement("button");
      this.playPauseButton.setAttribute("part", "play-pause-toggle-button");
      this.playPauseButton.setAttribute("id", "playPauseButton");
      const playIconSlot = document.createElement("slot");
      playIconSlot.name = "play-icon";
      const pauseIconSlot = document.createElement("slot");
      pauseIconSlot.name = "pause-icon";
      pauseIconSlot.style.display = "none";
      if (!this.querySelector('[slot="play-icon"]')) {
        playIconSlot.innerHTML = playIconSvg.outerHTML;
      }
      if (!this.querySelector('[slot="pause-icon"]')) {
        pauseIconSlot.innerHTML = pauseIconSvg.outerHTML;
      } else {
        this.playPauseButton.appendChild(pauseIconSlot);
      }
      this.playPauseButton.appendChild(playIconSlot);
      this.playPauseButton.appendChild(pauseIconSlot);
      this.playPauseButton.setAttribute("aria-label", "Play");
      this.playPauseButton.addEventListener("click", () => this.togglePlayPause());
      controlsContainer.appendChild(this.playPauseButton);
      this.prevButton = document.createElement("button");
      this.prevButton.setAttribute("part", "prev-button");
      this.prevButton.setAttribute("aria-label", "Previous Track");
      const prevIconSlot = document.createElement("slot");
      prevIconSlot.name = "prev-icon";
      if (!this.querySelector('[slot="prev-icon"]')) {
        prevIconSlot.innerHTML = prevIconSvg.outerHTML;
      }
      this.prevButton.appendChild(prevIconSlot);
      this.prevButton.addEventListener("click", () => this.prevTrack());
      prevNextContainer.appendChild(this.prevButton);
      this.nextButton = document.createElement("button");
      this.nextButton.setAttribute("part", "next-button");
      this.nextButton.setAttribute("aria-label", "Next Track");
      const nextIconSlot = document.createElement("slot");
      nextIconSlot.name = "next-icon";
      if (!this.querySelector('[slot="next-icon"]')) {
        nextIconSlot.innerHTML = nextIconSvg.outerHTML;
      }
      this.nextButton.appendChild(nextIconSlot);
      this.nextButton.addEventListener("click", () => this.nextTrack());
      prevNextContainer.appendChild(this.nextButton);
      controlsContainer.appendChild(prevNextContainer);
      this.playbackRateSelect = document.createElement("select");
      this.playbackRateSelect.setAttribute("aria-label", "Playback Speed");
      const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
      playbackRates.forEach((rate) => {
        var _a2;
        const option = document.createElement("option");
        option.value = rate.toString();
        option.textContent = `${rate}x`;
        if (rate === 1) {
          option.selected = true;
        }
        (_a2 = this.playbackRateSelect) == null ? void 0 : _a2.appendChild(option);
      });
      this.playbackRateSelect.addEventListener("change", () => this.adjustPlaybackRate());
      controlsContainer.appendChild(this.playbackRateSelect);
      (_a = this.controlsProgressTimeContainer) == null ? void 0 : _a.appendChild(controlsContainer);
    }
    /**
     * Updates the visibility of the Prev and Next buttons based on the number of tracks
     */
    updateControlsVisibility() {
      if (this.playlistData.length > 1) {
        if (!this.prevButton && !this.nextButton) {
          this.removeControls();
          this.createControls();
          this.updateControlsState(true);
        } else {
          if (this.prevButton) {
            this.prevButton.style.display = "";
          }
          if (this.nextButton) {
            this.nextButton.style.display = "";
          }
        }
      } else {
        if (this.prevButton) {
          this.prevButton.style.display = "none";
        }
        if (this.nextButton) {
          this.nextButton.style.display = "none";
        }
      }
    }
    /**
     * Removes the existing controls from the DOM
     */
    removeControls() {
      const controls = this.shadow.querySelector('div[role="group"]');
      if (controls) {
        this.shadow.removeChild(controls);
      }
      this.playPauseButton = null;
      this.prevButton = null;
      this.nextButton = null;
      this.playbackRateSelect = null;
    }
    /**
     * Updates the enabled/disabled state of controls based on the availability of tracks
     * @param isEnabled Whether the controls should be enabled
     */
    updateControlsState(isEnabled) {
      if (this.playPauseButton) {
        this.playPauseButton.disabled = !isEnabled;
      }
      if (this.nextButton) {
        this.nextButton.disabled = !isEnabled;
      }
      if (this.prevButton) {
        this.prevButton.disabled = !isEnabled;
      }
      if (this.progressBar) {
        this.progressBar.disabled = !isEnabled;
      }
      if (this.playbackRateSelect) {
        this.playbackRateSelect.disabled = !isEnabled;
      }
      if (this.timeDisplay) {
        this.timeDisplay.textContent = isEnabled ? "0:00/0:00" : "";
      }
    }
    /**
     * Attaches event listeners for media events
     */
    attachEventListeners() {
      if (!this.audio) return;
      this.audio.addEventListener("error", () => this.handleMediaError());
      this.audio.addEventListener("timeupdate", () => {
        this.updateProgressBar();
        this.updateTimeDisplay();
      });
      this.audio.addEventListener("loadedmetadata", () => {
        this.updateProgressBar();
        this.updateTimeDisplay();
      });
      this.audio.addEventListener("durationchange", () => {
        this.updateTimeDisplay();
      });
      this.audio.addEventListener("play", () => {
        this.updatePlayPauseButton();
        this.dispatchEvent(new Event("play"));
      });
      this.audio.addEventListener("pause", () => {
        this.updatePlayPauseButton();
        this.dispatchEvent(new Event("pause"));
      });
      this.audio.addEventListener("ended", () => this.onTrackEnded());
    }
    /**
     * Sets up keyboard shortcuts for controlling the audio player
     */
    setupKeyboardShortcuts() {
      this.keyboardShortcuts = {
        " ": () => this.togglePlayPause(),
        // Spacebar
        ArrowRight: () => this.nextTrack(),
        ArrowLeft: () => this.prevTrack()
        // Additional shortcuts can be added here
      };
      document.addEventListener("keydown", (event) => this.handleKeydown(event));
    }
    /**
     * Handles keydown events for keyboard shortcuts
     * @param event KeyboardEvent
     */
    handleKeydown(event) {
      const action = this.keyboardShortcuts[event.key];
      if (action) {
        if (document.activeElement === this || !this.multiplePlayersExist()) {
          event.preventDefault();
          action();
        }
      }
    }
    /**
     * Checks if multiple instances of the player exist on the page
     */
    multiplePlayersExist() {
      return document.querySelectorAll("bespoken-audio-player").length > 1;
    }
    /**
     * Toggles between play and pause states
     */
    togglePlayPause() {
      if (!this.audio) return;
      if (this.audio.paused) {
        this.playAudio();
      } else {
        this.pauseAudio();
      }
    }
    /**
     * Plays the current audio track
     */
    async playAudio() {
      if (!this.audio) return;
      try {
        const src = this.audio.src;
        if (!src) {
          throw new Error("No audio source available.");
        }
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Audio file not found: ${src}`);
        }
        await this.audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
    /**
     * Pauses the current audio track
     */
    pauseAudio() {
      if (!this.audio) return;
      this.audio.pause();
    }
    /**
     * Updates the play/pause button based on playback state
     */
    updatePlayPauseButton() {
      if (!this.playPauseButton) return;
      const playIconSlot = this.playPauseButton.querySelector('slot[name="play-icon"]');
      const pauseIconSlot = this.playPauseButton.querySelector('slot[name="pause-icon"]');
      if (this.audio && this.audio.paused) {
        this.playPauseButton.setAttribute("aria-label", "Play");
        this.playPauseButton.setAttribute("aria-pressed", "false");
        playIconSlot.style.display = "";
        pauseIconSlot.style.display = "none";
      } else {
        this.playPauseButton.setAttribute("aria-label", "Pause");
        this.playPauseButton.setAttribute("aria-pressed", "true");
        playIconSlot.style.display = "none";
        pauseIconSlot.style.display = "";
      }
      this.updatePlaylistUI();
    }
    /**
     * Moves to the next track in the playlist
     */
    nextTrack() {
      if (this.playlistData.length > 1) {
        if (this.hasNextAvailableTrack()) {
          this.nextAvailableTrack();
          this.dispatchTrackChangeEvent(this.currentTrackIndex);
        } else {
          console.warn("No next available tracks to play.");
        }
      }
    }
    /**
     * Moves to the previous track in the playlist
     */
    prevTrack() {
      if (this.playlistData.length > 1) {
        if (this.hasPrevAvailableTrack()) {
          this.prevAvailableTrack();
          this.dispatchTrackChangeEvent(this.currentTrackIndex);
        } else {
          console.warn("No previous available tracks to play.");
        }
      }
    }
    /**
     * Adjusts the playback rate based on the select control
     */
    adjustPlaybackRate() {
      if (!this.audio || !this.playbackRateSelect) return;
      const rate = parseFloat(this.playbackRateSelect.value);
      this.audio.playbackRate = rate;
    }
    /**
     * Loads the current track based on currentTrackIndex
     */
    loadCurrentTrack(retryCount = 0, maxRetries = 3) {
      var _a;
      if (!this.audio) return;
      if (this.playlistData.length > 0) {
        const currentTrack = this.playlistData[this.currentTrackIndex];
        this.audio.src = currentTrack.src;
        this.audio.load();
        const rate = parseFloat(((_a = this.playbackRateSelect) == null ? void 0 : _a.value) ?? "1");
        this.audio.playbackRate = rate;
        this.audio.onerror = () => {
          console.error(`Failed to load audio: ${currentTrack.src}`);
          if (retryCount < maxRetries) {
            console.log(`Retrying to load: ${currentTrack.src} (${retryCount + 1}/${maxRetries})`);
            this.loadCurrentTrack(retryCount + 1, maxRetries);
          } else {
            console.error(`The audio file, ${currentTrack.src}, could not be loaded. Skipping to the next track.`);
            this.nextTrack();
          }
        };
        this.audio.oncanplay = () => {
          var _a2;
          console.log(`Successfully loaded: ${currentTrack.src}`);
          (_a2 = this.audio) == null ? void 0 : _a2.play();
        };
      } else {
        this.audio.removeAttribute("src");
        this.updateControlsState(false);
      }
    }
    /**
     * Handles media errors and provides detailed error messages
     */
    handleMediaError() {
      var _a;
      const error = (_a = this.audio) == null ? void 0 : _a.error;
      let errorMessage = "An unknown error occurred while loading the audio.";
      let errorCode = 0;
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Playback was aborted by the user.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "A network error prevented the audio from loading. Please check your internet connection.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "An error occurred while decoding the audio. The file may be corrupt or in an unsupported format.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Error: The file was not found or the audio format is not supported.";
            break;
          default:
            errorMessage = "An unknown error occurred while loading the audio.";
            break;
        }
      }
      this.dispatchEvent(
        new CustomEvent("error", {
          detail: {
            code: errorCode,
            message: errorMessage,
            mediaError: error,
            trackIndex: this.currentTrackIndex,
            track: this.playlistData[this.currentTrackIndex]
          }
        })
      );
      this.trackErrorStates[this.currentTrackIndex] = true;
      this.updatePlaylistUI();
      if (this.hasNextAvailableTrack()) {
        this.nextAvailableTrack();
        this.playAudio();
      } else {
        this.updateControlsState(false);
        console.warn("No available tracks to play.");
      }
      const errorContainer = document.createElement("div");
      errorContainer.setAttribute("class", "error-message");
      errorContainer.textContent = errorMessage;
      const existingError = this.shadow.querySelector(".error-message");
      if (existingError) {
        this.shadow.removeChild(existingError);
      }
      this.shadow.appendChild(errorContainer);
    }
    /**
     * Updates the progress bar as the audio plays
     */
    updateProgressBar() {
      if (!this.progressBar) return;
      if (this.audio && this.audio.duration > 0) {
        const value = this.audio.currentTime / this.audio.duration * 100;
        this.progressBar.value = value.toString();
        this.progressBar.setAttribute("aria-valuenow", value.toFixed(2));
        const percentPlayed = value.toFixed(1) + "% played";
        this.progressBar.setAttribute("aria-valuetext", percentPlayed);
        this.progressBar.style.setProperty("--progress", `${value}%`);
      } else {
        this.progressBar.value = "0";
        this.progressBar.setAttribute("aria-valuenow", "0");
        this.progressBar.setAttribute("aria-valuetext", "0% played");
        this.progressBar.style.setProperty("--progress", "0%");
      }
    }
    /**
     * Updates the time display
     */
    updateTimeDisplay() {
      const currentTime = this.audio ? this.audio.currentTime : 0;
      const duration = this.audio ? this.audio.duration : 0;
      const formattedCurrentTime = this.formatTime(currentTime);
      const formattedDuration = this.formatTime(duration);
      if (!this.timeDisplay) return;
      this.timeDisplay.textContent = `${formattedCurrentTime}/${formattedDuration}`;
    }
    /**
     * Formats a time value in seconds to HH:MM:SS or MM:SS
     * @param time Time in seconds
     * @returns Formatted time string
     */
    formatTime(time) {
      if (!isFinite(time)) {
        return "0:00";
      }
      const totalSeconds = Math.floor(time);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
      const seconds = totalSeconds - hours * 3600 - minutes * 60;
      const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
      const minutesStr = minutes < 10 && hours > 0 ? `0${minutes}` : `${minutes}`;
      if (hours > 0) {
        return `${hours}:${minutesStr}:${secondsStr}`;
      } else {
        return `${minutes}:${secondsStr}`;
      }
    }
    /**
     * Handles user seeking via the progress bar
     */
    onSeek() {
      if (!this.audio || !this.progressBar) return;
      if (this.audio.duration > 0) {
        const seekTime = parseFloat(this.progressBar.value) / 100 * this.audio.duration;
        this.audio.currentTime = seekTime;
      }
    }
    /**
     * Handles keyboard events on the progress bar for accessibility
     * @param event KeyboardEvent
     */
    onSeekKeyDown(event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        this.stepBack();
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        this.stepForward();
      }
    }
    /**
     * Steps back the progress bar by a small amount
     */
    stepBack() {
      if (!this.progressBar) return;
      const step = parseFloat(this.progressBar.step);
      let value = parseFloat(this.progressBar.value) - step;
      if (value < 0) value = 0;
      this.progressBar.value = value.toString();
      this.onSeek();
    }
    /**
     * Steps forward the progress bar by a small amount
     */
    stepForward() {
      if (!this.progressBar) return;
      const step = parseFloat(this.progressBar.step);
      let value = parseFloat(this.progressBar.value) + step;
      if (value > 100) value = 100;
      this.progressBar.value = value.toString();
      this.onSeek();
    }
    /**
     * Handles the end of a track
     */
    onTrackEnded() {
      if (this.playlistData.length > 1) {
        if (this.currentTrackIndex < this.playlistData.length - 1) {
          this.currentTrackIndex++;
          this.loadCurrentTrack();
          this.playAudio();
          this.dispatchTrackChangeEvent(this.currentTrackIndex);
        } else if (this.isLoopEnabled) {
          this.currentTrackIndex = 0;
          this.loadCurrentTrack();
          this.playAudio();
        } else {
          this.updatePlayPauseButton();
        }
      } else {
        this.updatePlayPauseButton();
      }
      this.dispatchEvent(new Event("ended"));
    }
    /**
     * Creates or updates the playlist UI
     */
    updatePlaylistUI() {
      if (!this.playlistContainer) return;
      while (this.playlistContainer.firstChild) {
        this.playlistContainer.removeChild(this.playlistContainer.firstChild);
      }
      if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
        if (this.playlistData.length > 0) {
          const list = document.createElement("ul");
          list.setAttribute("role", "list");
          let tracksToDisplay = [];
          if (this.isOnlyCurrentTrackVisible) {
            tracksToDisplay = [this.playlistData[this.currentTrackIndex]];
            this.playlistContainer.classList.add("only-current-track-visible");
          } else {
            tracksToDisplay = this.playlistData;
          }
          tracksToDisplay.forEach((track, idx) => {
            const actualIndex = this.isOnlyCurrentTrackVisible ? this.currentTrackIndex : idx;
            const listItem = document.createElement("li");
            listItem.setAttribute("role", "listitem");
            const trackButton = document.createElement("button");
            const trackTitle = track.title || this.extractFileName(track.src);
            trackButton.setAttribute("aria-label", `Play ${trackTitle}`);
            const isTrackError = this.trackErrorStates[actualIndex];
            trackButton.disabled = isTrackError;
            const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            iconSvg.setAttribute("width", "16");
            iconSvg.setAttribute("height", "16");
            iconSvg.setAttribute("aria-hidden", "true");
            const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
            useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "");
            iconSvg.appendChild(useElement);
            if (isTrackError) {
              useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#error-icon");
            } else if (this.currentTrackIndex === actualIndex) {
              trackButton.classList.add("current-track");
              trackButton.setAttribute("aria-current", "true");
              trackButton.classList.add("playing");
              if (this.audio && this.audio.paused) {
                useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#play-icon");
                trackButton.setAttribute("aria-pressed", "false");
                trackButton.classList.remove("playing");
              } else {
                useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#pause-icon");
                trackButton.setAttribute("aria-pressed", "true");
              }
            } else {
              useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#bullet-icon");
              trackButton.setAttribute("aria-pressed", "false");
            }
            trackButton.appendChild(iconSvg);
            const spanNode = document.createElement("span");
            spanNode.classList.add("track-title");
            const textNode = document.createTextNode(`${trackTitle}`);
            spanNode.appendChild(textNode);
            trackButton.appendChild(spanNode);
            trackButton.addEventListener("click", () => {
              if (this.currentTrackIndex === actualIndex) {
                this.togglePlayPause();
              } else {
                this.currentTrackIndex = actualIndex;
                this.loadCurrentTrack();
                this.playAudio();
              }
            });
            listItem.appendChild(trackButton);
            list.appendChild(listItem);
          });
          this.playlistContainer.appendChild(list);
        }
      }
    }
    /**
     * Extracts the file name from the source URL
     * @param src The source URL of the track
     * @returns The extracted file name without extension
     */
    extractFileName(src) {
      const parts = src.split("/");
      let filename = parts[parts.length - 1];
      filename = filename.split("?")[0];
      filename = filename.replace(/\.[^/.]+$/, "");
      return filename;
    }
    /**
     * Updates the visibility of the playlist UI
     */
    updatePlaylistVisibility() {
      if (!this.playlistContainer) return;
      if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
        this.playlistContainer.style.display = "block";
        this.updatePlaylistUI();
      } else {
        this.playlistContainer.style.display = "none";
      }
    }
    hasNextAvailableTrack() {
      const totalTracks = this.playlistData.length;
      let nextIndex = this.currentTrackIndex;
      for (let i = 1; i < totalTracks; i++) {
        nextIndex = (this.currentTrackIndex + i) % totalTracks;
        if (!this.trackErrorStates[nextIndex]) {
          return true;
        }
      }
      return false;
    }
    hasPrevAvailableTrack() {
      const totalTracks = this.playlistData.length;
      let prevIndex = this.currentTrackIndex;
      for (let i = 1; i < totalTracks; i++) {
        prevIndex = (this.currentTrackIndex - i + totalTracks) % totalTracks;
        if (!this.trackErrorStates[prevIndex]) {
          return true;
        }
      }
      return false;
    }
    nextAvailableTrack() {
      const totalTracks = this.playlistData.length;
      let nextIndex = this.currentTrackIndex;
      do {
        nextIndex = (nextIndex + 1) % totalTracks;
        if (!this.trackErrorStates[nextIndex]) {
          this.currentTrackIndex = nextIndex;
          this.loadCurrentTrack();
          return;
        }
      } while (nextIndex !== this.currentTrackIndex);
      console.warn("No available tracks to play.");
    }
    prevAvailableTrack() {
      const totalTracks = this.playlistData.length;
      let prevIndex = this.currentTrackIndex;
      do {
        prevIndex = (prevIndex - 1 + totalTracks) % totalTracks;
        if (!this.trackErrorStates[prevIndex]) {
          this.currentTrackIndex = prevIndex;
          this.loadCurrentTrack();
          return;
        }
      } while (prevIndex !== this.currentTrackIndex);
      console.warn("No available tracks to play.");
    }
    dispatchTrackChangeEvent(currentTrackIndex = 0) {
      this.dispatchEvent(new CustomEvent("trackChange", {
        detail: {
          currentTrackIndex: currentTrackIndex ?? 0,
          track: this.playlistData[currentTrackIndex ?? 0]
        }
      }));
    }
    /**
     * Renders the component's HTML structure and styles
     */
    render() {
      const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgDefs.setAttribute("aria-hidden", "true");
      svgDefs.setAttribute("style", "display: none;");
      svgDefs.innerHTML = `
<!-- Play Icon -->
<symbol id="play-icon" viewBox="0 0 24 24"><path d="M8.93,6v12.31l8.72-6.16-8.72-6.16Z"/></symbol>

<!-- Pause Icon -->
<symbol id="pause-icon" viewBox="0 0 24 24"><rect x="6.94" y="6.66" width="3.69" height="11"/><rect x="13.56" y="6.66" width="3.69" height="11"/></symbol>

<!-- Bullet Icon -->
<symbol id="bullet-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/></symbol>

<!-- Error Icon -->
<symbol id="error-icon" viewBox="0 0 24 24"><defs><style>.b{fill:none;stroke:#000;stroke-miterlimit:10;stroke-width:2px;}</style></defs><circle class="b" cx="11.75" cy="11.91" r="5.25"/><line class="b" x1="7.88" y1="16.03" x2="15.62" y2="8.28"/></symbol>

<!-- Previous Icon (Two Left-Pointing Arrows) -->
<symbol id="previous-icon" viewBox="0 0 24 24"><path d="M10.22,18.31V6L1.5,12.16l8.72,6.16ZM20.99,18.31V6l-8.72,6.16,8.72,6.16Z"/></symbol>

<!-- Next Icon (Two Right-Pointing Arrows) -->
<symbol id="next-icon" viewBox="0 0 24 24"><path d="M13.77,6v12.31l8.72-6.16-8.72-6.16ZM3,6v12.31l8.72-6.16L3,6Z"/></symbol>
      `;
      this.shadow.appendChild(svgDefs);
      const style = document.createElement("style");
      style.textContent = `
      /* Styles for the audio player */
        :host {
            --primary-color: #334155;
            --progress-bar-background: #ccc;
            --progress-bar-fill: var(--primary-color);
            --progress-bar-thumb: var(--primary-color);
        }
        
        .player-container {
            /* the container-type allows a container query resize of the children element */
            container-type: inline-size;
        }
        
        .player-container.hidden {
            display: none;
        }
        
        .playlist-container {
        
            display: block;
            width: 100%;
            margin-bottom: 10px;
        }
        
        .playlist-container ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .playlist-container button {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 2px;
            width: 100%;
            text-align: left;
            background: var(--playlist-background, #f9f9f9);
            border: var(--playlist-border, 1px solid #ccc);
            border-radius: var(--playlist-border-radius, 3px);
            color: var(--playlist-color, #333);
            cursor: pointer;
            font-size: var(--playlist-font-size, 0.75rem);
            font-weight: var(--playlist-font-weight, normal);
            padding: var(--playlist-padding, 10px);
        }
        .playlist-container button span.track-title {
            display: -webkit-box;
            -webkit-line-clamp: 1; /* Number of lines */
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
               
        .playlist-container ul {
            display: flex;
            flex-direction: column;
            gap: var(--playlist-gap-between-tracks, 5px);
        }
        
        .playlist-container ul li {
            width: 100%;
        }
        
        .playlist-container button.current-track {
            background-color: var(--playlist-current-background, var(--playlist-background, #f9f9f9));
            font-weight: var(--playlist-current-font-weight, bold);
            text-decoration: none;
        }
        
        .playlist-container button.current-track.playing {
            font-weight: var(--playlist-current-playing-font-weight, var(--playlist-current-font-weight, bold));
            background-color: var(--playlist-current-playing-background, var(--playlist-current-background, var(--playlist-background, #fff)));
        }
        
        .playlist-container svg {
            display: inline-block;
            width: 10px;
            height: 10px;
            min-width: 10px;
        }
        
        .controls-progress-time-container {
            display: flex;
            gap: var(--controls-gap, 5px);
            flex-direction: row;
            align-items: center;
        }
        
        /* style the default icons */
        .controls-progress-time-container button svg.default-icon {
            padding: 0;
            margin: -3px 0 -3px 0;
        }
        
        .progress-container {
            display: flex;
            align-items: center;
            flex-grow: 1;
            width: 100%;
        }
        
        .progress-container input[type="range"] {
            width: 100%;
        }
        
        .time-display {
            line-height: 1;
            font-size: 0.625em;
            font-color: #bbc0c7;
            flex-shrink: 0;
            font-family: monospace;
        }
        
        div[role="group"] {
            display: flex;
            justify-content: space-between;
            align-items: center;
        
            gap: var(--audio-controls-gap, var(--controls-gap, 5px));
            margin-top: 0;
            align-items: center;
        }
        
        .prev-next-container {
            display: flex;
            gap: var(--prev-next-controls-gap, var(--audio-controls-gap, var(--controls-gap, 5px)));
        }
        
        .controls-progress-time-container button {
            padding: var(--button-padding, 3px 6px);
            font-size: 0.8rem;
            background-color: var(--button-background, #fff);
            color: var(--button-color, var(--primary-color));
            cursor: pointer;
        }
        
        /* set the button and select border styles */
        button, select {
            border-width: var(--button-border-size, 1px);
            border-color: var(--button-border-color, #9F9F9F);
            border-style: solid;
            border-radius: 2px;
        }
        
        /* Style the select element - the speed drop down */
        
        select {
            appearance: none; /* Remove default select styles */
            -webkit-appearance: none; /* For Safari */
            -moz-appearance: none; /* For Firefox */
            background-color: var(--select-background, #fff);
            color: var(--select-color, #334155);
            padding: var(--select-padding, 4px 4px);
            font-size: var(--select-font-size, 0.7rem);
            border-radius: var(--select-border-radius, 2px);
            cursor: pointer;
        }
        
        /* Container query for small container sizes */
        @container (max-width: 300px) {
            .controls-progress-time-container {
                display: flex;
                padding: 8px 0;
                flex-direction: column;
                gap: 10px;
                align-items: center;
            }
        
            .progress-container {
        
            }
        
            .time-display {
                margin-left: 0;
                margin-top: 0;
            }
        }

      /* Progress Bar Styles */
      input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        background-color: transparent;
        cursor: pointer;
      }

      /* Track - Normal State */
      input[type="range"]::-webkit-slider-runnable-track {
        height: 8px;
        border-radius: 5px;
        background: linear-gradient(
          to right,
          var(--progress-bar-fill) 0%,
          var(--progress-bar-fill) var(--progress),
          var(--progress-bar-background) var(--progress),
          var(--progress-bar-background) 100%
        );
      }

      /* Track - Hover State */
      @supports (background: color-mix(in srgb, red 50%, blue)) {
        input[type="range"]:hover::-webkit-slider-runnable-track {
          background: linear-gradient(
            to right,
            color-mix(in srgb, var(--progress-bar-fill) 65%, transparent 0%) 0%,
            color-mix(in srgb, var(--progress-bar-fill) 65%, transparent 0%) var(--progress),
            var(--progress-bar-background) var(--progress),
            var(--progress-bar-background) 100%
          );
        }
      }

      /* Thumb */
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 15px;
        height: 15px;
        background-color: var(--progress-bar-thumb);
        border-radius: 50%;
        margin-top: -4px; /* Adjust for alignment */
      }

      /* Mozilla Browsers */
      /* Track - Normal State */
      input[type="range"]::-moz-range-track {
        height: 8px;
        background-color: var(--progress-bar-background);
        border-radius: 5px;
      }

        /* Style for disabled buttons */
        .playlist-container button:disabled {
          cursor: not-allowed;
          color: var(--playlist-color-error, #ca3a31); /* Optional: Change text color */
        }
        
        /* Optionally, add an error icon */
        .playlist-container button:disabled svg use {
          href: '#error-icon'; /* Reference an error icon */
        }

        /* Error Message Styles */
        .error-message {
          color: #ca3a31;
          font-weight: bold;
          font-size: 0.7rem;
          margin-top: 10px;
        }
    `;
      this.shadow.appendChild(style);
      if (this.playlistData.length > 0) {
        this.loadCurrentTrack();
      } else {
        this.updateControlsState(false);
      }
      this.updateControlsVisibility();
      this.updatePlaylistVisibility();
    }
    /**
     * Allows setting the playlist via the 'tracks' attribute or property
     */
    set tracks(value) {
      if (Array.isArray(value)) {
        this.playlistData = value.filter((track) => typeof track.src === "string");
        this.trackErrorStates = new Array(this.playlistData.length).fill(false);
        this.playlistData = value.filter((track) => typeof track.src === "string");
        if (this.playlistData.length === 0) {
          console.error('The "tracks" property must contain at least one valid track with a "src" property.');
          this.updateControlsState(false);
        } else {
          this.currentTrackIndex = 0;
          this.loadCurrentTrack();
          this.updatePlaylistUI();
          this.updateControlsState(true);
          this.updateControlsVisibility();
        }
      } else {
        console.error('The "tracks" property must be an array of track objects.');
        this.updateControlsState(false);
      }
    }
    /**
     * Gets the current playlist data
     */
    get tracks() {
      return this.playlistData;
    }
  }
  if (!customElements.get("bespoken-audio-player")) {
    customElements.define("bespoken-audio-player", BespokenAudioPlayer);
  }
  function initBespokenAudioPlayer() {
    if (!customElements.get("bespoken-audio-player")) {
      customElements.define("bespoken-audio-player", BespokenAudioPlayer);
    }
  }
  exports2.BespokenAudioPlayer = BespokenAudioPlayer;
  exports2.initBespokenAudioPlayer = initBespokenAudioPlayer;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});

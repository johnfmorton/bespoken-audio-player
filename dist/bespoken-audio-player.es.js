/**
 * name: bespoken-audio-player
 * version: v1.0.0
 * description: This is a template repo that will create a Vite workflow to ease creation of Javascript modules with a dev server, GitHub Pages support and automated publishing to NPM.
 * author: John F. Morton <john@johnfmorton.com> (https://supergeekery.com)
 * repository: https://github.com/johnfmorton/bespoken-audio-player
 * build date: 2024-09-15T14:03:04.425Z 
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class BespokenAudioPlayer extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM root
    __publicField(this, "shadow");
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
    __publicField(this, "progressTimeContainer");
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
    this.shadow = this.attachShadow({ mode: "open" });
    this.playlistData = [];
    this.currentTrackIndex = 0;
    this.keyboardShortcuts = {};
    this.isPlaylistVisible = false;
    this.isLoopEnabled = false;
    this.isOnlyCurrentTrackVisible = false;
    this.createAudioElement();
    this.createPlaylist();
    this.createProgressAndTimeContainer();
    this.createControls();
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
    if (tracksAttr) {
      try {
        const tracks = JSON.parse(tracksAttr);
        if (Array.isArray(tracks)) {
          this.playlistData = tracks.filter((track) => typeof track.src === "string");
          if (this.playlistData.length === 0) {
            console.error('The "tracks" attribute must contain at least one valid track with a "src" property.');
            this.updateControlsState(false);
          } else {
            this.currentTrackIndex = 0;
            this.loadCurrentTrack();
            this.updatePlaylistUI();
            this.updateControlsState(true);
            this.updateControlsVisibility();
          }
        } else {
          console.error('Invalid "tracks" attribute format. Expected a JSON array.');
          this.updateControlsState(false);
        }
      } catch (e) {
        console.error('Failed to parse "tracks" attribute as JSON.', e);
        this.updateControlsState(false);
      }
    } else {
      console.error('The "tracks" attribute is required and must be a valid JSON array.');
      this.updateControlsState(false);
    }
  }
  /**
   * Creates the audio element and appends it to the shadow DOM
   */
  createAudioElement() {
    this.audio = document.createElement("audio");
    this.audio.setAttribute("aria-hidden", "true");
    this.audio.preload = "metadata";
    this.shadow.appendChild(this.audio);
  }
  /**
   * Creates the playlist UI and appends it to the shadow DOM
   */
  createPlaylist() {
    this.playlistContainer = document.createElement("div");
    this.playlistContainer.setAttribute("class", "playlist-container");
    this.shadow.appendChild(this.playlistContainer);
  }
  /**
   * Creates the container for progress bar and time display
   */
  createProgressAndTimeContainer() {
    this.progressTimeContainer = document.createElement("div");
    this.progressTimeContainer.setAttribute("class", "progress-time-container");
    this.createProgressBar();
    this.createTimeDisplay();
    this.shadow.appendChild(this.progressTimeContainer);
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
    (_a = this.progressTimeContainer) == null ? void 0 : _a.appendChild(progressContainer);
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
    (_a = this.progressTimeContainer) == null ? void 0 : _a.appendChild(this.timeDisplay);
  }
  /**
   * Creates control buttons and other UI elements
   */
  createControls() {
    const controlsContainer = document.createElement("div");
    controlsContainer.setAttribute("role", "group");
    controlsContainer.setAttribute("aria-label", "Audio Player Controls");
    this.playPauseButton = document.createElement("button");
    this.playPauseButton.setAttribute("part", "play-button");
    this.playPauseButton.setAttribute("id", "playPauseButton");
    const playIconSlot = document.createElement("slot");
    playIconSlot.name = "play-icon";
    const pauseIconSlot = document.createElement("slot");
    pauseIconSlot.name = "pause-icon";
    pauseIconSlot.style.display = "none";
    if (!this.querySelector('[slot="play-icon"]')) {
      playIconSlot.textContent = "Play";
    }
    if (!this.querySelector('[slot="pause-icon"]')) {
      pauseIconSlot.textContent = "Pause";
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
      prevIconSlot.textContent = "Previous";
    }
    this.prevButton.appendChild(prevIconSlot);
    this.prevButton.addEventListener("click", () => this.prevTrack());
    controlsContainer.appendChild(this.prevButton);
    this.nextButton = document.createElement("button");
    this.nextButton.setAttribute("part", "next-button");
    this.nextButton.setAttribute("aria-label", "Next Track");
    const nextIconSlot = document.createElement("slot");
    nextIconSlot.name = "next-icon";
    if (!this.querySelector('[slot="next-icon"]')) {
      nextIconSlot.textContent = "Next";
    }
    this.nextButton.appendChild(nextIconSlot);
    this.nextButton.addEventListener("click", () => this.nextTrack());
    controlsContainer.appendChild(this.nextButton);
    if (this.playlistData.length > 1) {
      controlsContainer.appendChild(this.prevButton);
      controlsContainer.appendChild(this.nextButton);
    }
    this.playbackRateSelect = document.createElement("select");
    this.playbackRateSelect.setAttribute("aria-label", "Playback Speed");
    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    playbackRates.forEach((rate) => {
      var _a;
      const option = document.createElement("option");
      option.value = rate.toString();
      option.textContent = `${rate}x`;
      if (rate === 1) {
        option.selected = true;
      }
      (_a = this.playbackRateSelect) == null ? void 0 : _a.appendChild(option);
    });
    this.playbackRateSelect.addEventListener("change", () => this.adjustPlaybackRate());
    controlsContainer.appendChild(this.playbackRateSelect);
    this.shadow.appendChild(controlsContainer);
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
    if (!this.audio)
      return;
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
    if (!this.audio)
      return;
    if (this.audio.paused) {
      this.playAudio();
    } else {
      this.pauseAudio();
    }
  }
  /**
   * Plays the current audio track
   */
  playAudio() {
    if (!this.audio)
      return;
    this.audio.play();
  }
  /**
   * Pauses the current audio track
   */
  pauseAudio() {
    if (!this.audio)
      return;
    this.audio.pause();
  }
  /**
   * Updates the play/pause button based on playback state
   */
  updatePlayPauseButton() {
    if (!this.playPauseButton)
      return;
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
      if (this.currentTrackIndex < this.playlistData.length - 1) {
        this.currentTrackIndex++;
        this.loadCurrentTrack();
      } else if (this.isLoopEnabled) {
        this.currentTrackIndex = 0;
        this.loadCurrentTrack();
      }
    }
  }
  /**
   * Moves to the previous track in the playlist
   */
  prevTrack() {
    if (this.playlistData.length > 1) {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.loadCurrentTrack();
      } else if (this.isLoopEnabled) {
        this.currentTrackIndex = this.playlistData.length - 1;
        this.loadCurrentTrack();
      }
    }
  }
  /**
   * Adjusts the playback rate based on the select control
   */
  adjustPlaybackRate() {
    if (!this.audio || !this.playbackRateSelect)
      return;
    const rate = parseFloat(this.playbackRateSelect.value);
    this.audio.playbackRate = rate;
  }
  /**
   * Loads the current track based on currentTrackIndex
   */
  loadCurrentTrack() {
    if (!this.audio)
      return;
    if (this.playlistData.length > 0) {
      const currentTrack = this.playlistData[this.currentTrackIndex];
      this.audio.src = currentTrack.src;
      this.audio.load();
      const rate = parseFloat(this.playbackRateSelect ? this.playbackRateSelect.value : "1");
      this.audio.playbackRate = rate;
      if (this.progressBar) {
        this.progressBar.value = "0";
        this.updateProgressBar();
      }
      this.updatePlayPauseButton();
      this.updatePlaylistUI();
      this.updateTimeDisplay();
      this.dispatchEvent(new CustomEvent("trackChange", {
        detail: {
          currentTrackIndex: this.currentTrackIndex,
          track: currentTrack
        }
      }));
    } else {
      this.audio.removeAttribute("src");
      this.updateControlsState(false);
    }
  }
  /**
   * Handles media errors and provides fallback content
   */
  handleMediaError() {
    console.error("An error occurred while attempting to load the audio.");
    const errorContainer = document.createElement("div");
    errorContainer.textContent = "The audio cannot be played at this time.";
    this.shadow.appendChild(errorContainer);
    this.updateControlsState(false);
  }
  /**
   * Updates the progress bar as the audio plays
   */
  updateProgressBar() {
    if (!this.progressBar)
      return;
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
    if (!this.timeDisplay)
      return;
    this.timeDisplay.textContent = `${formattedCurrentTime}/${formattedDuration}`;
  }
  /**
   * Formats a time value in seconds to HH:MM:SS or MM:SS
   * @param time Time in seconds
   * @returns Formatted time string
   */
  formatTime(time) {
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
    if (!this.audio || !this.progressBar)
      return;
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
    if (!this.progressBar)
      return;
    const step = parseFloat(this.progressBar.step);
    let value = parseFloat(this.progressBar.value) - step;
    if (value < 0)
      value = 0;
    this.progressBar.value = value.toString();
    this.onSeek();
  }
  /**
   * Steps forward the progress bar by a small amount
   */
  stepForward() {
    if (!this.progressBar)
      return;
    const step = parseFloat(this.progressBar.step);
    let value = parseFloat(this.progressBar.value) + step;
    if (value > 100)
      value = 100;
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
    if (!this.playlistContainer)
      return;
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
          const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          iconSvg.setAttribute("width", "16");
          iconSvg.setAttribute("height", "16");
          iconSvg.setAttribute("aria-hidden", "true");
          const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
          useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "");
          iconSvg.appendChild(useElement);
          if (this.currentTrackIndex === actualIndex) {
            trackButton.classList.add("current-track");
            trackButton.setAttribute("aria-current", "true");
            if (this.audio && this.audio.paused) {
              useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#play-icon");
              trackButton.setAttribute("aria-pressed", "false");
            } else {
              useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#pause-icon");
              trackButton.setAttribute("aria-pressed", "true");
            }
          } else {
            useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#bullet-icon");
            trackButton.setAttribute("aria-pressed", "false");
          }
          trackButton.appendChild(iconSvg);
          const textNode = document.createTextNode(` ${trackTitle}`);
          trackButton.appendChild(textNode);
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
    if (!this.playlistContainer)
      return;
    if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
      this.playlistContainer.style.display = "block";
      this.updatePlaylistUI();
    } else {
      this.playlistContainer.style.display = "none";
    }
  }
  /**
   * Renders the component's HTML structure and styles
   */
  render() {
    const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgDefs.setAttribute("aria-hidden", "true");
    svgDefs.setAttribute("style", "display: none;");
    svgDefs.innerHTML = `
      <symbol id="play-icon" viewBox="0 0 16 16">
        <polygon points="3,2 13,8 3,14" fill="currentColor"/>
      </symbol>
      <symbol id="pause-icon" viewBox="0 0 16 16">
        <rect x="3" y="2" width="4" height="12" fill="currentColor"/>
        <rect x="9" y="2" width="4" height="12" fill="currentColor"/>
      </symbol>
      <symbol id="bullet-icon" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="4" fill="currentColor"/>
      </symbol>
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
      .playlist-container {
        margin-bottom: 10px;
      }
      .playlist-container ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .playlist-container button {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
      }
      .playlist-container ul {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .playlist-container ul li {
        background-color: #f9f9f9;
        border-radius: 3px;
        border: 1px solid #ddd;
        width: 100%;
      }
      .playlist-container button {
        display: block;
        padding: 10px;
        width: 100%;
        text-align: left;
      }
      .playlist-container button.current-track {
        font-weight: bold;
        text-decoration: none;
        cursor: default;
      }
      .playlist-container svg {
        width: 10px;
        height: 10px;
        top: 0.5px;
        position: relative;
      }

/* TODO: These styles need work */

   .playlist-container button.current-track.playing {
  /* Styles when the current track is playing */
  font-weight: bold;
}

.playlist-container button.current-track.paused {
  /* Styles when the current track is paused */
  // font-weight: normal;
}

/* Style for track buttons when pressed (playing) */
.playlist-container button.current-track.playing {
  background-color: rgba(51, 65, 85, 0.1);
}

/* Style for track buttons when not pressed (paused) */
.playlist-container button.current-track.paused {
  background-color: transparent;
}

// .playlist-container button.current-track.playing::before {
//   content: '⏸︎ '; /* Pause symbol */
// }

// .playlist-container button.current-track.paused::before {
//   content: '▶︎ '; /* Play symbol */
// }

// .playlist-container button:not(.current-track)::before {
//   content: '• '; /* Bullet point */
// }

/* end of TODO */

      .progress-time-container {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      .progress-container {
        flex-grow: 1;
        width: 100%;
      }
      .progress-container input[type="range"] {
        width: 100%;
      }
      .time-display {
        font-size: 0.8em;
        margin-left: 10px;
        flex-shrink: 0;
      }
      div[role="group"] {
        display: flex;
        gap: 5px;
        margin-top: 10px;
        align-items: center;
      }
      button {
        padding: 3px 5px;
        font-size: 0.8rem;
        background-color: var(--button-background, #fff);
        color: var(--button-color, var(--primary-color));
        border: 1px solid color-mix(in srgb, var(--primary-color) 70%, transparent 0%);
        border-radius: 2px;
        cursor: pointer;
      }
      select {
        padding: 5px;
        padding: 3px 5px;
        background-color: var(--button-background, #fff);
        color: var(--button-color, var(--primary-color));
        border: 1px solid color-mix(in srgb, var(--primary-color) 70%, transparent 0%);
        border-radius: 2px;
        font-size: 0.8rem;
      }
      @media (max-width: 600px) {
        .progress-time-container {
          flex-direction: column;
          align-items: center;
        }
        .time-display {
          margin-left: 0;
          margin-top: 5px;
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
export {
  BespokenAudioPlayer,
  initBespokenAudioPlayer
};

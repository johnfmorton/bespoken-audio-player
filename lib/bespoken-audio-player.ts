// Import jsmediatags
import jsmediatags from 'jsmediatags';

export class BespokenAudioPlayer extends HTMLElement {
  // Shadow DOM root
  private shadow: ShadowRoot;

  // Audio element
  private audio: HTMLAudioElement;

  // Playlist array
  private playlist: string[];

  // Current track index
  private currentTrackIndex: number;

  // Cache for track titles
  private trackTitleCache: Map<string, string>;

  // Controls
  private playPauseButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private prevButton: HTMLButtonElement;
  private playbackRateSelect: HTMLSelectElement;

  // Progress bar elements
  private progressContainer: HTMLElement;
  private progressBar: HTMLInputElement;

  // Playlist UI elements
  private playlistContainer: HTMLElement;

  // Attributes
  private isPlaylistVisible: boolean;
  private isLoopEnabled: boolean;

  // Keyboard shortcuts map
  private keyboardShortcuts: { [key: string]: () => void };

  constructor() {
    super();

    this.trackTitleCache = new Map<string, string>();

    // Attach a shadow DOM tree to this instance
    this.shadow = this.attachShadow({ mode: 'open' });

    // Initialize properties
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.keyboardShortcuts = {};
    this.isPlaylistVisible = false;
    this.isLoopEnabled = false;

    // Call initialization methods
    this.createAudioElement();
    this.createPlaylist(); // Create playlist UI
    this.createProgressBar(); // Create progress bar
    this.createControls();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Specifies the observed attributes so that
   * attributeChangedCallback will work
   */
  static get observedAttributes() {
    return ['audio-src', 'playlist-visible', 'loop'];
  }

  /**
   * Called when the component is added to the DOM
   */
  connectedCallback() {
    // Load the initial playlist from the attribute
    if (this.hasAttribute('audio-src')) {
      this.parseAudioSrcAttribute();
    }

    // Check if the playlist should be visible
    if (this.hasAttribute('playlist-visible')) {
      this.isPlaylistVisible = true;
    }

    // Check if looping is enabled
    if (this.hasAttribute('loop')) {
      this.isLoopEnabled = true;
    }

    this.render();
  }

  /**
   * Called when an observed attribute has been added, removed, updated, or replaced.
   * @param name The attribute's name.
   * @param oldValue The previous value.
   * @param newValue The new value.
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'audio-src' && oldValue !== newValue) {
      this.parseAudioSrcAttribute();
    } else if (name === 'playlist-visible') {
      this.isPlaylistVisible = this.hasAttribute('playlist-visible');
      this.updatePlaylistVisibility();
    } else if (name === 'loop') {
      this.isLoopEnabled = this.hasAttribute('loop');
    }
  }

  /**
   * Parses the 'audio-src' attribute and updates the playlist.
   */
  private parseAudioSrcAttribute() {
    const audioSrc = this.getAttribute('audio-src');
    if (audioSrc) {
      // Split the attribute value by commas and trim whitespace
      const sources = audioSrc
        .split(',')
        .map((src) => src.trim())
        .filter((src) => src.length > 0);
      this.src = sources.length === 1 ? sources[0] : sources;
    }
  }

  /**
   * Creates the audio element and appends it to the shadow DOM
   */
  private createAudioElement() {
    this.audio = document.createElement('audio');
    this.audio.setAttribute('aria-hidden', 'true'); // Hide from screen readers
    this.audio.preload = 'metadata'; // Ensure metadata is loaded but do not autoplay
    this.shadow.appendChild(this.audio);
  }

  /**
   * Creates the playlist UI and appends it to the shadow DOM
   */
  private createPlaylist() {
    this.playlistContainer = document.createElement('div');
    this.playlistContainer.setAttribute('class', 'playlist-container');
    this.shadow.appendChild(this.playlistContainer);
  }

  /**
   * Creates the progress bar and appends it to the shadow DOM
   */
  private createProgressBar() {
    // Create a container for styling purposes
    this.progressContainer = document.createElement('div');
    this.progressContainer.setAttribute('class', 'progress-container');

    // Create the progress bar (range input)
    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = '0';
    this.progressBar.max = '100';
    this.progressBar.value = '0';
    this.progressBar.step = '0.1'; // Small steps for smooth seeking

    // Accessibility attributes
    this.progressBar.setAttribute('role', 'slider');
    this.progressBar.setAttribute('aria-label', 'Seek Slider');
    this.progressBar.setAttribute('aria-valuemin', '0');
    this.progressBar.setAttribute('aria-valuemax', '100');
    this.progressBar.setAttribute('aria-valuenow', '0');
    this.progressBar.setAttribute('aria-valuetext', '0% played');

    // Event listeners for user interaction
    this.progressBar.addEventListener('input', () => this.onSeek());
    this.progressBar.addEventListener('change', () => this.onSeek());
    this.progressBar.addEventListener('keydown', (event) => this.onSeekKeyDown(event));

    // Append the progress bar to the container
    this.progressContainer.appendChild(this.progressBar);

    // Append the container to the shadow DOM
    this.shadow.appendChild(this.progressContainer);
  }

  /**
   * Creates control buttons and other UI elements
   */
  private createControls() {
    // Create container for controls
    const controlsContainer = document.createElement('div');
    controlsContainer.setAttribute('role', 'group');
    controlsContainer.setAttribute('aria-label', 'Audio Player Controls');

    // Play/Pause toggle button
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.textContent = 'Play';
    this.playPauseButton.setAttribute('aria-label', 'Play');
    this.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    controlsContainer.appendChild(this.playPauseButton);

    // Previous track button
    this.prevButton = document.createElement('button');
    this.prevButton.textContent = 'Previous';
    this.prevButton.setAttribute('aria-label', 'Previous Track');
    this.prevButton.addEventListener('click', () => this.prevTrack());
    controlsContainer.appendChild(this.prevButton);

    // Next track button
    this.nextButton = document.createElement('button');
    this.nextButton.textContent = 'Next';
    this.nextButton.setAttribute('aria-label', 'Next Track');
    this.nextButton.addEventListener('click', () => this.nextTrack());
    controlsContainer.appendChild(this.nextButton);

    // Playback rate select dropdown
    this.playbackRateSelect = document.createElement('select');
    this.playbackRateSelect.setAttribute('aria-label', 'Playback Speed');
    // Define available playback rates
    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2.0];
    playbackRates.forEach((rate) => {
      const option = document.createElement('option');
      option.value = rate.toString();
      option.textContent = `${rate}x`;
      if (rate === 1) {
        option.selected = true;
      }
      this.playbackRateSelect.appendChild(option);
    });
    this.playbackRateSelect.addEventListener('change', () => this.adjustPlaybackRate());
    controlsContainer.appendChild(this.playbackRateSelect);

    // Append controls to shadow DOM
    this.shadow.appendChild(controlsContainer);
  }

  /**
   * Attaches event listeners for media events
   */
  private attachEventListeners() {
    // Handle media errors
    this.audio.addEventListener('error', () => this.handleMediaError());

    // Update progress bar as audio plays
    this.audio.addEventListener('timeupdate', () => this.updateProgressBar());

    // Update duration when metadata is loaded
    this.audio.addEventListener('loadedmetadata', () => this.updateProgressBar());

    // Update play/pause button when playback state changes
    this.audio.addEventListener('play', () => this.updatePlayPauseButton());
    this.audio.addEventListener('pause', () => this.updatePlayPauseButton());

    // Handle track end to move to the next track
    this.audio.addEventListener('ended', () => this.onTrackEnded());
  }

  /**
   * Sets up keyboard shortcuts for controlling the audio player
   */
  private setupKeyboardShortcuts() {
    // Define keyboard shortcuts
    this.keyboardShortcuts = {
      ' ': () => this.togglePlayPause(), // Spacebar
      ArrowRight: () => this.nextTrack(),
      ArrowLeft: () => this.prevTrack(),
      // Additional shortcuts can be added here
    };

    // Add event listener for keydown events
    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  /**
   * Handles keydown events for keyboard shortcuts
   * @param event KeyboardEvent
   */
  private handleKeydown(event: KeyboardEvent) {
    const action = this.keyboardShortcuts[event.key];
    if (action) {
      // If multiple players exist, only respond when focused
      if (document.activeElement === this || !this.multiplePlayersExist()) {
        event.preventDefault();
        action();
      }
    }
  }

  /**
   * Checks if multiple instances of the player exist on the page
   */
  private multiplePlayersExist(): boolean {
    return document.querySelectorAll('bespoken-audio-player').length > 1;
  }

  /**
   * Toggles between play and pause states
   */
  private togglePlayPause() {
    if (this.audio.paused) {
      this.playAudio();
    } else {
      this.pauseAudio();
    }
  }

  /**
   * Plays the current audio track
   */
  private playAudio() {
    this.audio.play();
  }

  /**
   * Pauses the current audio track
   */
  private pauseAudio() {
    this.audio.pause();
  }

  /**
   * Updates the play/pause button text and aria-label based on playback state
   */
  private updatePlayPauseButton() {
    if (this.audio.paused) {
      this.playPauseButton.textContent = 'Play';
      this.playPauseButton.setAttribute('aria-label', 'Play');
    } else {
      this.playPauseButton.textContent = 'Pause';
      this.playPauseButton.setAttribute('aria-label', 'Pause');
    }
  }

  /**
   * Moves to the next track in the playlist
   */
  private nextTrack() {
    if (this.playlist.length > 1) {
      if (this.currentTrackIndex < this.playlist.length - 1) {
        this.currentTrackIndex++;
        this.loadCurrentTrack();
      } else if (this.isLoopEnabled) {
        this.currentTrackIndex = 0;
        this.loadCurrentTrack();
      }
      // Do not autoplay; wait for user to initiate playback
    }
  }

  /**
   * Moves to the previous track in the playlist
   */
  private prevTrack() {
    if (this.playlist.length > 1) {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.loadCurrentTrack();
      } else if (this.isLoopEnabled) {
        this.currentTrackIndex = this.playlist.length - 1;
        this.loadCurrentTrack();
      }
      // Do not autoplay; wait for user to initiate playback
    }
  }

  /**
   * Adjusts the playback rate based on the select control
   */
  private adjustPlaybackRate() {
    const rate = parseFloat(this.playbackRateSelect.value);
    this.audio.playbackRate = rate;
  }

  /**
   * Loads the current track based on currentTrackIndex
   */
  private loadCurrentTrack() {
    if (this.playlist.length > 0) {
      this.audio.src = this.playlist[this.currentTrackIndex];
      this.audio.load();
      // Reset progress bar
      this.progressBar.value = '0';
      this.updateProgressBar();
      // Update play/pause button to reflect paused state
      this.updatePlayPauseButton();
      // Update playlist UI to indicate the current track
      this.updatePlaylistUI();
    } else {
      this.audio.removeAttribute('src');
    }
  }

  /**
   * Handles media errors and provides fallback content
   */
  private handleMediaError() {
    const errorContainer = document.createElement('div');
    errorContainer.textContent = 'The audio cannot be played at this time.';
    this.shadow.appendChild(errorContainer);
  }

  /**
   * Updates the progress bar as the audio plays
   */
  private updateProgressBar() {
    if (this.audio.duration > 0) {
      const value = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressBar.value = value.toString();
      this.progressBar.setAttribute('aria-valuenow', value.toFixed(2));
      const percentPlayed = value.toFixed(1) + '% played';
      this.progressBar.setAttribute('aria-valuetext', percentPlayed);
    } else {
      // Audio duration is not available yet
      this.progressBar.value = '0';
      this.progressBar.setAttribute('aria-valuenow', '0');
      this.progressBar.setAttribute('aria-valuetext', '0% played');
    }
  }

  /**
   * Handles user seeking via the progress bar
   */
  private onSeek() {
    if (this.audio.duration > 0) {
      const seekTime = (parseFloat(this.progressBar.value) / 100) * this.audio.duration;
      this.audio.currentTime = seekTime;
    }
  }

  /**
   * Handles keyboard events on the progress bar for accessibility
   * @param event KeyboardEvent
   */
  private onSeekKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBack();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepForward();
    }
  }

  /**
   * Steps back the progress bar by a small amount
   */
  private stepBack() {
    const step = parseFloat(this.progressBar.step);
    let value = parseFloat(this.progressBar.value) - step;
    if (value < 0) value = 0;
    this.progressBar.value = value.toString();
    this.onSeek();
  }

  /**
   * Steps forward the progress bar by a small amount
   */
  private stepForward() {
    const step = parseFloat(this.progressBar.step);
    let value = parseFloat(this.progressBar.value) + step;
    if (value > 100) value = 100;
    this.progressBar.value = value.toString();
    this.onSeek();
  }

  /**
   * Handles the end of a track
   */
  private onTrackEnded() {
    if (this.playlist.length > 1) {
      if (this.currentTrackIndex < this.playlist.length - 1) {
        // Move to the next track
        this.currentTrackIndex++;
        this.loadCurrentTrack();
        this.playAudio(); // Automatically play the next track
      } else if (this.isLoopEnabled) {
        // Loop back to the first track
        this.currentTrackIndex = 0;
        this.loadCurrentTrack();
        this.playAudio(); // Automatically play the first track
      } else {
        // Do not loop; stop playback
        this.updatePlayPauseButton();
      }
    } else {
      // Single track; stop playback
      this.updatePlayPauseButton();
    }
  }

  /**
   * Creates or updates the playlist UI
   */
  private updatePlaylistUI() {
    // Clear existing playlist items
    while (this.playlistContainer.firstChild) {
      this.playlistContainer.removeChild(this.playlistContainer.firstChild);
    }

    if (this.isPlaylistVisible && this.playlist.length > 0) {
      // Create a list element
      const list = document.createElement('ul');
      list.setAttribute('role', 'list');

      this.playlist.forEach((trackSrc, index) => {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'listitem');

        // Extract the track name from the source URL
        const trackName = this.extractTrackName(trackSrc);

        // Create a button to represent the track
        const trackButton = document.createElement('button');
        trackButton.textContent = trackName;
        trackButton.setAttribute('aria-label', `Play ${trackName}`);
        trackButton.addEventListener('click', () => {
          this.currentTrackIndex = index;
          this.loadCurrentTrack();
          this.playAudio();
        });

        // Indicate the currently playing track
        if (index === this.currentTrackIndex) {
          trackButton.classList.add('current-track');
          trackButton.setAttribute('aria-current', 'true');
        }

        listItem.appendChild(trackButton);
        list.appendChild(listItem);
      });

      this.playlistContainer.appendChild(list);
    }
  }

  /**
   * Updates the visibility of the playlist UI
   */
  private updatePlaylistVisibility() {
    if (this.isPlaylistVisible) {
      this.playlistContainer.style.display = 'block';
      this.updatePlaylistUI();
    } else {
      this.playlistContainer.style.display = 'none';
    }
  }

  /**
   * Extracts a track name from the source URL
   * @param src The source URL of the track
   * @returns The extracted track name
   */
  private extractTrackName(src: string): string {
    // Simple extraction of the filename from the URL
    const parts = src.split('/');
    const filename = parts[parts.length - 1];
    // Remove any query parameters
    return filename.split('?')[0];
  }

  /**
   * Renders the component's HTML structure and styles
   */
  private render() {
    // Optionally, you can add styles here or link to an external stylesheet
    const style = document.createElement('style');
    style.textContent = `
      /* Styles for the audio player */
      .playlist-container {
        margin-bottom: 10px;
      }
      .playlist-container ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .playlist-container li {
        margin-bottom: 5px;
      }
      .playlist-container button {
        background: none;
        border: none;
        color: blue;
        text-decoration: underline;
        cursor: pointer;
      }
      .playlist-container button.current-track {
        font-weight: bold;
        text-decoration: none;
        cursor: default;
      }
      .progress-container {
        width: 100%;
      }
      div[role="group"] {
        display: flex;
        gap: 5px;
        margin-top: 10px;
        align-items: center;
      }
      button {
        padding: 5px 10px;
      }
      select {
        padding: 5px;
      }
      input[type="range"] {
        width: 100%;
      }
    `;
    this.shadow.appendChild(style);

    // Load the current track
    this.loadCurrentTrack();

    // Update playlist visibility
    this.updatePlaylistVisibility();
  }

  /**
   * Allows setting the playlist via an attribute or property
   */
  set src(value: string | string[]) {
    if (Array.isArray(value)) {
      this.playlist = value;
    } else {
      this.playlist = [value];
    }
    this.currentTrackIndex = 0;
    this.loadCurrentTrack();
    this.updatePlaylistUI();
  }

  /**
   * Gets the current playlist
   */
  get src(): string[] {
    return this.playlist;
  }
}

// Automatically define the custom element upon import if not already defined
if (!customElements.get('bespoken-audio-player')) {
  customElements.define('bespoken-audio-player', BespokenAudioPlayer);
}

export function initBespokenAudioPlayer() {
  if (!customElements.get('bespoken-audio-player')) {
    customElements.define('bespoken-audio-player', BespokenAudioPlayer);
  }
}

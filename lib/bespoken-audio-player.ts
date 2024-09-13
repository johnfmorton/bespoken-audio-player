export class BespokenAudioPlayer extends HTMLElement {
  // Shadow DOM root
  private shadow: ShadowRoot;

  // Audio element
  private audio: HTMLAudioElement;

  // Playlist data including titles
  private playlistData: { src: string; title?: string }[];

  // Current track index
  private currentTrackIndex: number;

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
  private isOnlyCurrentTrackVisible: boolean;

  // Keyboard shortcuts map
  private keyboardShortcuts: { [key: string]: () => void };

  constructor() {
    super();
    // Attach a shadow DOM tree to this instance
    this.shadow = this.attachShadow({ mode: 'open' });

    // Initialize properties
    this.playlistData = [];
    this.currentTrackIndex = 0;
    this.keyboardShortcuts = {};
    this.isPlaylistVisible = false;
    this.isLoopEnabled = false;
    this.isOnlyCurrentTrackVisible = false;

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
    return ['tracks', 'playlist-visible', 'loop', 'only-current-track-visible'];
  }

  /**
   * Called when the component is added to the DOM
   */
  connectedCallback() {
    // Load the initial playlist from the 'tracks' attribute
    if (this.hasAttribute('tracks')) {
      this.parseTracksAttribute();
    } else {
      // No tracks attribute provided
      console.error('The "tracks" attribute is required and must be a valid JSON array.');
      this.updateControlsState(false);
    }

    // Check if the only-current-track-visible attribute is present
    this.isOnlyCurrentTrackVisible = this.hasAttribute('only-current-track-visible');

    // Check if the playlist should be visible
    this.isPlaylistVisible = this.hasAttribute('playlist-visible');

    // Check if looping is enabled
    this.isLoopEnabled = this.hasAttribute('loop');

    this.render();
  }

  /**
   * Called when an observed attribute has been added, removed, updated, or replaced.
   * @param name The attribute's name.
   * @param oldValue The previous value.
   * @param newValue The new value.
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'tracks' && oldValue !== newValue) {
      this.parseTracksAttribute();
    } else if (name === 'playlist-visible') {
      this.isPlaylistVisible = this.hasAttribute('playlist-visible');
      this.updatePlaylistVisibility();
    } else if (name === 'loop') {
      this.isLoopEnabled = this.hasAttribute('loop');
    } else if (name === 'only-current-track-visible') {
      this.isOnlyCurrentTrackVisible = this.hasAttribute('only-current-track-visible');
      this.updatePlaylistVisibility();
    }
  }

  /**
   * Parses the 'tracks' attribute and updates the playlist data.
   */
  private parseTracksAttribute() {
    const tracksAttr = this.getAttribute('tracks');
    if (tracksAttr) {
      try {
        // Parse the JSON string
        const tracks = JSON.parse(tracksAttr);
        if (Array.isArray(tracks)) {
          // Validate and set the playlist data
          this.playlistData = tracks.filter((track) => typeof track.src === 'string');

          if (this.playlistData.length === 0) {
            console.error('The "tracks" attribute must contain at least one valid track with a "src" property.');
            this.updateControlsState(false);
          } else {
            this.currentTrackIndex = 0;
            this.loadCurrentTrack();
            this.updatePlaylistUI();
            this.updateControlsState(true);
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
   * Updates the enabled/disabled state of controls based on the availability of tracks
   * @param isEnabled Whether the controls should be enabled
   */
  private updateControlsState(isEnabled: boolean) {
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
    if (this.playlistData.length > 1) {
      if (this.currentTrackIndex < this.playlistData.length - 1) {
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
    if (this.playlistData.length > 1) {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.loadCurrentTrack();
      } else if (this.isLoopEnabled) {
        this.currentTrackIndex = this.playlistData.length - 1;
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
    if (this.playlistData.length > 0) {
      const currentTrack = this.playlistData[this.currentTrackIndex];
      this.audio.src = currentTrack.src;
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
      this.updateControlsState(false);
    }
  }

  /**
   * Handles media errors and provides fallback content
   */
  private handleMediaError() {
    console.error('An error occurred while attempting to load the audio.');
    const errorContainer = document.createElement('div');
    errorContainer.textContent = 'The audio cannot be played at this time.';
    this.shadow.appendChild(errorContainer);
    this.updateControlsState(false);
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
    if (this.playlistData.length > 1) {
      if (this.currentTrackIndex < this.playlistData.length - 1) {
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

    if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
      if (this.playlistData.length > 0) {
        // Create a list element
        const list = document.createElement('ul');
        list.setAttribute('role', 'list');

        // Determine which tracks to display
        let tracksToDisplay: { src: string; title?: string }[] = [];

        if (this.isOnlyCurrentTrackVisible) {
          // Display only the current track
          tracksToDisplay = [this.playlistData[this.currentTrackIndex]];
        } else {
          // Display the full playlist
          tracksToDisplay = this.playlistData;
        }

        tracksToDisplay.forEach((track, index) => {
          const listItem = document.createElement('li');
          listItem.setAttribute('role', 'listitem');

          // Create a button to represent the track
          const trackButton = document.createElement('button');
          const trackTitle = track.title || this.extractFileName(track.src);
          trackButton.textContent = trackTitle;
          trackButton.setAttribute('aria-label', `Play ${trackTitle}`);

          // Only add click listener if not only-current-track-visible
          if (!this.isOnlyCurrentTrackVisible) {
            trackButton.addEventListener('click', () => {
              this.currentTrackIndex = index;
              this.loadCurrentTrack();
              this.playAudio();
            });
          }

          // Indicate the currently playing track
          if (this.playlistData.indexOf(track) === this.currentTrackIndex) {
            trackButton.classList.add('current-track');
            trackButton.setAttribute('aria-current', 'true');
          }

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
  private extractFileName(src: string): string {
    const parts = src.split('/');
    let filename = parts[parts.length - 1];
    // Remove query parameters
    filename = filename.split('?')[0];
    // Remove file extension
    filename = filename.replace(/\.[^/.]+$/, '');
    return filename;
  }

  /**
   * Updates the visibility of the playlist UI
   */
  private updatePlaylistVisibility() {
    if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
      this.playlistContainer.style.display = 'block';
      this.updatePlaylistUI();
    } else {
      this.playlistContainer.style.display = 'none';
    }
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
    if (this.playlistData.length > 0) {
      this.loadCurrentTrack();
    } else {
      this.updateControlsState(false);
    }

    // Update playlist visibility
    this.updatePlaylistVisibility();
  }

  /**
   * Allows setting the playlist via the 'tracks' attribute or property
   */
  set tracks(value: { src: string; title?: string }[]) {
    if (Array.isArray(value)) {
      this.playlistData = value.filter((track) => typeof track.src === 'string');

      if (this.playlistData.length === 0) {
        console.error('The "tracks" property must contain at least one valid track with a "src" property.');
        this.updateControlsState(false);
      } else {
        this.currentTrackIndex = 0;
        this.loadCurrentTrack();
        this.updatePlaylistUI();
        this.updateControlsState(true);
      }
    } else {
      console.error('The "tracks" property must be an array of track objects.');
      this.updateControlsState(false);
    }
  }

  /**
   * Gets the current playlist data
   */
  get tracks(): { src: string; title?: string }[] {
    return this.playlistData;
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

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
  private playPauseButton: HTMLButtonElement | null;
  private nextButton?: HTMLButtonElement | null;
  private prevButton?: HTMLButtonElement | null;
  private playbackRateSelect: HTMLSelectElement | null;

  // Progress bar elements
  private progressTimeContainer: HTMLElement; // Container for progress bar and time display
  private progressBar: HTMLInputElement;

  // Time display element
  private timeDisplay: HTMLElement;

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
    this.createProgressAndTimeContainer(); // Create container for progress bar and time display
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
   * Creates the container for progress bar and time display
   */
  private createProgressAndTimeContainer() {
    // Create a container for progress bar and time display
    this.progressTimeContainer = document.createElement('div');
    this.progressTimeContainer.setAttribute('class', 'progress-time-container');

    // Create the progress bar
    this.createProgressBar();

    // Create the time display
    this.createTimeDisplay();

    // Append the container to the shadow DOM
    this.shadow.appendChild(this.progressTimeContainer);
  }

  /**
   * Creates the progress bar and appends it to the progress-time container
   */
  private createProgressBar() {
    // Create the progress bar (range input)
    this.progressBar = document.createElement('input');
    this.progressBar.type = 'range';
    this.progressBar.min = '0';
    this.progressBar.max = '100';
    this.progressBar.value = '0';
    this.progressBar.step = '0.1'; // Small steps for smooth seeking

    // Accessibility attributes
    // Add part attribute to the progress bar
    this.progressBar.setAttribute('part', 'progress-bar');
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

    // Create a container for the progress bar to apply styles
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', 'progress-container');

    // Append the progress bar to its container
    progressContainer.appendChild(this.progressBar);

    // Append the progress container to the progress-time container
    this.progressTimeContainer.appendChild(progressContainer);
  }

  /**
   * Creates the time display element and appends it to the progress-time container
   */
  private createTimeDisplay() {
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.setAttribute('class', 'time-display');
    this.timeDisplay.setAttribute('part', 'time-display');
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.setAttribute('class', 'time-display');
    this.timeDisplay.setAttribute('aria-live', 'off');
    this.timeDisplay.textContent = '0:00/0:00';

    // Append the time display to the progress-time container
    this.progressTimeContainer.appendChild(this.timeDisplay);
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
    this.playPauseButton.setAttribute('part', 'play-button');
    this.playPauseButton.setAttribute('id', 'playPauseButton');

    // Use slots for play and pause icons
    const playIconSlot = document.createElement('slot');
    playIconSlot.name = 'play-icon';

    const pauseIconSlot = document.createElement('slot');
    pauseIconSlot.name = 'pause-icon';
    pauseIconSlot.style.display = 'none'; // Initially hidden

    // Default content for play and pause icons
    if (!this.querySelector('[slot="play-icon"]')) {
      playIconSlot.textContent = 'Play';
    }
    if (!this.querySelector('[slot="pause-icon"]')) {
      pauseIconSlot.textContent = 'Pause';
    }

    this.playPauseButton.appendChild(playIconSlot);
    this.playPauseButton.appendChild(pauseIconSlot);

    this.playPauseButton.setAttribute('aria-label', 'Play');
    this.playPauseButton.addEventListener('click', () => this.togglePlayPause());
    controlsContainer.appendChild(this.playPauseButton);

    // Previous track button
    this.prevButton = document.createElement('button');
    this.prevButton.setAttribute('part', 'prev-button');
    this.prevButton.setAttribute('aria-label', 'Previous Track');

    // Use slot for previous icon
    const prevIconSlot = document.createElement('slot');
    prevIconSlot.name = 'prev-icon';

    // Default content if no custom icon is provided
    if (!this.querySelector('[slot="prev-icon"]')) {
      prevIconSlot.textContent = 'Previous';
    }

    this.prevButton.appendChild(prevIconSlot);
    this.prevButton.addEventListener('click', () => this.prevTrack());
    controlsContainer.appendChild(this.prevButton);

    // Next track button
    this.nextButton = document.createElement('button');
    this.nextButton.setAttribute('part', 'next-button');
    this.nextButton.setAttribute('aria-label', 'Next Track');

    // Use slot for next icon
    const nextIconSlot = document.createElement('slot');
    nextIconSlot.name = 'next-icon';

    // Default content if no custom icon is provided
    if (!this.querySelector('[slot="next-icon"]')) {
      nextIconSlot.textContent = 'Next';
    }

    this.nextButton.appendChild(nextIconSlot);
    this.nextButton.addEventListener('click', () => this.nextTrack());
    controlsContainer.appendChild(this.nextButton);



    // Previous and Next buttons are only created if there is more than one track
    if (this.playlistData.length > 1) {
      // Previous track button
      this.prevButton = document.createElement('button');
      this.prevButton.setAttribute('part', 'prev-button');
      this.prevButton.textContent = 'Previous';
      this.prevButton.setAttribute('aria-label', 'Previous Track');
      this.prevButton.addEventListener('click', () => this.prevTrack());
      controlsContainer.appendChild(this.prevButton);

      // Next track button
      this.nextButton = document.createElement('button');
      this.nextButton.setAttribute('part', 'next-button');
      this.nextButton.textContent = 'Next';
      this.nextButton.setAttribute('aria-label', 'Next Track');
      this.nextButton.addEventListener('click', () => this.nextTrack());
      controlsContainer.appendChild(this.nextButton);
    }

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
   * Updates the visibility of the Prev and Next buttons based on the number of tracks
   */
  private updateControlsVisibility() {
    if (this.playlistData.length > 1) {
      // Ensure Prev and Next buttons exist
      if (!this.prevButton && !this.nextButton) {
        // Re-create controls to include Prev and Next buttons
        this.removeControls();
        this.createControls();
        this.updateControlsState(true);
      } else {
        // Make sure the buttons are visible
        if (this.prevButton) {
          this.prevButton.style.display = '';
        }
        if (this.nextButton) {
          this.nextButton.style.display = '';
        }
      }
    } else {
      // Hide Prev and Next buttons if they exist
      if (this.prevButton) {
        this.prevButton.style.display = 'none';
      }
      if (this.nextButton) {
        this.nextButton.style.display = 'none';
      }
    }
  }

  /**
   * Removes the existing controls from the DOM
   */
  private removeControls() {
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
    if (this.timeDisplay) {
      this.timeDisplay.textContent = isEnabled ? '0:00/0:00' : '';
    }
  }

  /**
   * Attaches event listeners for media events
   */
  private attachEventListeners() {
    // Handle media errors
    this.audio.addEventListener('error', () => this.handleMediaError());

    // Update progress bar as audio plays
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgressBar();
      this.updateTimeDisplay();
    });

    // Update duration when metadata is loaded
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateProgressBar();
      this.updateTimeDisplay();
    });

    this.audio.addEventListener('durationchange', () => {
      this.updateTimeDisplay();
    });

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
   * Updates the play/pause button based on playback state
   */
  private updatePlayPauseButton() {
    const playIconSlot = this.playPauseButton.querySelector('slot[name="play-icon"]') as HTMLSlotElement;
    const pauseIconSlot = this.playPauseButton.querySelector('slot[name="pause-icon"]') as HTMLSlotElement;

    if (this.audio.paused) {
      this.playPauseButton.setAttribute('aria-label', 'Play');
      playIconSlot.style.display = '';
      pauseIconSlot.style.display = 'none';
    } else {
      this.playPauseButton.setAttribute('aria-label', 'Pause');
      playIconSlot.style.display = 'none';
      pauseIconSlot.style.display = '';
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

    // Apply the user's selected playback rate
    const rate = parseFloat(this.playbackRateSelect.value);
    this.audio.playbackRate = rate;

    // Reset progress bar
    this.progressBar.value = '0';
    this.updateProgressBar();
    // Update play/pause button to reflect paused state
    this.updatePlayPauseButton();
    // Update playlist UI to indicate the current track
    this.updatePlaylistUI();
    // Reset time display
    this.updateTimeDisplay();
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

    // Set CSS variable for progress
    this.progressBar.style.setProperty('--progress', `${value}%`);
  } else {
    // Audio duration is not available yet
    this.progressBar.value = '0';
    this.progressBar.setAttribute('aria-valuenow', '0');
    this.progressBar.setAttribute('aria-valuetext', '0% played');

    // Set CSS variable for progress
    this.progressBar.style.setProperty('--progress', '0%');
  }
  }

  /**
   * Updates the time display
   */
  private updateTimeDisplay() {
    const currentTime = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    const formattedCurrentTime = this.formatTime(currentTime);
    const formattedDuration = this.formatTime(duration);
    this.timeDisplay.textContent = `${formattedCurrentTime}/${formattedDuration}`;
  }

  /**
   * Formats a time value in seconds to HH:MM:SS or MM:SS
   * @param time Time in seconds
   * @returns Formatted time string
   */
  private formatTime(time: number): string {
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
      .playlist-container button::before {
        content: '◦';
        margin-right: 5px;
      }
      .playlist-container button.current-track::before {
        content: '•';
        margin-right: 5px;
      }
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
        padding: 6px 10px;
        background-color: var(--button-background, #fff);
        color: var(--button-color, var(--primary-color));
        border: 1px solid color-mix(in srgb, var(--primary-color) 70%, transparent 0%);
        border-radius: 2px;
        cursor: pointer;
      }
      select {
        padding: 5px;
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
      input[type="range"]:hover::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--progress-bar-fill-hover) 0%,
          var(--progress-bar-fill-hover) var(--progress),
          var(--progress-bar-background) var(--progress),
          var(--progress-bar-background) 100%
        );
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

      /* Using CSS color function (requires browser support) */
      input[type="range"]::-webkit-slider-runnable-track {
        /* Normal State */
        background: linear-gradient(
          to right,
          color-mix(in srgb, var(--progress-bar-fill) 100%, transparent 0%) 0%,
          color-mix(in srgb, var(--progress-bar-fill) 100%, transparent 0%) var(--progress),
          var(--progress-bar-background) var(--progress),
          var(--progress-bar-background) 100%
        );
      }

      input[type="range"]:hover::-webkit-slider-runnable-track {
        /* Hover State */
        background: linear-gradient(
          to right,
          color-mix(in srgb, var(--progress-bar-fill) 65%, transparent 0%) 0%,
          color-mix(in srgb, var(--progress-bar-fill) 65%, transparent 0%) var(--progress),
          var(--progress-bar-background) var(--progress),
          var(--progress-bar-background) 100%
        );
      }
    `;
    this.shadow.appendChild(style);

    // Load the current track
    if (this.playlistData.length > 0) {
      this.loadCurrentTrack();
    } else {
      this.updateControlsState(false);
    }

    // Update controls visibility
    this.updateControlsVisibility();

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

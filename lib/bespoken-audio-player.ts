// do not combile a default export AND named exports in the same file
// because consumers of your bundle will have to use `my-bundle.default`
// to access the default export, which may not be what you want.
// Use `output.exports: "named"` to disable this warning.

// Export the class so it can be imported in other modules
export class BespokenAudioPlayer extends HTMLElement {
  // Shadow DOM root
  private shadow: ShadowRoot;

  // Audio element
  private audio: HTMLAudioElement;

  // Playlist array
  private playlist: string[];

  // Current track index
  private currentTrackIndex: number;

  // Controls
  private playButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private prevButton: HTMLButtonElement;
  private playbackRateControl: HTMLInputElement;

  // Keyboard shortcuts map
  private keyboardShortcuts: { [key: string]: () => void };

  constructor() {
    super();
    // Attach a shadow DOM tree to this instance
    this.shadow = this.attachShadow({ mode: 'open' });

    // Initialize properties
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.keyboardShortcuts = {};

    // Call initialization methods
    this.createAudioElement();
    this.createControls();
    this.attachEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * Specifies the observed attributes so that
   * attributeChangedCallback will work
   */
  static get observedAttributes() {
    return ['audio-src'];
  }

  /**
   * Called when the component is added to the DOM
   */
  connectedCallback() {
    // Load the initial playlist from the attribute
    if (this.hasAttribute('audio-src')) {
      this.parseAudioSrcAttribute();
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
    this.shadow.appendChild(this.audio);
  }

  /**
   * Creates control buttons and other UI elements
   */
  private createControls() {
    // Create container for controls
    const controlsContainer = document.createElement('div');
    controlsContainer.setAttribute('role', 'group');
    controlsContainer.setAttribute('aria-label', 'Audio Player Controls');

    // Play button
    this.playButton = document.createElement('button');
    this.playButton.textContent = 'Play';
    this.playButton.setAttribute('aria-label', 'Play');
    this.playButton.addEventListener('click', () => this.playAudio());
    controlsContainer.appendChild(this.playButton);

    // Pause button
    this.pauseButton = document.createElement('button');
    this.pauseButton.textContent = 'Pause';
    this.pauseButton.setAttribute('aria-label', 'Pause');
    this.pauseButton.addEventListener('click', () => this.pauseAudio());
    controlsContainer.appendChild(this.pauseButton);

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

    // Playback rate control
    this.playbackRateControl = document.createElement('input');
    this.playbackRateControl.type = 'range';
    this.playbackRateControl.min = '0.5';
    this.playbackRateControl.max = '2';
    this.playbackRateControl.step = '0.1';
    this.playbackRateControl.value = '1';
    this.playbackRateControl.setAttribute('aria-label', 'Playback Speed');
    this.playbackRateControl.addEventListener('input', () => this.adjustPlaybackRate());
    controlsContainer.appendChild(this.playbackRateControl);

    // Append controls to shadow DOM
    this.shadow.appendChild(controlsContainer);
  }

  /**
   * Attaches event listeners for media events
   */
  private attachEventListeners() {
    // Handle media errors
    this.audio.addEventListener('error', () => this.handleMediaError());
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
      ArrowUp: () => this.increasePlaybackRate(),
      ArrowDown: () => this.decreasePlaybackRate(),
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
   * Moves to the next track in the playlist
   */
  private nextTrack() {
    if (this.playlist.length > 1) {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
      this.loadCurrentTrack();
      this.playAudio();
    }
  }

  /**
   * Moves to the previous track in the playlist
   */
  private prevTrack() {
    if (this.playlist.length > 1) {
      this.currentTrackIndex =
        (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadCurrentTrack();
      this.playAudio();
    }
  }

  /**
   * Adjusts the playback rate based on the input control
   */
  private adjustPlaybackRate() {
    const rate = parseFloat(this.playbackRateControl.value);
    this.audio.playbackRate = rate;
  }

  /**
   * Increases playback rate by 0.1
   */
  private increasePlaybackRate() {
    let rate = this.audio.playbackRate + 0.1;
    if (rate > 2) rate = 2;
    this.audio.playbackRate = rate;
    this.playbackRateControl.value = rate.toString();
  }

  /**
   * Decreases playback rate by 0.1
   */
  private decreasePlaybackRate() {
    let rate = this.audio.playbackRate - 0.1;
    if (rate < 0.5) rate = 0.5;
    this.audio.playbackRate = rate;
    this.playbackRateControl.value = rate.toString();
  }

  /**
   * Loads the current track based on currentTrackIndex
   */
  private loadCurrentTrack() {
    if (this.playlist.length > 0) {
      this.audio.src = this.playlist[this.currentTrackIndex];
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
   * Renders the component's HTML structure and styles
   */
  private render() {
    // Optionally, you can add styles here or link to an external stylesheet
    const style = document.createElement('style');
    style.textContent = `
      /* Styles for the audio player controls */
      div[role="group"] {
        display: flex;
        gap: 5px;
      }
      button {
        padding: 5px 10px;
      }
      input[type="range"] {
        width: 100px;
      }
    `;
    this.shadow.appendChild(style);

    // Load the current track
    this.loadCurrentTrack();
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

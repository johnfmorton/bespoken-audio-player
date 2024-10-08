// Extend the HTMLElementEventMap to include the custom event
declare global {
  interface HTMLElementEventMap {
    'play': TrackPlayEvent;
    'pause': TrackPauseEvent;
    'ended': TrackEndedEvent;
    'error': TrackErrorEvent;
    'trackChange': TrackChangeEvent;
  }
}

interface Track {
    src: string;
    title?: string;
}

// Define the event structure
export type TrackPlayEvent = CustomEvent<TrackPlayEventDetail>;
export type TrackPauseEvent = CustomEvent<TrackPauseEventDetail>;
export type TrackEndedEvent = CustomEvent<TrackEndedEventDetail>;
export type TrackErrorEvent = CustomEvent<TrackErrorEventDetail>;
export type TrackChangeEvent = CustomEvent<TrackChangeEventDetail>;

// Define the detail structure separately
interface TrackErrorEventDetail {
    code: number;
    message: string;
    mediaError: MediaError | null | undefined; // Allow undefined for non-media errors
    trackIndex: number;
    track: Track;
}

interface TrackPlayEventDetail {
    trackIndex: number;
    track: Track;
}

interface TrackEndedEventDetail {
    trackIndex: number;
    track: Track;
}

interface TrackPauseEventDetail {
    trackIndex: number;
    track: Track;
    currentTime: number;
    duration: number;
}

interface TrackChangeEventDetail {
    currentTrackIndex: number;
    prevTrackIndex: number;
}

export class BespokenAudioPlayer extends HTMLElement {
    // Shadow DOM root
    private shadow: ShadowRoot;

    // Container for all player elements
    private playerContainer: HTMLDivElement | undefined;

    // Audio element
    private audio: HTMLAudioElement | undefined;

    // Playlist data including titles
    private playlistData: { src: string; title: string }[];

    // Current track index
    private currentTrackIndex: number;

    // Controls
    private playPauseButton: HTMLButtonElement | null | undefined;
    private nextButton: HTMLButtonElement | null | undefined;
    private prevButton: HTMLButtonElement | null | undefined;
    private playbackRateSelect: HTMLSelectElement | null | undefined;

    // Progress bar elements
    private controlsProgressTimeContainer: HTMLElement | undefined; // Container for progress bar and time display
    private progressBar: HTMLInputElement | undefined;

    // Time display element
    private timeDisplay: HTMLElement | undefined;

    // Playlist UI elements
    private playlistContainer: HTMLElement | undefined;

    // Attributes
    private isPlaylistVisible: boolean;
    private isLoopEnabled: boolean;
    private isOnlyCurrentTrackVisible: boolean;

    // Container for the previous and next buttons
    private prevNextContainer: HTMLDivElement | undefined

    // Is the current track the last track in the playlist?
    // This is used when there is a playlist and the last track has an error
    // to prevent looping back to the first track
    private isLastTrack: boolean;

    // Keyboard shortcuts map
    private keyboardShortcuts: { [key: string]: () => void };

    // Add to your class properties
    private trackErrorStates: boolean[] = [];

    constructor() {
        super();
        // Attach a shadow DOM tree to this instance
        this.shadow = this.attachShadow({mode: 'open'});

        // Initialize properties
        this.playlistData = [];
        this.currentTrackIndex = 0;
        this.keyboardShortcuts = {};
        this.isPlaylistVisible = false;
        this.isLoopEnabled = false;
        this.isOnlyCurrentTrackVisible = false;
        this.isLastTrack = false;

        // Call initialization methods

        //
        this.createPlayerContainer(); // Create container for all player elements
        this.createAudioElement();
        this.createPlaylist(); // Create playlist UI
        this.createControlsProgressAndTimeContainer(); // Create container for progress bar and time display

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

        this.trackErrorStates = new Array(this.playlistData.length).fill(false);

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

    private hidePlayer(hide: boolean) {
        // TODO: Hide the player
        if (hide) {
            this.playerContainer?.classList.add('hidden');
        } else {
            this.playerContainer?.classList.remove('hidden');
        }
    }

    /**
     * Create a container for all the player elements
     */
    private createPlayerContainer() {
        this.playerContainer = document.createElement('div');
        this.playerContainer.setAttribute('class', 'player-container');
        this.shadow.appendChild(this.playerContainer);
    }

    /**
     * Creates the audio element and appends it to the shadow DOM
     */
    private createAudioElement() {
        this.audio = document.createElement('audio');
        this.audio.setAttribute('aria-hidden', 'true'); // Hide from screen readers
        this.audio.preload = 'metadata'; // Ensure metadata is loaded but do not autoplay
        this.playerContainer?.appendChild(this.audio);
    }

    /**
     * Creates the playlist UI and appends it to the shadow DOM
     */
    private createPlaylist() {
        this.playlistContainer = document.createElement('div');
        this.playlistContainer.setAttribute('class', 'playlist-container');
        this.playerContainer?.appendChild(this.playlistContainer);
    }

    /**
     * Creates the container for progress bar and time display
     */
    private createControlsProgressAndTimeContainer() {
        // Create a container for progress bar and time display
        this.controlsProgressTimeContainer = document.createElement('div');
        this.controlsProgressTimeContainer.setAttribute('class', 'controls-progress-time-container');

        // Create the controls
        this.createControls();

        // Create the progress bar
        this.createProgressBar();

        // Create the time display
        this.createTimeDisplay();

        // Append the container to the shadow DOM
        this.playerContainer?.appendChild(this.controlsProgressTimeContainer);
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
        this.controlsProgressTimeContainer?.appendChild(progressContainer);
    }

    /**
     * Creates the time display element and appends it to the progress-time container
     */
    private createTimeDisplay() {
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.setAttribute('class', 'time-display');
        this.timeDisplay.setAttribute('part', 'time-display');
        this.timeDisplay.setAttribute('aria-live', 'off');
        this.timeDisplay.textContent = '0:00/0:00';

        // Append the time display to the progress-time container
        this.controlsProgressTimeContainer?.appendChild(this.timeDisplay);
    }

    /**
     * Creates control buttons and other UI elements
     */
    private createControls() {
        // Create container for controls
        const controlsContainer = document.createElement('div');
        controlsContainer.setAttribute('role', 'group');
        controlsContainer.setAttribute('aria-label', 'Audio Player Controls');

        this.prevNextContainer = document.createElement('div');
        this.prevNextContainer.setAttribute('class', 'prev-next-container');

        // Helper function to create SVG icons with <use>
        const createIcon = (iconId: string): SVGSVGElement => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '14');
            svg.setAttribute('height', '14');
            svg.classList.add('default-icon');
            // set viewBox attribute to the same value as the icon's viewBox
            svg.setAttribute('viewBox', '0 0 24 24');

            const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', iconId);

            svg.appendChild(useElement);
            return svg;
        };

        const playIconSvg = createIcon('#play-icon');
        const pauseIconSvg = createIcon('#pause-icon');
        const prevIconSvg = createIcon('#previous-icon');
        const nextIconSvg = createIcon('#next-icon');

        // Play/Pause toggle button
        this.playPauseButton = document.createElement('button');
        this.playPauseButton.setAttribute('part', 'play-pause-toggle-button');
        this.playPauseButton.setAttribute('id', 'playPauseButton');

        // Use slots for play and pause icons
        const playIconSlot = document.createElement('slot');
        playIconSlot.name = 'play-icon';

        const pauseIconSlot = document.createElement('slot');
        pauseIconSlot.name = 'pause-icon';
        pauseIconSlot.style.display = 'none'; // Initially hidden

        // Default content for play and pause icons
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
            // prevIconSlot.textContent = 'Previous';
            prevIconSlot.innerHTML = prevIconSvg.outerHTML
        }

        this.prevButton.appendChild(prevIconSlot);
        this.prevButton.addEventListener('click', () => this.prevTrack());
        this.prevNextContainer.appendChild(this.prevButton);

        // Next track button
        this.nextButton = document.createElement('button');
        this.nextButton.setAttribute('part', 'next-button');
        this.nextButton.setAttribute('aria-label', 'Next Track');

        // Use slot for next icon
        const nextIconSlot = document.createElement('slot');
        nextIconSlot.name = 'next-icon';

        // Default content if no custom icon is provided
        if (!this.querySelector('[slot="next-icon"]')) {
            // nextIconSlot.textContent = 'Next';
            nextIconSlot.innerHTML = nextIconSvg.outerHTML;
        }

        this.nextButton.appendChild(nextIconSlot);
        this.nextButton.addEventListener('click', () => this.nextTrack());
        this.prevNextContainer.appendChild(this.nextButton);

        // Append the prev/next container to the controls container
        controlsContainer.appendChild(this.prevNextContainer);

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
            this.playbackRateSelect?.appendChild(option);
        });
        this.playbackRateSelect.addEventListener('change', () => this.adjustPlaybackRate());
        controlsContainer.appendChild(this.playbackRateSelect);

        // Append controls to shadow DOM
        this.controlsProgressTimeContainer?.appendChild(controlsContainer);
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
                // Make sure the Prev and Next buttons are visible
                if (this.prevNextContainer) {
                    this.prevNextContainer.classList.remove('hidden');
                }
            }
        } else {
            // Hide Prev and Next buttons if they exist
            if (this.prevNextContainer) {
                this.prevNextContainer.classList.add('hidden');
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
        // if no audio element, return
        if (!this.audio) return;

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
        this.audio.addEventListener('play', () => {
            this.updatePlayPauseButton();
            // new CustomEvent dispatches the event with the track index
            this.dispatchEvent(new CustomEvent<TrackPlayEventDetail>('play', {
                detail: {
                    trackIndex: this.currentTrackIndex,
                    track: this.playlistData[this.currentTrackIndex],
                }
            }));
        });
        this.audio.addEventListener('pause', () => {
            this.updatePlayPauseButton();
            // The 'pause' event is dispatched in the togglePlayPause method, not here
        });

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
        // If no audio element, return
        if (!this.audio) return;
        if (this.audio.paused) {
            this.playAudio();
        } else {

            const currentTime = this.audio.currentTime;
            const duration = this.audio.duration;
            // Dispatch the 'pause' event here because this means the user initiated the pause
            this.dispatchEvent(new CustomEvent<TrackPauseEventDetail>('pause', {
                detail: {
                    trackIndex: this.currentTrackIndex,
                    track: this.playlistData[this.currentTrackIndex],
                    currentTime: currentTime,
                    duration: duration
                }
            }));

            this.pauseAudio();
        }
    }

    /**
     * Plays the current audio track
     */
    private async playAudio() {
        // If no audio element, return
        if (!this.audio) return;

        // Check if the audio source is set
        const src = this.audio.src;
        if (!src) {
            console.error('No audio source available.');
            return;
        }

        // Try to play the audio directly using the built-in `play()` method
        try {
            await this.audio.play();
        } catch (error) {
            // Handle any errors that occur during playback
            console.error('Error playing audio:', error);
        }
    }

    /**
     * Pauses the current audio track
     */
    private pauseAudio() {
        // If no audio element, return
        if (!this.audio) return;
        this.audio.pause();
    }

    /**
     * Updates the play/pause button based on playback state
     */
    private updatePlayPauseButton() {
        if (!this.playPauseButton) return;

        const playIconSlot = this.playPauseButton.querySelector('slot[name="play-icon"]') as HTMLSlotElement;
        const pauseIconSlot = this.playPauseButton.querySelector('slot[name="pause-icon"]') as HTMLSlotElement;

        if (this.audio && this.audio.paused) {
            this.playPauseButton.setAttribute('aria-label', 'Play');
            this.playPauseButton.setAttribute('aria-pressed', 'false');
            playIconSlot.style.display = '';
            pauseIconSlot.style.display = 'none';
        } else {
            this.playPauseButton.setAttribute('aria-label', 'Pause');
            this.playPauseButton.setAttribute('aria-pressed', 'true');
            playIconSlot.style.display = 'none';
            pauseIconSlot.style.display = '';
        }

        // Update the playlist UI to reflect the playback state
        this.updatePlaylistUI();
    }

    /**
     * Moves to the next track in the playlist
     */
    private nextTrack() {
        if (this.playlistData.length > 1) {
            if (this.hasNextAvailableTrack()) {
                const prevTrackIndex = this.currentTrackIndex;
                this.nextAvailableTrack();
                // Do not autoplay; wait for user to initiate playback
                const detail = {
                    currentTrackIndex: this.currentTrackIndex,
                    prevTrackIndex: prevTrackIndex
                }
                this.dispatchTrackChangeEvent(detail);
            } else {
                console.warn('No next available tracks to play.');
            }
        }
    }

    /**
     * Moves to the previous track in the playlist
     */
    private prevTrack() {
        if (this.playlistData.length > 1) {
            if (this.hasPrevAvailableTrack()) {
                const prevTrackIndex = this.currentTrackIndex;
                this.prevAvailableTrack();
                // Do not autoplay; wait for user to initiate playback
                const detail = {
                    currentTrackIndex: this.currentTrackIndex,
                    prevTrackIndex: prevTrackIndex
                }
                this.dispatchTrackChangeEvent(detail);
            } else {
                console.warn('No previous available tracks to play.');
            }
        }
    }

    /**
     * Adjusts the playback rate based on the select control
     */
    private adjustPlaybackRate() {
        // If no audio element, return
        if (!this.audio || !this.playbackRateSelect) return;
        const rate = parseFloat(this.playbackRateSelect.value);
        this.audio.playbackRate = rate;
    }

    /**
     * Loads the current track based on currentTrackIndex
     */

    private loadCurrentTrack() {
        // If no audio element, return
        if (!this.audio) return;

        if (this.playlistData.length > 0) {
            const currentTrack = this.playlistData[this.currentTrackIndex];

            // Is this the last track in the playlist? Update the state.
            const isLastTrack = this.currentTrackIndex === this.playlistData.length - 1;
            if (isLastTrack) {
                this.isLastTrack = true;
            } else {
                this.isLastTrack = false
            }


            this.audio.src = currentTrack.src;
            this.audio.load();  // Attempt to load the new track

            // Apply the user's selected playback rate
            const rate = parseFloat(this.playbackRateSelect ? this.playbackRateSelect.value : '1');
            this.audio.playbackRate = rate;

            // Reset progress bar
            if (this.progressBar) {
                this.progressBar.value = '0';
                this.updateProgressBar();
            }

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
     * Handles media errors and provides detailed error messages
     */
    private handleMediaError() {
        const error = this.audio?.error;
        let errorMessage = 'An unknown error occurred while loading the audio.';
        let errorCode = 0;

        if (error) {
            errorCode = error.code;
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Playback was aborted by the user.';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'A network error prevented the audio from loading. Please check your internet connection.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'An error occurred while decoding the audio. The file may be corrupt or in an unsupported format.';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Error: The file was not found or the audio format is not supported.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred while loading the audio.';
                    break;
            }
        }

        // Dispatch the 'error' event with details
        this.dispatchEvent(
            new CustomEvent<TrackErrorEventDetail>('error', {
                detail: {
                    code: errorCode? errorCode : 0,
                    message: errorMessage,
                    mediaError: error,
                    trackIndex: this.currentTrackIndex,
                    track: this.playlistData[this.currentTrackIndex],
                },
            })
        );

        // Mark the current track as having an error
        this.trackErrorStates[this.currentTrackIndex] = true;

        // Update the playlist UI to disable the affected track button
        this.updatePlaylistUI();

        // Attempt to move to the next available track unless it's the last track.
        if (this.hasNextAvailableTrack()) {

            if (!this.isLastTrack || this.isLoopEnabled) {
                console.log('There was an error. Attempting to play the next available track.');
                this.nextAvailableTrack();
                this.playAudio();
            }
        } else {
            // No available tracks left
            this.updateControlsState(false);
            // Optionally, display a message to the user
            console.warn('No available tracks to play.');
        }

        // Display the error message to the user
        const errorContainer = document.createElement('div');
        errorContainer.setAttribute('class', 'error-message');
        errorContainer.textContent = errorMessage;

        // Remove any existing error messages
        const existingError = this.shadow.querySelector('.error-message');
        if (existingError) {
            this.shadow.removeChild(existingError);
        }

        // Append the error message to the shadow DOM
        this.shadow.appendChild(errorContainer);
    }

    /**
     * Updates the progress bar as the audio plays
     */
    private updateProgressBar() {
        // if no progress bar, return
        if (!this.progressBar) return;

        if (this.audio && this.audio.duration > 0) {
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
        const currentTime = this.audio ? this.audio.currentTime : 0;
        const duration = this.audio ? this.audio.duration : 0;
        const formattedCurrentTime = this.formatTime(currentTime);
        const formattedDuration = this.formatTime(duration);
        // if no time display element, return
        if (!this.timeDisplay) return;
        this.timeDisplay.textContent = `${formattedCurrentTime}/${formattedDuration}`;
    }

    /**
     * Formats a time value in seconds to HH:MM:SS or MM:SS
     * @param time Time in seconds
     * @returns Formatted time string
     */
    private formatTime(time: number): string {
        if (!isFinite(time)) {
            return '0:00';
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
    private onSeek() {
        // if no audio element or progressBar element , return
        if (!this.audio || !this.progressBar) return;
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
        // if no progress bar, return
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
    private stepForward() {
        // if no progress bar, return
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
    private onTrackEnded() {
        // save the previous track index before updating the current track index, used in the 'ended' event
        const prevTrackIndex = this.currentTrackIndex;
        if (this.playlistData.length > 1) {
            // If there are more tracks in the playlist
            if (this.currentTrackIndex < this.playlistData.length - 1 && !this.isLastTrack) {
                this.currentTrackIndex++;
                this.loadCurrentTrack();

                this.playAudio(); // Automatically play the next track
            } else {
                // This is the last track, don't loop if there's an error
                if (this.audio?.error) {
                    console.error(`Error on the last track: ${this.playlistData[this.currentTrackIndex].src}`);
                    this.updatePlayPauseButton();
                } else if (this.isLoopEnabled) {
                    // Loop back to the first track if loop is enabled and no error
                    this.currentTrackIndex = 0;
                    this.loadCurrentTrack();
                    this.playAudio(); // Automatically play the first track
                } else {

                    // Don't loop back, just stop
                    this.updatePlayPauseButton();
                }
            }
        } else {
            // Single track; stop playback
            this.updatePlayPauseButton();
        }

        // Dispatch the 'ended' event
        // new CustomEvent dispatches the event with the track index
        this.dispatchEvent(new CustomEvent<TrackEndedEventDetail>('ended', {
            detail: {
                trackIndex: prevTrackIndex,
                track: this.playlistData[prevTrackIndex],
            }
        }));
    }

    /**
     * Creates or updates the playlist UI
     */
    private updatePlaylistUI() {
        // if no playlist container, return
        if (!this.playlistContainer) return;

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
                let tracksToDisplay: { src: string; title: string }[] = [];

                if (this.isOnlyCurrentTrackVisible) {
                    // Display only the current track
                    tracksToDisplay = [this.playlistData[this.currentTrackIndex]];
                    this.playlistContainer.classList.add('only-current-track-visible');
                } else {
                    // Display the full playlist
                    tracksToDisplay = this.playlistData;
                }

                tracksToDisplay.forEach((track, idx) => {
                    // Adjust index based on visibility setting
                    const actualIndex = this.isOnlyCurrentTrackVisible ? this.currentTrackIndex : idx;

                    const listItem = document.createElement('li');
                    listItem.setAttribute('role', 'listitem');

                    // Create a button to represent the track
                    const trackButton = document.createElement('button');
                    const trackTitle = track.title || this.extractFileName(track.src);
                    trackButton.setAttribute('aria-label', `Play ${trackTitle}`);

                    // Disable the button if the track has an error
                    const isTrackError = this.trackErrorStates[actualIndex];
                    trackButton.disabled = isTrackError;

                    // Create an SVG icon element
                    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    iconSvg.setAttribute('width', '16');
                    iconSvg.setAttribute('height', '16');
                    iconSvg.setAttribute('aria-hidden', 'true');

                    const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                    useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '');

                    iconSvg.appendChild(useElement);

                    // In the part where you set the icon
                    if (isTrackError) {
                        useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#error-icon');
                    } else if (this.currentTrackIndex === actualIndex) {
                        // Set the appropriate icon based on state
                        trackButton.classList.add('current-track');
                        trackButton.setAttribute('aria-current', 'true');
                        trackButton.classList.add('playing');
                        if (this.audio && this.audio.paused) {
                            useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#play-icon');
                            trackButton.setAttribute('aria-pressed', 'false');
                            // remove the playing class
                            trackButton.classList.remove('playing');

                        } else {
                            useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#pause-icon');
                            trackButton.setAttribute('aria-pressed', 'true');
                        }
                    } else {
                        useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#bullet-icon');
                        trackButton.setAttribute('aria-pressed', 'false');
                    }

                    // Append the icon and text to the button
                    trackButton.appendChild(iconSvg);
                    const spanNode = document.createElement('span');
                    spanNode.classList.add('track-title');
                    const textNode = document.createTextNode(`${trackTitle}`); // Add a space for separation
                    spanNode.appendChild(textNode);
                    trackButton.appendChild(spanNode);

                    // Add click listener to toggle play/pause or change track
                    trackButton.addEventListener('click', () => {
                        if (this.currentTrackIndex === actualIndex) {
                            // Clicked on the currently playing track
                            this.togglePlayPause();
                        } else {
                            // Clicked on a different track
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
        // if no playlist container, return
        if (!this.playlistContainer) return;
        if (this.isPlaylistVisible || this.isOnlyCurrentTrackVisible) {
            this.playlistContainer.style.display = 'block';
            this.updatePlaylistUI();
        } else {
            this.playlistContainer.style.display = 'none';
        }
    }

    private hasNextAvailableTrack(): boolean {
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

    private hasPrevAvailableTrack(): boolean {
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

    private nextAvailableTrack() {
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

        // No available tracks found
        console.warn('No available tracks to play.');
    }

    private prevAvailableTrack() {
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

        // No available tracks found
        console.warn('No available tracks to play.');
    }

    private dispatchTrackChangeEvent(detail: { currentTrackIndex: number, prevTrackIndex: number }) {
        this.dispatchEvent(new CustomEvent<TrackChangeEventDetail>('trackChange', {
            detail
        }));
    }

    /**
     * Renders the component's HTML structure and styles
     */
    private render() {
        // Add SVG definitions to the Shadow DOM
        const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgDefs.setAttribute('aria-hidden', 'true');
        svgDefs.setAttribute('style', 'display: none;');
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
        .prev-next-container.hidden {
            display: none;
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
    set tracks(value: { src: string; title: string }[]) {
        if (Array.isArray(value)) {
            this.playlistData = value.filter((track) => typeof track.src === 'string');
            this.trackErrorStates = new Array(this.playlistData.length).fill(false);

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
    get tracks(): { src: string; title: string }[] {
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

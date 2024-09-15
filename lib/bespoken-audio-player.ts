export class BespokenAudioPlayer extends HTMLElement {
    // Shadow DOM root
    private shadow: ShadowRoot;

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
    private progressTimeContainer: HTMLElement | undefined; // Container for progress bar and time display
    private progressBar: HTMLInputElement | undefined;

    // Time display element
    private timeDisplay: HTMLElement | undefined;

    // Playlist UI elements
    private playlistContainer: HTMLElement | undefined;

    // Attributes
    private isPlaylistVisible: boolean;
    private isLoopEnabled: boolean;
    private isOnlyCurrentTrackVisible: boolean;

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
        this.progressTimeContainer?.appendChild(progressContainer);
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
        this.progressTimeContainer?.appendChild(this.timeDisplay);
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
            controlsContainer.appendChild(this.prevButton);
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
            this.playbackRateSelect?.appendChild(option);
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
            this.dispatchEvent(new Event('play'));
        });
        this.audio.addEventListener('pause', () => {
            this.updatePlayPauseButton();
            this.dispatchEvent(new Event('pause'));
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
            this.pauseAudio();
        }
    }

    /**
     * Plays the current audio track
     */
    private playAudio() {
        // If no audio element, return
        if (!this.audio) return;
        this.audio.play();
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
                this.nextAvailableTrack();
                // Do not autoplay; wait for user to initiate playback
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
                this.prevAvailableTrack();
                // Do not autoplay; wait for user to initiate playback
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
            this.audio.src = currentTrack.src;
            this.audio.load();

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

            // Dispatch the 'trackChange' event
            this.dispatchEvent(new CustomEvent('trackChange', {
                detail: {
                    currentTrackIndex: this.currentTrackIndex,
                    track: currentTrack,
                },
            }));

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
                    errorMessage = 'The audio format is not supported or the file was not found (404 error).';
                    break;
                default:
                    errorMessage = 'An unknown error occurred while loading the audio.';
                    break;
            }
        }

        // Dispatch the 'error' event with details
        this.dispatchEvent(
            new CustomEvent('error', {
                detail: {
                    code: errorCode,
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

        // Attempt to move to the next available track
        if (this.hasNextAvailableTrack()) {
            this.nextAvailableTrack();
            this.playAudio();
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
        // Dispatch the 'ended' event
        this.dispatchEvent(new Event('ended'));
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

                        if (this.audio && this.audio.paused) {
                            useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#play-icon');
                            trackButton.setAttribute('aria-pressed', 'false');
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
                    const textNode = document.createTextNode(` ${trackTitle}`); // Add a space for separation
                    trackButton.appendChild(textNode);

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

    /**
     * Renders the component's HTML structure and styles
     */
    private render() {
        // Add SVG definitions to the Shadow DOM
        const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgDefs.setAttribute('aria-hidden', 'true');
        svgDefs.setAttribute('style', 'display: none;');
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
      <symbol id="error-icon" viewBox="0 0 16 16">
          <!-- Circle -->
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" fill="none"/>
          <!-- Exclamation Mark -->
          <rect x="7" y="3.25" width="2" height="5.5" fill="currentColor"/>
          <circle cx="8" cy="11" r="1.5" fill="currentColor"/>
        </symbol>
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
        
        border-radius: 2px;
        cursor: pointer;
      }
      
      /* set the button and select border styles */
        button, select {
            border: 1px solid color-mix(in srgb, var(--button-border-color, #596570) 70%, transparent 0%);
        }
        /* Style the select element */

select {
  appearance: none; /* Remove default select styles */
  -webkit-appearance: none; /* For Safari */
  -moz-appearance: none; /* For Firefox */
  background-color: var(--select-background, #fff);
  color: var(--select-color, #334155);
  padding: 3px 8px;
  font-size: 0.8rem;
  border-radius: 2px;
  cursor: pointer;
  width: 100%;
  max-width: 50px; /* Set width to keep it consistent */
  padding-right: 5px; /* Ensure space for dropdown arrow */
  position: relative; /* Ensure the arrow is positioned correctly */
}

/* Remove default browser dropdown arrow */
select::-ms-expand {
  display: none;
}
select::-moz-focus-inner {
  border: 0;
}

/* Add custom dropdown indicator using ::after pseudo-element */
select::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid currentColor;
}

/* Ensure consistent focus outline */
select:focus {
  outline: none;
  border-color: var(--focus-color, #2563eb);
  box-shadow: 0 0 3px 1px var(--focus-color, #2563eb);
}

/* Style for disabled select */
select:disabled {
  background-color: #f0f0f0;
  color: #999;
  cursor: not-allowed;
  border-color: #ddd;
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


/* Style for disabled buttons */
.playlist-container button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: gray; /* Optional: Change text color */
}

/* Optionally, add an error icon */
.playlist-container button:disabled svg use {
  href: '#error-icon'; /* Reference an error icon */
}

/* Error Message Styles */
.error-message {
  color: #ca3a31;
  font-weight: bold;
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

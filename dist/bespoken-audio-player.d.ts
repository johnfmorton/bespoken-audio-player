declare module "bespoken-audio-player" {
    interface Track {
        src: string;
        title?: string;
    }
    export interface TrackErrorEventDetail {
        code: number;
        message: string;
        mediaError: MediaError | null | undefined;
        trackIndex: number;
        track: Track;
    }
    export class BespokenAudioPlayer extends HTMLElement {
        private shadow;
        private playerContainer;
        private audio;
        private playlistData;
        private currentTrackIndex;
        private playPauseButton;
        private nextButton;
        private prevButton;
        private playbackRateSelect;
        private controlsProgressTimeContainer;
        private progressBar;
        private timeDisplay;
        private playlistContainer;
        private isPlaylistVisible;
        private isLoopEnabled;
        private isOnlyCurrentTrackVisible;
        private prevNextContainer;
        private isLastTrack;
        private keyboardShortcuts;
        private trackErrorStates;
        constructor();
        /**
         * Specifies the observed attributes so that
         * attributeChangedCallback will work
         */
        static get observedAttributes(): string[];
        /**
         * Called when the component is added to the DOM
         */
        connectedCallback(): void;
        /**
         * Called when an observed attribute has been added, removed, updated, or replaced.
         * @param name The attribute's name.
         * @param oldValue The previous value.
         * @param newValue The new value.
         */
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
        /**
         * Parses the 'tracks' attribute and updates the playlist data.
         */
        private parseTracksAttribute;
        private hidePlayer;
        /**
         * Create a container for all the player elements
         */
        private createPlayerContainer;
        /**
         * Creates the audio element and appends it to the shadow DOM
         */
        private createAudioElement;
        /**
         * Creates the playlist UI and appends it to the shadow DOM
         */
        private createPlaylist;
        /**
         * Creates the container for progress bar and time display
         */
        private createControlsProgressAndTimeContainer;
        /**
         * Creates the progress bar and appends it to the progress-time container
         */
        private createProgressBar;
        /**
         * Creates the time display element and appends it to the progress-time container
         */
        private createTimeDisplay;
        /**
         * Creates control buttons and other UI elements
         */
        private createControls;
        /**
         * Updates the visibility of the Prev and Next buttons based on the number of tracks
         */
        private updateControlsVisibility;
        /**
         * Removes the existing controls from the DOM
         */
        private removeControls;
        /**
         * Updates the enabled/disabled state of controls based on the availability of tracks
         * @param isEnabled Whether the controls should be enabled
         */
        private updateControlsState;
        /**
         * Attaches event listeners for media events
         */
        private attachEventListeners;
        /**
         * Sets up keyboard shortcuts for controlling the audio player
         */
        private setupKeyboardShortcuts;
        /**
         * Handles keydown events for keyboard shortcuts
         * @param event KeyboardEvent
         */
        private handleKeydown;
        /**
         * Checks if multiple instances of the player exist on the page
         */
        private multiplePlayersExist;
        /**
         * Toggles between play and pause states
         */
        private togglePlayPause;
        /**
         * Plays the current audio track
         */
        private playAudio;
        /**
         * Pauses the current audio track
         */
        private pauseAudio;
        /**
         * Updates the play/pause button based on playback state
         */
        private updatePlayPauseButton;
        /**
         * Moves to the next track in the playlist
         */
        private nextTrack;
        /**
         * Moves to the previous track in the playlist
         */
        private prevTrack;
        /**
         * Adjusts the playback rate based on the select control
         */
        private adjustPlaybackRate;
        /**
         * Loads the current track based on currentTrackIndex
         */
        private loadCurrentTrack;
        /**
         * Handles media errors and provides detailed error messages
         */
        private handleMediaError;
        /**
         * Updates the progress bar as the audio plays
         */
        private updateProgressBar;
        /**
         * Updates the time display
         */
        private updateTimeDisplay;
        /**
         * Formats a time value in seconds to HH:MM:SS or MM:SS
         * @param time Time in seconds
         * @returns Formatted time string
         */
        private formatTime;
        /**
         * Handles user seeking via the progress bar
         */
        private onSeek;
        /**
         * Handles keyboard events on the progress bar for accessibility
         * @param event KeyboardEvent
         */
        private onSeekKeyDown;
        /**
         * Steps back the progress bar by a small amount
         */
        private stepBack;
        /**
         * Steps forward the progress bar by a small amount
         */
        private stepForward;
        /**
         * Handles the end of a track
         */
        private onTrackEnded;
        /**
         * Creates or updates the playlist UI
         */
        private updatePlaylistUI;
        /**
         * Extracts the file name from the source URL
         * @param src The source URL of the track
         * @returns The extracted file name without extension
         */
        private extractFileName;
        /**
         * Updates the visibility of the playlist UI
         */
        private updatePlaylistVisibility;
        private hasNextAvailableTrack;
        private hasPrevAvailableTrack;
        private nextAvailableTrack;
        private prevAvailableTrack;
        private dispatchTrackChangeEvent;
        /**
         * Renders the component's HTML structure and styles
         */
        private render;
        /**
         * Allows setting the playlist via the 'tracks' attribute or property
         */
        set tracks(value: {
            src: string;
            title: string;
        }[]);
        /**
         * Gets the current playlist data
         */
        get tracks(): {
            src: string;
            title: string;
        }[];
    }
    export function initBespokenAudioPlayer(): void;
}

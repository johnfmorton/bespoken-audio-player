# BespokenAudioPlayer Web Component Documentation

## Overview

The **BespokenAudioPlayer** is a customizable and accessible web component that provides a rich audio playback experience. It supports playlists, playback controls, progress tracking, and is designed to be easily integrated into any web application.

---

## Table of Contents

- [BespokenAudioPlayer Web Component Documentation](#bespokenaudioplayer-web-component-documentation)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
    - [From NPM](#from-npm)
    - [As a Module](#as-a-module)
    - [Direct Inclusion](#direct-inclusion)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Custom Icons](#custom-icons)
    - [Styling the Component](#styling-the-component)
  - [Attributes](#attributes)
  - [Events](#events)
  - [Slots](#slots)
  - [Styling and Customization](#styling-and-customization)
    - [CSS Custom Properties](#css-custom-properties)
    - [Exposed Parts](#exposed-parts)
  - [Accessibility](#accessibility)
  - [Examples](#examples)
    - [Example 1: Basic Player](#example-1-basic-player)
    - [Example 2: Custom Styled Player](#example-2-custom-styled-player)
  - [Browser Support](#browser-support)
  - [License](#license)
  - [Contributing](#contributing)
  - [Contact](#contact)

---

## Features

- **Playlist Support**: Play multiple audio tracks with next and previous controls.
- **Customizable Controls**: Replace default buttons and icons with custom SVGs.
- **Responsive Design**: Adapts to different screen sizes and devices.
- **Accessibility**: ARIA attributes and keyboard controls for screen readers and keyboard navigation.
- **Playback Rate Control**: Adjust the playback speed of the audio.
- **Progress Tracking**: Visual progress bar with time display.
- **Customizable Appearance**: Style the component using CSS custom properties and exposed parts.

---

## Installation

Include the `BespokenAudioPlayer` component in your project by importing it as a module or including it directly in your HTML.

### From NPM

The component can be installed from NPM. See the project page here: https://www.npmjs.com/package/bespoken-audio-player

```bash
npm i bespoken-audio-player
```

Then in your JavaScript file:

```javascript
import {initBespokenAudioPlayer} from "@js/bespoken-audio-player";
initBespokenAudioPlayer();
```

### As a Module

You can import the component as a module in your HTML file by including the `bespoken-audio-player.js` file in your own project.

```html
<script type="module">
  import { BespokenAudioPlayer } from './path/to/bespoken-audio-player.js';
  // Initialize the component
  if (!customElements.get('bespoken-audio-player')) {
    customElements.define('bespoken-audio-player', BespokenAudioPlayer);
  }
</script>
```

### Direct Inclusion

Alternatively, you can include the component script directly:

```html
<script src="./path/to/bespoken-audio-player.js"></script>
```

---

## Usage

### Basic Usage

To use the `bespoken-audio-player` component, include it in your HTML and provide a list of tracks via the `tracks` attribute.

```html
<bespoken-audio-player
  tracks='[
    {"src": "path/to/track1.mp3", "title": "First Track"},
    {"src": "path/to/track2.mp3", "title": "Second Track"}
  ]'
>
</bespoken-audio-player>
```

### Custom Icons

You can replace the default text in the control buttons with custom SVG icons using slots.

```html
<bespoken-audio-player
  tracks='[
    {"src": "path/to/track1.mp3", "title": "First Track"}
  ]'
>
  <!-- Custom Play Icon -->
  <svg slot="play-icon" viewBox="0 0 24 24">
    <!-- SVG content for play icon -->
  </svg>
  <!-- Custom Pause Icon -->
  <svg slot="pause-icon" viewBox="0 0 24 24">
    <!-- SVG content for pause icon -->
  </svg>
  <!-- Custom Previous Icon -->
  <svg slot="prev-icon" viewBox="0 0 24 24">
    <!-- SVG content for previous icon -->
  </svg>
  <!-- Custom Next Icon -->
  <svg slot="next-icon" viewBox="0 0 24 24">
    <!-- SVG content for next icon -->
  </svg>
</bespoken-audio-player>
```

### Styling the Component

The `bespoken-audio-player` component can be styled using CSS custom properties and exposed parts.

There are many options which you can read about in the [Styling and Customization](CSS-STYLING.md) documentation.

---

## Attributes

- **`tracks`**: *(required)* A JSON array of track objects. Each object must have a `src` property and can optionally have a `title`.

  ```html
  tracks='[
    {"src": "path/to/track1.mp3", "title": "First Track"},
    {"src": "path/to/track2.mp3", "title": "Second Track"}
  ]'
  ```

- **`playlist-visible`**: *(optional)* If present, the playlist will be displayed.

  ```html
  <bespoken-audio-player tracks='[...]' playlist-visible></bespoken-audio-player>
  ```

- **`loop`**: *(optional)* If present, the playlist will loop when it reaches the end.

  ```html
  <bespoken-audio-player tracks='[...]' loop></bespoken-audio-player>
  ```

- **`only-current-track-visible`**: *(optional)* If present, only the current track will be displayed in the playlist.

  ```html
  <bespoken-audio-player tracks='[...]' only-current-track-visible></bespoken-audio-player>
  ```


## Events

- **`play`**: Fired when playback starts.
- **`pause`**: Fired when playback is paused.
- **`ended`**: Fired when the track ends.
- **`trackChange`**: Fired when the current track changes. This event includes the new track index, `currentTrackIndex`, and the `track` itself.
- **`error`**: Fired when an error occurs during playback. This event includes:•
   - code: The error code from MediaError.code.
   - message: A descriptive error message.
   - mediaError: The original MediaError object.
   - trackIndex: The index of the track that caused the error.
   - track: The track object ({ src, title }) that caused the error.

```javascript
const player = document.querySelector('bespoken-audio-player');
player.addEventListener('play', () => {
  console.log('Playback started');
});
```

```javascript
const player = document.querySelector('bespoken-audio-player');
player.addEventListener('trackchange', (event) => {
  const { currentTrackIndex, track } = event.detail;
  console.log(`Track changed to index ${currentTrackIndex}`, track);
});
```

```javascript
player.addEventListener('error', (event) => {
  const { code, message, mediaError, trackIndex, track } = event.detail;
  console.error(`Error on track ${trackIndex}:`, message);
  // You can handle the error as needed, e.g., display a custom message
});
```

---

## Slots

- **`play-icon`**: Slot for providing a custom play icon.
- **`pause-icon`**: Slot for providing a custom pause icon.
- **`prev-icon`**: Slot for providing a custom previous track icon.
- **`next-icon`**: Slot for providing a custom next track icon.

---

## Styling and Customization

### CSS Custom Properties

Customize the appearance using the following CSS variables:

- **`--primary-color`**: The primary color used throughout the component.
- **`--button-background`**: Background color of buttons.
- **`--button-color`**: Text color of buttons.
- **`--progress-bar-background`**: Background color of the progress bar.
- **`--progress-bar-fill`**: Fill color of the progress bar.
- **`--progress-bar-fill-hover`**: Fill color of the progress bar on hover.
- **`--progress-bar-thumb`**: Color of the progress bar thumb (the draggable part).

### Exposed Parts

Style specific parts of the component using the `::part` pseudo-element:

- **`play-button`**: The play/pause button.
- **`next-button`**: The next track button.
- **`prev-button`**: The previous track button.
- **`progress-bar`**: The progress bar (range input).
- **`time-display`**: The time display element.

---

## Accessibility

The `bespoken-audio-player` component is built with accessibility in mind:

- **ARIA Attributes**: Uses appropriate ARIA roles and attributes to convey information to assistive technologies.
- **Keyboard Navigation**: Supports keyboard controls for play/pause, next/previous track, and seeking.
- **Focus Management**: Ensures focus is managed appropriately when interacting with controls.
- **Screen Reader Support**: Provides meaningful labels and state information for screen reader users.

---

## Examples

### Example 1: Basic Player

```html
<bespoken-audio-player
  tracks='[
    {"src": "audio/track1.mp3", "title": "Track 1"},
    {"src": "audio/track2.mp3", "title": "Track 2"}
  ]'
  playlist-visible
  loop
>
</bespoken-audio-player>
```

### Example 2: Custom Styled Player

```html
<bespoken-audio-player
  tracks='[
    {"src": "audio/song1.mp3", "title": "Song One"},
    {"src": "audio/song2.mp3", "title": "Song Two"}
  ]'
  playlist-visible
>
  <!-- Custom Icons -->
  <svg slot="play-icon" viewBox="0 0 24 24">
    <!-- SVG content for play icon -->
  </svg>
  <svg slot="pause-icon" viewBox="0 0 24 24">
    <!-- SVG content for pause icon -->
  </svg>
  <svg slot="prev-icon" viewBox="0 0 24 24">
    <!-- SVG content for previous icon -->
  </svg>
  <svg slot="next-icon" viewBox="0 0 24 24">
    <!-- SVG content for next icon -->
  </svg>
</bespoken-audio-player>

<style>
  bespoken-audio-player {
    --primary-color: #4caf50;
    --button-background: #fff;
    --button-color: #4caf50;
    --progress-bar-background: #e0e0e0;
    --progress-bar-fill: #4caf50;
    --progress-bar-fill-hover: #81c784;
    --progress-bar-thumb: #4caf50;
  }

  /* Style the play/pause button */
  bespoken-audio-player::part(play-button) {
    background-color: #4caf50;
    color: #fff;
    border-radius: 50%;
  }

  /* Style the time display */
  bespoken-audio-player::part(time-display) {
    color: #4caf50;
    font-weight: bold;
  }
</style>
```

---

## Browser Support

The `bespoken-audio-player` component is built using standard web technologies and should work in modern browsers that support:

- ES6 Classes and Modules
- Custom Elements v1
- Shadow DOM v1
- CSS Custom Properties
- `@supports` at-rule (for feature detection)

**Note**: Internet Explorer is not supported. For the best experience, use the latest version of your browser.

---

## License

The `bespoken-audio-player` component is released under the [MIT License](https://opensource.org/licenses/MIT).

---

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please submit an issue or pull request to the project's repository.

---

## Contact

For questions or support, please contact me through the options on my [Contact Page](https://supergeekery.com/contact) on my site.

---

**Thank you for using the BespokenAudioPlayer component!**

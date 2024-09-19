# Styling and Customization of the Bespoken Audio Player Web Component

## Customizing Web Component Parts

The `<bespoken-audio-player>` web component uses the `::part()` pseudo-class to allow fine-grained styling of individual elements within the shadow DOM. This enables developers to target specific elements (called "parts") of the audio player and customize their appearance without needing to break into the component's internal structure. Below is a list of all the parts available for customization, along with examples of how to style each one.

### Available Parts

1. **`progress-bar`**
   The `progress-bar` part controls the appearance of the audio track progress bar, which allows users to see how much of the audio has played and manually seek through the track.

   **Example:**
   ```css
   bespoken-audio-player::part(progress-bar) {
       background-color: #f0f0f0;  /* Background of unplayed portion */
       border-radius: 5px;
       height: 8px;  /* Height of the progress bar */
   }
   ```

2. **`time-display`**
   The `time-display` part represents the text showing the current playback time and the total duration of the track (e.g., `0:30 / 3:45`). You can customize the font, colors, and borders of this display.

   **Example:**
   ```css
   bespoken-audio-player::part(time-display) {
       color: #ff5722;  /* Text color */
       font-weight: bold;
       border: 1px solid #673ab7;
       border-radius: 3px;
       padding: 0 4px;
       background-color: #f9f9f9;
   }
   ```

3. **`play-pause-toggle-button`**
   The `play-pause-toggle-button` part refers to the button that toggles between play and pause. This button swaps between the play and pause icons depending on the audio state.

   **Example:**
   ```css
   bespoken-audio-player::part(play-pause-toggle-button) {
       background-color: transparent;
       border: 2px solid #00f;  /* Button border */
       border-radius: 50%;  /* Make the button round */
       padding: 5px;
       color: #00f;  /* Icon color */
   }

   bespoken-audio-player::part(play-pause-toggle-button):hover {
       background-color: #e0e0e0;  /* Change background on hover */
   }
   ```

4. **`prev-button`**
   The `prev-button` part refers to the button that allows users to go to the previous track in the playlist. You can customize the appearance of this button, including its size, shape, and colors.

   **Example:**
   ```css
   bespoken-audio-player::part(prev-button) {
       background-color: #673ab7;
       border-radius: 4px;
       color: #fff;  /* Icon color */
       padding: 5px;
   }

   bespoken-audio-player::part(prev-button):hover {
       background-color: #875fd1;  /* Lighter purple on hover */
   }
   ```

5. **`next-button`**
   The `next-button` part controls the appearance of the button that advances to the next track in the playlist. You can style it similarly to the previous button, but it can also be styled differently to indicate its unique function.

   **Example:**
   ```css
   bespoken-audio-player::part(next-button) {
       background-color: #673ab7;
       border-radius: 4px;
       color: #fff;  /* Icon color */
       padding: 5px;
   }

   bespoken-audio-player::part(next-button):hover {
       background-color: #875fd1;  /* Lighter purple on hover */
   }
   ```

## Example Usage

Below is an example of how you can style the parts of the audio player:

```css
bespoken-audio-player#custom-player::part(progress-bar) {
    background-color: #f0f0f0;
    height: 10px;
    border-radius: 5px;
}

bespoken-audio-player#custom-player::part(time-display) {
    color: #333;
    font-size: 12px;
    background-color: #e0e0e0;
    padding: 2px 5px;
    border-radius: 3px;
}

bespoken-audio-player#custom-player::part(play-pause-toggle-button) {
    background-color: #673ab7;
    border-radius: 50%;
    color: #fff;
    padding: 8px;
}

bespoken-audio-player#custom-player::part(prev-button) {
    background-color: #673ab7;
    color: #fff;
    padding: 5px;
    border-radius: 50%;
}

bespoken-audio-player#custom-player::part(next-button) {
    background-color: #673ab7;
    color: #fff;
    padding: 5px;
    border-radius: 50%;
}
```

By leveraging the `::part()` pseudo-class, you can easily style the internal parts of the `<bespoken-audio-player>` web component to fit your application's design. These parts provide flexibility in customizing key areas of the audio player, such as the progress bar, time display, and control buttons.

## Customization via CSS Variables

In addition to the `::part()` pseudo-classes mentioned previously, the `<bespoken-audio-player>` web component also allows extensive customization through CSS variables. By setting these variables, you can control the appearance of the player, including the playlist, buttons, progress bar, select element, and more. This flexibility allows developers to style the player to match their application's design requirements.

Below is a list of all available CSS variables with descriptions of what they control.

### 1. Playlist Styling

- `--playlist-background`: Sets the background color of the playlist.
  **Example**: `aqua`

- `--playlist-color`: Sets the text color of the tracks in the playlist.
  **Example**: `green`

- `--playlist-color-error`: Sets the color of tracks that have encountered an error during loading.
  **Example**: `#0b09d0` (Midnight blue)

- `--playlist-border`: Controls the border of the playlist.
  **Example**: `1px solid blue`

- `--playlist-border-radius`: Sets the border-radius of the playlist to give it rounded corners.
  **Example**: `15px 0 15px 0` (Top-left and bottom-right corners rounded)

- `--playlist-padding`: Controls the padding inside the playlist.
  **Example**: `0.5rem 0.4rem`

- `--playlist-font-size`: Adjusts the font size of the playlist text.
  **Example**: `0.65rem`

- `--playlist-font-weight`: Sets the weight (thickness) of the font used in the playlist.
  **Example**: `300`

- `--playlist-gap-between-tracks`: Sets the space between individual tracks in the playlist.
  **Example**: `0.5em`

### 2. Current Track Styling

- `--playlist-current-background`: Background color of the currently selected track in the playlist.
  **Example**: `yellow`

- `--playlist-current-color`: Text color of the currently selected track.
  **Example**: `#673ab7`

- `--playlist-current-border`: Border for the currently selected track.
  **Example**: `1px solid #673ab7`

- `--playlist-current-border-radius`: Controls the rounding of the borders of the currently selected track.
  **Example**: `2px`

- `--playlist-current-padding`: Padding inside the currently selected track.
  **Example**: `0.2em 0.5em`

- `--playlist-current-font-size`: Font size for the currently selected track.
  **Example**: `0.65rem`

- `--playlist-current-font-weight`: Font weight for the currently selected track.
  **Example**: `thin`

### 3. Current Playing Track Styling

- `--playlist-current-playing-background`: Background color of the currently playing track.
  **Example**: `lightblue`

- `--playlist-current-playing-color`: Text color of the currently playing track.
  **Example**: `#673ab7`

- `--playlist-current-playing-border`: Border for the currently playing track.
  **Example**: `1px solid #673ab7`

- `--playlist-current-playing-border-radius`: Rounding of the currently playing track's borders.
  **Example**: `2px`

- `--playlist-current-playing-padding`: Padding for the currently playing track.
  **Example**: `0.2em 0.5em`

- `--playlist-current-playing-font-size`: Font size for the currently playing track.
  **Example**: `0.65rem`

- `--playlist-current-playing-font-weight`: Font weight for the currently playing track.
  **Example**: `900`

### 4. Button and Control Styling

- `--button-background`: Sets the background color for the play, pause, next, and previous buttons.
  **Example**: `transparent`

- `--button-color`: Text or icon color for the buttons.
  **Example**: `#00f`

- `--button-border-color`: Color of the border around buttons.
  **Example**: `#403b3b`

- `--button-border-size`: Thickness of the button borders.
  **Example**: `0`

- `--button-padding`: Padding inside the buttons.
  **Example**: `0 0 0 0`

- `--primary-color`: The primary color used throughout the player for various elements like the progress bar fill.
  **Example**: `#3ec635`

### 5. Progress Bar Styling

- `--progress-bar-background`: Background color of the progress bar (unfilled portion).
  **Example**: `#cdcc53`

- `--progress-bar-fill`: Color of the filled portion of the progress bar.
  **Example**: `#ff5722`

- `--progress-bar-thumb`: Color of the slider thumb (draggable part) of the progress bar.
  **Example**: `#1acf74`

### 6. Select Element Styling

 Note: The options below change the element itself, _not_ the dropdown menu and items in within menu.

- `--select-background`: Background color for the select element that allows users to select playback speed.
  **Example**: `#673ab7`

- `--select-color`: Text color inside the select element.
  **Example**: `#fff`

- `--select-padding`: Padding inside the select element.
  **Example**: `1px 2px`

- `--select-border-size`: Thickness of the element border.
  **Example**: `0`

- `--select-border-radius`: Rounding of the element's borders.
  **Example**: `2px`

- `--select-border-color`: Color of the element's border.
  **Example**: `#673ab7`

- `--select-font-size`: Font size for the select element text.
  **Example**: `0.65rem`

### 7. Gap and Spacing Controls

- `--controls-gap`: The gap between the control elements (buttons, progress bar, etc.).
  **Example**: `5px`

- `--audio-controls-gap`: Gap specifically for the audio control buttons (play, pause, next, etc.).
  **Example**: `10px`

- `--prev-next-controls-gap`: Gap between the "previous" and "next" buttons.
  **Example**: `0px`

### 8. Time Display Styling

- `--time-display-background`: Background color for the time display.
  **Example**: `antiquewhite`

- `--time-display-color`: Text color of the time display.
  **Example**: `#c41d7e`

- `--time-display-border`: Border around the time display.
  **Example**: `1px solid #673ab7`

- `--time-display-border-radius`: Rounding of the time display's borders.
  **Example**: `2px`

- `--time-display-padding`: Padding inside the time display.
  **Example**: `0 3px`

- `--time-display-font-size`: Font size of the time display.
  **Example**: `0.6rem`

### Example Usage

```css
bespoken-audio-player#my-audio-player {
    --playlist-background: aqua;
    --playlist-color: green;
    --button-background: transparent;
    --progress-bar-fill: #ff5722;
}
```

This example will style the playlist background as `aqua`, set the text color to `green`, make the button background `transparent`, and color the progress bar fill as `#ff5722`.

## Customizing Button Hover Effects

You can customize the hover effects for buttons using the `::part()` pseudo-class:

```css
bespoken-audio-player#my-audio-player::part(play-pause-toggle-button):hover,
bespoken-audio-player#my-audio-player::part(prev-button):hover,
bespoken-audio-player#my-audio-player::part(next-button):hover {
    background-color: mediumpurple;
}
```

This will set the background color of the buttons to `mediumpurple` when hovered.

These variables allow you to fine-tune the appearance of the `<bespoken-audio-player>` component to match your design requirements. Simply update the CSS values for the variables in your stylesheets to apply custom styles to the audio player.

## Conclusion

Using the `::part()` pseudo-class and CSS variables, you can easily customize the appearance of the `<bespoken-audio-player>` web component to match your application's design.

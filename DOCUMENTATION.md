# Bespoken Audio Player documentation

## Customizing the Color Scheme

```
bespoken-audio-player {
  --primary-color: #ff5722;
  --button-background: #e0e0e0;
  --button-color: #fff;
  --progress-bar-background: #d3d3d3;
  --progress-bar-fill: #ff5722;
  --progress-bar-thumb: #ff5722;
}
```

## Styling Buttons and Time Display via `::part`

```
/* Style the play/pause button */
bespoken-audio-player::part(play-button) {
  background-color: #ff5722;
  color: #fff;
  border-radius: 50%;
}

/* Style the previous and next buttons */
bespoken-audio-player::part(prev-button),
bespoken-audio-player::part(next-button) {
  background-color: #ff5722;
  color: #fff;
  border-radius: 50%;
}

/* Style the time display */
bespoken-audio-player::part(time-display) {
  color: #ff5722;
  font-weight: bold;
}
```

## Providing Custom Icons via Slots

```
<bespoken-audio-player>
  <!-- Custom Play Icon -->
  <svg slot="play-icon" viewBox="0 0 24 24">
    <!-- SVG content -->
  </svg>
  <!-- Custom Pause Icon -->
  <svg slot="pause-icon" viewBox="0 0 24 24">
    <!-- SVG content -->
  </svg>
  <!-- Custom Previous Icon -->
  <svg slot="prev-icon" viewBox="0 0 24 24">
    <!-- SVG content -->
  </svg>
  <!-- Custom Next Icon -->
  <svg slot="next-icon" viewBox="0 0 24 24">
    <!-- SVG content -->
  </svg>
</bespoken-audio-player>
```

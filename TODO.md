# Bespoken Audio Player to do list

The player currently meets the requirements of the project, but there are a few things that could be improved or added. This is a list of things that could be done to improve the player. If you're looking for these features, please let me know and I'll try to implement them.

## First tier features

- [ ] Add following methods to the player:
  - [ ] `play`
  - [ ] `pause`
  - [ ] `next`
  - [ ] `previous`
  - [ ] `setPlaybackRate(rate: number)`

## Second tier features

- [ ] Add a `volume` property to the player.
- [ ] Add a `muted` property to the player.
- [ ] Add a `currentTime` property to the player.
- [ ] Add a `duration` property to the player.
- [ ] Add a `seekTo(time: number)` method to the player.
- [ ] Add a `setVolume(volume: number)` method to the player.
- [ ] Add a `mute()` method to the player.
- [ ] Add an `unmute()` method to the player.
- [ ] Add a `setLoop(loop: boolean)` method to the player.
- [ ] Add a `setShuffle(shuffle: boolean)` method to the player.
- [ ] Add a `setPlaylist(playlist: AudioTrack[])` method to the player.
- [ ] Add a `setTrack(track: AudioTrack)` method to the player.
- [ ] Add a `setTrackIndex(index: number)` method to the player.

## Methods to possibly add

- **`play()`**: Starts playback of the current track.

  ```javascript
  document.querySelector('bespoken-audio-player').play();
  ```

- **`pause()`**: Pauses playback.

  ```javascript
  document.querySelector('bespoken-audio-player').pause();
  ```

- **`next()`**: Moves to the next track in the playlist.

  ```javascript
  document.querySelector('bespoken-audio-player').next();
  ```

- **`previous()`**: Moves to the previous track in the playlist.

  ```javascript
  document.querySelector('bespoken-audio-player').previous();
  ```

- **`setPlaybackRate(rate: number)`**: Sets the playback speed.

  ```javascript
  document.querySelector('bespoken-audio-player').setPlaybackRate(1.5);
  ```

---
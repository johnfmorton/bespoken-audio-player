# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-29

- The playback speed drop-down is now exposed for external styling via `::part(playback-rate-select)`, so it can be restyled or hidden (e.g. `display: none`) from outside the shadow DOM. ([#7](https://github.com/johnfmorton/bespoken-audio-player/issues/7))
- Fixed documentation that referred to the play/pause button part as `play-button`; the correct part name is `play-pause-toggle-button`.

## [1.0.7] - 2026-06-06

- Added `"types"` entry to the `"."` subpath in `package.json` `"exports"` so consumers using `moduleResolution: "bundler"` or `"node16"+` can resolve the shipped `.d.ts` instead of falling back to `any`.

## [1.0.6] - 2025-04-4

- The `initBespokenAudioPlayer` now accepts a string, like `my-custom-audio-player` to initialize the web component with the name of your choice.

## [1.0.5] - 2025-03-08

- Fixed a bug in the `handleKeydown` function that caused the Bespoken Audio Player to intercept the space bar keypress when focus was not on the audio player itself. This error only happened when a single instance of the player was on the page. If there were multiple instances, the error did not occur.

## [1.0.4] - 2024-09-27

- Added TypeScript types to the emitted events. For example, the `play` event is the type `TrackPlayEvent`. See the [event section of the documentation](DOCUMENTATION.md#events) for details.

## [1.0.3] - 2024-09-26

- Updated custom event to include the `detail` property for all events, not just the `error` event. See documentation for details.

## [1.0.2] - 2024-09-18

- Updated the documentation to reflect the changes in the project.

## [1.0.1] - 2024-09-18

- The biggest update is that the project no longer uses fetch to avoid CORS issues. This also makes a proxy server unnecessary.
- Various bug fixes and improvements.
- Better error handling.
- Improved documentation, but still a WIP.

## [1.0.0] - 2024-09-15

- Initial version of the project, released on September 18, 2024. This was intended to be labeled as a beta. Apologies for that.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

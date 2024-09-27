// Path: demo-page-assets/demo.ts

// Import the styles for the demo page
import './style.pcss';

import Notify from 'simple-notify'
import 'simple-notify/dist/simple-notify.css'
// @ts-ignore
import type {NotifyStatus} from 'simple-notify/dist/simple-notify'


// Import the custom element and its initialization function
import {
    initBespokenAudioPlayer, TrackChangeEvent,
    TrackEndedEvent, TrackErrorEvent, TrackPauseEvent,
    TrackPlayEvent,
} from '../lib/bespoken-audio-player';

// Initialize the custom element
initBespokenAudioPlayer();


const player = document.getElementById('event-example');

// Listen for the new custom event
player?.addEventListener('play', (e: TrackPlayEvent) => {
    const {trackIndex, track} = e.detail;

    console.log(`Custom Event: bespoken-play, track ${trackIndex}: ${track.title}`);

    sendNotification({
        title: `Play event - track ${trackIndex}: ${track.title}`,
    });
});

player?.addEventListener('pause', (e: TrackPauseEvent) => {
    const {trackIndex, track, currentTime, duration} = e.detail;

    console.log(`Custom Event: bespoken-pause, track ${trackIndex}: ${track.title}`);

    sendNotification({
        title: `Pause event - track ${trackIndex}: ${track.title}, time detail: ${currentTime}/${duration}`,
    });
});

player?.addEventListener('ended', (e: TrackEndedEvent) => {
    const {trackIndex, track} = e.detail;
    console.log('Event: ended');
    sendNotification({
        title: 'Ended event',
        text: `Track ${trackIndex}: ${track.title}`,
    })
});

player?.addEventListener('trackChange', (event: TrackChangeEvent) => {
    console.log('Event: trackChange', event.detail);

    let currentTrackIndex = !(event.detail.currentTrackIndex) ? null : event.detail.currentTrackIndex
    sendNotification({
        title: 'Track Change event',
        text: `from #my-audio-player to track ${Number(currentTrackIndex)}`,
    })
});

player?.addEventListener('error', (event: TrackErrorEvent) => {
    const {message, trackIndex} = event.detail;
    console.error(`Error on track ${trackIndex}:`, message);

    sendNotification({
        status: 'error',
        title: `Error event`,
        text: `Track ${trackIndex}: ${message}`,
    });
});

function sendNotification({
                              title = 'Notification',
                              status = 'info',
                              text = '',
                          }: {
    title?: string;
    status?: NotifyStatus;
    text?: string;
}) {

    // debugger;
    new Notify({
        showIcon: false,
        status,
        text,
        title,
        autotimeout: 4500,
        notificationsGap: 4,
        notificationsPadding: 1,
    });
}

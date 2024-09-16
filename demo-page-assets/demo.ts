// Path: demo-page-assets/demo.ts

// Import the styles for the demo page
import './style.pcss';

import Notify from 'simple-notify'
import 'simple-notify/dist/simple-notify.css'
// @ts-ignore
import type { NotifyStatus } from 'simple-notify/dist/simple-notify'


// Import the custom element and its initialization function
import { initBespokenAudioPlayer } from '../lib/bespoken-audio-player';

// Initialize the custom element
initBespokenAudioPlayer();


const player = document.getElementById('my-audio-player');

  player?.addEventListener('play', () => {
    console.log('Event: play');
      sendNotification({
            title: 'Play event',
      })
  });

  player?.addEventListener('pause', () => {
    console.log('Event: pause');
      sendNotification({
            title: 'Pause event',
      })
  });

  player?.addEventListener('ended', () => {
    console.log('Event: ended');
      sendNotification({
            title: 'Ended event',
      })
  });

  player?.addEventListener('trackChange', (event) => {
    console.log('Event: trackChange', event.detail);

      let currentTrackIndex = !(event.detail.currentTrackIndex) ? null : event.detail.currentTrackIndex
      sendNotification({
            title: 'Track Change event',
            text: `from #my-audio-player to track ${Number(currentTrackIndex)}`,
      })
  });

  player?.addEventListener('error', (event) => {
      const { message, trackIndex } = event.detail;
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
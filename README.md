# Streamwall

Watch up to four configured HLS live streams on one page. Streams start muted; use the video controls to enable audio. **Mute all** silences every player, and **Fullscreen wall** displays the four screens without their controls.

Run locally:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Playback requires the stream server to allow cross-origin requests for its playlists and video segments. HTTPS pages also require HTTPS streams. Availability depends on the stream provider.

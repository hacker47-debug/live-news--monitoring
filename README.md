# Streamwall

Watch up to four configured HLS live streams on one page. Streams start muted; use the video controls to enable audio. **Mute all** silences every player, and **Fullscreen wall** displays the four screens without their controls.

Run locally:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Playback requires the stream server to allow cross-origin requests for its playlists and video segments. HTTPS pages also require HTTPS streams. Availability depends on the stream provider.

## Channels and Zee authentication

The four configured channels are Sandesh News, VTV Gujarati, Zee 24 Kalak, and TV9 Gujarati. URLs are configured in `app/page.tsx`; the dashboard has no URL entry fields.

Zee uses the public authentication flow inspected in the publisher's [player script](https://static.vidgyor.com/kaltura/v1/js/vgr_util_kaltura.min.js) and [channel configuration](https://s3.ap-southeast-1.amazonaws.com/vidgyor.com/player/account/zee/conf/zee_24kalak.json): GET the `cf-token` endpoint with a `cb` cache-buster, read the JSON `video_token`, and append its query suffix verbatim to the HLS URL. `app/stream-auth.ts` obtains a fresh token at player initialization, without storing it or using custom headers/cookies. No authentication proxy or access-control bypass is used. Token or playback failures are reported in Zee's panel without interrupting other channels.

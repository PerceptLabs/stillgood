# Benchmark media

The v3 playback ladder uses one deterministic moving test pattern encoded at
three resolutions. Keeping content, duration, frame rate, codec profile, pixel
format, GOP structure, and quality target constant makes resolution the primary
intentional variable.

- `video-480p.mp4`: 854×480, 6 seconds, H.264 High Profile, 30 fps
- `video-720p.mp4`: 1280×720, 6 seconds, H.264 High Profile, 30 fps
- `video-1080p.mp4`: 1920×1080, 6 seconds, H.264 High Profile, 30 fps

The fixtures are generated from FFmpeg's `testsrc2` source at 1920×1080 and
scaled with bicubic filtering. They contain continuous visible motion and no
audio. Encoding uses yuv420p, CRF 23, level 4.0, a 60-frame GOP, and fast-start
MP4 metadata.

All assets are cached before measurement so network transfer is excluded from
playback scores. The earlier `flower.mp4` fixture is retained only for
compatibility with v1 exports.

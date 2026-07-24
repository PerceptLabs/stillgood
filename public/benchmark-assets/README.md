# Benchmark media

The v2 playback ladder uses three local CC0 H.264/30 fps fixtures:

- `video-480p.mp4`: 854×480, 4 seconds, 1 MB
- `video-720p.mp4`: 1280×720, 5 seconds, about 2 MB
- `video-1080p.mp4`: 1920×1080, 5 seconds, about 800 KB

Source and license details:

- 480p: https://truefilesize.com/video/mp4/
- 720p and 1080p: https://examplefiles.org/example-video-files/sample-mp4-files

The earlier `flower.mp4` fixture is retained for compatibility with v1 exports.
All assets are cached before measurement so network transfer is excluded from
playback scores.

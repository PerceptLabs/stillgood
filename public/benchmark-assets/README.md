# Benchmark media

The v4 playback ladder uses one deterministic StillGood moving test pattern.
Keeping the design, duration, pixel format, GOP structure, and quality target
consistent makes resolution and frame rate the intentional variables.

- `video-480p.mp4`: 854×480, 6 seconds, H.264 High Profile, 30 fps
- `video-720p.mp4`: 1280×720, 6 seconds, H.264 High Profile, 30 fps
- `video-1080p.mp4`: 1920×1080, 6 seconds, H.264 High Profile, 30 fps
- `video-1080p60.mp4`: 1920×1080, 6 seconds, H.264 High Profile, 60 fps
- `video-1440p.mp4`: 2560×1440, 6 seconds, H.264 High Profile, 30 fps
- `video-4k.mp4`: 3840×2160, 6 seconds, H.264 High Profile, 30 fps

The fixtures are generated from FFmpeg's `testsrc2` source and an SG identity
card, with continuous visible motion and no audio. Encoding uses yuv420p, CRF
23, resolution-appropriate H.264 levels, a two-second GOP, and fast-start MP4
metadata.

The everyday 480p, 720p, and 1080p assets are cached before measurement. The
1080p60 and 1440p headroom assets are fetched only after strong earlier results
and comfortable 1080p playback. The 4K asset is fetched only after both of
those extended tiers are comfortable. Skipped headroom tiers do not lower the
everyday video score or result confidence. If a lower ordinary tier performs
worse than a higher one, it receives two confirmation runs and the three-run
median becomes the recorded result. The earlier `flower.mp4` fixture is
retained only for compatibility with v1 exports.

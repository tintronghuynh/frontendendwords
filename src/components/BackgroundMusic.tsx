import { useEffect, useRef } from 'react';

interface BackgroundMusicProps {
  videoId: string;
  isPlaying: boolean;
  volume?: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function BackgroundMusic({ videoId, isPlaying, volume = 50 }: BackgroundMusicProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Load YouTube IFrame Player API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      if (!isMountedRef.current) return;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          height: '0',
          width: '0',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: videoId, // Required for looping
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!isMountedRef.current) return;
              try {
                if (isPlaying) {
                  event.target.playVideo();
                  event.target.setVolume(volume);
                }
              } catch (error) {
                console.error("Error in onReady handler:", error);
              }
            },
            onStateChange: (event: any) => {
              if (!isMountedRef.current) return;
              try {
                // When video ends (state = 0), replay it
                if (event.data === 0) {
                  event.target.playVideo();
                }
              } catch (error) {
                console.error("Error in onStateChange handler:", error);
              }
            },
          },
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    };

    return () => {
      isMountedRef.current = false;
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      } catch (error) {
        console.error("Error destroying YouTube player:", error);
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    try {
      if (playerRef.current) {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    } catch (error) {
      console.error("Error updating play state:", error);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    try {
      if (playerRef.current && playerRef.current.setVolume) {
        playerRef.current.setVolume(volume);
      }
    } catch (error) {
      console.error("Error updating volume:", error);
    }
  }, [volume]);

  return <div ref={containerRef} className="hidden" />;
}
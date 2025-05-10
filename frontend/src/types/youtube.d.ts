interface YouTubePlayerOptions {
  height: string;
  width: string;
  videoId: string;
  playerVars: {
    autoplay: number;
    controls: number;
    disablekb: number;
    enablejsapi: number;
    fs: number;
    modestbranding: number;
    rel: number;
  };
  events: {
    onReady: (event: any) => void;
    onStateChange: (event: any) => void;
    onError: (event: any) => void;
  };
}

interface YouTubePlayerState {
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
  UNSTARTED: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YouTubePlayerOptions) => any;
      PlayerState: any;
      DJ?: {
        Player: new (elementId: string, options: YouTubePlayerOptions) => any;
        PlayerState: any;
      };
    } & {
      PlayerState: any;
    };
    onYouTubeIframeAPIReady: () => void;
    onYouTubeDJAPIReady?: () => void;
  }
}

export {}; 
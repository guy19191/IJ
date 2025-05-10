export interface SpotifyPlayerState {
  position: number;
  duration: number;
  paused: boolean;
  track_window: {
    current_track: {
      id: string;
      name: string;
      artists: { name: string }[];
      album: { name: string };
    };
  };
} 
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  providerId: string;
  provider: 'spotify' | 'youtube' | null;
}

interface DJPageProps {
  eventId: string;
}

interface YouTubePlayerOptions {
  height: string;
  width: string;
  playerVars: {
    playsinline: number;
    controls: number;
    rel: number;
  };
  events: {
    onReady: () => void;
    onStateChange: (event: any) => void;
    onError: (event: any) => void;
  };
}

declare global {
  interface Window {
    Spotify: any;
    YT: {
      Player: new (elementId: string, options: YouTubePlayerOptions) => any;
      PlayerState: any;
      DJ?: {
        Player: new (elementId: string, options: YouTubePlayerOptions) => any;
        PlayerState: any;
      } | undefined;
    } & Record<string, any>;
    onSpotifyWebPlaybackSDKReady: () => void;
    onYouTubeIframeAPIReady: () => void;
  }
}

const DJPage: React.FC<DJPageProps> = ({ eventId }) => {
  // State
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [isYoutubeReady, setIsYoutubeReady] = useState(false);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);

  // Refs
  const spotifyPlayer = useRef<any>(null);
  const youtubePlayer = useRef<any>(null);

  // Computed values
  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < playlist.length
    ? playlist[currentTrackIndex]
    : null;

  const upcomingTracks = !playlist.length || currentTrackIndex < 0
    ? []
    : playlist.slice(currentTrackIndex + 1, currentTrackIndex + 6);

  const hasPrevious = currentTrackIndex > 0;
  const hasNext = currentTrackIndex < playlist.length - 1;

  // Methods
  const fetchPlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/events/${eventId}`);

      
      // Process playlist - ensure all tracks have a provider
      const processedPlaylist = response.data.playlist.map((track: Song) => ({
        ...track,
        provider: track.provider || 'youtube'
      }));
      
      setPlaylist(processedPlaylist);
      
      if (processedPlaylist.length > 0) {
        setCurrentTrackIndex(0);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setError('Failed to load playlist. Please try again.');
      setIsLoading(false);
    }
  }, [eventId]);

  const fetchToken = useCallback(async (provider: 'spotify' | 'youtube') => {
    try {
      const response = await api.get(`/music/${provider}/token`);

      return response.data.token;
    } catch (err) {
      console.error(`Error fetching ${provider} token:`, err);
    }
  }, []);

  const loadSpotifySDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('spotify-sdk')) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      
      script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
          resolve();
        };
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Spotify SDK'));
      };
      
      document.body.appendChild(script);
    });
  }, []);

  const loadYouTubeAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.YT) {
        resolve();
        return;
      }
      
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
      
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      
      // Add a timeout to prevent infinite waiting
      setTimeout(() => {
        if (!window.YT) {
          reject(new Error('YouTube API failed to load'));
        }
      }, 10000);
    });
  }, []);

  const initializeSpotifyPlayer = useCallback(async () => {
    try {
      await loadSpotifySDK();
      const token = await fetchToken('spotify');
      setSpotifyToken(token);
      
      spotifyPlayer.current = new window.Spotify.Player({
        name: 'Web DJ App',
        getOAuthToken: (cb: (token: string) => void) => { cb(spotifyToken!); },
        volume: volume / 100
      });
      
      // Error handling
      spotifyPlayer.current.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Spotify initialization error:', message);
        setError('Failed to initialize Spotify player');
      });
      
      spotifyPlayer.current.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Spotify authentication error:', message);
        setError('Spotify authentication failed');
      });
      
      spotifyPlayer.current.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Spotify account error:', message);
        setError('Spotify account error');
      });
      
      // Ready event
      spotifyPlayer.current.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with device ID', device_id);
        setSpotifyDeviceId(device_id);
        setIsSpotifyReady(true);
      });
      
      // Not ready event
      spotifyPlayer.current.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify device has gone offline', device_id);
        setIsSpotifyReady(false);
      });
      
      // Player state changed
      spotifyPlayer.current.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        
        setIsPlaying(!state.paused);
        
        // Track ended
        if (state.paused && state.position === 0 && state.duration > 0) {
          handleNext();
        }
      });
      
      // Connect the player
      await spotifyPlayer.current.connect();
    } catch (err) {
      console.error('Error initializing Spotify player:', err);
      setError('Failed to initialize Spotify player');
    }
  }, [loadSpotifySDK, fetchToken, volume]);

  const initializeYouTubePlayer = useCallback(async () => {
    try {
      await loadYouTubeAPI();
      
      youtubePlayer.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          'playsinline': 1,
          'controls': 0,
          'rel': 0
        },
        events: {
          'onReady': () => setIsYoutubeReady(true),
          'onStateChange': (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            if (event.data === window.YT.PlayerState.ENDED) {
              handleNext();
            }
          },
          'onError': () => {
            console.error('YouTube player error');
            handleNext();
          }
        }
      });
    } catch (err) {
      console.error('Error initializing YouTube player:', err);
      setError('Failed to initialize YouTube player');
    }
  }, [loadYouTubeAPI]);

  const playSpotifyTrack = useCallback(async (track: Song) => {
    if (!isSpotifyReady || !spotifyDeviceId) {
      console.error('Spotify player not ready');
      setError('Spotify player not ready');
      return;
    }
    
    try {
      // Refresh token if needed
      const token = await fetchToken('spotify');
      setSpotifyToken(token);
      
      // Play the track on the device
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uris: [`spotify:track:${track.providerId}`]
        })
      });
      
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing Spotify track:', err);
      setError('Failed to play Spotify track');
      handleNext();
    }
  }, [isSpotifyReady, spotifyDeviceId, fetchToken]);

  const playYouTubeTrack = useCallback((track: Song) => {
    if (!isYoutubeReady || !youtubePlayer.current) {
      console.error('YouTube player not ready');
      setError('YouTube player not ready');
      return;
    }
    
    try {
      youtubePlayer.current.loadVideoById(track.providerId);
      youtubePlayer.current.playVideo();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing YouTube track:', err);
      setError('Failed to play YouTube track');
      handleNext();
    }
  }, [isYoutubeReady]);

  const playCurrentTrack = useCallback(async () => {
    if (!currentTrack) return;
    
    try {
      if (currentTrack.provider === 'spotify') {
        await playSpotifyTrack(currentTrack);
      } else {
        playYouTubeTrack(currentTrack);
      }
    } catch (err) {
      console.error('Error playing track:', err);
      setError('Failed to play track');
    }
  }, [currentTrack, playSpotifyTrack, playYouTubeTrack]);

  const handleTogglePlay = useCallback(() => {
    if (!currentTrack) return;
    
    try {
      if (isPlaying) {
        // Pause
        if (currentTrack.provider === 'spotify' && spotifyPlayer.current) {
          spotifyPlayer.current.pause();
        } else if (youtubePlayer.current) {
          youtubePlayer.current.pauseVideo();
        }
      } else {
        // Play
        if (currentTrack.provider === 'spotify' && spotifyPlayer.current) {
          spotifyPlayer.current.resume();
        } else if (youtubePlayer.current) {
          youtubePlayer.current.playVideo();
        }
      }
      
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  }, [currentTrack, isPlaying]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;
    setCurrentTrackIndex(prev => prev + 1);
  }, [hasNext]);

  const handlePrevious = useCallback(() => {
    if (!hasPrevious) return;
    setCurrentTrackIndex(prev => prev - 1);
  }, [hasPrevious]);

  const handlePlayTrack = useCallback((index: number) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentTrackIndex(index);
  }, [playlist.length]);

  const handleUpdateVolume = useCallback(() => {
    if (currentTrack?.provider === 'spotify' && spotifyPlayer.current) {
      spotifyPlayer.current.setVolume(volume / 100);
    }
  }, [currentTrack, volume]);

  const handleRetryLoading = useCallback(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Effects
  useEffect(() => {
    if (currentTrack && isPlaying) {
      playCurrentTrack();
    }
  }, [currentTrack, isPlaying, playCurrentTrack]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchPlaylist();
        
        // Initialize both players
        await Promise.all([
          initializeSpotifyPlayer(),
          initializeYouTubePlayer()
        ]);
        
        // Start playing the first track if available
        if (playlist.length > 0) {
          setCurrentTrackIndex(0);
        }
      } catch (err) {
        console.error('Error during component initialization:', err);
        setError('Failed to initialize players');
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      // Clean up Spotify player
      if (spotifyPlayer.current) {
        spotifyPlayer.current.disconnect();
      }
      
      // Clean up YouTube player
      if (youtubePlayer.current) {
        youtubePlayer.current.destroy();
      }
    };
  }, [fetchPlaylist, initializeSpotifyPlayer, initializeYouTubePlayer, playlist.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 text-xl font-bold mb-4">{error}</div>
        <button 
          onClick={handleRetryLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 md:p-6">
      {/* Now Playing Section */}
      <div className="mb-8 bg-gray-800 rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-400 mb-2">Now Playing</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Album Art Placeholder */}
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
            {currentTrack?.provider === 'spotify' ? (
              <svg className="w-10 h-10 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.059 14.406c-.192.286-.567.383-.86.192-2.387-1.414-5.247-1.774-8.727-.955-.335.095-.67-.144-.766-.478-.096-.335.144-.67.48-.766 3.764-.86 6.91-.478 9.586 1.15.286.19.383.57.192.86zm1.053-2.388c-.239.382-.764.478-1.15.239-2.675-1.627-6.775-2.1-9.93-1.15-.43.143-.91-.095-1.054-.526-.144-.43.096-.91.527-1.053 3.62-1.102 8.154-.574 11.213 1.341.382.238.478.764.239 1.15zm.096-2.484c-3.24-1.893-8.536-2.054-11.593-1.15-.478.144-1.005-.144-1.15-.622-.143-.478.144-1.005.622-1.15 3.527-1.053 9.4-.86 13.107 1.341.43.239.573.86.334 1.294-.239.43-.86.573-1.294.334l-.026-.047z"/>
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            )}
          </div>
          
          {/* Track Info */}
          <div className="flex-grow">
            <h3 className="text-xl font-bold truncate">{currentTrack?.title || 'No track selected'}</h3>
            <p className="text-gray-400 text-lg">{currentTrack?.artist || 'Unknown artist'}</p>
            <p className="text-gray-500">{currentTrack?.album || 'Unknown album'}</p>
            <div className="flex items-center mt-2">
              {currentTrack?.provider === 'spotify' ? (
                <span className="text-green-500 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.059 14.406c-.192.286-.567.383-.86.192-2.387-1.414-5.247-1.774-8.727-.955-.335.095-.67-.144-.766-.478-.096-.335.144-.67.48-.766 3.764-.86 6.91-.478 9.586 1.15.286.19.383.57.192.86zm1.053-2.388c-.239.382-.764.478-1.15.239-2.675-1.627-6.775-2.1-9.93-1.15-.43.143-.91-.095-1.054-.526-.144-.43.096-.91.527-1.053 3.62-1.102 8.154-.574 11.213 1.341.382.238.478.764.239 1.15zm.096-2.484c-3.24-1.893-8.536-2.054-11.593-1.15-.478.144-1.005-.144-1.15-.622-.143-.478.144-1.005.622-1.15 3.527-1.053 9.4-.86 13.107 1.341.43.239.573.86.334 1.294-.239.43-.86.573-1.294.334l-.026-.047z"/>
                  </svg>
                  Spotify
                </span>
              ) : (
                <span className="text-red-500 text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Player Section */}
      <div className="mb-8">
        {/* Spotify Player (hidden element) for SDK integration */}
        <div id="spotify-player" className="hidden"></div>
        
        {/* YouTube Player */}
        {currentTrack?.provider !== 'spotify' && (
          <div className="aspect-video w-full max-h-96 bg-black rounded-lg overflow-hidden">
            <div id="youtube-player" className="w-full h-full"></div>
          </div>
        )}
      </div>
      
      {/* Controls Section */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-6">
          <button 
            onClick={handlePrevious}
            className={`p-2 text-gray-400 hover:text-white transition rounded-full ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasPrevious}>
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"></path>
            </svg>
          </button>
          
          <button 
            onClick={handleTogglePlay}
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition">
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            )}
          </button>
          
          <button 
            onClick={handleNext}
            className={`p-2 text-gray-400 hover:text-white transition rounded-full ${!hasNext ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!hasNext}>
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
            </svg>
          </button>
        </div>
        
        {/* Volume Control (Spotify only) */}
        {currentTrack?.provider === 'spotify' && (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                handleUpdateVolume();
              }}
              className="w-24 md:w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
      
      {/* Up Next Section */}
      <div className="flex-grow overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-400 mb-4">Up Next</h2>
        <div className="overflow-y-auto max-h-96">
          {upcomingTracks.map((track, index) => (
            <div 
              key={index}
              onClick={() => handlePlayTrack(currentTrackIndex + index + 1)}
              className="flex items-center p-3 hover:bg-gray-800 rounded-md cursor-pointer mb-2 transition">
              
              <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                {track.provider === 'spotify' ? (
                  <svg className="w-4 h-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.059 14.406c-.192.286-.567.383-.86.192-2.387-1.414-5.247-1.774-8.727-.955-.335.095-.67-.144-.766-.478-.096-.335.144-.67.48-.766 3.764-.86 6.91-.478 9.586 1.15.286.19.383.57.192.86zm1.053-2.388c-.239.382-.764.478-1.15.239-2.675-1.627-6.775-2.1-9.93-1.15-.43.143-.91-.095-1.054-.526-.144-.43.096-.91.527-1.053 3.62-1.102 8.154-.574 11.213 1.341.382.238.478.764.239 1.15zm.096-2.484c-3.24-1.893-8.536-2.054-11.593-1.15-.478.144-1.005-.144-1.15-.622-.143-.478.144-1.005.622-1.15 3.527-1.053 9.4-.86 13.107 1.341.43.239.573.86.334 1.294-.239.43-.86.573-1.294.334l-.026-.047z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm md:text-base truncate">{track.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm truncate">{track.artist}</p>
              </div>
            </div>
          ))}
          
          {upcomingTracks.length === 0 && (
            <div className="text-gray-500 text-center p-4">
              No more tracks in the queue
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export type { DJPageProps };
export default DJPage;
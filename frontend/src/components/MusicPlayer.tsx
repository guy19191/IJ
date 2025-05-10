import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Slider, Paper, Fade } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeOff } from '@mui/icons-material';
import api from '../api/client';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  providerId: string;
  provider: string;
  spotifyUri?: string;
}

interface MusicPlayerProps {
  eventId: string;
  initialPlaylist: Song[];
  onPlaylistUpdate?: (playlist: Song[]) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ eventId, initialPlaylist, onPlaylistUpdate }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playlist, setPlaylist] = useState<Song[]>(initialPlaylist);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(100);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const player = new window.Spotify.Player({
        name: 'Music Project Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: any) => {
        if (state) {
          setProgress((state.position / state.duration) * 100);
          setIsPlaying(!state.paused);
        }
      });

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      // Connect to the player!
      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (currentSong && deviceId) {
      // Get Spotify URI for the current song
      const getSpotifyUri = async () => {
        try {
          const response = await api.get('/music/spotify-uri', {
            params: {
              title: currentSong.title,
              artist: currentSong.artist,
              album: currentSong.album
            }
          });
          const { uri } = response.data;
          
          // Play the track on Spotify
          await api.put('https://api.spotify.com/v1/me/player/play', {
            device_id: deviceId,
            uris: [uri]
          });
        } catch (error) {
          console.error('Error playing track:', error);
        }
      };

      getSpotifyUri();
    }
  }, [currentSong, deviceId]);

  const handlePlayPause = async () => {
    if (player) {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.resume();
      }
    }
  };

  const handleNext = async () => {
    if (playlist.length <= 1) {
      try {
        const response = await api.post(`/playlists/events/${eventId}/generate-next`);
        const newSong = response.data;
        
        const updatedPlaylist = [...playlist.slice(1), newSong];
        setPlaylist(updatedPlaylist);
        onPlaylistUpdate?.(updatedPlaylist);
        setCurrentSong(newSong);
      } catch (error) {
        console.error('Error generating next song:', error);
      }
    } else {
      const updatedPlaylist = playlist.slice(1);
      setPlaylist(updatedPlaylist);
      onPlaylistUpdate?.(updatedPlaylist);
      setCurrentSong(updatedPlaylist[0]);
    }
  };

  const handlePrevious = () => {
    if (playlist.length > 1) {
      const updatedPlaylist = playlist.slice(0, -1);
      setPlaylist(updatedPlaylist);
      onPlaylistUpdate?.(updatedPlaylist);
      setCurrentSong(updatedPlaylist[updatedPlaylist.length - 1]);
    }
  };

  const handleVolumeChange = async (_: Event, value: number | number[]) => {
    if (player && typeof value === 'number') {
      const newVolume = value / 100;
      await player.setVolume(newVolume);
      setVolume(value);
      if (value === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  const handleMuteToggle = async () => {
    if (player) {
      if (isMuted) {
        await player.setVolume(previousVolume / 100);
        setVolume(previousVolume);
      } else {
        setPreviousVolume(volume);
        await player.setVolume(0);
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = async (_: Event, value: number | number[]) => {
    if (player && typeof value === 'number') {
      const state = await player.getCurrentState();
      if (state) {
        const newPosition = (value / 100) * state.duration;
        await player.seek(newPosition);
        setProgress(value);
      }
    }
  };

  if (!currentSong) {
    return null;
  }

  return (
    <Fade in={true}>
      <Paper 
        elevation={8}
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          bgcolor: 'background.paper',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          zIndex: 1000,
          borderRadius: '16px 16px 0 0',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.9)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        {/* Album Art Placeholder */}
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '8px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          {currentSong.title.charAt(0)}
        </Box>

        {/* Song Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle1" 
            noWrap
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1.1rem'
            }}
          >
            {currentSong.title}
          </Typography>
          <Typography 
            variant="body2" 
            noWrap
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.9rem'
            }}
          >
            {currentSong.artist}
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handlePrevious} 
            color="primary"
            sx={{ 
              '&:hover': { 
                transform: 'scale(1.1)',
                transition: 'transform 0.2s'
              }
            }}
          >
            <SkipPrevious />
          </IconButton>
          <IconButton 
            onClick={handlePlayPause} 
            color="primary"
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { 
                bgcolor: 'primary.dark',
                transform: 'scale(1.1)',
                transition: 'all 0.2s'
              }
            }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton 
            onClick={handleNext} 
            color="primary"
            sx={{ 
              '&:hover': { 
                transform: 'scale(1.1)',
                transition: 'transform 0.2s'
              }
            }}
          >
            <SkipNext />
          </IconButton>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ flex: 2, mx: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45 }}>
            {formatTime((progress / 100) * (player?.getCurrentState()?.duration || 0))}
          </Typography>
          <Slider
            value={progress}
            onChange={handleProgressChange}
            aria-label="song progress"
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': {
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgb(255 255 255 / 16%)',
                },
                '&.Mui-active': {
                  width: 20,
                  height: 20,
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45 }}>
            {formatTime(player?.getCurrentState()?.duration || 0)}
          </Typography>
        </Box>

        {/* Volume Control */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
          <IconButton onClick={handleMuteToggle} color="primary">
            {isMuted ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            aria-label="volume"
            sx={{
              color: 'primary.main',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': {
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0px 0px 0px 8px rgb(255 255 255 / 16%)',
                },
                '&.Mui-active': {
                  width: 20,
                  height: 20,
                },
              },
            }}
          />
        </Box>
      </Paper>
    </Fade>
  );
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default MusicPlayer; 
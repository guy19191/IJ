import { useState, useRef, useEffect } from 'react'
import { useMusicStore } from '../stores/musicStore'
import { useAuthStore } from '../stores/authStore'

interface MusicPlayerProps {
  eventId: string;
  initialPlaylist: any[];
  onPlaylistUpdate: () => void;
}

export default function MusicPlayer(_props: MusicPlayerProps) {
  const { currentTrack, isPlaying, togglePlay, setCurrentTime, currentTime, duration } = useMusicStore()
  const { user } = useAuthStore()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [volume, setVolume] = useState(1)

  if (!user?.accessToken) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">Please connect your music provider to use the player</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!user?.accessToken) {
      console.error('No access token found')
      return
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack, user])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h3 className="font-medium text-gray-900">{currentTrack.title}</h3>
            <p className="text-sm text-gray-500">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {}}
      />
    </div>
  )
} 
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand } from 'react-icons/fa';

// Constante global para duração máxima de destaques
export const MAX_HIGHLIGHT_DURATION = 30; // 30 segundos

interface OptimizedVideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  storiesMode?: boolean; // Modo especial para stories
  showAudioControls?: boolean; // Forçar exibição dos controles de áudio
  maxDuration?: number; // Duração máxima em segundos (padrão: 30s)
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onCanPlay?: () => void;
  onError?: (error: any) => void;
  onStalled?: () => void;
  onSuspend?: () => void;
  onDurationDetected?: (duration: number) => void; // Callback quando duração é detectada
  style?: React.CSSProperties;
}

interface VideoMetadata {
  width: number;
  height: number;
  isLandscape: boolean;
  aspectRatio: number;
}

const OptimizedVideoPlayer: React.FC<OptimizedVideoPlayerProps> = ({
  src,
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true,
  storiesMode = false,
  showAudioControls = false,
  maxDuration = MAX_HIGHLIGHT_DURATION,
  onLoadStart,
  onLoadedData,
  onCanPlay,
  onError,
  onStalled,
  onSuspend,
  onDurationDetected,
  style
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [effectiveDuration, setEffectiveDuration] = useState<number>(maxDuration);
  const [originalDuration, setOriginalDuration] = useState<number>(0);

  // Detectar orientação e duração do vídeo quando carregado
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const isLandscape = width > height;
      const aspectRatio = width / height;
      const videoDuration = video.duration;

      // Calcular duração efetiva (máximo 30 segundos)
      const calculatedDuration = Math.min(videoDuration, maxDuration);

      setVideoMetadata({
        width,
        height,
        isLandscape,
        aspectRatio
      });

      setOriginalDuration(videoDuration);
      setEffectiveDuration(calculatedDuration);

      // Notificar componente pai sobre a duração detectada
      onDurationDetected?.(calculatedDuration);

      console.log('🎬 [OptimizedVideoPlayer] Metadados do vídeo:', {
        width,
        height,
        isLandscape,
        aspectRatio: aspectRatio.toFixed(2),
        orientation: isLandscape ? 'Paisagem' : 'Retrato',
        originalDuration: videoDuration.toFixed(2) + 's',
        effectiveDuration: calculatedDuration.toFixed(2) + 's',
        isClipped: videoDuration > maxDuration
      });
    }
  };

  const handleLoadStart = () => {
    console.log('🎬 [OptimizedVideoPlayer] Iniciando carregamento do vídeo');
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadedData = () => {
    console.log('✅ [OptimizedVideoPlayer] Vídeo carregado com sucesso');
    setIsLoading(false);
    onLoadedData?.();
  };

  const handleCanPlay = () => {
    console.log('✅ [OptimizedVideoPlayer] Vídeo pronto para reproduzir');
    setIsLoading(false);
    onCanPlay?.();
  };

  const handleError = (e: any) => {
    console.error('❌ [OptimizedVideoPlayer] Erro no vídeo:', e);
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const enterFullscreen = () => {
    const video = videoRef.current;
    if (video && video.requestFullscreen) {
      video.requestFullscreen().catch(console.error);
    }
  };

  // Calcular estilos para letterbox (barras pretas)
  const getVideoContainerStyle = (): React.CSSProperties => {
    if (!videoMetadata) {
      return { width: '100%', height: '100%' };
    }

    const containerAspectRatio = 9 / 16; // Formato stories (vertical)

    if (videoMetadata.isLandscape) {
      // Para vídeos em paisagem, usar letterbox
      const targetHeight = 70; // Porcentagem da altura do container

      return {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000'
      };
    }

    return {
      width: '100%',
      height: '100%'
    };
  };

  const getVideoStyle = (): React.CSSProperties => {
    if (!videoMetadata) {
      return { width: '100%', height: '100%', objectFit: 'cover' };
    }

    if (videoMetadata.isLandscape) {
      // Para vídeos paisagem, manter aspect ratio e adicionar padding
      return {
        width: '85%', // Reduzir largura para dar espaço
        height: 'auto',
        maxHeight: '70%', // Limitar altura para criar letterbox
        objectFit: 'contain', // Manter proporções sem cortar
        backgroundColor: '#000'
      };
    }

    // Para vídeos em retrato, usar cover normal
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    };
  };

  // Auto-hide controles após 3 segundos
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showControls) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls]);

  // Controle de duração máxima - pausar aos 30 segundos
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !storiesMode) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= effectiveDuration) {
        if (loop) {
          // Se loop está ativo, voltar ao início
          video.currentTime = 0;
          console.log('🔄 [OptimizedVideoPlayer] Reiniciando vídeo (limite de duração atingido)');
        } else {
          // Pausar o vídeo
          video.pause();
          setIsPlaying(false);
          console.log('⏸️ [OptimizedVideoPlayer] Vídeo pausado (limite de duração atingido)');
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [effectiveDuration, loop, storiesMode]);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{...getVideoContainerStyle(), ...style}}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => setShowControls(!showControls)}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        playsInline={playsInline}
        controls={false} // Sempre falso, usamos controles customizados
        style={getVideoStyle()}
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onStalled={onStalled}
        onSuspend={onSuspend}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-[#7ad38e] border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center text-white text-center px-4">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-medium mb-2">Erro ao carregar vídeo</p>
            <p className="text-sm opacity-90">O vídeo não pôde ser reproduzido</p>
          </div>
        </div>
      )}

      {/* Controles customizados */}
      {(controls && showControls && !isLoading && !hasError) && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-black/70 rounded-lg p-3 flex items-center justify-between">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="text-white hover:text-[#7ad38e] transition-colors"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="text-white hover:text-[#7ad38e] transition-colors"
            >
              {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                enterFullscreen();
              }}
              className="text-white hover:text-[#7ad38e] transition-colors"
            >
              <FaExpand size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Controles de áudio para stories (sempre visível) */}
      {(storiesMode || showAudioControls) && !isLoading && !hasError && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                backdrop-blur-sm border border-white/20 transition-all duration-200
                hover:scale-110 active:scale-95
                ${isMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-black/30 text-white hover:bg-black/50'
                }
              `}
              title={isMuted ? 'Ativar som (Clique para ouvir o áudio)' : 'Desativar som'}
            >
              {isMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
            </button>

            {/* Indicador de áudio desabilitado */}
            {isMuted && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse"></div>
            )}
          </div>
        </div>
      )}

      {/* Indicador de orientação (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && videoMetadata && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {videoMetadata.isLandscape ? '📱 Paisagem' : '📱 Retrato'}
          {' '}({videoMetadata.aspectRatio.toFixed(2)})
        </div>
      )}
    </div>
  );
};

export default OptimizedVideoPlayer;
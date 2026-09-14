import React, { useEffect, useState } from 'react';

export function ExerciseMediaPreview({ exerciseName, videoUrl, compact = false, onClose, style }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    if (!videoUrl) return;

    const interval = setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, 1200);

    return () => clearInterval(interval);
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div
        style={{
          minHeight: 180,
          height: 180,
          flexShrink: 0,
          backgroundColor: '#121216',
          border: '1px solid #27272a',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#71717a',
          position: 'relative',
          ...style,
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              color: '#71717a',
              fontSize: 14,
              cursor: 'pointer',
            }}
            title="Close"
          >
            ✕
          </button>
        )}
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.8px' }}>NO MEDIA CONFIGURED</div>
        <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 6 }}>{exerciseName}</div>
      </div>
    );
  }

  const frameUrl = videoUrl.replace('/0.jpg', `/${frame}.jpg`);
  const previewHeight = compact ? 200 : 340;

  return (
    <div
      style={{
        minHeight: previewHeight,
        height: previewHeight,
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#0d0d11',
        border: '1px solid #27272a',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Top Header Bar - Not overlapping the motion frames */}
      <div
        style={{
          backgroundColor: '#141418',
          borderBottom: '1px solid #222227',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#ffffff', fontSize: 11, fontWeight: 900, letterSpacing: '0.8px' }}>
            {exerciseName?.toUpperCase()}
          </span>
          <span style={{ color: '#71717a', fontSize: 10, fontWeight: 700 }}>
            / MOTION DEMO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setFrame(0)}
            style={{
              backgroundColor: frame === 0 ? '#ffffff' : '#1f1f25',
              color: frame === 0 ? '#09090b' : '#a1a1aa',
              border: '1px solid',
              borderColor: frame === 0 ? '#ffffff' : '#27272a',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 9,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            FRAME 1
          </button>
          <button
            onClick={() => setFrame(1)}
            style={{
              backgroundColor: frame === 1 ? '#ffffff' : '#1f1f25',
              color: frame === 1 ? '#09090b' : '#a1a1aa',
              border: '1px solid',
              borderColor: frame === 1 ? '#ffffff' : '#27272a',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 9,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            FRAME 2
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                color: '#71717a',
                fontSize: 14,
                marginLeft: 6,
                padding: '2px 6px',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close preview"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Frame Visual Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          padding: 8,
          overflow: 'hidden',
        }}
      >
        <img
          key={frameUrl}
          src={frameUrl}
          alt={exerciseName}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: 6,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

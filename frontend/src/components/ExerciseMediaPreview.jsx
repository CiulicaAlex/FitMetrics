import React, { useEffect, useState } from 'react';

export function ExerciseMediaPreview({ exercise, exerciseName, videoUrl, compact = false, onClose, style }) {
  const [frame, setFrame] = useState(0);

  const name = exerciseName || exercise?.name || exercise?.exerciseName || 'Exercise';
  const url = videoUrl || exercise?.videoUrl || exercise?.video || exercise?.gifUrl || exercise?.url || '';

  const isGif = url.toLowerCase().includes('.gif');

  useEffect(() => {
    setFrame(0);
    if (!url || isGif) return;

    const interval = setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, 1200);

    return () => clearInterval(interval);
  }, [url, isGif]);

  if (!url) {
    return (
      <div
        className="media-preview media-preview-empty"
        style={{
          minHeight: compact ? 150 : 200,
          height: compact ? 150 : 200,
          flexShrink: 0,
          backgroundColor: '#121216',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          position: 'relative',
          padding: 16,
          ...style,
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              color: 'var(--text-muted)',
              fontSize: 14,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
            title="Close"
          >
            ✕
          </button>
        )}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
          NO MEDIA CONFIGURED
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
          {name}
        </div>
      </div>
    );
  }

  const frameUrl = url.includes('/0.jpg') ? url.replace('/0.jpg', `/${frame}.jpg`) : url;
  const previewHeight = compact ? 220 : 320;

  return (
    <div
      className={`media-preview${compact ? ' media-preview-compact' : ''}`}
      style={{
        minHeight: previewHeight,
        height: previewHeight,
        flexShrink: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#000000',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        ...style,
      }}
    >
      {/* Top Header Bar */}
      <div
        className="media-preview-header"
        style={{
          backgroundColor: '#161618',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <span style={{ color: '#8e8e93', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
            • DEMO
          </span>
        </div>

        <div className="media-preview-controls" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isGif ? (
            <span
              style={{
                backgroundColor: 'rgba(48, 209, 88, 0.18)',
                color: 'var(--accent-green)',
                border: '1px solid rgba(48, 209, 88, 0.35)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.4px',
              }}
            >
              ANIMATED GIF
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFrame(0)}
                style={{
                  backgroundColor: frame === 0 ? '#ff2d55' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                F1
              </button>
              <button
                type="button"
                onClick={() => setFrame(1)}
                style={{
                  backgroundColor: frame === 1 ? '#ff2d55' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                F2
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                color: '#8e8e93',
                fontSize: 13,
                marginLeft: 4,
                padding: '2px 6px',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
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
          backgroundColor: '#000000',
          padding: 6,
          overflow: 'hidden',
        }}
      >
        <img
          key={frameUrl}
          src={frameUrl}
          alt={`${name} exercise demonstration animation`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (frameUrl.includes('/1.jpg')) {
              e.target.src = url;
            }
          }}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: 8,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

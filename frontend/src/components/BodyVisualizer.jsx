import React, { useEffect, useRef, useState } from 'react';
import Model from 'react-body-highlighter';

// react-body-highlighter does not expose a hover callback, but its SVG muscle
// order is stable. We use that order to add accessible native labels and a
// small follow-the-cursor tooltip without changing the library itself.
const MUSCLE_ORDER = {
  anterior: [
    'chest',
    'obliques',
    'abs',
    'biceps',
    'triceps',
    'neck',
    'front-deltoids',
    'head',
    'abductors',
    'quadriceps',
    'knees',
    'calves',
    'forearm',
  ],
  posterior: [
    'head',
    'trapezius',
    'back-deltoids',
    'upper-back',
    'triceps',
    'lower-back',
    'forearm',
    'gluteal',
    'adductor',
    'hamstring',
    'knees',
    'calves',
    'left-soleus',
    'right-soleus',
  ],
};

const MUSCLE_LABELS = {
  chest: 'Chest',
  obliques: 'Obliques',
  abs: 'Abs',
  biceps: 'Biceps',
  triceps: 'Triceps',
  neck: 'Neck',
  'front-deltoids': 'Front Deltoids',
  'back-deltoids': 'Rear Deltoids',
  head: 'Head',
  abductors: 'Abductors',
  adductor: 'Adductors',
  quadriceps: 'Quadriceps',
  hamstring: 'Hamstrings',
  calves: 'Calves',
  forearm: 'Forearms',
  trapezius: 'Trapezius',
  'upper-back': 'Upper Back',
  'lower-back': 'Lower Back',
  gluteal: 'Glutes',
  knees: 'Knees',
  'left-soleus': 'Soleus',
  'right-soleus': 'Soleus',
};

export default function BodyVisualizer({ type, data, bodyColor, highlightedColors, style, svgStyle }) {
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const view = type === 'posterior' ? 'posterior' : 'anterior';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const polygons = Array.from(container.querySelectorAll('polygon'));
    const muscleOrder = MUSCLE_ORDER[view] || [];
    const cleanups = polygons.map((polygon, index) => {
      const muscle = muscleOrder[index] || 'muscle';
      const label = MUSCLE_LABELS[muscle] || muscle;
      polygon.setAttribute('aria-label', label);
      polygon.setAttribute('title', label);

      const handleMouseMove = (event) => {
        const bounds = container.getBoundingClientRect();
        setTooltip({
          label,
          x: event.clientX - bounds.left + 12,
          y: event.clientY - bounds.top - 12,
        });
      };
      const handleMouseLeave = () => setTooltip(null);

      polygon.addEventListener('mousemove', handleMouseMove);
      polygon.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        polygon.removeEventListener('mousemove', handleMouseMove);
        polygon.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      setTooltip(null);
    };
  }, [view]);

  return (
    <div ref={containerRef} style={{ ...style, position: 'relative' }}>
      <Model
        data={data}
        type={view}
        bodyColor={bodyColor}
        highlightedColors={highlightedColors}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        svgStyle={svgStyle}
      />
      {tooltip && (
        <div
          role="status"
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-100%)',
            pointerEvents: 'none',
            zIndex: 10,
            backgroundColor: '#09090b',
            border: '1px solid #10b981',
            borderRadius: 6,
            color: '#ffffff',
            padding: '7px 10px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}

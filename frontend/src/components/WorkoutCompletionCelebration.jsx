import React, { useEffect, useRef, useState } from 'react';

// Progression tiers matching Apple Fitness tier styling
export const MUSCLE_TIERS = [
  { name: 'Beginner', minXp: 0, color: '#8e8e93', rankIndex: 1, title: 'Cadet' },
  { name: 'Novice', minXp: 1200, color: '#00c7be', rankIndex: 2, title: 'Adept' },
  { name: 'Intermediate', minXp: 4000, color: '#30d158', rankIndex: 3, title: 'Warrior' },
  { name: 'Advanced', minXp: 10000, color: '#ffd60a', rankIndex: 4, title: 'Gladiator' },
  { name: 'Expert', minXp: 22000, color: '#ff9f0a', rankIndex: 5, title: 'Champion' },
  { name: 'Elite', minXp: 45000, color: '#ff375f', rankIndex: 6, title: 'Hero' },
  { name: 'Master', minXp: 75000, color: '#bf5af2', rankIndex: 7, title: 'Titan' },
];

export const MUSCLE_COLORS = {
  CHEST: '#ff2d55', // Apple Crimson Move Red
  'UPPER BACK': '#007aff', // System Blue
  'LOWER BACK': '#5856d6', // Indigo
  BACK: '#007aff',
  LATS: '#007aff',
  TRAPS: '#34c759', // Emerald
  SHOULDERS: '#ff9500', // Amber Orange
  DELTOIDS: '#ff9500',
  ABS: '#00c7be', // Stand Cyan
  CORE: '#00c7be',
  OBLIQUES: '#30d158', // Green
  BICEPS: '#af52de', // Purple
  TRICEPS: '#bf5af2', // Violet
  ARMS: '#af52de',
  FOREARMS: '#ffd60a', // Gold
  GLUTES: '#ff6482', // Rose Pink
  QUADRICEPS: '#32d74b', // Mint Green
  LEGS: '#32d74b',
  HAMSTRINGS: '#ff3b30', // Coral Red
  CALVES: '#64d2ff', // Sky Blue
  NECK: '#ac8e68', // Warm Stone
};

export const MUSCLE_XP_MULTIPLIERS = {
  // Heavy Primary Compound Groups (Bench Press, Squats, Deadlifts, Rows, Leg Press)
  CHEST: 3.5,
  BACK: 3.5,
  'UPPER BACK': 3.5,
  'LOWER BACK': 3.5,
  LATS: 3.5,
  LEGS: 3.5,
  QUADRICEPS: 3.5,
  HAMSTRINGS: 3.5,
  GLUTES: 3.5,

  // Medium Compound Groups (Overhead Press, Shrugs, Abs, Core)
  SHOULDERS: 2.0,
  DELTOIDS: 2.0,
  TRAPS: 2.0,
  ABS: 2.0,
  CORE: 2.0,
  OBLIQUES: 2.0,

  // Smaller Isolation Groups (Biceps, Triceps, Calves, Forearms, Neck)
  BICEPS: 1.0,
  TRICEPS: 1.0,
  ARMS: 1.0,
  CALVES: 1.0,
  FOREARMS: 1.0,
  NECK: 1.0,
};

export function getMuscleTiers(muscleGroupName = '') {
  const key = (muscleGroupName || '').toUpperCase().trim();
  const multiplier = MUSCLE_XP_MULTIPLIERS[key] || 1.0;
  return MUSCLE_TIERS.map((tier) => ({
    ...tier,
    minXp: Math.round(tier.minXp * multiplier),
  }));
}

export function getMuscleRankInfo(xp, muscleGroupName = '') {
  const tiers = getMuscleTiers(muscleGroupName);

  let tierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].minXp) {
      tierIndex = i;
      break;
    }
  }
  const currentTier = tiers[tierIndex];
  const nextTier = tiers[tierIndex + 1] || null;
  const rankNumber = tierIndex + 1;

  let progress = 1;
  let xpToNext = 0;
  if (nextTier) {
    const range = nextTier.minXp - currentTier.minXp;
    const into = xp - currentTier.minXp;
    progress = Math.min(Math.max(into / range, 0), 1);
    xpToNext = nextTier.minXp - xp;
  }

  return {
    tierIndex,
    rankNumber,
    name: currentTier.name,
    title: currentTier.title,
    color: currentTier.color,
    progress,
    xpToNext,
    currentTier,
    nextTier,
    tiers,
  };
}

export default function WorkoutCompletionCelebration({
  isOpen,
  onClose,
  workoutName = 'Workout Session',
  totalXpEarned = 350,
  muscleGroups = [],
  onFinish,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const xpPoolRef = useRef(null);
  const cardRefs = useRef({});

  // Animation states: 'intro' -> 'transferring' -> 'completed'
  const [phase, setPhase] = useState('intro');
  const [displayPoolXp, setDisplayPoolXp] = useState(totalXpEarned);
  const [cardProgressMap, setCardProgressMap] = useState({});
  const [impactingCards, setImpactingCards] = useState({});

  // Formatted muscle data with base and new XP
  const enrichedGroups = React.useMemo(() => {
    if (!muscleGroups || muscleGroups.length === 0) {
      return [
        {
          name: 'CHEST',
          baseXp: 3000,
          earnedXp: totalXpEarned,
          color: MUSCLE_COLORS.CHEST,
        },
      ];
    }

    return muscleGroups.map((mg) => {
      const nameUpper = (mg.name || mg.muscleGroup || 'CHEST').toUpperCase();
      const earned = Math.min(15000, Math.max(0, Number(mg.earnedXp || mg.xp || Math.round(totalXpEarned / muscleGroups.length))));
      const base = Math.min(100000, Math.max(0, Number(mg.baseXp ?? 3000)));
      const newXp = base + earned;
      const prevRank = getMuscleRankInfo(base, nameUpper);
      const newRank = getMuscleRankInfo(newXp, nameUpper);
      const rankedUp = newRank.rankNumber > prevRank.rankNumber;

      return {
        name: nameUpper,
        baseXp: base,
        earnedXp: earned,
        newXp,
        prevRank,
        newRank,
        rankedUp,
        color: mg.color || MUSCLE_COLORS[nameUpper] || '#007aff',
        isDailyCapped: Boolean(mg.isDailyCapped),
      };
    });
  }, [muscleGroups, totalXpEarned]);

  // Initialize display states when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setPhase('intro');
    setDisplayPoolXp(totalXpEarned);

    const initialMap = {};
    enrichedGroups.forEach((g) => {
      initialMap[g.name] = {
        currentXp: g.baseXp,
        progress: g.prevRank.progress,
      };
    });
    setCardProgressMap(initialMap);

    // After brief 550ms intro delay, start particle transfer
    const timer = setTimeout(() => {
      setPhase('transferring');
    }, 550);

    return () => clearTimeout(timer);
  }, [isOpen, enrichedGroups, totalXpEarned]);

  // Particle simulation loop
  useEffect(() => {
    if (!isOpen || phase !== 'transferring') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = null;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const particles = [];
    const sparkParticles = [];
    let startTimestamp = null;
    const duration = 2400; // 2.4 seconds smooth migration duration

    const getPositions = () => {
      let source = { x: window.innerWidth / 2, y: 110 };
      if (xpPoolRef.current) {
        const pRect = xpPoolRef.current.getBoundingClientRect();
        source = {
          x: pRect.left + pRect.width / 2,
          y: pRect.top + pRect.height / 2,
        };
      }

      const targets = {};
      enrichedGroups.forEach((g) => {
        const el = cardRefs.current[g.name];
        if (el) {
          const cRect = el.getBoundingClientRect();
          targets[g.name] = {
            x: cRect.left + cRect.width / 2,
            y: cRect.top + cRect.height / 2,
          };
        } else {
          targets[g.name] = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }
      });

      return { source, targets };
    };

    const render = (time) => {
      if (!startTimestamp) startTimestamp = time;
      const elapsed = time - startTimestamp;
      const linearProgress = Math.min(elapsed / duration, 1);

      // Smooth cubic ease-in-out
      const easeProgress = linearProgress < 0.5
        ? 4 * linearProgress * linearProgress * linearProgress
        : 1 - Math.pow(-2 * linearProgress + 2, 3) / 2;

      // Update remaining XP counter
      const remaining = Math.max(0, Math.round(totalXpEarned * (1 - easeProgress)));
      setDisplayPoolXp(remaining);

      // Update each muscle group card XP & progress bar
      setCardProgressMap((prev) => {
        const next = { ...prev };
        enrichedGroups.forEach((g) => {
          const currentXp = Math.round(g.baseXp + g.earnedXp * easeProgress);
          const currentRankInfo = getMuscleRankInfo(currentXp, g.name);
          next[g.name] = {
            currentXp,
            progress: currentRankInfo.progress,
            rankName: currentRankInfo.name,
            rankNumber: currentRankInfo.rankNumber,
          };
        });
        return next;
      });

      const { source, targets } = getPositions();

      // Spawn new particles from source while transferring
      if (linearProgress < 0.9) {
        enrichedGroups.forEach((g) => {
          const target = targets[g.name] || source;
          const spawnCount = Math.ceil(3 * (1 - linearProgress));

          for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const initialSpeed = 2.5 + Math.random() * 4.5;
            particles.push({
              x: source.x + (Math.random() - 0.5) * 20,
              y: source.y + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * initialSpeed,
              vy: Math.sin(angle) * initialSpeed,
              targetX: target.x,
              targetY: target.y,
              color: g.color,
              group: g.name,
              radius: 3 + Math.random() * 3,
              alpha: 1,
              life: 0,
              maxLife: 50 + Math.floor(Math.random() * 20),
              trail: [],
            });
          }
        });
      }

      // Clear canvas for this frame
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Update & render main flying particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Save trail history
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        // Gravitational steering toward target card center
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          const pull = 0.6 + Math.min(p.life * 0.03, 1.2);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;

          // Organic turbulence
          p.vx += Math.sin(p.life * 0.25) * 0.35;
          p.vy += Math.cos(p.life * 0.25) * 0.35;

          // Friction damping
          p.vx *= 0.94;
          p.vy *= 0.94;

          p.x += p.vx;
          p.y += p.vy;
        }

        // Render trail ribbon
        if (p.trail.length > 1) {
          for (let t = 0; t < p.trail.length - 1; t++) {
            const tRatio = (t + 1) / p.trail.length;
            ctx.beginPath();
            ctx.moveTo(p.trail[t].x, p.trail[t].y);
            ctx.lineTo(p.trail[t + 1].x, p.trail[t + 1].y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = p.alpha * tRatio * 0.45;
            ctx.lineWidth = p.radius * tRatio * 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // Render particle head
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arrival at target card center
        if (dist < 26 || p.life > p.maxLife) {
          particles.splice(i, 1);

          // Spawn impact sparks
          for (let s = 0; s < 4; s++) {
            const sAngle = Math.random() * Math.PI * 2;
            const sSpeed = 1.5 + Math.random() * 3.5;
            sparkParticles.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(sAngle) * sSpeed,
              vy: Math.sin(sAngle) * sSpeed,
              color: p.color,
              radius: 1.5 + Math.random() * 2,
              alpha: 1,
              life: 0,
              maxLife: 16 + Math.floor(Math.random() * 12),
            });
          }

          // Trigger brief impact pulse on card
          setImpactingCards((prev) => ({ ...prev, [p.group]: true }));
          setTimeout(() => {
            setImpactingCards((prev) => ({ ...prev, [p.group]: false }));
          }, 120);
        }
      }

      // Update & render impact sparks
      for (let s = sparkParticles.length - 1; s >= 0; s--) {
        const sp = sparkParticles[s];
        sp.life++;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.92;
        sp.vy *= 0.92;
        sp.alpha = Math.max(0, 1 - sp.life / sp.maxLife);

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (sp.life >= sp.maxLife) {
          sparkParticles.splice(s, 1);
        }
      }

      ctx.globalAlpha = 1;

      if (linearProgress < 1 || particles.length > 0 || sparkParticles.length > 0) {
        animId = requestAnimationFrame(render);
      } else {
        // Migration complete!
        setPhase('completed');
        setDisplayPoolXp(0);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, phase, enrichedGroups, totalXpEarned]);

  if (!isOpen) return null;

  const handleExit = () => {
    if (onFinish) onFinish();
    onClose();
  };

  const cardCountClass =
    enrichedGroups.length === 1
      ? 'single-card'
      : enrichedGroups.length === 2
      ? 'double-card'
      : 'multi-card';

  return (
    <div ref={containerRef} className="celebration-overlay">
      <style>{`
        .celebration-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          z-index: 100000;
          padding: 14px 16px;
          box-sizing: border-box;
          overflow: hidden !important;
          height: 100dvh;
          max-height: 100dvh;
          width: 100vw;
        }

        .celebration-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 6px;
          z-index: 20;
          flex-shrink: 0;
        }

        .celebration-eyebrow-main {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 3px;
        }

        .celebration-pool-pill {
          padding: 5px 18px;
          border-radius: 9999px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .celebration-pool-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .celebration-pool-val {
          font-size: 18px;
          font-weight: 900;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.5px;
        }

        .celebration-cards-container {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 440px;
          z-index: 20;
          margin: 0 auto;
          flex: 1 1 0;
          min-height: 0;
        }

        .celebration-card {
          width: 100%;
          box-sizing: border-box;
          background-color: var(--bg-card);
          border-radius: 16px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          flex: 1 1 0;
          min-height: 0;
          max-height: 160px;
          justify-content: center;
          transition: transform 0.12s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .celebration-card.single-card {
          max-height: 280px;
        }
        .celebration-card.double-card {
          max-height: 210px;
        }

        .celebration-card-eyebrow {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 2px;
          z-index: 2;
          line-height: 1;
        }

        .celebration-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.04);
          border-style: solid;
          border-width: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          z-index: 2;
          flex-shrink: 0;
          transition: transform 0.12s ease, box-shadow 0.2s ease;
        }

        .celebration-badge-svg {
          width: 20px;
          height: 20px;
        }

        .celebration-card-title {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.3px;
          margin: 0 0 1px;
          color: var(--text-primary);
          z-index: 2;
          line-height: 1.1;
        }

        .celebration-card-subtitle {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 0 0 4px;
          max-width: 290px;
          line-height: 1.2;
          z-index: 2;
        }

        .celebration-rank-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          margin-bottom: 4px;
          z-index: 2;
          width: 100%;
          max-width: 320px;
          box-sizing: border-box;
          font-size: 11px;
        }

        .celebration-pill-text-prev {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
        }

        .celebration-pill-text-next {
          font-size: 11px;
          font-weight: 900;
          color: #ffffff;
        }

        .celebration-pill-text-current {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .celebration-pill-text-sub {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .celebration-progress-block {
          width: 100%;
          max-width: 320px;
          z-index: 2;
        }

        .celebration-progress-track {
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background-color: var(--bg-input);
          overflow: hidden;
          border: 0.5px solid var(--border-subtle);
        }

        .celebration-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: var(--text-muted);
          margin-top: 2px;
          font-weight: 600;
        }

        .celebration-close-wrapper {
          margin-top: 8px;
          z-index: 20;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .celebration-close-btn {
          padding: 10px 48px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 800;
          min-width: 160px;
          background-color: var(--text-primary);
          color: var(--bg-main);
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          transition: transform 0.15s ease, opacity 0.15s ease;
        }

        /* Desktop layout (>= 768px) */
        @media (min-width: 768px) {
          .celebration-overlay {
            justify-content: center;
            padding: 24px 20px;
            overflow-y: auto !important;
            height: 100vh;
            max-height: 100vh;
          }

          .celebration-header {
            margin-bottom: 24px;
          }

          .celebration-eyebrow-main {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .celebration-pool-pill {
            padding: 8px 26px;
            gap: 12px;
          }

          .celebration-pool-label {
            font-size: 12px;
          }

          .celebration-pool-val {
            font-size: 26px;
          }

          .celebration-cards-container {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 20px;
            flex: initial;
            max-width: 1120px;
            min-height: auto;
          }

          .celebration-card {
            width: min(350px, 92vw);
            max-width: 380px;
            border-radius: 28px;
            padding: 32px 28px 28px;
            flex: initial;
            max-height: none !important;
            justify-content: flex-start;
          }

          .celebration-card-eyebrow {
            font-size: 11px;
            letter-spacing: 1.4px;
            margin-bottom: 16px;
          }

          .celebration-badge {
            width: 92px;
            height: 92px;
            border-width: 2.5px;
            margin-bottom: 18px;
          }

          .celebration-badge-svg {
            width: 44px;
            height: 44px;
          }

          .celebration-card-title {
            font-size: 24px;
            margin: 0 0 6px;
            letter-spacing: -0.5px;
          }

          .celebration-card-subtitle {
            font-size: 13px;
            margin: 0 0 18px;
            line-height: 1.4;
          }

          .celebration-rank-pill {
            padding: 10px 18px;
            gap: 10px;
            margin-bottom: 18px;
            max-width: 100%;
            font-size: 13px;
          }

          .celebration-pill-text-prev {
            font-size: 13px;
          }

          .celebration-pill-text-next {
            font-size: 13px;
          }

          .celebration-pill-text-current {
            font-size: 13px;
          }

          .celebration-pill-text-sub {
            font-size: 11px;
          }

          .celebration-progress-block {
            max-width: 100%;
          }

          .celebration-progress-track {
            height: 6px;
          }

          .celebration-progress-labels {
            font-size: 10px;
            margin-top: 5px;
          }

          .celebration-close-wrapper {
            margin-top: 24px;
          }

          .celebration-close-btn {
            padding: 13px 48px;
            font-size: 15px;
            min-width: 180px;
          }
        }
      `}</style>

      {/* Full-screen particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Central XP Source Pool / Ribbon */}
      <div ref={xpPoolRef} className="celebration-header">
        <div className="celebration-eyebrow-main">
          WORKOUT COMPLETED • {workoutName.toUpperCase()}
        </div>

        <div
          className="celebration-pool-pill"
          style={{
            boxShadow:
              displayPoolXp > 0
                ? '0 0 32px rgba(255, 255, 255, 0.14), inset 0 0 16px rgba(255, 255, 255, 0.05)'
                : 'none',
          }}
        >
          <span className="celebration-pool-label">
            {displayPoolXp > 0 ? 'TOTAL XP' : 'ALLOCATED'}
          </span>
          <span className="celebration-pool-val">
            {displayPoolXp > 0 ? `+${displayPoolXp.toLocaleString()}` : '✓ Finished'}
          </span>
        </div>
      </div>

      {/* Centered Muscle Cards Grid / Stack */}
      <div
        className="celebration-cards-container"
        style={{
          maxWidth:
            enrichedGroups.length === 1
              ? 400
              : enrichedGroups.length === 2
              ? 780
              : 1120,
        }}
      >
        {enrichedGroups.map((group) => {
          const cardData = cardProgressMap[group.name] || {
            currentXp: group.baseXp,
            progress: group.prevRank.progress,
          };
          const currentRank = getMuscleRankInfo(cardData.currentXp, group.name);
          const isImpacting = impactingCards[group.name];
          const isRankedUp = group.rankedUp && currentRank.rankNumber > group.prevRank.rankNumber;

          return (
            <div
              key={group.name}
              ref={(el) => (cardRefs.current[group.name] = el)}
              className={`ios-card celebration-card ${cardCountClass}`}
              style={{
                border: isRankedUp
                  ? `2px solid ${group.color}`
                  : isImpacting
                  ? `1.5px solid ${group.color}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isRankedUp
                  ? `0 24px 64px rgba(0, 0, 0, 0.65), 0 0 32px ${group.color}44`
                  : isImpacting
                  ? `0 24px 64px rgba(0, 0, 0, 0.6), 0 0 20px ${group.color}33`
                  : '0 24px 64px rgba(0, 0, 0, 0.55)',
                transform: isImpacting ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Background ambient glow if ranked up */}
              {isRankedUp && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 280,
                    height: 280,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${group.color}28 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Eyebrow Label */}
              <div
                className="celebration-card-eyebrow"
                style={{
                  color: isRankedUp ? group.color : 'var(--text-muted)',
                }}
              >
                {isRankedUp ? 'RANK UP ACHIEVED' : 'MUSCLE PROGRESSION'}
              </div>

              {/* Center Iconic Metallic Badge */}
              <div
                className="celebration-badge"
                style={{
                  borderColor: group.color,
                  boxShadow: isRankedUp
                    ? `0 0 36px ${group.color}88, inset 0 0 18px ${group.color}44`
                    : `0 0 24px ${group.color}44, inset 0 0 12px ${group.color}22`,
                  transform: isImpacting ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <svg className="celebration-badge-svg" viewBox="0 0 24 24" fill={group.color}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>

              {/* Muscle Group Title */}
              <h2 className="celebration-card-title">
                {isRankedUp ? `${group.name} Ascended!` : group.name}
              </h2>

              {/* XP Gains Subtitle */}
              <p className="celebration-card-subtitle">
                <strong style={{ color: 'var(--text-primary)' }}>+{group.earnedXp} XP</strong> gained • Total{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{cardData.currentXp.toLocaleString()} XP</strong>
              </p>

              {/* Red Daily Cap Alert if XP capped */}
              {group.isDailyCapped && (
                <div
                  style={{
                    marginTop: 4,
                    marginBottom: 6,
                    padding: '4px 10px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 45, 85, 0.12)',
                    border: '1px solid rgba(255, 45, 85, 0.35)',
                    color: '#ff2d55',
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ff2d55', display: 'inline-block' }} />
                  <span>DAILY XP CAP REACHED FOR THIS MUSCLE GROUP</span>
                </div>
              )}

              {/* Rank Evolution Pill */}
              <div
                className="celebration-rank-pill"
                style={{
                  backgroundColor: isRankedUp ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-input)',
                  border: isRankedUp ? `1px solid ${group.color}55` : '1px solid var(--border-subtle)',
                }}
              >
                {isRankedUp ? (
                  <>
                    <span className="celebration-pill-text-prev">
                      {group.prevRank.name} (Rank {group.prevRank.rankNumber})
                    </span>
                    <span style={{ fontSize: 'inherit', fontWeight: 800, color: group.color }}>➔</span>
                    <span className="celebration-pill-text-next">
                      {group.newRank.name} (Rank {group.newRank.rankNumber})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="celebration-pill-text-current">
                      {currentRank.name} (Rank {currentRank.rankNumber})
                    </span>
                    <span className="celebration-pill-text-sub">
                      {currentRank.nextTier
                        ? `• ${currentRank.xpToNext.toLocaleString()} XP to Next`
                        : '• Maximum Tier'}
                    </span>
                  </>
                )}
              </div>

              {/* Progress Bar towards next tier */}
              <div className="celebration-progress-block">
                <div className="celebration-progress-track">
                  <div
                    style={{
                      width: `${Math.round(cardData.progress * 100)}%`,
                      height: '100%',
                      backgroundColor: group.color,
                      borderRadius: 999,
                      transition: 'width 0.15s linear',
                    }}
                  />
                </div>
                <div className="celebration-progress-labels">
                  <span>{currentRank.name}</span>
                  <span>{Math.round(cardData.progress * 100)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Bottom Close Button */}
      <div className="celebration-close-wrapper">
        <button
          type="button"
          onClick={handleExit}
          className="ios-button-primary celebration-close-btn"
        >
          Close
        </button>
      </div>
    </div>
  );
}

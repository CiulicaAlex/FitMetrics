import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Model from 'react-body-highlighter';
import Navbar from '../components/Navbar';
import { fetchApi } from '../api';

const initialMuscleGroups = [
  { name: 'CHEST', xp: 0, slugs: ['chest'] },
  { name: 'UPPER BACK', xp: 0, slugs: ['upper-back'] },
  { name: 'LOWER BACK', xp: 0, slugs: ['lower-back'] },
  { name: 'TRAPS', xp: 0, slugs: ['trapezius'] },
  { name: 'SHOULDERS', xp: 0, slugs: ['front-deltoids', 'back-deltoids'] },
  { name: 'ABS', xp: 0, slugs: ['abs'] },
  { name: 'OBLIQUES', xp: 0, slugs: ['obliques'] },
  { name: 'BICEPS', xp: 0, slugs: ['biceps'] },
  { name: 'TRICEPS', xp: 0, slugs: ['triceps'] },
  { name: 'FOREARMS', xp: 0, slugs: ['forearm'] },
  { name: 'GLUTES', xp: 0, slugs: ['gluteal'] },
  { name: 'QUADRICEPS', xp: 0, slugs: ['quadriceps'] },
  { name: 'HAMSTRINGS', xp: 0, slugs: ['hamstring'] },
  { name: 'CALVES', xp: 0, slugs: ['calves'] },
  { name: 'NECK', xp: 0, slugs: ['neck'] },
];

// Progression ranks with simple, realistic fitness levels.
const RANK_TIERS = [
  { name: 'Beginner', minXp: 0, color: '#71717a' },
  { name: 'Novice', minXp: 5000, color: '#22d3ee' },
  { name: 'Intermediate', minXp: 15000, color: '#22c55e' },
  { name: 'Advanced', minXp: 35000, color: '#eab308' },
  { name: 'Expert', minXp: 75000, color: '#f97316' },
  { name: 'Elite', minXp: 150000, color: '#ec4899' },
  { name: 'Master', minXp: 250000, color: '#10b981' },
];

const MASTER_TIER_MIN = 250000;
const MASTER_TIER_STEP = 50000;

function getRankInfo(totalXp) {
  if (totalXp >= MASTER_TIER_MIN) {
    const extraXp = totalXp - MASTER_TIER_MIN;
    const tierLevel = Math.floor(extraXp / MASTER_TIER_STEP) + 1;
    const xpIntoTier = extraXp % MASTER_TIER_STEP;
    const progress = xpIntoTier / MASTER_TIER_STEP;
    const xpToNext = MASTER_TIER_STEP - xpIntoTier;
    return {
      rankIndex: 6,
      name: `Master${tierLevel > 1 ? ` Tier ${tierLevel}` : ''}`,
      baseName: 'Master',
      color: '#10b981',
      progress,
      xpToNext,
      xpIntoRank: xpIntoTier,
      xpNeeded: MASTER_TIER_STEP,
      isMaster: true,
      tierLevel,
    };
  }

  let tierIndex = 0;
  for (let i = RANK_TIERS.length - 2; i >= 0; i--) {
    if (totalXp >= RANK_TIERS[i].minXp) {
      tierIndex = i;
      break;
    }
  }

  const currentTier = RANK_TIERS[tierIndex];
  const nextTier = RANK_TIERS[tierIndex + 1];
  const xpIntoRank = totalXp - currentTier.minXp;
  const xpNeeded = nextTier.minXp - currentTier.minXp;
  const progress = Math.min(xpIntoRank / xpNeeded, 1);
  const xpToNext = nextTier.minXp - totalXp;

  return {
    rankIndex: tierIndex,
    name: currentTier.name,
    baseName: currentTier.name,
    color: currentTier.color,
    progress,
    xpToNext,
    xpIntoRank,
    xpNeeded,
    isMaster: false,
    tierLevel: tierIndex + 1,
  };
}

// Muscle Tiers with balanced steep thresholds
const MUSCLE_TIERS = [
  { name: 'Beginner', minXp: 0, color: '#3f3f46' },
  { name: 'Novice', minXp: 1200, color: '#22d3ee' },
  { name: 'Intermediate', minXp: 4000, color: '#22c55e' },
  { name: 'Advanced', minXp: 10000, color: '#eab308' },
  { name: 'Expert', minXp: 22000, color: '#f97316' },
  { name: 'Elite', minXp: 45000, color: '#ec4899' },
  { name: 'Master', minXp: 75000, color: '#10b981' },
];

function getMuscleRank(xp) {
  for (let i = MUSCLE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= MUSCLE_TIERS[i].minXp) {
      return i + 1;
    }
  }
  return 1;
}

function getMuscleRankName(xp) {
  const idx = Math.min(getMuscleRank(xp) - 1, MUSCLE_TIERS.length - 1);
  return MUSCLE_TIERS[idx]?.name || 'Master';
}

function getMuscleColor(xp) {
  if (xp === 0) return '#3f3f46';
  const idx = Math.min(getMuscleRank(xp) - 1, MUSCLE_TIERS.length - 1);
  return MUSCLE_TIERS[idx]?.color || '#10b981';
}

function getRankThemeColor(rankIndex) {
  return RANK_TIERS[rankIndex]?.color || '#10b981';
}


function getBmiInfo(bmi) {
  if (!bmi || isNaN(bmi)) return { category: 'Normal Weight', color: '#10b981' };
  if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6' };
  if (bmi <= 24.9) return { category: 'Normal Weight', color: '#10b981' };
  if (bmi <= 29.9) return { category: 'Overweight', color: '#f59e0b' };
  return { category: 'Obese', color: '#ef4444' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState(initialMuscleGroups);
  const [workouts, setWorkouts] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [bodySide, setBodySide] = useState('front');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Physical stats
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(75);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newHeight, setNewHeight] = useState('180');
  const [newWeight, setNewWeight] = useState('75');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [userRes, workoutsRes] = await Promise.all([
          fetchApi('/auth/me'),
          fetchApi('/workouts'),
        ]);

        if (!userRes.ok) {
          navigate('/', { replace: true });
          return;
        }

        const userData = await userRes.json();
        if (cancelled) return;
        setUser(userData);

        let allWorkouts = [];
        if (workoutsRes.ok) {
          allWorkouts = await workoutsRes.json();
          setWorkouts(allWorkouts || []);
        }

        const h = userData.height ?? userData.Height ?? 180;
        const w = userData.weight ?? userData.Weight ?? 75;
        setHeight(h);
        setWeight(w);
        setNewHeight(String(h));
        setNewWeight(String(w));

        const userId = userData.id || userData.Id;
        if (userId) {
          const [progressRes, historyRes] = await Promise.all([
            fetchApi(`/progress/user/${userId}`),
            fetchApi(`/progress/history/user/${userId}`).catch(() => null),
          ]);

          if (progressRes.ok) {
            const progress = await progressRes.json();
            const map = new Map(progress.map((p) => [p.muscleGroup.toUpperCase(), p.xp]));

            setMuscleGroups(
              initialMuscleGroups.map((m) => ({
                ...m,
                xp: map.get(m.name) || 0,
              }))
            );
          }

          let dbLogs = [];
          if (historyRes && historyRes.ok) {
            dbLogs = await historyRes.json();
          }

          const localCompleted = JSON.parse(
            localStorage.getItem(`completed_workouts_${userId}`) || '[]'
          );

          // 1. Deduplicate: remove dbLogs already captured in a localCompleted session
          const uncapturedDbLogs = (dbLogs || []).filter((dbLog) => {
            const dbTime = new Date(dbLog.completedAt).getTime();
            return !localCompleted.some((loc) => {
              const locTime = new Date(loc.completedAt).getTime();
              const timeMatch = Math.abs(locTime - dbTime) < 15 * 60 * 1000;
              const exMatch = (loc.logs || []).some(
                (l) => l.exerciseName?.toLowerCase() === dbLog.exerciseName?.toLowerCase()
              );
              return timeMatch && exMatch;
            });
          });

          // 2. Group uncaptured DB logs into 30-min sessions
          const SESSION_WINDOW_MS = 30 * 60 * 1000;
          const sortedLogs = [...uncapturedDbLogs].sort(
            (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
          );

          const findWorkoutName = (exerciseNames) => {
            if (!allWorkouts || allWorkouts.length === 0) return null;
            const match = allWorkouts.find((w) =>
              (w.exercises || []).some((e) =>
                exerciseNames.some((ex) => ex.toLowerCase() === e.toLowerCase())
              )
            );
            return match?.name || null;
          };

          const sessions = [];
          sortedLogs.forEach((log) => {
            const lastSession = sessions[sessions.length - 1];
            const logTime = new Date(log.completedAt).getTime();
            if (
              lastSession &&
              logTime - new Date(lastSession.completedAt).getTime() < SESSION_WINDOW_MS
            ) {
              lastSession.logs.push(log);
              lastSession.totalSets += log.sets || 0;
              lastSession.totalVolume += (log.sets || 1) * (log.reps || 1) * (log.weightUsed || 0);
              lastSession.totalXp += log.xpEarned || 0;
              if (log.muscleGroup && !lastSession.muscleGroups.includes(log.muscleGroup.toUpperCase())) {
                lastSession.muscleGroups.push(log.muscleGroup.toUpperCase());
              }
              lastSession.completedAt = log.completedAt;
            } else {
              sessions.push({
                id: 'db_session_' + log.id,
                muscleGroups: log.muscleGroup ? [log.muscleGroup.toUpperCase()] : [],
                completedAt: log.completedAt,
                totalSets: log.sets || 0,
                totalVolume: (log.sets || 1) * (log.reps || 1) * (log.weightUsed || 0),
                totalXp: log.xpEarned || 0,
                logs: [log],
                fromDb: true,
              });
            }
          });

          const dbCompleted = sessions.map((s) => {
            const exNames = s.logs.map((l) => l.exerciseName).filter(Boolean);
            const workoutName = findWorkoutName(exNames) || (s.logs.length > 1 ? 'Workout Session' : s.logs[0]?.exerciseName || 'Workout');
            return {
              ...s,
              workoutName,
              logs: s.logs.map((l) => ({
                exerciseName: l.exerciseName,
                sets: l.sets,
                reps: l.reps,
                weight: l.weightUsed,
              })),
            };
          });

          const merged = [...localCompleted, ...dbCompleted].sort(
            (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
          );

          setCompletedWorkouts(merged);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const h = parseFloat(newHeight);
    const w = parseFloat(newWeight);

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      alert('Please enter valid positive numbers for height and weight.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetchApi('/auth/profile', {
        method: 'POST',
        body: JSON.stringify({ height: h, weight: w }),
      });

      if (res.ok) {
        setHeight(h);
        setWeight(w);
        setUser((prev) => ({ ...prev, height: h, weight: w }));
        setShowProfileModal(false);
      } else {
        alert('Could not update profile.');
      }
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '22.0';
  const bmiNumber = parseFloat(bmi);
  const bmiInfo = getBmiInfo(bmiNumber);

  // Position on scale 15.0 -> 35.0
  const markerPercent = Math.min(Math.max(((bmiNumber - 15) / (35 - 15)) * 100, 0), 100);

  const totalXp = muscleGroups.reduce((acc, m) => acc + m.xp, 0);
  const rankInfo = getRankInfo(totalXp);
  const { rankIndex, name: rankName, progress: rankProgress, xpToNext: xpToNextRank, isMaster } = rankInfo;
  const rankColor = getRankThemeColor(rankIndex);

  // Body calculations & metrics
  const minHealthyWeight = height > 0 ? (18.5 * Math.pow(height / 100, 2)).toFixed(1) : '60.0';
  const maxHealthyWeight = height > 0 ? (24.9 * Math.pow(height / 100, 2)).toFixed(1) : '80.7';
  const bmr = height > 0 && weight > 0 ? Math.round(10 * weight + 6.25 * height - 125) : 1750;

  const topMuscle = useMemo(() => {
    const sorted = [...muscleGroups].sort((a, b) => b.xp - a.xp);
    return sorted[0]?.xp > 0 ? sorted[0] : null;
  }, [muscleGroups]);

  const trainedCount = useMemo(() => {
    return muscleGroups.filter((m) => m.xp > 0).length;
  }, [muscleGroups]);

  const bodyData = useMemo(() => {
    const list = [];
    muscleGroups.forEach((m) => {
      if (m.xp > 0) {
        list.push({
          name: m.name,
          muscles: m.slugs,
          frequency: getMuscleRank(m.xp),
        });
      }
    });
    return list;
  }, [muscleGroups]);

  // Floating rank energy particles
  const particles = useMemo(() => {
    const list = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        left: Math.round(6 + (i * 88) / count + ((i * 7) % 11) - 5),
        size: 3 + (i % 4), // 3px to 6px
        duration: 3.2 + (i % 5) * 0.7, // 3.2s to 6.0s
        delay: (i * 0.22) % 3.4,
      });
    }
    return list;
  }, []);

  // Completed workouts for selected muscle group
  const completedForMuscle = useMemo(() => {
    if (!selectedMuscle) return [];
    return completedWorkouts.filter((cw) => {
      const groups = cw.muscleGroups || (cw.muscleGroup ? [cw.muscleGroup] : []);
      return groups.some((g) => g.toUpperCase() === selectedMuscle.toUpperCase());
    });
  }, [selectedMuscle, completedWorkouts]);

  if (loading) {
    return (
      <div style={styles.centerWrap}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar user={user} />

      <main className="dashboard-main" style={styles.main}>
        {/* Top Header */}
        <div className="dashboard-header" style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>Physical metrics, muscle progression, and completed workout logs</p>
          </div>
          <button onClick={() => navigate('/workouts')} style={styles.startBtn}>
            Start Workout
          </button>
        </div>

        {/* 3 Physical Stats Cards */}
        <div className="dashboard-stats-grid" style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statCardTop}>
              <span style={styles.statLabel}>Height</span>
              <button
                onClick={() => setShowProfileModal(true)}
                style={styles.editStatBtn}
                title="Edit Height & Weight"
              >
                ✎
              </button>
            </div>
            <div style={styles.statValue}>{height} cm</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardTop}>
              <span style={styles.statLabel}>Current Weight</span>
              <button
                onClick={() => setShowProfileModal(true)}
                style={styles.editStatBtn}
                title="Edit Height & Weight"
              >
                ✎
              </button>
            </div>
            <div style={styles.statValue}>{weight} kg</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statCardTop}>
              <span style={styles.statLabel}>Body Mass Index (BMI)</span>
            </div>
            <div style={{ ...styles.statValue, color: bmiInfo.color }}>{bmi}</div>
          </div>
        </div>

        {/* BMI Scale Card */}
        <div className="dashboard-card" style={styles.card}>
          <div className="dashboard-card-header" style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>BMI Scale</h2>
            <span style={{ ...styles.badge, backgroundColor: `${bmiInfo.color}22`, color: bmiInfo.color }}>
              {bmiInfo.category} ({bmi})
            </span>
          </div>

          <div style={styles.scaleContainer}>
            <div style={styles.scaleTrack}>
              <div style={{ ...styles.scaleSegment, backgroundColor: '#3b82f6', width: '17.5%' }} />
              <div style={{ ...styles.scaleSegment, backgroundColor: '#10b981', width: '32%' }} />
              <div style={{ ...styles.scaleSegment, backgroundColor: '#f59e0b', width: '25%' }} />
              <div style={{ ...styles.scaleSegment, backgroundColor: '#ef4444', width: '25.5%' }} />
            </div>

            {/* Marker Indicator */}
            <div style={{ ...styles.scaleMarker, left: `${markerPercent}%` }}>
              <div style={styles.markerPointer} />
              <div style={{ ...styles.markerLabel, color: bmiInfo.color }}>{bmi}</div>
            </div>

            <div className="dashboard-scale-labels" style={styles.scaleLabels}>
              <span>15.0</span>
              <span>18.5 (Normal)</span>
              <span>25.0 (Overweight)</span>
              <span>35.0+</span>
            </div>
          </div>
        </div>

        {/* Body Visualizer Card */}
        <div className="dashboard-card" style={styles.card}>
          <div className="dashboard-card-header" style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Body Visualizer</h2>
              <div style={styles.cardMeta}>Visual muscle training load & anatomical metrics</div>
            </div>

            <div style={styles.sideToggle}>
              <button
                onClick={() => setBodySide('front')}
                style={{
                  ...styles.sideBtn,
                  ...(bodySide === 'front' ? styles.sideBtnActive : {}),
                }}
              >
                FRONT
              </button>
              <button
                onClick={() => setBodySide('back')}
                style={{
                  ...styles.sideBtn,
                  ...(bodySide === 'back' ? styles.sideBtnActive : {}),
                }}
              >
                BACK
              </button>
            </div>
          </div>

          <div className="dashboard-visualizer-grid" style={styles.visualizerContentGrid}>
            {/* Left Column: Mannequin Visualizer with Corner Rank Badge and Minimalist Background Animation */}
            <div className="dashboard-mannequin-col" style={styles.visualizerMannequinCol}>
              {/* Corner Rank HUD Badge */}
              <div style={styles.cornerRankBadge}>
                <div style={styles.cornerRankTop}>
                  <span style={{ ...styles.cornerRankDot, backgroundColor: rankColor }} />
                  <span style={{ ...styles.cornerRankTitle, color: rankColor }}>{rankName.toUpperCase()}</span>
                </div>
                <div style={styles.cornerRankSub}>
                  {isMaster ? (
                    <><span style={{ color: '#ffffff', fontWeight: 900 }}>{xpToNextRank.toLocaleString()} XP</span> to next milestone</>
                  ) : (
                    <><span style={{ color: '#ffffff', fontWeight: 900 }}>{xpToNextRank.toLocaleString()} XP</span> to {RANK_TIERS[rankIndex + 1]?.name || 'Master'}</>
                  )}
                </div>
                <div style={styles.cornerMiniBar}>
                  <div
                    style={{
                      ...styles.cornerMiniFill,
                      width: `${rankProgress * 100}%`,
                      backgroundColor: rankColor,
                    }}
                  />
                </div>
              </div>

              {/* Centered Mannequin Container with Animated Rank Ambient Aura and Flying Particles */}
              <div style={styles.bodyWrap}>
                {/* Minimalist Rank Ambient Aura Rings */}
                <div
                  style={{
                    position: 'absolute',
                    width: 280,
                    height: 280,
                    borderRadius: '50%',
                    border: `1.5px dashed ${rankColor}66`,
                    animation: 'rankRingPulse 4.5s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 230,
                    height: 310,
                    borderRadius: '50%',
                    background: `radial-gradient(ellipse at center, ${rankColor}2e 0%, ${rankColor}10 48%, transparent 72%)`,
                    animation: 'rankBreathe 3.2s ease-in-out infinite',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                {/* Flying Particles based on Current Rank */}
                {particles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: `${p.left}%`,
                      bottom: 0,
                      width: p.size,
                      height: p.size,
                      borderRadius: '50%',
                      backgroundColor: rankColor,
                      boxShadow: `0 0 8px ${rankColor}, 0 0 16px ${rankColor}aa`,
                      animation: `floatParticle ${p.duration}s ease-in-out infinite`,
                      animationDelay: `${p.delay}s`,
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                ))}

                <div className="dashboard-body-center" style={styles.bodyCenterContainer}>
                  <Model
                    data={bodyData}
                    type={bodySide === 'front' ? 'anterior' : 'posterior'}
                    bodyColor="#3f3f46"
                    highlightedColors={RANK_TIERS.map((tier) => tier.color)}
                    style={{
                      width: '100%',
                      height: '340px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 2,
                    }}
                    svgStyle={{ maxHeight: '340px', width: '100%', margin: '0 auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* Visualizer Legend */}
              <div style={styles.legend}>
                {RANK_TIERS.map(({ color, name }) => (
                  <div key={name} style={styles.legendItem}>
                    <div style={{ ...styles.legendDot, backgroundColor: color }} />
                    <span style={styles.legendText}>{name.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Detailed Body Information & Insights */}
            <div className="dashboard-body-details" style={styles.bodyDetailsCol}>
              <div style={styles.detailsHeader}>
                <span style={styles.eyebrow}>ANATOMICAL PROFILE & METRICS</span>
                <h3 style={styles.detailsTitle}>Body Analysis</h3>
              </div>

              <div className="dashboard-info-grid" style={styles.infoCardsGrid}>
                {/* Height & Weight */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>HEIGHT & WEIGHT</div>
                  <div style={styles.infoCardValue}>
                    {height} <span style={styles.infoCardUnit}>cm</span> / {weight} <span style={styles.infoCardUnit}>kg</span>
                  </div>
                  <div style={styles.infoCardMeta}>User Physical Baseline</div>
                </div>

                {/* BMI Status */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>BODY MASS INDEX</div>
                  <div style={{ ...styles.infoCardValue, color: bmiInfo.color }}>
                    {bmi} <span style={styles.infoCardUnit}>BMI</span>
                  </div>
                  <div style={{ ...styles.infoCardMeta, color: bmiInfo.color }}>
                    {bmiInfo.category}
                  </div>
                </div>

                {/* Healthy Weight Range */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>HEALTHY WEIGHT RANGE</div>
                  <div style={styles.infoCardValue}>
                    {minHealthyWeight} - {maxHealthyWeight} <span style={styles.infoCardUnit}>kg</span>
                  </div>
                  <div style={styles.infoCardMeta}>Recommended for {height} cm</div>
                </div>

                {/* Estimated BMR */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>EST. BASAL METABOLISM (BMR)</div>
                  <div style={styles.infoCardValue}>
                    {bmr.toLocaleString()} <span style={styles.infoCardUnit}>kcal/day</span>
                  </div>
                  <div style={styles.infoCardMeta}>Daily resting energy expenditure</div>
                </div>

                {/* Dominant Muscle */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>DOMINANT MUSCLE GROUP</div>
                  <div style={styles.infoCardValue}>
                    {topMuscle ? topMuscle.name : 'None'}
                  </div>
                  <div style={styles.infoCardMeta}>
                    {topMuscle
                      ? `${topMuscle.xp} XP • ${getMuscleRankName(topMuscle.xp)}`
                      : 'All muscle groups at baseline'}
                  </div>
                </div>

                {/* Muscle Coverage */}
                <div style={styles.infoCard}>
                  <div style={styles.infoCardLabel}>MUSCLE GROUPS ACTIVATED</div>
                  <div style={styles.infoCardValue}>
                    {trainedCount} / {muscleGroups.length}
                  </div>
                  <div style={styles.infoCardMeta}>
                    {trainedCount === muscleGroups.length
                      ? 'Full body coverage achieved'
                      : `${muscleGroups.length - trainedCount} groups remaining to train`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total XP & Rank Progression */}
        <div className="dashboard-card dashboard-rank-card" style={styles.card}>
          <div className="dashboard-card-header" style={styles.cardHeader}>
            <div>
              <span style={styles.eyebrow}>OVERALL PROGRESSION</span>
              <div style={styles.totalXpVal}>{totalXp.toLocaleString()} XP</div>
            </div>
            <div style={{ ...styles.rankBadge, borderColor: rankColor }}>
              <div style={{ ...styles.rankNumber, color: rankColor }}>{rankName}</div>
              <div style={styles.rankLabel}>CURRENT RANK</div>
            </div>
          </div>

          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${rankProgress * 100}%`, backgroundColor: rankColor }} />
          </div>
          <div style={styles.progressText}>
            {isMaster
              ? `${rankInfo.xpIntoRank.toLocaleString()} XP into Master — no cap`
              : `${rankInfo.xpIntoRank.toLocaleString()} / ${rankInfo.xpNeeded.toLocaleString()} XP to ${RANK_TIERS[rankIndex + 1]?.name || 'Master'}`}
          </div>
        </div>

        {/* Muscle XP Breakdown Grid */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>MUSCLE GROUPS XP</h2>
          <span style={styles.sectionMeta}>THIS CYCLE</span>
        </div>

        <div className="dashboard-muscle-grid" style={styles.muscleGrid}>
          {muscleGroups.map((muscle) => {
            const color = getMuscleColor(muscle.xp);
            const mRank = getMuscleRank(muscle.xp);
            const mRankName = getMuscleRankName(muscle.xp);
            const mTier = MUSCLE_TIERS[mRank - 1] || MUSCLE_TIERS[0];
            const nextMTier = MUSCLE_TIERS[mRank];
            const mFloor = mTier.minXp;
            const mCeil = nextMTier ? nextMTier.minXp : mFloor + 30000;
            const mProgress = Math.min(Math.max((muscle.xp - mFloor) / (mCeil - mFloor), 0), 1);
            const isSelected = selectedMuscle === muscle.name;
            return (
              <div
                key={muscle.name}
                onClick={() => {
                  setSelectedMuscle((prev) => (prev === muscle.name ? null : muscle.name));
                }}
                style={{
                  ...styles.muscleCard,
                  ...(isSelected ? styles.muscleCardSelected : {}),
                }}
              >
                <div style={{ ...styles.muscleAccent, backgroundColor: color }} />
                <div style={styles.muscleTop}>
                  <span style={styles.muscleName}>{muscle.name}</span>
                  <span style={{ ...styles.muscleRank, color }}>{mRankName.toUpperCase()}</span>
                </div>
                <div style={styles.muscleXp}>{muscle.xp} XP</div>
                <div style={styles.muscleTrack}>
                  <div
                    style={{
                      ...styles.muscleFill,
                      width: `${mProgress * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Muscle Completed Workouts History */}
        {selectedMuscle && (
          <div className="dashboard-muscle-history" style={styles.muscleWorkoutsCard}>
            <div style={styles.muscleWorkoutsHeader}>
              <div>
                <div style={styles.eyebrow}>COMPLETED WORKOUT HISTORY</div>
                <h3 style={styles.muscleWorkoutsTitle}>
                  Completed for: <span style={{ color: '#10b981' }}>{selectedMuscle}</span>
                </h3>
                <div style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>
                  {completedForMuscle.length === 0
                    ? `No completed sessions on record for ${selectedMuscle}`
                    : `${completedForMuscle.length} completed session${completedForMuscle.length > 1 ? 's' : ''} recorded`}
                </div>
              </div>

              <button
                onClick={() => setSelectedMuscle(null)}
                style={styles.closeWorkoutsBtn}
                title="Close"
              >
                ✕
              </button>
            </div>

            {completedForMuscle.length === 0 ? (
              <div style={styles.emptyMuscleWorkouts}>
                <div style={styles.emptyMuscleTitle}>
                  No completed workouts found for {selectedMuscle}.
                </div>
                <div style={styles.emptyMuscleSubtitle}>
                  When you complete and log training sets targeting {selectedMuscle}, your completed history will appear here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {completedForMuscle.map((item) => {
                  const dateStr = item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent Session';

                  // Aggregate sets and reps per distinct exercise
                  const exAggMap = new Map();
                  (item.logs || []).forEach((log) => {
                    const name = log.exerciseName || 'Exercise';
                    if (!exAggMap.has(name)) {
                      exAggMap.set(name, {
                        name,
                        sets: 0,
                        totalReps: 0,
                        weight: log.weight ?? log.weightUsed ?? 0,
                        volume: 0,
                      });
                    }
                    const curr = exAggMap.get(name);
                    const s = Number(log.sets) || 0;
                    const r = Number(log.reps) || 0;
                    const w = Number(log.weight ?? log.weightUsed) || 0;
                    curr.sets += s;
                    curr.totalReps += s * r;
                    curr.volume += s * r * (w > 0 ? w : 1);
                    if (w > 0) curr.weight = w;
                  });
                  const aggregatedList = Array.from(exAggMap.values());

                  const sessionTitle = item.workoutName || 'Workout Session';

                  return (
                    <div key={item.id} style={styles.completedCard}>
                      {/* Top row: Workout title + date + badge */}
                      <div style={styles.completedCardTop}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={styles.workoutOriginTitle}>
                            <span style={styles.workoutOriginPrefix}>WORKOUT:</span>
                            {sessionTitle}
                          </div>
                          <div style={styles.completedDate}>{dateStr}</div>
                        </div>
                        <span style={styles.completedBadge}>COMPLETED</span>
                      </div>

                      {/* Metrics row */}
                      <div style={styles.completedMetricsRow}>
                        <div style={styles.completedMetricItem}>
                          <span style={styles.completedMetricLabel}>TOTAL SETS</span>
                          <span style={styles.completedMetricValue}>{item.totalSets}</span>
                        </div>
                        <div style={styles.completedMetricDivider} />
                        <div style={styles.completedMetricItem}>
                          <span style={styles.completedMetricLabel}>VOLUME</span>
                          <span style={styles.completedMetricValueGreen}>
                            {(item.totalVolume || 0).toLocaleString()} kg
                          </span>
                        </div>
                        <div style={styles.completedMetricDivider} />
                        <div style={styles.completedMetricItem}>
                          <span style={styles.completedMetricLabel}>XP EARNED</span>
                          <span style={styles.completedMetricValueOrange}>+{item.totalXp}</span>
                        </div>
                      </div>

                      {/* Aggregated exercises: no duplicate lines, sets and reps accumulated */}
                      {aggregatedList.length > 0 && (
                        <div style={styles.aggExercisesContainer}>
                          <div style={styles.aggExercisesTitle}>EXERCISES PERFORMED</div>
                          {aggregatedList.map((agg) => (
                            <div key={agg.name} style={styles.aggExerciseRow}>
                              <div style={styles.aggExerciseName}>• {agg.name}</div>
                              <div style={styles.aggExerciseMeta}>
                                <span style={styles.aggHighlight}>{agg.sets} sets</span>
                                <span style={styles.aggDot}>•</span>
                                <span>{agg.totalReps} total reps</span>
                                {agg.weight > 0 && (
                                  <>
                                    <span style={styles.aggDot}>•</span>
                                    <span>{agg.weight} kg</span>
                                  </>
                                )}
                                {agg.volume > 0 && (
                                  <>
                                    <span style={styles.aggDot}>•</span>
                                    <span style={{ color: '#10b981', fontWeight: 800 }}>
                                      +{agg.volume.toLocaleString()} kg
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="dashboard-modal-overlay" style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Physical Stats</h3>
              <button onClick={() => setShowProfileModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>HEIGHT (CM)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="260"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>WEIGHT (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" disabled={savingProfile} style={styles.saveModalBtn}>
                {savingProfile ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#09090b',
    color: '#ffffff',
  },
  centerWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #27272a',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  main: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 20px 60px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '0.5px',
    margin: 0,
  },
  pageSubtitle: {
    color: '#71717a',
    fontSize: 14,
    marginTop: 4,
  },
  startBtn: {
    backgroundColor: '#ffffff',
    color: '#09090b',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: '0.4px',
    boxShadow: 'none',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#111115',
    border: '1px solid #1f1f25',
    borderRadius: 12,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  editStatBtn: {
    color: '#10b981',
    fontSize: 18,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a1a22',
    border: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 900,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#111115',
    border: '1px solid #1f1f25',
    borderRadius: 12,
    padding: '22px 24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: '0.5px',
    margin: 0,
  },
  cardMeta: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  scaleContainer: {
    position: 'relative',
    padding: '16px 0 6px',
  },
  scaleTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    display: 'flex',
  },
  scaleSegment: {
    height: '100%',
  },
  scaleMarker: {
    position: 'absolute',
    top: 2,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'left 0.4s ease',
  },
  markerPointer: {
    width: 2,
    height: 22,
    backgroundColor: '#ffffff',
    boxShadow: '0 0 6px rgba(255,255,255,0.8)',
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: 900,
    marginTop: 4,
  },
  scaleLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#71717a',
    fontSize: 10,
    fontWeight: 700,
    marginTop: 16,
  },
  sideToggle: {
    display: 'flex',
    border: '1px solid #27272a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sideBtn: {
    padding: '6px 14px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.6px',
    color: '#71717a',
    backgroundColor: 'transparent',
  },
  sideBtnActive: {
    backgroundColor: '#ffffff',
    color: '#09090b',
  },
  visualizerContentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
    alignItems: 'start',
    marginTop: 8,
  },
  visualizerMannequinCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#0d0d11',
    border: '1px solid #1f1f25',
    borderRadius: 10,
    padding: '16px 12px 20px',
    overflow: 'hidden',
  },
  cornerRankBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    backgroundColor: 'rgba(17, 17, 21, 0.94)',
    backdropFilter: 'blur(6px)',
    border: '1px solid #27272a',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  cornerRankTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  cornerRankDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
  },
  cornerRankTitle: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '0.8px',
  },
  cornerRankSub: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: 700,
  },
  cornerMiniBar: {
    height: 3,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
    width: '100%',
  },
  cornerMiniFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  bodyWrap: {
    minHeight: 340,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px auto',
    textAlign: 'center',
    position: 'relative',
  },
  bodyCenterContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  bodyDetailsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  detailsHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '0.5px',
  },
  infoCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#0d0d11',
    border: '1px solid #1f1f25',
    borderRadius: 8,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 88,
  },
  infoCardLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.6px',
    marginBottom: 6,
  },
  infoCardValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  infoCardUnit: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: 700,
  },
  infoCardMeta: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 600,
    marginTop: 6,
  },
  legend: {
    borderTop: '1px solid #1f1f25',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 16,
    justifyContent: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
  },
  eyebrow: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1.2px',
  },
  totalXpVal: {
    fontSize: 26,
    fontWeight: 900,
    color: '#ffffff',
    marginTop: 4,
  },
  rankBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #3f3f46',
    borderRadius: 8,
    padding: '6px 16px',
    backgroundColor: '#18181c',
  },
  rankNumber: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 900,
  },
  rankLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '1px',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'right',
    marginTop: 6,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: '1px',
    margin: 0,
  },
  sectionMeta: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 700,
  },
  muscleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
  },
  muscleCard: {
    backgroundColor: '#111115',
    border: '1.5px solid #ffffff',
    borderRadius: 10,
    padding: '16px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transition: 'border-color 0.15s ease',
  },
  muscleCardSelected: {
    borderColor: '#10b981',
  },
  muscleAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  muscleTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  muscleName: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '1px',
  },
  muscleRank: {
    fontSize: 10,
    fontWeight: 900,
  },
  muscleXp: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 900,
    margin: '8px 0',
  },
  muscleTrack: {
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  muscleFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  muscleWorkoutsCard: {
    backgroundColor: '#111115',
    border: '1px solid #10b981',
    borderRadius: 12,
    padding: '22px 20px',
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)',
  },
  muscleWorkoutsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  muscleWorkoutsTitle: {
    fontSize: 18,
    fontWeight: 900,
    margin: 0,
  },
  closeWorkoutsBtn: {
    color: '#a1a1aa',
    fontSize: 14,
    padding: '6px 10px',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 6,
    cursor: 'pointer',
  },
  emptyMuscleWorkouts: {
    textAlign: 'center',
    padding: '36px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyMuscleTitle: {
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 14,
  },
  emptyMuscleSubtitle: {
    color: '#71717a',
    fontSize: 12,
    maxWidth: 380,
    lineHeight: 1.5,
  },
  completedWorkoutsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
  },
  completedCard: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  completedCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  workoutOriginTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  workoutOriginPrefix: {
    color: '#10b981',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '1px',
  },
  completedDate: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 3,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid #10b981',
    color: '#86efac',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '0.6px',
    whiteSpace: 'nowrap',
  },
  completedMetricsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#111115',
    border: '1px solid #27272a',
    borderRadius: 6,
    padding: '10px 12px',
  },
  completedMetricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  completedMetricLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.6px',
  },
  completedMetricValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 900,
  },
  completedMetricValueGreen: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 900,
  },
  completedMetricValueOrange: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: 900,
  },
  completedMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#27272a',
  },
  aggExercisesContainer: {
    borderTop: '1px solid #27272a',
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  aggExercisesTitle: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '1px',
    marginBottom: 4,
  },
  aggExerciseRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#111115',
    border: '1px solid #222226',
    borderRadius: 6,
    padding: '8px 12px',
  },
  aggExerciseName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 800,
  },
  aggExerciseMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    color: '#a1a1aa',
    fontSize: 12,
  },
  aggHighlight: {
    color: '#ffffff',
    fontWeight: 800,
  },
  aggDot: {
    color: '#52525b',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: '24px 28px',
    width: '100%',
    maxWidth: 380,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 900,
    margin: 0,
  },
  closeBtn: {
    color: '#a1a1aa',
    fontSize: 18,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1px',
  },
  input: {
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: 6,
    color: '#ffffff',
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
  },
  saveModalBtn: {
    height: 46,
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: 6,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: '1px',
    marginTop: 8,
  },
};

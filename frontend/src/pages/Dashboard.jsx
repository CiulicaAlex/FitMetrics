import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Model from 'react-body-highlighter';
import Navbar from '../components/Navbar';
import { fetchApi } from '../api';
import { useTheme } from '../context/ThemeContext';

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

// Progression ranks matching Apple Fitness tier styling
const RANK_TIERS = [
  { name: 'Beginner', minXp: 0, color: '#8e8e93' },
  { name: 'Novice', minXp: 5000, color: '#00c7be' },
  { name: 'Intermediate', minXp: 15000, color: '#30d158' },
  { name: 'Advanced', minXp: 35000, color: '#ffd60a' },
  { name: 'Expert', minXp: 75000, color: '#ff9f0a' },
  { name: 'Elite', minXp: 150000, color: '#ff375f' },
  { name: 'Master', minXp: 250000, color: '#bf5af2' },
];

const MASTER_TIER_MIN = 250000;
const MASTER_TIER_STEP = 50000;

function getRankInfo(totalXp) {
  if (totalXp >= MASTER_TIER_MIN) {
    const extraXp = totalXp - MASTER_TIER_MIN;
    const tierLevel = Math.floor(extraXp / MASTER_TIER_STEP) + 1;
    const targetXp = MASTER_TIER_MIN + tierLevel * MASTER_TIER_STEP;
    const progress = Math.min(Math.max(totalXp / targetXp, 0), 1);
    const xpToNext = Math.max(0, targetXp - totalXp);
    return {
      rankIndex: 6,
      name: `Master${tierLevel > 1 ? ` Tier ${tierLevel}` : ''}`,
      baseName: 'Master',
      color: '#bf5af2',
      progress,
      xpToNext,
      xpIntoRank: totalXp,
      xpNeeded: targetXp,
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
  const progress = nextTier && nextTier.minXp > 0 ? Math.min(Math.max(totalXp / nextTier.minXp, 0), 1) : 1;
  const xpToNext = nextTier ? Math.max(0, nextTier.minXp - totalXp) : 0;

  return {
    rankIndex: tierIndex,
    name: currentTier.name,
    baseName: currentTier.name,
    color: currentTier.color,
    progress,
    xpToNext,
    xpIntoRank: totalXp,
    xpNeeded: nextTier ? nextTier.minXp : currentTier.minXp,
    isMaster: false,
    tierLevel: tierIndex + 1,
  };
}

const MUSCLE_TIERS = [
  { name: 'Beginner', minXp: 0, color: '#8e8e93' },
  { name: 'Novice', minXp: 1200, color: '#00c7be' },
  { name: 'Intermediate', minXp: 4000, color: '#30d158' },
  { name: 'Advanced', minXp: 10000, color: '#ffd60a' },
  { name: 'Expert', minXp: 22000, color: '#ff9f0a' },
  { name: 'Elite', minXp: 45000, color: '#ff375f' },
  { name: 'Master', minXp: 75000, color: '#bf5af2' },
];

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

export function getMuscleTiers(muscleName = '') {
  const key = (muscleName || '').toUpperCase().trim();
  const multiplier = MUSCLE_XP_MULTIPLIERS[key] || 1.0;
  return MUSCLE_TIERS.map((tier) => ({
    ...tier,
    minXp: Math.round(tier.minXp * multiplier),
  }));
}

function getMuscleRank(xp, muscleName = '') {
  const tiers = getMuscleTiers(muscleName);
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].minXp) {
      return i + 1;
    }
  }
  return 1;
}

function getMuscleRankName(xp, muscleName = '') {
  const tiers = getMuscleTiers(muscleName);
  const idx = Math.min(getMuscleRank(xp, muscleName) - 1, tiers.length - 1);
  return tiers[idx]?.name || 'Master';
}

function getMuscleColor(xp, muscleName = '') {
  if (xp === 0) return 'var(--text-muted)';
  const tiers = getMuscleTiers(muscleName);
  const idx = Math.min(getMuscleRank(xp, muscleName) - 1, tiers.length - 1);
  return tiers[idx]?.color || '#bf5af2';
}

function getRankThemeColor(rankIndex) {
  return RANK_TIERS[rankIndex]?.color || '#bf5af2';
}

function getBmiInfo(bmi) {
  if (!bmi || isNaN(bmi)) return { category: 'Normal Weight', color: '#30d158' };
  if (bmi < 18.5) return { category: 'Underweight', color: '#0a84ff' };
  if (bmi <= 24.9) return { category: 'Normal Weight', color: '#30d158' };
  if (bmi <= 29.9) return { category: 'Overweight', color: '#ff9f0a' };
  return { category: 'Obese', color: '#ff375f' };
}

function getMuscleBadgeStyle(mRankName, xp, isDark, muscleName = '') {
  if (xp === 0 || mRankName === 'Beginner') {
    return isDark
      ? {
          color: '#d1d1d6',
          bg: 'rgba(142, 142, 147, 0.18)',
          border: 'rgba(142, 142, 147, 0.32)',
          barColor: '#636366',
        }
      : {
          color: '#1c1c1e',
          bg: '#f2f2f7',
          border: 'rgba(60, 60, 67, 0.18)',
          barColor: '#c7c7cc',
        };
  }

  const baseColor = getMuscleColor(xp, muscleName);
  // High-contrast refined colors for light mode so nothing looks washed out or muddy
  const lightColors = {
    Novice: '#008b84',
    Intermediate: '#248a3d',
    Advanced: '#a37700',
    Expert: '#c96500',
    Elite: '#d70035',
    Master: '#8936b2',
  };

  const badgeTextColor = isDark ? baseColor : (lightColors[mRankName] || baseColor);
  return {
    color: badgeTextColor,
    bg: isDark ? `${baseColor}22` : `${baseColor}16`,
    border: isDark ? `${baseColor}44` : `${baseColor}38`,
    barColor: baseColor,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [muscleGroups, setMuscleGroups] = useState(initialMuscleGroups);
  const [workouts, setWorkouts] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [bodySide, setBodySide] = useState('front');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const [loading, setLoading] = useState(true);

  // Physical stats
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(75);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newHeight, setNewHeight] = useState('180');
  const [newWeight, setNewWeight] = useState('75');
  const [savingProfile, setSavingProfile] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetDevUrl, setResetDevUrl] = useState(null);
  const [requestingResetEmail, setRequestingResetEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    if (location.search.includes('modal=profile')) {
      setShowProfileModal(true);
    }
  }, [location.search]);

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

          let progressData = [];
          if (progressRes.ok) {
            progressData = await progressRes.json();
            const map = new Map(progressData.map((p) => [p.muscleGroup.toUpperCase(), p.xp]));

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

          const totalServerXp = (progressData || []).reduce((acc, p) => acc + (p.xp || 0), 0);
          const isServerEmpty = totalServerXp === 0 && (!dbLogs || dbLogs.length === 0);

          if (isServerEmpty) {
            // Account was reset to 0: wipe stale local storage caches across all modules
            localStorage.removeItem(`completed_workouts_${userId}`);
            localStorage.removeItem('fitmetrics_calisthenics_xp');
            localStorage.removeItem('fitmetrics_cali_sessions_count');
            localStorage.removeItem(`fitmetrics_calisthenics_xp_${userId}`);
            localStorage.removeItem(`fitmetrics_cali_sessions_count_${userId}`);
          }

          const localCompleted = isServerEmpty
            ? []
            : JSON.parse(localStorage.getItem(`completed_workouts_${userId}`) || '[]');

          // Deduplicate
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

          // Group uncaptured DB logs into 30-min sessions
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
    setProfileError(null);
    const h = parseFloat(newHeight);
    const w = parseFloat(newWeight);

    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      setProfileError('Please enter valid positive numbers for height and weight.');
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
        triggerToast('Physical vitals updated successfully');
      } else {
        setProfileError('Could not update profile.');
      }
    } catch (err) {
      setProfileError('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestResetEmail = async () => {
    setRequestingResetEmail(true);
    try {
      const res = await fetchApi('/auth/request-action-confirmation', {
        method: 'POST',
        body: JSON.stringify({ actionType: 'RESET_PROGRESS' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetEmailSent(true);
        if (data.devUrl) {
          setResetDevUrl(data.devUrl);
        }
        triggerToast('Security verification email sent! Check your inbox.');
      } else {
        triggerToast(data.message || 'Could not send confirmation email.');
      }
    } catch (err) {
      triggerToast('Error sending confirmation email: ' + err.message);
    } finally {
      setRequestingResetEmail(false);
    }
  };

  const handleDirectReset = async () => {
    if (!window.confirm('Are you sure you want to reset all muscle progress, gym workout logs, and running history to 0? This cannot be undone.')) {
      return;
    }
    setResettingProgress(true);
    try {
      const uId = user?.id || user?.Id;
      const res = await fetchApi(`/progress/reset/user/${uId}`, {
        method: 'POST',
      });
      if (res.ok) {
        localStorage.removeItem(`completed_workouts_${uId}`);
        localStorage.removeItem('fitmetrics_calisthenics_xp');
        localStorage.removeItem('fitmetrics_cali_sessions_count');
        localStorage.removeItem(`fitmetrics_calisthenics_xp_${uId}`);
        localStorage.removeItem(`fitmetrics_cali_sessions_count_${uId}`);
        setShowResetConfirm(false);
        triggerToast('Progress successfully reset to 0');
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        triggerToast(data.message || 'Error resetting progress.');
      }
    } catch (err) {
      triggerToast('Error resetting progress: ' + err.message);
    } finally {
      setResettingProgress(false);
    }
  };

  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '22.0';
  const bmiNumber = parseFloat(bmi);
  const bmiInfo = getBmiInfo(bmiNumber);
  const markerPercent = Math.min(Math.max(((bmiNumber - 15) / (35 - 15)) * 100, 0), 100);

  const totalXp = muscleGroups.reduce((acc, m) => acc + m.xp, 0);
  const rankInfo = getRankInfo(totalXp);
  const { rankIndex, name: rankName, progress: rankProgress, xpToNext: xpToNextRank, isMaster } = rankInfo;
  const rankColor = getRankThemeColor(rankIndex);

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
          frequency: getMuscleRank(m.xp, m.name),
        });
      }
    });
    return list;
  }, [muscleGroups]);

  const totalVolumeAll = useMemo(() => {
    return completedWorkouts.reduce((acc, w) => {
      const vol = typeof w.totalVolume === 'number' && w.totalVolume <= 100000 ? Math.max(0, w.totalVolume) : 0;
      return acc + vol;
    }, 0);
  }, [completedWorkouts]);

  const totalSetsAll = useMemo(() => {
    return completedWorkouts.reduce((acc, w) => acc + (w.totalSets || 0), 0);
  }, [completedWorkouts]);

  const completedForMuscle = useMemo(() => {
    if (!selectedMuscle) return [];
    return completedWorkouts.filter((cw) => {
      const groups = cw.muscleGroups || (cw.muscleGroup ? [cw.muscleGroup] : []);
      return groups.some((g) => g.toUpperCase() === selectedMuscle.toUpperCase());
    });
  }, [selectedMuscle, completedWorkouts]);

  // Sort muscle groups: Top popular (Chest, Upper Back, Shoulders, Quadriceps) or highest XP first
  const sortedMuscleGroups = useMemo(() => {
    const popularOrder = ['CHEST', 'UPPER BACK', 'SHOULDERS', 'QUADRICEPS', 'BICEPS', 'TRICEPS', 'ABS', 'GLUTES'];
    return [...muscleGroups].sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      const aIdx = popularOrder.indexOf(a.name.toUpperCase());
      const bIdx = popularOrder.indexOf(b.name.toUpperCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
  }, [muscleGroups]);

  const displayedMuscles = useMemo(() => {
    return showAllMuscles ? sortedMuscleGroups : sortedMuscleGroups.slice(0, 4);
  }, [showAllMuscles, sortedMuscleGroups]);

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

  // Current date formatted in authentic Apple style: e.g. "TUESDAY, SEPTEMBER 15"
  const formattedDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  }, []);

  // Activity Ring calculations (percentages 0 - 1)
  const ringMove = Math.min((totalVolumeAll % 10000) / 10000 || (totalVolumeAll > 0 ? 0.65 : 0.25), 1);
  const ringExercise = Math.min((totalSetsAll % 50) / 50 || (totalSetsAll > 0 ? 0.75 : 0.35), 1);
  const ringStand = Math.min(rankProgress || 0.45, 1);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      <Navbar user={user} />

      <main style={{ maxWidth: 1040, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '28px 20px 120px', display: 'flex', flexDirection: 'column', gap: 24, overflowX: 'hidden' }}>
        
        {/* Apple Health Summary Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
              {formattedDate}
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Summary
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowProfileModal(true)}
              className="ios-button-secondary"
              style={{ padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>Edit Vitals</span>
            </button>

            <button
              onClick={() => navigate('/workouts')}
              className="ios-button-primary"
              style={{ padding: '9px 18px', borderRadius: 9999, fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Start Workout</span>
            </button>
          </div>
        </div>

        {/* Section: Activity & Progression (Apple Fitness Activity Rings + Rank Medal) */}
        <div className="ios-card" style={{ padding: '22px 24px', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Left: Concentric Activity Rings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                {/* Outer Ring: Move (Red) */}
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255, 45, 85, 0.15)" strokeWidth="9" />
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  fill="none"
                  stroke="#ff2d55"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - ringMove)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />

                {/* Middle Ring: Exercise (Green) */}
                <circle cx="55" cy="55" r="34" fill="none" stroke="rgba(48, 209, 88, 0.15)" strokeWidth="9" />
                <circle
                  cx="55"
                  cy="55"
                  r="34"
                  fill="none"
                  stroke="#30d158"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - ringExercise)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />

                {/* Inner Ring: Stand/XP (Stand Cyan/Blue) */}
                <circle cx="55" cy="55" r="22" fill="none" stroke="rgba(0, 199, 190, 0.15)" strokeWidth="9" />
                <circle
                  cx="55"
                  cy="55"
                  r="22"
                  fill="none"
                  stroke="#00c7be"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - ringStand)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACTIVITY RINGS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff2d55' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Volume: <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{totalVolumeAll.toLocaleString()} kg</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#30d158' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Sessions: <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{completedWorkouts.length} logged</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#00c7be' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Total XP: <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{totalXp.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Apple Watch Award Badge & Rank Progression */}
          <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 18, borderLeft: '0.5px solid var(--border-subtle)', paddingLeft: 20 }}>
            {/* Apple Fitness Metallic Achievement Medal */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, ${rankColor} 55%, #18181a 100%)`,
                padding: 3,
                boxShadow: `0 6px 18px ${rankColor}40, inset 0 1px 2px rgba(255, 255, 255, 0.8)`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #38383a 0%, #202022 70%, #121214 100%)',
                  border: `1.5px solid ${rankColor}88`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.7)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.75))' }}
                >
                  {/* Left Facet: Bright White Highlight with clean border */}
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill={rankIndex === 0 ? '#f2f2f7' : rankColor}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                  {/* Right Facet: Crisp Bevel Shading for 3D depth */}
                  <path
                    d="M12 2v15.77l6.18 3.25L17 14.14l5-4.87-6.91-1.01L12 2z"
                    fill="rgba(0, 0, 0, 0.22)"
                  />
                </svg>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{rankName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(rankProgress * 100)}%
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: rankColor, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    LEVEL {rankIndex + 1}
                  </span>
                </div>
              </div>
              
              <div style={{ height: 8, width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: 9999, margin: '8px 0 6px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(2, Math.round(rankProgress * 100))}%`,
                    backgroundColor: rankColor,
                    borderRadius: 9999,
                    boxShadow: `0 0 10px ${rankColor}66`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {totalXp.toLocaleString()} XP
                </span>
                <span>
                  {isMaster ? 'Master Tier' : `${xpToNextRank.toLocaleString()} XP to ${RANK_TIERS[rankIndex + 1]?.name || 'Master'}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Favorites / Physical Vitals (Apple Health Tiles) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)', margin: 0 }}>
              Physical Vitals
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Latest Metrics</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {/* Tile 1: Height */}
            <div className="ios-card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(0, 199, 190, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c7be', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.3 8.7 8.7 21.3c-.4.4-1 .4-1.4 0l-4.6-4.6c-.4-.4-.4-1 0-1.4L15.3 2.7c.4-.4 1-.4 1.4 0l4.6 4.6c.4.4.4 1 0 1.4Z"/>
                      <path d="m14.5 3.5 1 1"/>
                      <path d="m11.5 6.5 2 2"/>
                      <path d="m8.5 9.5 1 1"/>
                      <path d="m5.5 12.5 2 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    HEIGHT
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{ background: 'none', border: 'none', color: '#007aff', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {height}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>cm</span>
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Stature
              </div>
            </div>

            {/* Tile 2: Weight */}
            <div className="ios-card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(48, 209, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#30d158', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-8 4v2a12 12 0 0 0 8 11.3A12 12 0 0 0 20 9V7Z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    WEIGHT
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{ background: 'none', border: 'none', color: '#007aff', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {weight}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>kg</span>
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {minHealthyWeight}-{maxHealthyWeight} kg
              </div>
            </div>

            {/* Tile 3: BMI */}
            <div className="ios-card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(175, 82, 222, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#af52de', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    BMI
                  </span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: bmiInfo.color, padding: '1px 5px', borderRadius: 9999, backgroundColor: `${bmiInfo.color}1f`, whiteSpace: 'nowrap' }}>
                  {bmiInfo.category === 'Normal Weight' ? 'Normal' : bmiInfo.category}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: bmiInfo.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {bmi}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>BMI</span>
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Ref 18.5-24.9
              </div>
            </div>
          </div>
        </div>

        {/* Section: BMI Scale Bar */}
        <div className="ios-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                HEALTH METRIC GAUGE
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                BMI Classification
              </h3>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: bmiInfo.color, padding: '4px 10px', borderRadius: 9999, backgroundColor: `${bmiInfo.color}1a` }}>
              {bmiInfo.category} ({bmi})
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%', marginTop: 28, marginBottom: 10 }}>
            {/* Indicator Pin */}
            <div style={{
              position: 'absolute',
              top: -24,
              left: `${markerPercent}%`,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 3,
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: bmiInfo.color, backgroundColor: 'var(--bg-card)', padding: '1px 6px', borderRadius: 6, boxShadow: 'var(--shadow-sm)', border: `1px solid ${bmiInfo.color}` }}>
                {bmi}
              </span>
              <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${bmiInfo.color}` }} />
            </div>

            {/* Segmented Track */}
            <div style={{ height: 8, width: '100%', borderRadius: 9999, display: 'flex', overflow: 'hidden', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ width: '17.5%', backgroundColor: '#0a84ff' }} title="Underweight (< 18.5)" />
              <div style={{ width: '32%', backgroundColor: '#30d158' }} title="Normal (18.5 - 24.9)" />
              <div style={{ width: '25%', backgroundColor: '#ff9f0a' }} title="Overweight (25 - 29.9)" />
              <div style={{ width: '25.5%', backgroundColor: '#ff375f' }} title="Obese (>= 30)" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 8 }}>
              <span>15.0</span>
              <span>18.5 (Normal)</span>
              <span>25.0 (Overweight)</span>
              <span>35.0+</span>
            </div>
          </div>
        </div>

        {/* Section: Body Visualizer & Anatomical Breakdown */}
        <div className="ios-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ANATOMICAL MODEL
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                Body Visualizer
              </h3>
            </div>

            {/* Apple iOS Segmented Control */}
            <div className="ios-segmented-control" style={{ width: 180 }}>
              <button
                type="button"
                onClick={() => setBodySide('front')}
                className={`ios-segment-btn ${bodySide === 'front' ? 'active' : ''}`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setBodySide('back')}
                className={`ios-segment-btn ${bodySide === 'back' ? 'active' : ''}`}
              >
                Back
              </button>
            </div>
          </div>

          <div className="body-visualizer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24, alignItems: 'center' }}>
            {/* Mannequin Visualizer with Animated Rank Ambient Aura and Flying Particles */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 360,
                backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                borderRadius: 16,
                padding: '20px 0',
                overflow: 'hidden',
              }}
            >
              {/* Minimalist Rank Ambient Aura Rings */}
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 140px)',
                  top: 'calc(50% - 140px)',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  border: `1.5px dashed ${rankColor}66`,
                  animation: 'rankRingPulse 4.5s ease-in-out infinite',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 115px)',
                  top: 'calc(50% - 155px)',
                  width: 230,
                  height: 310,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse at center, ${rankColor}33 0%, ${rankColor}12 48%, transparent 72%)`,
                  animation: 'rankBreathe 3.2s ease-in-out infinite',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* Flying Particles based on Current Rank */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: `${p.left}%`,
                    top: 0,
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                    backgroundColor: rankColor,
                    boxShadow: `0 0 8px ${rankColor}, 0 0 16px ${rankColor}aa`,
                    animation: `floatParticle ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              ))}

              {/* Anatomical Model */}
              <Model
                data={bodyData}
                type={bodySide === 'front' ? 'anterior' : 'posterior'}
                bodyColor={isDark ? 'rgba(142, 142, 147, 0.45)' : 'rgba(120, 120, 128, 0.35)'}
                highlightedColors={RANK_TIERS.map((tier) => tier.color)}
                style={{
                  width: '100%',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 3,
                }}
                svgStyle={{ maxHeight: '320px', width: '100%', margin: '0 auto', display: 'block' }}
              />
            </div>

            {/* Physiological Insights (Apple Health Metric Cards) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                PHYSIOLOGICAL INSIGHTS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {/* Metric 1: Basal Metabolism */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                    borderRadius: 14,
                    border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255, 159, 10, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff9f0a',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Basal Metabolism
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {bmr.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>kcal</span>
                  </div>
                </div>

                {/* Metric 2: Dominant Muscle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                    borderRadius: 14,
                    border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: 'rgba(191, 90, 242, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bf5af2',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Dominant Muscle
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: topMuscle ? (isDark ? getMuscleColor(topMuscle.xp, topMuscle.name) : '#8936b2') : 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {topMuscle ? topMuscle.name : 'None'}
                  </div>
                </div>

                {/* Metric 3: Active Muscle Groups */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                    borderRadius: 14,
                    border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: 'rgba(48, 209, 88, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#30d158' : '#248a3d',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Active Muscles
                    </span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {trainedCount} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>/ {muscleGroups.length}</span>
                  </div>
                </div>

                {/* Metric 4: Healthy Weight Boundary */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                    borderRadius: 14,
                    border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: 'rgba(10, 132, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#0a84ff' : '#0071e3',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                        <path d="M7 21h10"/>
                        <path d="M12 3v18"/>
                        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      Healthy Target
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#30d158' : '#248a3d', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {minHealthyWeight} - {maxHealthyWeight} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank Progression Legend Bar (Milestone Tiers Reference Guide) */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '0.5px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Rank Progression Guide
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• Milestone tiers & XP thresholds</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Row 1: 4 Ranks (Beginner, Novice, Intermediate, Advanced) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {RANK_TIERS.slice(0, 4).map((tier) => (
                  <div
                    key={tier.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 8px',
                      borderRadius: 10,
                      backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                      border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: tier.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {tier.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {tier.minXp >= 1000 ? `${(tier.minXp / 1000).toLocaleString()}k` : `${tier.minXp}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2: 3 Ranks (Expert, Elite, Master) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {RANK_TIERS.slice(4).map((tier) => (
                  <div
                    key={tier.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: isDark ? 'var(--bg-input)' : '#f2f2f7',
                      border: isDark ? '0.5px solid var(--border-subtle)' : '0.5px solid rgba(60, 60, 67, 0.12)',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: tier.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {tier.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {tier.minXp >= 1000 ? `${(tier.minXp / 1000).toLocaleString()}k` : `${tier.minXp}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Muscle Groups Breakdown Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)', margin: 0 }}>
                Muscle Group Progression
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tap any group to inspect completed workout history</div>
            </div>
            {selectedMuscle && (
              <button
                onClick={() => setSelectedMuscle(null)}
                style={{ background: 'none', border: 'none', color: '#007aff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Selection
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 12 }}>
            {displayedMuscles.map((muscle) => {
              const tiers = getMuscleTiers(muscle.name);
              const mRank = getMuscleRank(muscle.xp, muscle.name);
              const mRankName = getMuscleRankName(muscle.xp, muscle.name);
              const mTier = tiers[mRank - 1] || tiers[0];
              const nextMTier = tiers[mRank];
              const mFloor = mTier.minXp;
              const mult = MUSCLE_XP_MULTIPLIERS[(muscle.name || '').toUpperCase().trim()] || 1.0;
              const mCeil = nextMTier ? nextMTier.minXp : mFloor + Math.round(30000 * mult);
              const mProgress = Math.min(Math.max((muscle.xp - mFloor) / (mCeil - mFloor), 0), 1);
              const isSelected = selectedMuscle === muscle.name;
              const badgeStyle = getMuscleBadgeStyle(mRankName, muscle.xp, isDark, muscle.name);

              return (
                <div
                  key={muscle.name}
                  onClick={() => setSelectedMuscle((prev) => (prev === muscle.name ? null : muscle.name))}
                  className="ios-card"
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    border: isSelected ? '1.5px solid var(--accent-red)' : '0.5px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 4px 16px rgba(255, 45, 85, 0.18)' : 'var(--shadow-sm)',
                    transition: 'transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Row 1: Muscle Name full without any truncation or collision */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.2px',
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}
                  >
                    {muscle.name}
                  </div>

                  {/* Row 2: Rank Badge Pill on Left, Completion % on Right */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: badgeStyle.color,
                        backgroundColor: badgeStyle.bg,
                        border: `1px solid ${badgeStyle.border}`,
                        padding: '2.5px 8px',
                        borderRadius: 6,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {mRankName}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(mProgress * 100)}%
                    </span>
                  </div>

                  {/* Row 3: XP Value */}
                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 2 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {muscle.xp.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>XP</span>
                    </div>
                  </div>

                  {/* Row 4: Progress Bar */}
                  <div style={{ height: 5, width: '100%', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.round(mProgress * 100)}%`,
                        backgroundColor: badgeStyle.barColor,
                        borderRadius: 9999,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Daily XP Cap Reached indicator */}
                  {muscle.isDailyCapped && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 2,
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--accent-red)',
                        letterSpacing: '0.2px',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-red)',
                          display: 'inline-block',
                          boxShadow: '0 0 6px var(--accent-red)',
                        }}
                      />
                      <span>MAX XP REACHED TODAY</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Toggle View More / Show Less Button */}
          {sortedMuscleGroups.length > 4 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowAllMuscles((prev) => !prev)}
                className="ios-button-secondary"
                style={{
                  padding: '10px 22px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{showAllMuscles ? 'Show Less' : `View More (${sortedMuscleGroups.length - 4} more)`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAllMuscles ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Section: Selected Muscle Completed Workouts History */}
        {selectedMuscle && (
          <div className="ios-card" style={{ padding: '22px 24px', border: '1.5px solid var(--accent-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                  COMPLETED WORKOUT LOGS
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  Sessions Targeting {selectedMuscle}
                </h3>
              </div>

              <button
                onClick={() => setSelectedMuscle(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {completedForMuscle.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-secondary)' }}>
                  No completed workouts found for {selectedMuscle}.
                </p>
                <p style={{ fontSize: 13, marginTop: 4 }}>
                  Log training sets targeting {selectedMuscle} to track history and progression here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 14,
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.workoutName || 'Workout Session'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', backgroundColor: 'rgba(48, 209, 88, 0.15)', padding: '3px 8px', borderRadius: 9999 }}>
                          COMPLETED
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '0.5px solid var(--border-subtle)', paddingTop: 10 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          Sets: <strong style={{ color: 'var(--text-primary)' }}>{item.totalSets}</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          Volume: <strong style={{ color: 'var(--accent-green)' }}>{(item.totalVolume || 0).toLocaleString()} kg</strong>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          XP: <strong style={{ color: 'var(--accent-orange)' }}>+{item.totalXp}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Apple iOS Sheet Modal: Edit Vitals */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 20,
        }}>
          <div className="ios-card" style={{ width: '100%', maxWidth: 420, borderRadius: 24, padding: 24, boxShadow: 'var(--shadow-floating)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Grabber handle */}
            <div style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: 'var(--text-muted)', opacity: 0.4, margin: '-6px auto 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Edit Physical Vitals
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-input)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  HEIGHT (CM)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="260"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '0.5px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 16,
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  WEIGHT (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '0.5px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 16,
                    outline: 'none',
                  }}
                  required
                />
              </div>

              {profileError && (
                <div style={{ fontSize: 12, color: '#ff3b30', backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: '8px 12px', borderRadius: 8, textAlign: 'center' }}>
                  {profileError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="ios-button-secondary"
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="ios-button-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 700 }}
                >
                  {savingProfile ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>
            </form>

            {/* Danger Zone: Reset Muscle Progress & XP */}
            <div style={{ borderTop: '0.5px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reset Progress
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Reset all muscle group XP, ranks, and workout logs back to 0.
              </p>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                disabled={resettingProgress}
                style={{
                  marginTop: 6,
                  padding: '11px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  border: '1px solid rgba(255, 59, 48, 0.25)',
                  color: '#ff3b30',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Reset All Muscle XP to 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple Destructive Action Sheet: Email Confirmation for Reset All Progress */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div className="ios-card" style={{ width: '100%', maxWidth: 400, borderRadius: 24, padding: '28px 24px', boxShadow: 'var(--shadow-floating)', textAlign: 'center' }}>
            {!resetEmailSent ? (
              <>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 149, 0, 0.12)',
                  color: 'var(--accent-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  border: '1px solid rgba(255, 149, 0, 0.25)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Reset All Progress
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
                  This will reset all your muscle XP, gym workout logs, and running history to 0. You can reset immediately or send a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{user?.email || 'your email'}</strong>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    disabled={resettingProgress || requestingResetEmail}
                    onClick={handleDirectReset}
                    className="ios-button-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 14,
                      backgroundColor: 'var(--accent-orange)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: (resettingProgress || requestingResetEmail) ? 'not-allowed' : 'pointer',
                      opacity: (resettingProgress || requestingResetEmail) ? 0.7 : 1,
                    }}
                  >
                    {resettingProgress ? 'Resetting Progress...' : 'Reset All Progress to 0 Now'}
                  </button>

                  <button
                    type="button"
                    disabled={resettingProgress || requestingResetEmail}
                    onClick={handleRequestResetEmail}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 12,
                      border: '1px solid var(--accent-blue)',
                      cursor: (resettingProgress || requestingResetEmail) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {requestingResetEmail ? 'Sending Email...' : 'Send Verification Email Instead'}
                  </button>

                  <button
                    type="button"
                    disabled={resettingProgress || requestingResetEmail}
                    onClick={() => {
                      setShowResetConfirm(false);
                      setResetEmailSent(false);
                      setResetDevUrl(null);
                    }}
                    className="ios-button-secondary"
                    style={{ width: '100%', padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 700 }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(48, 209, 88, 0.12)',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  border: '1px solid rgba(48, 209, 88, 0.25)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Verification Email Sent
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 18px' }}>
                  A confirmation link has been sent to <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>. Please click the button inside the email to authorize resetting your progress.
                </p>

                {resetDevUrl && (
                  <div style={{ marginBottom: 16 }}>
                    <a
                      href={resetDevUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ios-button-secondary"
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent-blue)',
                        textDecoration: 'none',
                        border: '1px dashed var(--accent-blue)',
                      }}
                    >
                      Open Confirmation Page
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    disabled={resettingProgress}
                    onClick={handleDirectReset}
                    className="ios-button-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 14,
                      backgroundColor: 'var(--accent-orange)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: resettingProgress ? 'not-allowed' : 'pointer',
                      opacity: resettingProgress ? 0.7 : 1,
                    }}
                  >
                    {resettingProgress ? 'Resetting Progress...' : 'Reset All Progress to 0 Now'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetConfirm(false);
                      setResetEmailSent(false);
                      setResetDevUrl(null);
                    }}
                    className="ios-button-secondary"
                    style={{ width: '100%', padding: '12px', borderRadius: 14, fontSize: 14, fontWeight: 700 }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Apple HIG Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
          pointerEvents: 'none',
          maxWidth: '90vw',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: 9999,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
            border: '0.5px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              flexShrink: 0,
            }}>
              ✓
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {toastMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

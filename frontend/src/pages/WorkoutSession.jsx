import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import Navbar from '../components/Navbar';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';
import WorkoutCompletionCelebration from '../components/WorkoutCompletionCelebration';

const REST_DEFAULT = 45;
const COUNTDOWN_DEFAULT = 5;

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-exercise progression state machine:
  // { [exerciseId]: { completedSets: [{ setNumber, reps, weight, volume, xp, time }], targetSets: 3, phase: 'countdown' | 'active' | 'rest' | 'summary' } }
  const [exerciseProgress, setExerciseProgress] = useState({});

  // Active set input fields (configured set-by-set, NOT 3 sets at once)
  const [reps, setReps] = useState(10);
  const [repsInput, setRepsInput] = useState('10');
  const [weight, setWeight] = useState(20);
  const [weightInput, setWeightInput] = useState('20');
  const [logging, setLogging] = useState(false);
  const [toast, setToast] = useState(null);

  // Stepper and direct input handlers for reps (Clamped 1..100)
  const handleAdjustReps = (delta) => {
    setReps((prev) => {
      const next = Math.min(100, Math.max(1, prev + delta));
      setRepsInput(String(next));
      return next;
    });
  };

  const handleRepsChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const clampedRaw = raw.slice(0, 3);
    setRepsInput(clampedRaw);
    const parsed = parseInt(clampedRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setReps(Math.min(100, parsed));
    }
  };

  const handleRepsBlur = () => {
    if (!repsInput || isNaN(parseInt(repsInput, 10))) {
      setReps(1);
      setRepsInput('1');
    } else {
      const parsed = Math.min(100, Math.max(1, parseInt(repsInput, 10)));
      setReps(parsed);
      setRepsInput(String(parsed));
    }
  };

  // Stepper and direct input handlers for weight (0..1000 kg, comma/dot auto-replace)
  const handleAdjustWeight = (delta) => {
    setWeight((prev) => {
      const next = Math.min(1000, Math.max(0, Math.round((prev + delta) * 10) / 10));
      setWeightInput(String(next));
      return next;
    });
  };

  const handleWeightChange = (e) => {
    let raw = e.target.value;
    // Replace comma with dot automatically as user types
    raw = raw.replace(',', '.');
    // Allow empty string, digits up to 4 places, and optional .1 decimal (Max 1000.0)
    if (raw !== '' && !/^\d{0,4}(\.\d{0,1})?$/.test(raw)) return;
    setWeightInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      setWeight(Math.min(1000, parsed));
    }
  };

  const handleWeightBlur = () => {
    if (weightInput === '' || isNaN(parseFloat(weightInput))) {
      setWeight(0);
      setWeightInput('0');
    } else {
      const parsed = Math.min(1000, Math.max(0, Math.round(parseFloat(weightInput) * 10) / 10));
      setWeight(parsed);
      setWeightInput(String(parsed));
    }
  };

  // Countdown timer state (5s Get Ready before starting exercise)
  const [countdownSeconds, setCountdownSeconds] = useState(COUNTDOWN_DEFAULT);

  // Rest timer state (between sets)
  const [restSeconds, setRestSeconds] = useState(REST_DEFAULT);
  const [restCustom, setRestCustom] = useState(REST_DEFAULT);

  // Live session calculation metrics
  const [totalWeightLifted, setTotalWeightLifted] = useState(0);
  const [totalSetsLogged, setTotalSetsLogged] = useState(0);
  const [sessionLogs, setSessionLogs] = useState([]);

  // Exit confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Workout completion celebration & particle migration modal
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [initialUserProgress, setInitialUserProgress] = useState({});
  const [cappedMuscles, setCappedMuscles] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const [userRes, workoutRes, exRes] = await Promise.all([
          fetchApi('/auth/me'),
          fetchApi('/workouts'),
          fetchApi('/exercises'),
        ]);

        if (!userRes.ok) {
          navigate('/', { replace: true });
          return;
        }

        const userData = await userRes.json();
        const workoutsList = await workoutRes.json();
        const allExercises = await exRes.json();

        if (cancelled) return;
        setUser(userData);

        const userId = userData.id || userData.Id;
        if (userId) {
          try {
            const pRes = await fetchApi(`/progress/user/${userId}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              const map = {};
              pData.forEach((item) => {
                map[item.muscleGroup.toUpperCase()] = item.xp;
              });
              setInitialUserProgress(map);
            }
          } catch (e) {
            // fallback
          }
        }

        const currentWorkout = workoutsList.find((w) => String(w.id) === String(id));
        if (!currentWorkout) {
          alert('Workout not found.');
          navigate('/workouts');
          return;
        }

        const workoutExercises = allExercises.filter((e) =>
          currentWorkout.exercises.includes(e.name)
        );

        setWorkout(currentWorkout);
        setExercises(workoutExercises);

        if (workoutExercises.length > 0) {
          const firstEx = workoutExercises[0];
          setSelectedExercise(firstEx);
          setExerciseProgress({
            [firstEx.id]: {
              completedSets: [],
              targetSets: 3,
              phase: 'active',
            },
          });
          setCountdownSeconds(0);
        }
      } catch (err) {
        console.error('Error loading session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // Current selected exercise progress helper
  const currentExProgress = selectedExercise
    ? exerciseProgress[selectedExercise.id] || {
        completedSets: [],
        targetSets: 3,
        phase: 'active',
      }
    : { completedSets: [], targetSets: 3, phase: 'active' };

  const currentPhase = currentExProgress.phase || 'active';
  const completedSets = currentExProgress.completedSets || [];
  const targetSets = currentExProgress.targetSets || 3;
  const currentSetNumber = completedSets.length + 1;

  // Countdown timer effect (5s Get Ready)
  useEffect(() => {
    if (!selectedExercise) return;
    if (currentPhase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExerciseProgress((p) => {
            const exData = p[selectedExercise.id] || { completedSets: [], targetSets: 3 };
            return {
              ...p,
              [selectedExercise.id]: {
                ...exData,
                phase: 'active',
              },
            };
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedExercise?.id, currentPhase]);

  // Rest timer effect (between sets)
  useEffect(() => {
    if (!selectedExercise) return;
    if (currentPhase !== 'rest') return;

    const timer = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExerciseProgress((p) => {
            const exData = p[selectedExercise.id] || { completedSets: [], targetSets: 3 };
            return {
              ...p,
              [selectedExercise.id]: {
                ...exData,
                phase: 'active',
              },
            };
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedExercise?.id, currentPhase]);

  // Handle skip countdown
  const handleSkipCountdown = () => {
    if (!selectedExercise) return;
    setExerciseProgress((p) => {
      const exData = p[selectedExercise.id] || { completedSets: [], targetSets: 3 };
      return {
        ...p,
        [selectedExercise.id]: {
          ...exData,
          phase: 'active',
        },
      };
    });
    setCountdownSeconds(0);
  };

  // Handle skip rest
  const handleSkipRest = () => {
    if (!selectedExercise) return;
    setExerciseProgress((p) => {
      const exData = p[selectedExercise.id] || { completedSets: [], targetSets: 3 };
      return {
        ...p,
        [selectedExercise.id]: {
          ...exData,
          phase: 'active',
        },
      };
    });
    setRestSeconds(0);
  };

  const handleAdjustRest = (delta) => {
    setRestSeconds((prev) => Math.max(10, prev + delta));
  };

  // Switch exercise helper (with direct selection support)
  const switchExercise = (exercise) => {
    if (!exercise || exercise.id === selectedExercise?.id) return;
    setSelectedExercise(exercise);

    // If this exercise has not been started yet, initialize immediately in active phase
    if (!exerciseProgress[exercise.id]) {
      setExerciseProgress((prev) => ({
        ...prev,
        [exercise.id]: {
          completedSets: [],
          targetSets: 3,
          phase: 'active',
        },
      }));
      setCountdownSeconds(0);
    }
  };

  // Previous & Next Exercise navigation
  const currentIndex = exercises.findIndex((e) => e.id === selectedExercise?.id);
  const prevExercise = currentIndex > 0 ? exercises[currentIndex - 1] : null;
  const nextExercise = currentIndex < exercises.length - 1 ? exercises[currentIndex + 1] : null;

  // Finish current set and log it
  const handleFinishSet = async (e) => {
    if (e) e.preventDefault();
    if (!selectedExercise || !user || logging) return;

    const userId = user.id || user.Id;
    if (!userId) {
      alert('Could not verify user id.');
      return;
    }

    setLogging(true);
    try {
      // POST single set log to backend
      const res = await fetchApi('/progress/log-workout', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(userId),
          exerciseId: selectedExercise.id,
          sets: 1, // Strictly 1 set at a time
          reps: Number(reps),
          weightUsed: Number(weight),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const earned = typeof data?.xpEarned === 'number' ? Math.min(4000, Math.max(0, data.xpEarned)) : 0;
        const volumeLifted = 1 * Number(reps) * Number(weight);

        if (data.isDailyCapped) {
          setCappedMuscles((prev) => ({
            ...prev,
            [(selectedExercise.muscleGroup || 'CHEST').toUpperCase()]: true,
          }));
        }

        setTotalWeightLifted((prev) => prev + volumeLifted);
        setTotalSetsLogged((prev) => prev + 1);

        const newSetRecord = {
          setNumber: currentSetNumber,
          reps: Number(reps),
          weight: Number(weight),
          volume: volumeLifted,
          xp: earned,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedSets = [...completedSets, newSetRecord];

        // Add to global session logs list
        setSessionLogs((prev) => [
          {
            id: Date.now(),
            exerciseName: selectedExercise.name,
            muscleGroup: selectedExercise.muscleGroup,
            setNumber: currentSetNumber,
            sets: 1,
            reps: Number(reps),
            weight: Number(weight),
            volume: volumeLifted,
            xp: earned,
            time: newSetRecord.time,
          },
          ...prev,
        ]);

        if (data.isDailyCapped) {
          setToast(`Daily XP cap reached for ${selectedExercise.muscleGroup}! (+${earned} XP)`);
        } else {
          setToast(`+${volumeLifted.toLocaleString()} kg lifted • Set ${currentSetNumber} Finished!`);
        }
        setTimeout(() => setToast(null), 2800);

        // Check if finished target sets
        if (updatedSets.length >= targetSets) {
          // Trigger Exercise Summary Recap!
          setExerciseProgress((prev) => ({
            ...prev,
            [selectedExercise.id]: {
              ...currentExProgress,
              completedSets: updatedSets,
              phase: 'summary',
            },
          }));
        } else {
          // Trigger Rest timer between sets
          setRestSeconds(restCustom);
          setExerciseProgress((prev) => ({
            ...prev,
            [selectedExercise.id]: {
              ...currentExProgress,
              completedSets: updatedSets,
              phase: 'rest',
            },
          }));
        }
      } else {
        alert('Could not log set. Status: ' + res.status);
      }
    } catch (err) {
      alert('Error logging set: ' + err.message);
    } finally {
      setLogging(false);
    }
  };

  // Add bonus set in summary recap
  const handleDoAnotherSet = () => {
    if (!selectedExercise) return;
    setExerciseProgress((prev) => ({
      ...prev,
      [selectedExercise.id]: {
        ...currentExProgress,
        targetSets: targetSets + 1,
        phase: 'active',
      },
    }));
  };

  const handleFinishWorkout = () => {
    if (sessionLogs.length === 0) {
      setShowExitModal(true);
      return;
    }

    const totalXpEarned = sessionLogs.reduce((sum, l) => sum + l.xp, 0);
    const userId = user?.id || user?.Id;
    if (userId) {
      const storageKey = `completed_workouts_${userId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const completedRecord = {
        id: 'session_' + Date.now(),
        workoutId: workout?.id,
        workoutName: workout?.name || 'Workout Session',
        muscleGroups: workout?.muscleGroups || (selectedExercise ? [selectedExercise.muscleGroup] : []),
        completedAt: new Date().toISOString(),
        totalVolume: totalWeightLifted,
        totalSets: totalSetsLogged,
        totalXp: totalXpEarned,
        exercises: Array.from(new Set(sessionLogs.map((l) => l.exerciseName))),
        logs: sessionLogs,
      };
      localStorage.setItem(storageKey, JSON.stringify([completedRecord, ...existing]));
    }

    // Group logs by muscle group to calculate XP earned per group
    const mgMap = {};
    sessionLogs.forEach((l) => {
      const mgName = (l.muscleGroup || selectedExercise?.muscleGroup || 'CHEST').toUpperCase();
      mgMap[mgName] = (mgMap[mgName] || 0) + (l.xp || 0);
    });

    if (Object.keys(mgMap).length === 0 && workout?.muscleGroups) {
      workout.muscleGroups.forEach((mg) => {
        mgMap[mg.toUpperCase()] = Math.round(totalXpEarned / workout.muscleGroups.length);
      });
    }

    const groupsWorked = Object.keys(mgMap).map((mgName) => {
      const earned = Math.min(15000, Math.max(0, mgMap[mgName] || 0));
      const base = Math.min(100000, initialUserProgress[mgName] ?? 3000);
      return {
        name: mgName,
        earnedXp: earned,
        baseXp: base,
        isDailyCapped: Boolean(cappedMuscles[mgName]),
      };
    });

    setCelebrationData({
      workoutName: workout?.name || 'Workout Session',
      totalXpEarned: Math.min(50000, totalXpEarned > 0 ? totalXpEarned : 350),
      muscleGroups: groupsWorked.length > 0 ? groupsWorked : [
        { name: 'CHEST', earnedXp: 350, baseXp: Math.min(100000, initialUserProgress['CHEST'] ?? 3000) }
      ],
    });

    setShowCelebrationModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    navigate('/workouts');
  };

  // Count exercises completed
  const completedExercisesCount = exercises.filter((ex) => {
    const prog = exerciseProgress[ex.id];
    return prog && prog.completedSets && prog.completedSets.length >= (prog.targetSets || 3);
  }).length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!workout || !selectedExercise) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', gap: 16 }}>
        <div style={{ color: 'var(--text-muted)' }}>No exercises in this workout.</div>
        <button onClick={() => navigate('/workouts')} className="ios-button-primary" style={{ padding: '10px 20px', borderRadius: 9999 }}>
          Back to Workouts
        </button>
      </div>
    );
  }

  // Summary statistics for currently finished exercise
  const exerciseTotalVolume = completedSets.reduce((sum, s) => sum + s.volume, 0);
  const exerciseTotalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
  const exerciseTotalXp = completedSets.reduce((sum, s) => sum + s.xp, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      <Navbar user={user} />

      {/* Floating Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--accent-green)',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 700,
          boxShadow: 'var(--shadow-floating)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      <main className="workout-session-container">
        
        {/* Apple Fitness Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--accent-red)', textTransform: 'uppercase', marginBottom: 2 }}>
              ACTIVE WORKOUT SESSION
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.4px', margin: 0, color: 'var(--text-primary)' }}>
              {workout.name}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowExitModal(true)}
              className="ios-button-secondary"
              style={{ padding: '8px 18px', borderRadius: 9999, fontSize: 14, fontWeight: 600 }}
            >
              Exit
            </button>
            <button
              onClick={handleFinishWorkout}
              className="ios-button-primary"
              style={{ padding: '9px 20px', borderRadius: 9999, fontSize: 14, fontWeight: 700 }}
            >
              Finish Workout
            </button>
          </div>
        </div>

        {/* Live Session Metrics Ribbon */}
        <div className="ios-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              TOTAL VOLUME
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
              {totalWeightLifted.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>kg</span>
            </div>
          </div>

          <div style={{ width: 1, height: 32, backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              SETS LOGGED
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {totalSetsLogged}
            </div>
          </div>

          <div style={{ width: 1, height: 32, backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              EXERCISES COMPLETED
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-cyan)', fontVariantNumeric: 'tabular-nums' }}>
              {completedExercisesCount} / {exercises.length}
            </div>
          </div>
        </div>

        {/* Main 2-Column Responsive Split Grid */}
        <div className="workout-session-grid">
          
          {/* Active Exercise Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="ios-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Exercise Header & Prev/Next Quick Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {selectedExercise.muscleGroup}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: 999 }}>
                      Exercise {currentIndex + 1} of {exercises.length}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                    {selectedExercise.name}
                  </h2>
                </div>

                {/* Quick Navigation Buttons */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={prevExercise ? () => switchExercise(prevExercise) : undefined}
                    disabled={!prevExercise}
                    className="ios-button-secondary"
                    style={{
                      padding: '7px 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      opacity: prevExercise ? 1 : 0.4,
                      cursor: prevExercise ? 'pointer' : 'default',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextExercise ? () => switchExercise(nextExercise) : undefined}
                    disabled={!nextExercise}
                    className="ios-button-secondary"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      color: nextExercise ? 'var(--accent-blue)' : 'var(--text-muted)',
                      opacity: nextExercise ? 1 : 0.4,
                      cursor: nextExercise ? 'pointer' : 'default',
                    }}
                  >
                    Next Exercise
                  </button>
                </div>
              </div>

              {/* Media Demonstration */}
              <div style={{ borderRadius: 16, overflow: 'hidden' }}>
                <ExerciseMediaPreview
                  exercise={selectedExercise}
                  exerciseName={selectedExercise?.name}
                  videoUrl={selectedExercise?.videoUrl}
                />
              </div>

              {/* ============================================================ */}
              {/* DYNAMIC STAGE CARD: Countdown / Active Set / Rest / Summary */}
              {/* ============================================================ */}

              {/* STAGE 1: COUNTDOWN (Get Ready before starting exercise) */}
              {currentPhase === 'countdown' && (
                <div style={{
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 18,
                  padding: '28px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 16,
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    GET READY • POSITION YOURSELF
                  </div>

                  {/* Circular Animated Countdown Badge */}
                  <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute', inset: 0 }}>
                      <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255, 45, 85, 0.18)" strokeWidth="6" />
                      <circle
                        cx="55"
                        cy="55"
                        r="48"
                        fill="none"
                        stroke="var(--accent-red)"
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 48}`}
                        strokeDashoffset={`${2 * Math.PI * 48 * (1 - countdownSeconds / COUNTDOWN_DEFAULT)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 55 55)"
                        style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                      />
                    </svg>
                    <div className="countdown-number" style={{ fontSize: 48, fontWeight: 900, color: 'var(--accent-red)', fontVariantNumeric: 'tabular-nums' }}>
                      {countdownSeconds}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Starting <strong>Set 1 of {targetSets}</strong> for {selectedExercise.name}
                  </div>

                  <button
                    type="button"
                    onClick={handleSkipCountdown}
                    className="ios-button-primary"
                    style={{
                      padding: '11px 24px',
                      borderRadius: 9999,
                      fontSize: 14,
                      fontWeight: 700,
                      backgroundColor: 'var(--accent-red)',
                    }}
                  >
                    Start Set 1 Now
                  </button>
                </div>
              )}

              {/* STAGE 2: ACTIVE SET (Sequential Set Execution) */}
              {currentPhase === 'active' && (
                <form onSubmit={handleFinishSet} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Active Set Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, backgroundColor: 'rgba(255, 45, 85, 0.08)', border: '1px solid rgba(255, 45, 85, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ACTIVE SET {currentSetNumber} OF {targetSets}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {completedSets.length} sets completed
                    </span>
                  </div>

                  {/* Steppers for Reps and Weight */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
                    
                    {/* Reps Stepper */}
                    <div className="set-stepper-box">
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        REPS (SET {currentSetNumber})
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={repsInput}
                        onChange={handleRepsChange}
                        onBlur={handleRepsBlur}
                        onFocus={(e) => e.target.select()}
                        style={{
                          width: '100%',
                          maxWidth: 120,
                          textAlign: 'center',
                          fontSize: 32,
                          fontWeight: 900,
                          color: 'var(--text-primary)',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '2px solid transparent',
                          outline: 'none',
                          margin: '6px auto',
                          display: 'block',
                          fontVariantNumeric: 'tabular-nums',
                          cursor: 'text',
                          padding: 0,
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleAdjustReps(-1)}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 18 }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustReps(1)}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 18 }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Weight (kg) Stepper */}
                    <div className="set-stepper-box">
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        WEIGHT (KG)
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        maxLength={6}
                        value={weightInput}
                        onChange={handleWeightChange}
                        onBlur={handleWeightBlur}
                        onFocus={(e) => e.target.select()}
                        style={{
                          width: '100%',
                          maxWidth: 130,
                          textAlign: 'center',
                          fontSize: 32,
                          fontWeight: 900,
                          color: 'var(--accent-green)',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '2px solid transparent',
                          outline: 'none',
                          margin: '6px auto',
                          display: 'block',
                          fontVariantNumeric: 'tabular-nums',
                          cursor: 'text',
                          padding: 0,
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(-0.5)}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 18 }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustWeight(0.5)}
                          style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', fontSize: 18 }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Projected Volume Preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-input)', fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span>Projected Set Volume:</span>
                    <strong style={{ color: 'var(--accent-green)', fontSize: 13 }}>
                      1 set × {reps} reps × {weight} kg = {(1 * reps * weight).toLocaleString()} kg
                    </strong>
                  </div>

                  {/* Finish Set Button */}
                  <button
                    type="submit"
                    disabled={logging}
                    className="ios-button-primary"
                    style={{
                      padding: '14px',
                      borderRadius: 14,
                      fontSize: 16,
                      fontWeight: 700,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: 'var(--accent-blue)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>{logging ? 'Logging...' : `Finish Set ${currentSetNumber}`}</span>
                  </button>
                </form>
              )}

              {/* STAGE 3: REST TIMER (Between sets) */}
              {currentPhase === 'rest' && (
                <div style={{
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 18,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 14,
                  border: '1px solid var(--accent-orange)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.6px', color: 'var(--accent-orange)', textTransform: 'uppercase' }}>
                    REST INTERVAL • CATCH YOUR BREATH
                  </div>

                  <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 149, 0, 0.2)" strokeWidth="7" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="var(--accent-orange)"
                        strokeWidth="7"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - restSeconds / restCustom)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                      {restSeconds}s
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Next up: <strong>Set {currentSetNumber} of {targetSets}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300 }}>
                    <button
                      type="button"
                      onClick={() => handleAdjustRest(15)}
                      className="ios-button-secondary"
                      style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
                    >
                      +15s
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipRest}
                      className="ios-button-primary"
                      style={{ flex: 2, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, backgroundColor: 'var(--accent-orange)' }}
                    >
                      Start Set {currentSetNumber}
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 4: EXERCISE SUMMARY RECAP (Shown upon completing all sets) */}
              {currentPhase === 'summary' && (
                <div style={{
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 18,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  border: '1.5px solid var(--accent-green)',
                }}>
                  {/* Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-green)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 15,
                      }}>
                        ✓
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          EXERCISE FINISHED
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {selectedExercise.name} Summary
                        </h3>
                      </div>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {completedSets.length} sets completed
                    </span>
                  </div>

                  {/* Summary Metric Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                    <div className="exercise-recap-stat">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL VOLUME</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
                        {exerciseTotalVolume.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 600 }}>kg</span>
                      </div>
                    </div>

                    <div className="exercise-recap-stat">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SETS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {completedSets.length} / {targetSets}
                      </div>
                    </div>

                    <div className="exercise-recap-stat">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL REPS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-cyan)', fontVariantNumeric: 'tabular-nums' }}>
                        {exerciseTotalReps}
                      </div>
                    </div>

                    <div className="exercise-recap-stat">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>XP EARNED</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-yellow)', fontVariantNumeric: 'tabular-nums' }}>
                        +{exerciseTotalXp}
                      </div>
                    </div>
                  </div>

                  {/* Sets Breakdown Table */}
                  <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 14, padding: '12px 16px', border: '0.5px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.4px' }}>
                      SETS BREAKDOWN
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {completedSets.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0', borderBottom: idx < completedSets.length - 1 ? '0.5px solid var(--border-subtle)' : 'none' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Set {s.setNumber}:
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                            {s.reps} reps @ {s.weight} kg
                          </span>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>
                            +{(s.volume).toLocaleString()} kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {nextExercise ? (
                      <button
                        type="button"
                        onClick={() => switchExercise(nextExercise)}
                        className="ios-button-primary"
                        style={{
                          padding: '13px',
                          borderRadius: 14,
                          fontSize: 15,
                          fontWeight: 700,
                          backgroundColor: 'var(--accent-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <span>Next Exercise: {nextExercise.name}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishWorkout}
                        className="ios-button-primary"
                        style={{
                          padding: '13px',
                          borderRadius: 14,
                          fontSize: 15,
                          fontWeight: 700,
                          backgroundColor: 'var(--accent-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <span>Complete Workout</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleDoAnotherSet}
                      className="ios-button-secondary"
                      style={{ padding: '11px', borderRadius: 14, fontSize: 14, fontWeight: 600 }}
                    >
                      + Do Another Set
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: Workout HUD, Playlist & Activity Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Workout Progress Card */}
            <div className="ios-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  WORKOUT PROGRESS
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-green)' }}>
                  {Math.round((completedExercisesCount / (exercises.length || 1)) * 100)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${(completedExercisesCount / (exercises.length || 1)) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-green)',
                  transition: 'width 0.3s ease',
                  borderRadius: 999,
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>{completedExercisesCount} of {exercises.length} exercises done</span>
                <span>{totalSetsLogged} sets logged</span>
              </div>
            </div>

            {/* Interactive Exercises Playlist Drawer */}
            <div className="ios-card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  WORKOUT EXERCISES ({exercises.length})
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Tap to switch
                </span>
              </div>

              <div className="ios-grouped-list" style={{ border: '0.5px solid var(--border-subtle)' }}>
                {exercises.map((ex, index) => {
                  const isCurrent = selectedExercise.id === ex.id;
                  const prog = exerciseProgress[ex.id];
                  const exCompletedSets = prog?.completedSets || [];
                  const exTarget = prog?.targetSets || 3;
                  const isFinished = exCompletedSets.length >= exTarget;

                  return (
                    <div
                      key={ex.id}
                      onClick={() => switchExercise(ex)}
                      className="ios-list-cell"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? 'rgba(255, 45, 85, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: isFinished
                            ? 'var(--accent-green)'
                            : isCurrent
                            ? 'var(--accent-red)'
                            : 'var(--bg-input)',
                          color: isFinished || isCurrent ? '#ffffff' : 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isFinished ? '✓' : index + 1}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                            {ex.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {ex.muscleGroup}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isFinished ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', backgroundColor: 'rgba(48, 209, 88, 0.12)', padding: '2px 8px', borderRadius: 999 }}>
                            ✓ {exCompletedSets.length}/{exTarget} sets
                          </span>
                        ) : exCompletedSets.length > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', backgroundColor: 'rgba(0, 122, 255, 0.12)', padding: '2px 8px', borderRadius: 999 }}>
                            Set {exCompletedSets.length + 1}/{exTarget}
                          </span>
                        ) : isCurrent ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-red)', backgroundColor: 'rgba(255, 45, 85, 0.12)', padding: '2px 8px', borderRadius: 999 }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>
                            ›
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Activity Log */}
            {sessionLogs.length > 0 && (
              <div className="ios-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    RECENT SETS ({sessionLogs.length})
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Live Log
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {sessionLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '0.5px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
                          {log.exerciseName} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Set {log.setNumber || 1}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {log.time} • {log.muscleGroup}
                        </div>
                      </div>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {log.reps} reps @ {log.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finish Workout CTA Card */}
            <div className="ios-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: 'rgba(0, 122, 255, 0.04)', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  Ready to wrap up?
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  All your sets are saved in real-time. Finish now to record your workout in your activity calendar.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinishWorkout}
                className="ios-button-primary"
                style={{ width: '100%', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
              >
                Complete Workout ({totalWeightLifted.toLocaleString()} kg)
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* Exit Confirmation Dialog */}
      {showExitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 20,
        }}>
          <div className="ios-card" style={{ width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              End Active Workout?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Are you sure you want to exit? Any logged sets in this workout will still be recorded in your history.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="ios-button-secondary"
                style={{ flex: 1, padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={confirmExit}
                className="ios-button-primary"
                style={{ flex: 1, padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700, backgroundColor: 'var(--accent-red)' }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Completion Celebration & Particle Migration Modal */}
      {showCelebrationModal && celebrationData && (
        <WorkoutCompletionCelebration
          isOpen={showCelebrationModal}
          onClose={() => {
            setShowCelebrationModal(false);
            navigate('/dashboard');
          }}
          workoutName={celebrationData.workoutName}
          totalXpEarned={celebrationData.totalXpEarned}
          muscleGroups={celebrationData.muscleGroups}
          onFinish={() => {
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import Navbar from '../components/Navbar';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';

const REST_DEFAULT = 45;

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set logging fields
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);
  const [logging, setLogging] = useState(false);
  const [toast, setToast] = useState(null);

  // Live session calculation metrics
  const [totalWeightLifted, setTotalWeightLifted] = useState(0);
  const [totalSetsLogged, setTotalSetsLogged] = useState(0);
  const [sessionLogs, setSessionLogs] = useState([]);

  // Rest timer state
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(REST_DEFAULT);
  const [restCustom, setRestCustom] = useState(REST_DEFAULT);
  const restIntervalRef = useRef(null);
  const [nextExercise, setNextExercise] = useState(null);

  // Exit confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);

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
          setSelectedExercise(workoutExercises[0]);
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

  // Rest timer countdown
  useEffect(() => {
    if (restActive) {
      restIntervalRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(restIntervalRef.current);
            setRestActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }
    return () => clearInterval(restIntervalRef.current);
  }, [restActive]);

  const startRest = (currentExercise) => {
    const idx = exercises.findIndex((e) => e.id === currentExercise.id);
    const next = exercises[idx + 1] || null;
    setNextExercise(next);
    setRestSeconds(restCustom);
    setRestActive(true);
  };

  const skipRest = () => {
    clearInterval(restIntervalRef.current);
    setRestActive(false);
  };

  const adjustRest = (delta) => {
    setRestSeconds((prev) => Math.max(10, prev + delta));
    setRestCustom((prev) => Math.max(10, prev + delta));
  };

  const handleLogSet = async (e) => {
    e.preventDefault();
    if (!selectedExercise || !user) return;

    const userId = user.id || user.Id;
    if (!userId) {
      alert('Could not verify user id.');
      return;
    }

    setLogging(true);
    try {
      const res = await fetchApi('/progress/log-workout', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(userId),
          exerciseId: selectedExercise.id,
          sets: Number(sets),
          reps: Number(reps),
          weightUsed: Number(weight),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const earned = data.xpEarned || sets * reps * (weight > 0 ? weight : 1);
        const volumeLifted = Number(sets) * Number(reps) * Number(weight);

        setTotalWeightLifted((prev) => prev + volumeLifted);
        setTotalSetsLogged((prev) => prev + Number(sets));

        setSessionLogs((prev) => [
          {
            id: Date.now(),
            exerciseName: selectedExercise.name,
            muscleGroup: selectedExercise.muscleGroup,
            sets: Number(sets),
            reps: Number(reps),
            weight: Number(weight),
            volume: volumeLifted,
            xp: earned,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);

        setToast(`+${volumeLifted.toLocaleString()} kg lifted — rest now.`);
        setTimeout(() => setToast(null), 3000);

        startRest(selectedExercise);
      } else {
        alert('Could not log set. Status: ' + res.status);
      }
    } catch (err) {
      alert('Error logging set: ' + err.message);
    } finally {
      setLogging(false);
    }
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

    navigate('/dashboard');
  };

  const handleBackClick = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    navigate('/workouts');
  };

  if (loading) {
    return (
      <div style={styles.centerWrap}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (!workout || !selectedExercise) {
    return (
      <div style={styles.centerWrap}>
        <div style={{ color: '#71717a' }}>No exercises in this workout.</div>
        <button onClick={() => navigate('/workouts')} style={styles.backButton}>
          BACK TO WORKOUTS
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar user={user} />

      <main style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.eyebrow}>PULSE FIT / ACTIVE SET</div>
            <h1 style={styles.title}>{workout.name}</h1>
          </div>
          <div style={styles.headerActions}>
            <button onClick={handleBackClick} style={styles.backButton}>
              Back
            </button>
            <button onClick={handleFinishWorkout} style={styles.finishButton}>
              Finish
            </button>
          </div>
        </div>

        {toast && <div style={styles.toast}>{toast}</div>}

        {/* Live Session Metrics Card */}
        <div style={styles.sessionStatsCard}>
          <div style={styles.sessionStatItem}>
            <span style={styles.sessionStatLabel}>TOTAL WEIGHT</span>
            <div style={styles.sessionStatValueGreen}>
              {totalWeightLifted.toLocaleString()}
              <span style={styles.sessionStatUnit}>kg</span>
            </div>
          </div>
          <div style={styles.sessionStatDivider} />
          <div style={styles.sessionStatItem}>
            <span style={styles.sessionStatLabel}>TOTAL SETS</span>
            <div style={styles.sessionStatValue}>{totalSetsLogged}</div>
          </div>
        </div>

        {/* Exercise Chips Selector */}
        <div style={styles.exercisePicker}>
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              style={{
                ...styles.chip,
                ...(selectedExercise.id === ex.id ? styles.chipActive : {}),
              }}
            >
              {ex.name}
            </button>
          ))}
        </div>

        {/* Active Exercise Header */}
        <div style={styles.exerciseHeader}>
          <div style={styles.sectionLabel}>CURRENT EXERCISE</div>
          <h2 style={styles.exerciseName}>{selectedExercise.name}</h2>
          <div style={styles.exerciseGroup}>
            {selectedExercise.muscleGroup.toUpperCase()}
          </div>
        </div>

        {/* Rest Timer or Exercise View */}
        {restActive ? (
          <div style={styles.restCard}>
            <div style={styles.restLabel}>REST</div>
            <div style={styles.restTimer}>{restSeconds}s</div>
            <div style={styles.restTimerBar}>
              <div
                style={{
                  ...styles.restTimerFill,
                  width: `${Math.round((restSeconds / restCustom) * 100)}%`,
                }}
              />
            </div>

            <div style={styles.restAdjustRow}>
              <button onClick={() => adjustRest(-10)} style={styles.restAdjustBtn}>
                -10s
              </button>
              <button onClick={skipRest} style={styles.restSkipBtn}>
                Skip Rest
              </button>
              <button onClick={() => adjustRest(10)} style={styles.restAdjustBtn}>
                +10s
              </button>
            </div>

            {nextExercise ? (
              <div style={styles.upcomingCard}>
                <div style={styles.upcomingLabel}>UPCOMING NEXT</div>
                <div style={styles.upcomingName}>{nextExercise.name}</div>
                <div style={styles.upcomingGroup}>
                  {nextExercise.muscleGroup.toUpperCase()}
                </div>
                {nextExercise.videoUrl && (
                  <ExerciseMediaPreview
                    exerciseName={nextExercise.name}
                    videoUrl={nextExercise.videoUrl}
                    compact
                    style={{ marginTop: 12, minHeight: 160, height: 160 }}
                  />
                )}
              </div>
            ) : (
              <div style={styles.upcomingCard}>
                <div style={styles.upcomingLabel}>LAST EXERCISE DONE</div>
                <div style={{ color: '#10b981', fontSize: 13, fontWeight: 800, marginTop: 4 }}>
                  All exercises completed. Finish when ready.
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <ExerciseMediaPreview
              exerciseName={selectedExercise.name}
              videoUrl={selectedExercise.videoUrl}
            />

            <form onSubmit={handleLogSet} style={styles.logCard}>
              <div style={styles.logTitle}>LOG SET PROGRESS</div>

              <div style={styles.statsRow}>
                <div style={styles.statField}>
                  <label style={styles.statLabel}>SETS</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    style={styles.statInput}
                  />
                </div>

                <div style={styles.statField}>
                  <label style={styles.statLabel}>REPS</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    style={styles.statInput}
                  />
                </div>

                <div style={styles.statField}>
                  <label style={styles.statLabel}>WEIGHT (KG)</label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    style={styles.statInput}
                  />
                </div>
              </div>

              <div style={styles.liveCalcRow}>
                <span style={{ color: '#a1a1aa', fontSize: 11 }}>Volume for this set:</span>
                <strong style={{ color: '#10b981', fontSize: 13 }}>
                  {sets} × {reps} × {weight} kg ={' '}
                  {(Number(sets) * Number(reps) * Number(weight)).toLocaleString()} kg
                </strong>
              </div>

              <button type="submit" disabled={logging} style={styles.logButton}>
                <span>{logging ? 'LOGGING...' : 'LOG SET'}</span>
                <span style={styles.arrowIcon}>›</span>
              </button>
            </form>
          </>
        )}

        {/* Logged Sets History */}
        {sessionLogs.length > 0 && (
          <div style={styles.historyCard}>
            <h3 style={styles.historyTitle}>Sets logged ({sessionLogs.length})</h3>
            <div style={styles.historyList}>
              {sessionLogs.map((log) => (
                <div key={log.id} style={styles.historyItem}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.historyExName}>{log.exerciseName}</div>
                    <div style={styles.historyMeta}>
                      {log.sets}×{log.reps} @ {log.weight}kg • {log.time}
                    </div>
                  </div>
                  <div style={styles.historyRight}>
                    <div style={styles.historyVolume}>+{log.volume.toLocaleString()} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessionLogs.length > 0 && (
          <button onClick={handleFinishWorkout} style={styles.bottomFinishBtn}>
            COMPLETE WORKOUT SESSION
          </button>
        )}
      </main>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIcon}>⚠</div>
            <h3 style={styles.modalTitle}>Leave this session?</h3>
            <p style={styles.modalBody}>
              {sessionLogs.length > 0
                ? 'Your progress will not be saved and XP will be lost. Are you sure?'
                : 'No sets logged yet. Your session will be discarded.'}
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowExitModal(false)} style={styles.modalCancelBtn}>
                Keep Training
              </button>
              <button onClick={confirmExit} style={styles.modalConfirmBtn}>
                Leave Session
              </button>
            </div>
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
  content: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '24px 16px 80px',
    boxSizing: 'border-box',
    width: '100%',
  },
  centerWrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#09090b',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #27272a',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  headerLeft: {
    minWidth: 0,
    flex: 1,
  },
  headerActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  eyebrow: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1.4px',
    marginBottom: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: '0.8px',
    margin: 0,
    wordBreak: 'break-word',
  },
  backButton: {
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.8px',
    backgroundColor: '#18181b',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  finishButton: {
    backgroundColor: '#10b981',
    color: '#09090b',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  bottomFinishBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderRadius: 8,
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: '0.8px',
    marginTop: 20,
    cursor: 'pointer',
    border: 'none',
  },
  toast: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    color: '#86efac',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 16,
    textAlign: 'center',
  },
  exercisePicker: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    border: '1px solid #27272a',
    borderRadius: 6,
    padding: '7px 12px',
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    backgroundColor: '#111113',
    cursor: 'pointer',
  },
  chipActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    color: '#09090b',
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1px',
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: '0.5px',
    margin: '4px 0',
    wordBreak: 'break-word',
  },
  exerciseGroup: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '1px',
  },
  logCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 10,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginTop: 8,
  },
  logTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '1px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  statField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.8px',
  },
  statInput: {
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: 6,
    color: '#ffffff',
    padding: '10px 6px',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 800,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  logButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#09090b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 18px',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '1px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
  },
  arrowIcon: {
    fontSize: 24,
    lineHeight: 1,
  },
  sessionStatsCard: {
    backgroundColor: '#111115',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  sessionStatLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.8px',
    textAlign: 'center',
  },
  sessionStatValueGreen: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  sessionStatUnit: {
    fontSize: 12,
    color: '#86efac',
    fontWeight: 700,
  },
  sessionStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#27272a',
    flexShrink: 0,
  },
  sessionStatValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 900,
  },
  liveCalcRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid #1a2e26',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  // Rest Timer
  restCard: {
    backgroundColor: '#0f1a14',
    border: '1px solid #10b981',
    borderRadius: 12,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  restLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '2px',
  },
  restTimer: {
    color: '#10b981',
    fontSize: 64,
    fontWeight: 900,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  restTimerBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#1a2e26',
    borderRadius: 2,
    overflow: 'hidden',
  },
  restTimerFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
    transition: 'width 1s linear',
  },
  restAdjustRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  restAdjustBtn: {
    border: '1px solid #27272a',
    backgroundColor: '#141418',
    color: '#a1a1aa',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  restSkipBtn: {
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
    flex: 1,
    maxWidth: 180,
    textAlign: 'center',
    border: 'none',
  },
  upcomingCard: {
    width: '100%',
    backgroundColor: '#111115',
    border: '1px solid #1f1f25',
    borderRadius: 10,
    padding: '14px 16px',
  },
  upcomingLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '1.2px',
    marginBottom: 6,
  },
  upcomingName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
  },
  upcomingGroup: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    marginTop: 4,
  },

  // History
  historyCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 10,
    padding: '16px',
    marginTop: 20,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 800,
    margin: '0 0 12px 0',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#111115',
    border: '1px solid #1f1f25',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  historyExName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyMeta: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  historyVolume: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 900,
  },

  // Exit Confirmation Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 200,
  },
  modalCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: '28px 24px',
    maxWidth: 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  modalIcon: {
    fontSize: 28,
    textAlign: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 900,
    margin: 0,
    textAlign: 'center',
  },
  modalBody: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: 'center',
    margin: 0,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#1f1f25',
    border: '1px solid #27272a',
    color: '#ffffff',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.6px',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderRadius: 8,
    fontWeight: 900,
    fontSize: 11,
    letterSpacing: '0.6px',
    cursor: 'pointer',
    border: 'none',
  },
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import Navbar from '../components/Navbar';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';

export default function Workouts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Modal states
  const [showEditor, setShowEditor] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [previewExercise, setPreviewExercise] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWorkouts = async () => {
    try {
      const res = await fetchApi('/workouts');
      if (res.status === 401) {
        navigate('/', { replace: true });
        return;
      }
      if (res.ok) {
        setWorkouts(await res.json());
      }
    } catch (err) {
      console.error('Error loading workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const res = await fetchApi('/exercises');
      if (res.ok) {
        setExercises(await res.json());
      }
    } catch (err) {
      console.error('Error loading exercises:', err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const loadUser = async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.ok) {
        setUser(await res.json());
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  useEffect(() => {
    loadUser();
    loadWorkouts();
    loadExercises();
  }, []);

  const muscleGroups = Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort();

  const filteredExercises = exercises.filter((e) => {
    const matchesGroup = !selectedMuscleGroup || e.muscleGroup.toLowerCase() === selectedMuscleGroup.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesGroup && matchesSearch;
  });

  const openNewWorkout = () => {
    setEditingWorkoutId(null);
    setWorkoutName('');
    setSelectedExercises([]);
    setPreviewExercise(null);
    setSelectedMuscleGroup('');
    setSearchQuery('');
    setShowEditor(true);
  };

  const openEditWorkout = (workout) => {
    setEditingWorkoutId(workout.id);
    setWorkoutName(workout.name);
    const existing = exercises.filter((e) => workout.exercises.includes(e.name));
    setSelectedExercises(existing);
    setPreviewExercise(existing[0] || null);
    setSelectedMuscleGroup('');
    setSearchQuery('');
    setShowEditor(true);
  };

  const toggleExercise = (exercise) => {
    setSelectedExercises((current) => {
      const exists = current.some((item) => item.id === exercise.id);
      if (exists) {
        const next = current.filter((item) => item.id !== exercise.id);
        setPreviewExercise(next[next.length - 1] || null);
        return next;
      }
      setPreviewExercise(exercise);
      return [...current, exercise];
    });
  };

  const saveWorkout = async () => {
    const name = workoutName.trim();
    const groups = Array.from(new Set(selectedExercises.map((e) => e.muscleGroup)));
    const exerciseNames = selectedExercises.map((e) => e.name);

    if (!name || groups.length === 0 || exerciseNames.length === 0) {
      alert('Please enter a workout name and select at least one exercise.');
      return;
    }

    setSaving(true);
    try {
      const isEditing = editingWorkoutId !== null;
      const endpoint = isEditing ? `/workouts/${editingWorkoutId}` : '/workouts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify({
          name,
          muscleGroups: groups,
          exercises: exerciseNames,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setWorkouts((cur) => {
          if (isEditing) {
            return cur.map((w) => (w.id === saved.id ? saved : w));
          }
          return [saved, ...cur];
        });
        setShowEditor(false);
      } else {
        alert('Could not save workout. Please try again.');
      }
    } catch (err) {
      alert('Error saving workout: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkout = async (workout) => {
    if (!window.confirm(`Are you sure you want to delete "${workout.name}"?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/workouts/${workout.id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkouts((cur) => cur.filter((w) => w.id !== workout.id));
      } else {
        alert('Could not delete workout.');
      }
    } catch (err) {
      alert('Error deleting workout.');
    }
  };

  return (
    <div style={styles.page}>
      <Navbar user={user} />

      <main style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>PULSE FIT / TRAINING</div>
            <h1 style={styles.title}>My Workouts</h1>
            <p style={{ color: '#71717a', fontSize: 13, marginTop: 4 }}>
              Manage and start your daily training routines
            </p>
          </div>
          <button onClick={openNewWorkout} style={styles.addButton}>
            + Add Workout
          </button>
        </div>

        {loading ? (
          <div style={styles.centerSpinner}>
            <div style={styles.spinner}></div>
          </div>
        ) : workouts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>NO SAVED WORKOUTS</div>
            <p style={styles.emptyText}>Create your first training routine to start logging XP.</p>
          </div>
        ) : (
          <div style={styles.workoutList}>
            {workouts.map((workout) => (
              <div key={workout.id} style={styles.workoutCard}>
                <div style={styles.workoutCardHeader}>
                  <div>
                    <h3 style={styles.workoutName}>{workout.name}</h3>
                    <div style={styles.workoutMeta}>{workout.muscleGroups.join('  /  ')}</div>
                  </div>
                  <div style={styles.exerciseCount}>{workout.exercises.length} EX</div>
                </div>

                <div style={styles.exerciseList}>
                  {workout.exercises.map((ex) => (
                    <div key={ex} style={styles.exerciseItem}>
                      • {ex}
                    </div>
                  ))}
                </div>

                <div style={styles.cardActions}>
                  <button
                    onClick={() => navigate(`/workout-session/${workout.id}`)}
                    style={styles.startButton}
                  >
                    START
                  </button>
                  <button onClick={() => openEditWorkout(workout)} style={styles.editButton}>
                    EDIT
                  </button>
                  <button onClick={() => deleteWorkout(workout)} style={styles.deleteButton}>
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor Modal */}
      {showEditor && (
        <div style={styles.modalOverlay}>
          <div style={styles.editorCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingWorkoutId ? 'EDIT WORKOUT' : 'NEW WORKOUT'}
              </h2>
              <button onClick={() => setShowEditor(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>WORKOUT NAME</label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Chest & Biceps Day"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>SELECTED EXERCISES ({selectedExercises.length})</label>
              <div style={styles.tagWrap}>
                {selectedExercises.length === 0 ? (
                  <span style={styles.placeholderText}>No exercises selected yet.</span>
                ) : (
                  selectedExercises.map((e) => (
                    <span key={e.id} style={styles.exerciseTag}>
                      {e.name}
                      <button
                        onClick={() => toggleExercise(e)}
                        style={styles.removeTagBtn}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <button onClick={() => setShowPicker(true)} style={styles.chooseBtn}>
              CHOOSE EXERCISES
            </button>

            <button onClick={saveWorkout} disabled={saving} style={styles.saveBtn}>
              {saving ? 'SAVING...' : 'SAVE WORKOUT'}
            </button>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showPicker && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.pickerCard,
              maxWidth: previewExercise ? 880 : 580,
            }}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.eyebrow}>WORKOUT BUILDER</div>
                <h2 style={styles.modalTitle}>CHOOSE EXERCISES</h2>
              </div>
              <button onClick={() => setShowPicker(false)} style={styles.doneBtn}>
                DONE
              </button>
            </div>

            <div className={previewExercise ? 'picker-grid' : ''}>
              {/* Left Column: Search, Muscle Filters, & Exercise List */}
              <div style={styles.pickerLeftCol}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  style={styles.input}
                />

                {/* Muscle group chips */}
                <div style={styles.groupList}>
                  <button
                    type="button"
                    onClick={() => setSelectedMuscleGroup('')}
                    style={{
                      ...styles.groupChip,
                      borderColor: !selectedMuscleGroup ? '#ffffff' : '#27272a',
                      backgroundColor: !selectedMuscleGroup ? '#ffffff' : '#111115',
                      color: !selectedMuscleGroup ? '#09090b' : '#a1a1aa',
                    }}
                  >
                    ALL
                  </button>
                  {muscleGroups.map((g) => {
                    const isGroupSelected =
                      selectedMuscleGroup.toLowerCase() === g.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => {
                          setSelectedMuscleGroup((prev) =>
                            prev.toLowerCase() === g.toLowerCase() ? '' : g
                          );
                        }}
                        style={{
                          ...styles.groupChip,
                          borderColor: isGroupSelected ? '#ffffff' : '#27272a',
                          backgroundColor: isGroupSelected ? '#ffffff' : '#111115',
                          color: isGroupSelected ? '#09090b' : '#a1a1aa',
                        }}
                      >
                        {g.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                {/* List */}
                <div
                  style={{
                    ...styles.exercisePickerList,
                    maxHeight: previewExercise ? 350 : 380,
                  }}
                >
                  {loadingExercises ? (
                    <div style={styles.centerSpinner}>
                      <div style={styles.spinner}></div>
                    </div>
                  ) : filteredExercises.length === 0 ? (
                    <div style={styles.emptyText}>No exercises found</div>
                  ) : (
                    filteredExercises.map((ex) => {
                      const isSelected = selectedExercises.some(
                        (item) => item.id === ex.id
                      );
                      const isPreviewing = previewExercise?.id === ex.id;
                      return (
                        <div
                          key={ex.id}
                          onClick={() => toggleExercise(ex)}
                          style={{
                            ...styles.exerciseOption,
                            ...(isSelected ? styles.exerciseOptionSelected : {}),
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.exerciseOptionName}>{ex.name}</div>
                            <div style={styles.exerciseOptionGroup}>
                              {ex.muscleGroup.toUpperCase()}
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexShrink: 0,
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewExercise((cur) =>
                                  cur?.id === ex.id ? null : ex
                                );
                              }}
                              style={{
                                ...styles.previewBtn,
                                ...(isPreviewing ? styles.previewBtnActive : {}),
                              }}
                              title="Preview movement frames"
                            >
                              Preview
                            </button>
                            <div
                              style={{
                                ...styles.exerciseCheck,
                                color: isSelected ? '#10b981' : '#71717a',
                              }}
                            >
                              {isSelected ? '✓' : '+'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column (50%): Motion Preview Demo */}
              {previewExercise && (
                <div style={styles.pickerRightCol}>
                  <ExerciseMediaPreview
                    exerciseName={previewExercise.name}
                    videoUrl={previewExercise.videoUrl}
                    onClose={() => setPreviewExercise(null)}
                    style={{
                      height: '100%',
                      minHeight: 350,
                      maxHeight: 420,
                    }}
                  />
                </div>
              )}
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
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 20px 60px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  eyebrow: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1.4px',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '0.5px',
    margin: 0,
  },
  addButton: {
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
  centerSpinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #27272a',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    border: '1px solid #27272a',
    borderRadius: 9,
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#111113',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '1px',
    marginBottom: 8,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
  },
  workoutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  workoutCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 9,
    padding: 18,
  },
  workoutCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: '0.6px',
    margin: 0,
  },
  workoutMeta: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.7px',
    marginTop: 6,
  },
  exerciseCount: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 800,
  },
  exerciseList: {
    borderTop: '1px solid #222227',
    marginTop: 14,
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  exerciseItem: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  cardActions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  startButton: {
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderRadius: 5,
    padding: '8px 16px',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.7px',
    cursor: 'pointer',
  },
  editButton: {
    border: '1px solid #33333a',
    color: '#d4d4d8',
    borderRadius: 5,
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.7px',
    cursor: 'pointer',
  },
  deleteButton: {
    border: '1px solid #27272a',
    color: '#71717a',
    borderRadius: 5,
    padding: '8px 14px',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.7px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 100,
  },
  editorCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  pickerCard: {
    backgroundColor: '#141418',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: 22,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: '0.8px',
    margin: 0,
  },
  closeBtn: {
    color: '#a1a1aa',
    fontSize: 18,
    cursor: 'pointer',
  },
  doneBtn: {
    border: '1px solid #ffffff',
    color: '#ffffff',
    borderRadius: 5,
    padding: '6px 12px',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.8px',
    cursor: 'pointer',
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
  tagWrap: {
    minHeight: 48,
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#71717a',
    fontSize: 12,
  },
  exerciseTag: {
    backgroundColor: '#10241a',
    border: '1px solid #10b981',
    color: '#86efac',
    borderRadius: 5,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  removeTagBtn: {
    color: '#86efac',
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
  },
  chooseBtn: {
    backgroundColor: '#1c1c21',
    border: '1px solid #33333a',
    color: '#ffffff',
    borderRadius: 6,
    height: 44,
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  saveBtn: {
    backgroundColor: '#ffffff',
    color: '#09090b',
    borderRadius: 6,
    height: 46,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: '0.8px',
    cursor: 'pointer',
  },
  pickerLeftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
  },
  pickerRightCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
    height: '100%',
  },
  groupList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupChip: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.15s ease',
  },
  exercisePickerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: 360,
    maxHeight: 360,
    minHeight: 360,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: 4,
  },
  exerciseOption: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    minWidth: 0,
  },
  exerciseOptionSelected: {
    backgroundColor: '#0e1f16',
    borderColor: '#10b981',
  },
  exerciseOptionName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  exerciseOptionGroup: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    marginTop: 2,
  },
  previewBtn: {
    backgroundColor: '#1f1f25',
    border: '1px solid #2e2e36',
    color: '#a1a1aa',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  previewBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    color: '#09090b',
  },
  exerciseCheck: {
    fontSize: 18,
    fontWeight: 900,
  },
};

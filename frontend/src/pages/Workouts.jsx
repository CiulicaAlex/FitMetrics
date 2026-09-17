import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import Navbar from '../components/Navbar';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';

const POPULAR_WORKOUTS = [
  {
    id: 'arnold-arms',
    name: 'Arnold Arms Day',
    label: 'ARM SPECIALIZATION',
    description: 'High-volume biceps and triceps training inspired by Arnold Schwarzenegger.',
    muscleGroups: ['Biceps', 'Triceps'],
    exercises: [
      'Bicep Curl',
      'Incline Dumbbell Curl',
      'Concentration Curls',
      'Close-Grip Barbell Bench Press',
      'Lying Triceps Press',
      'Triceps Pushdown',
    ],
  },
  {
    id: 'ronnie-arms',
    name: 'Ronnie Heavy Arms',
    label: 'HEAVY POWER ARMS',
    description: 'Heavy loads and high tension arm template for maximum muscle stimulus.',
    muscleGroups: ['Biceps', 'Triceps'],
    exercises: [
      'Dumbbell Bicep Curl',
      'Alternate Hammer Curl',
      'Cable Preacher Curl',
      'Bench Dips',
      'Band Skull Crusher',
      'Cable Incline Triceps Extension',
    ],
  },
  {
    id: 'classic-ppl',
    name: 'Classic Push / Pull / Legs',
    label: 'FOUNDATION SPLIT',
    description: 'A complete three-session split balancing upper push, upper pull, and lower chain.',
    muscleGroups: [
      'Chest',
      'Shoulders',
      'Triceps',
      'Upper Back',
      'Lower Back',
      'Biceps',
      'Quadriceps',
      'Glutes',
      'Calves',
    ],
    exercises: [
      'Bench Press',
      'Arnold Dumbbell Press',
      'Cable Incline Triceps Extension',
      'Bent Over Barbell Row',
      'Deadlift',
      'Bicep Curl',
      'Barbell Squat',
      'Barbell Hip Thrust',
      'Barbell Seated Calf Raise',
    ],
  },
  {
    id: 'chest-powerhouse',
    name: 'Chest Forge & Power',
    label: 'CHEST SPECIALIZATION',
    description: 'Compound presses and targeted flies for complete upper, mid, and lower pec development.',
    muscleGroups: ['Chest'],
    exercises: [
      'Bench Press',
      'Incline Bench Press',
      'Dumbbell Flyes',
      'Pushups',
    ],
  },
  {
    id: 'back-traps-thickness',
    name: 'V-Taper Back & Traps',
    label: 'POSTERIOR CHAIN',
    description: 'Heavy rows, vertical pulls, deadlifts, and shrugs to sculpt back thickness and width.',
    muscleGroups: ['Upper Back', 'Lower Back', 'Traps'],
    exercises: [
      'Pullups',
      'Bent Over Barbell Row',
      'Deadlift',
      'Barbell Shrug',
    ],
  },
  {
    id: 'boulder-shoulders',
    name: 'Boulder Shoulders',
    label: 'DELTOID FOCUS',
    description: 'Target anterior, lateral, and posterior deltoid heads for 3D shoulder shape.',
    muscleGroups: ['Shoulders'],
    exercises: [
      'Arnold Dumbbell Press',
      'Side Lateral Raise',
      'Front Dumbbell Raise',
      'Alternating Cable Shoulder Press',
    ],
  },
  {
    id: 'leg-day-destroyer',
    name: 'Leg Day Annihilation',
    label: 'QUAD & GLUTE POWER',
    description: 'Comprehensive lower body training covering heavy squats, hip thrusts, and calves.',
    muscleGroups: ['Quadriceps', 'Glutes', 'Calves'],
    exercises: [
      'Barbell Squat',
      'Barbell Hip Thrust',
      'Leg Extensions',
      'Standing Calf Raises',
    ],
  },
  {
    id: 'core-abs-shred',
    name: 'Six-Pack & Core Shred',
    label: 'ABDOMINALS & OBLIQUES',
    description: 'Condition the anterior core, transverse abdominal wall, and rotational obliques.',
    muscleGroups: ['Abs', 'Obliques'],
    exercises: [
      'Hanging Leg Raise',
      'Decline Crunch',
      'Russian Twist',
      'Plank',
    ],
  },
  {
    id: 'machines-cables-hypertrophy',
    name: 'Gym Machines & Cables Hypertrophy',
    label: 'MACHINES & CABLES FOCUS',
    description: 'Pure machine and cable isolation circuit for maximum hypertrophy with constant muscle tension.',
    muscleGroups: ['Chest', 'Shoulders', 'Upper Back', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings'],
    exercises: [
      'Lever Chest Press',
      'Machine Chest Fly (Pec Deck)',
      'Lever Shoulder Press',
      'Cable Lat Pulldown',
      'Cable Seated Row',
      'Lever Leg Press',
      'Cable Triceps Pushdown',
      'Cable Bicep Curl',
    ],
  },
  {
    id: 'push-day-machines-cables',
    name: 'Push Day: Chest, Shoulders & Triceps',
    label: 'UPPER PUSH SPECIALIZATION',
    description: 'Heavy pressing on seated machines, chest flies on Pec Deck, and cable rope triceps pushdowns.',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    exercises: [
      'Lever Chest Press',
      'Machine Chest Fly (Pec Deck)',
      'Lever Shoulder Press',
      'Cable Upper Chest Crossovers',
      'Dumbbell Lateral Raise',
      'Cable Triceps Pushdown',
    ],
  },
  {
    id: 'pull-day-cables-dumbbells',
    name: 'Pull Day: Back, Rear Delts & Biceps',
    label: 'UPPER PULL SPECIALIZATION',
    description: 'Vertical lat pulldowns, horizontal seated cable rows, single-arm dumbbell rows, and rope hammer curls.',
    muscleGroups: ['Upper Back', 'Shoulders', 'Biceps'],
    exercises: [
      'Cable Lat Pulldown',
      'Cable Seated Row',
      'Dumbbell One Arm Bent Over Row',
      'Lever Seated Reverse Fly',
      'Cable Bicep Curl',
      'Dumbbell Hammer Curl',
    ],
  },
  {
    id: 'legs-abs-machine-power',
    name: 'Legs & Abs Machine Power',
    label: 'LOWER BODY & CORE MACHINES',
    description: 'Heavy leg press machine, quad extensions, seated leg curls, Romanian deadlifts, and seated crunch machine.',
    muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Abs', 'Calves'],
    exercises: [
      'Lever Leg Press',
      'Lever Leg Extension',
      'Lever Seated Leg Curl',
      'Dumbbell Romanian Deadlift',
      'Lever Seated Crunch',
      'Standing Calf Raises',
    ],
  },
  {
    id: 'dumbbells-only-full-body',
    name: 'Dumbbells Only Full Body',
    label: 'FREE WEIGHTS TEMPLATE',
    description: 'Complete full-body workout using exclusively dumbbells and an adjustable bench.',
    muscleGroups: ['Chest', 'Upper Back', 'Shoulders', 'Biceps', 'Glutes', 'Quadriceps'],
    exercises: [
      'Dumbbell Incline Bench Press',
      'Dumbbell One Arm Bent Over Row',
      'Dumbbell Seated Shoulder Press',
      'Dumbbell Lateral Raise',
      'Dumbbell Romanian Deadlift',
      'Dumbbell Incline Biceps Curl',
      'Dumbbell Goblet Squat',
    ],
  },
];

export default function Workouts() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Search filter
  const [routineSearch, setRoutineSearch] = useState('');

  // Modal states
  const [showEditor, setShowEditor] = useState(false);
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

  const loadPopularWorkout = (template) => {
    const selected = template.exercises
      .map((name) =>
        exercises.find((exercise) => exercise.name.toLowerCase() === name.toLowerCase())
      )
      .filter(Boolean);
    const missing = template.exercises.filter(
      (name) => !selected.some((exercise) => exercise.name.toLowerCase() === name.toLowerCase())
    );

    if (missing.length > 0) {
      alert(`Some template exercises are not available yet: ${missing.join(', ')}`);
      return;
    }

    setEditingWorkoutId(null);
    setWorkoutName(template.name);
    setSelectedExercises(selected);
    setPreviewExercise(selected[0] || null);
    setSelectedMuscleGroup('');
    setSearchQuery('');
    setShowEditor(true);
  };

  const filteredWorkouts = workouts.filter((w) => {
    if (!routineSearch.trim()) return true;
    const query = routineSearch.toLowerCase();
    const nameMatch = w.name.toLowerCase().includes(query);
    const muscleMatch = (w.muscleGroups || []).some((m) => m.toLowerCase().includes(query));
    const exerciseMatch = (w.exercises || []).some((e) => e.toLowerCase().includes(query));
    return nameMatch || muscleMatch || exerciseMatch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      <Navbar user={user} />

      <main style={{ maxWidth: 1040, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '28px 20px 120px', display: 'flex', flexDirection: 'column', gap: 28, overflowX: 'hidden' }}>
        
        {/* Apple Fitness Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
              FITNESS+ • STRENGTH & RESISTANCE
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>
              Workouts
            </h1>
          </div>

          <button
            onClick={openNewWorkout}
            className="ios-button-primary"
            style={{ padding: '9px 18px', borderRadius: 9999, fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Create Workout</span>
          </button>
        </div>

        {/* iOS Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 12,
            padding: '10px 14px',
            gap: 10,
            border: '0.5px solid var(--border-subtle)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search routines, muscle groups, or exercises..."
              value={routineSearch}
              onChange={(e) => setRoutineSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 15,
                width: '100%',
              }}
            />
            {routineSearch && (
              <button
                type="button"
                onClick={() => setRoutineSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="var(--text-muted)" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="var(--bg-card)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Section: My Saved Routines */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)', margin: 0 }}>
              My Routines
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filteredWorkouts.length} routine{filteredWorkouts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="ios-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255, 45, 85, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#ff2d55' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {routineSearch ? 'No matching routines' : 'No saved workouts yet'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {routineSearch ? 'Try a different search term or create a custom workout.' : 'Create your first workout or load one of our curated Apple Fitness templates below.'}
              </p>
              <button
                onClick={openNewWorkout}
                className="ios-button-primary"
                style={{ marginTop: 14, padding: '8px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 700 }}
              >
                + Create Routine
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
              {filteredWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="ios-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(48, 209, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#30d158' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12"/>
                          </svg>
                        </div>
                        <div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {workout.name}
                          </h3>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {(workout.muscleGroups || []).join(' • ')}
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)', padding: '3px 8px', borderRadius: 9999 }}>
                        {workout.exercises.length} EX
                      </span>
                    </div>

                    {/* Exercise List preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '12px 0 6px' }}>
                      {workout.exercises.slice(0, 4).map((ex) => (
                        <div key={ex} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
                          <span>{ex}</span>
                        </div>
                      ))}
                      {workout.exercises.length > 4 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 10 }}>
                          +{workout.exercises.length - 4} more exercises
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, borderTop: '0.5px solid var(--border-subtle)', paddingTop: 14 }}>
                    <button
                      onClick={() => navigate(`/workout-session/${workout.id}`)}
                      className="ios-button-primary"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      <span>Start</span>
                    </button>

                    <button
                      onClick={() => openEditWorkout(workout)}
                      className="ios-button-secondary"
                      style={{ padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteWorkout(workout)}
                      className="ios-button-secondary"
                      style={{ padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Featured Curated Templates */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              CURATED FITNESS+ COLLECTIONS
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--text-primary)', margin: '2px 0 0' }}>
              Explore Workout Routines
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
            {POPULAR_WORKOUTS.map((template) => (
              <div
                key={template.id}
                className="ios-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--accent-red)', textTransform: 'uppercase' }}>
                      {template.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: 9999 }}>
                      {template.exercises.length} EX
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {template.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 10px' }}>
                    {template.description}
                  </p>

                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {template.muscleGroups.join(' • ')}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {template.exercises.map((exercise) => (
                      <div key={exercise} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>+</span>
                        <span>{exercise}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadPopularWorkout(template)}
                  disabled={loadingExercises}
                  className="ios-button-secondary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#007aff',
                  }}
                >
                  Load into Builder
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Apple iOS Sheet Modal: Workout Builder & Editor */}
      {showEditor && (
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
          <div className="ios-card" style={{ width: '100%', maxWidth: 860, maxHeight: '90vh', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            
            {/* Grabber handle */}
            <div style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: 'var(--text-muted)', opacity: 0.4, margin: '-6px auto 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {editingWorkoutId ? 'Edit Workout Routine' : 'Create New Workout'}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Select exercises and target muscle groups
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditor(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--bg-input)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Routine Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  WORKOUT NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest & Triceps Hypertrophy"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
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
                />
              </div>

              {/* Selected Exercises Badge Strip */}
              {selectedExercises.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    SELECTED EXERCISES ({selectedExercises.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedExercises.map((ex) => (
                      <span
                        key={ex.id}
                        onClick={() => toggleExercise(ex)}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 45, 85, 0.12)',
                          color: 'var(--accent-red)',
                          padding: '5px 10px',
                          borderRadius: 9999,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{ex.name}</span>
                        <span style={{ fontSize: 10 }}>✕</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Split Layout: Exercise Selector & Live Media Demonstration */}
              <div className="workout-picker-split" style={{
                display: 'grid',
                gridTemplateColumns: previewExercise ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
                gap: 16,
                alignItems: 'start',
              }}>
                {/* Left Column: Filters and Scrollable Exercise List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Filter exercises by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        flex: '1 1 150px',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '0.5px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <select
                      value={selectedMuscleGroup}
                      onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                      style={{
                        flex: '0 1 150px',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '0.5px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">All Muscle Groups</option>
                      {muscleGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Protected Scrollable Exercise List */}
                  <div style={{
                    maxHeight: 280,
                    minHeight: 200,
                    overflowY: 'auto',
                    border: '0.5px solid var(--border-subtle)',
                    borderRadius: 14,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    backgroundColor: 'var(--bg-card-subtle)',
                  }}>
                    {filteredExercises.map((ex) => {
                      const isSelected = selectedExercises.some((e) => e.id === ex.id);
                      const isPreview = previewExercise?.id === ex.id;

                      return (
                        <div
                          key={ex.id}
                          onClick={() => toggleExercise(ex)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '9px 12px',
                            borderRadius: 10,
                            backgroundColor: isPreview
                              ? 'rgba(0, 122, 255, 0.14)'
                              : (isSelected ? 'rgba(255, 45, 85, 0.12)' : 'var(--bg-card)'),
                            border: isPreview
                              ? '1.5px solid #007aff'
                              : (isSelected ? '1px solid rgba(255, 45, 85, 0.45)' : '0.5px solid var(--border-subtle)'),
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: isPreview ? '#007aff' : (isSelected ? 'var(--accent-red)' : 'var(--text-primary)'),
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {ex.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {ex.muscleGroup}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {isSelected && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-red)', letterSpacing: '0.4px' }}>
                                ADDED
                              </span>
                            )}
                            <div style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: isSelected ? 'none' : '1.5px solid var(--border-subtle)',
                              backgroundColor: isSelected ? 'var(--accent-red)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              {isSelected && '✓'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Live Media Demonstration Preview */}
                {previewExercise && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minWidth: 0,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        EXERCISE DEMONSTRATION
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewExercise(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                      >
                        Hide ✕
                      </button>
                    </div>

                    <ExerciseMediaPreview
                      exercise={previewExercise}
                      exerciseName={previewExercise.name}
                      videoUrl={previewExercise.videoUrl}
                      compact={true}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: 10, borderTop: '0.5px solid var(--border-subtle)', paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="ios-button-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveWorkout}
                disabled={saving}
                className="ios-button-primary"
                style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 700 }}
              >
                {saving ? 'Saving...' : 'Save Routine'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

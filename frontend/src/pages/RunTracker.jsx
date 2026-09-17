import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RUN_MODES = [
  { id: 'running', label: 'Running', desc: 'Outdoor road & trail tracking' },
  { id: '5k_goal', label: '5K Pace Goal', desc: 'Targeting sub-25 min 5K' },
];

// Haversine formula to compute distance in km between two GPS coordinates
function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RunTracker() {
  const [user, setUser] = useState(null);
  const [selectedMode, setSelectedMode] = useState('running');

  // Live session state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentPace, setCurrentPace] = useState('0:00');
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(0);

  // GPS & Map state
  const [userCoords, setUserCoords] = useState(null); // [lat, lng]
  const [routeCoords, setRouteCoords] = useState([]); // array of [lat, lng]
  const [gpsStatus, setGpsStatus] = useState('Acquiring GPS...');
  const [isSimulating, setIsSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Database Recent Runs (strictly up to 3)
  const [recentRuns, setRecentRuns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);

  // Fetch authenticated user & 3 most recent runs from database
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const userRes = await fetchApi('/auth/me');
        if (!userRes.ok) return;
        const userData = await userRes.json();
        if (cancelled) return;
        setUser(userData);

        fetchRecentRuns();
      } catch (err) {
        console.error('Error loading run data:', err);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchRecentRuns = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchApi('/runs/recent?limit=3');
      if (res.ok) {
        const data = await res.json();
        setRecentRuns(data);
      }
    } catch (err) {
      console.error('Error fetching recent runs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (Bucharest, Romania or fallback until GPS fixes)
    const initialCoords = [44.4268, 26.1025];

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // High-resolution clean OpenStreetMap tiles (100% free, no API key, no watermark)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add subtle zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Polyline for tracking traversed path (Vibrant iOS Blue)
    const polyline = L.polyline([], {
      color: '#007aff',
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    mapInstanceRef.current = map;
    polylineRef.current = polyline;

    // Initial GPS location fix
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = [latitude, longitude];
          setUserCoords(pos);
          setGpsStatus('GPS Connected');
          map.setView(pos, 16);

          updateUserMarker(pos, map);
        },
        (error) => {
          console.warn('Initial geolocation warning:', error.message);
          setGpsStatus('GPS Ready (Searching)');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus('GPS Not Supported');
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update or create pulsating blue dot marker
  const updateUserMarker = (coords, mapOverride = null) => {
    const map = mapOverride || mapInstanceRef.current;
    if (!map) return;

    const puckHtml = `
      <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(0,122,255,0.24); animation:gpsPulseRing 1.8s infinite ease-out;"></div>
        <div style="width:18px; height:18px; border-radius:50%; background:#007aff; border:3px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.4); z-index:2;"></div>
      </div>
    `;

    const customPuckIcon = L.divIcon({
      className: 'custom-gps-puck',
      html: puckHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(coords, { icon: customPuckIcon }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(coords);
    }
  };

  // Timer & real-time pace/speed calculation
  useEffect(() => {
    let timer = null;
    if (isRunning && !isPaused) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isPaused]);

  // Compute live pace and average speed whenever seconds or distance changes
  useEffect(() => {
    if (seconds > 0 && distanceKm > 0) {
      // Speed in km/h
      const hours = seconds / 3600;
      const speed = distanceKm / hours;
      setAvgSpeedKmh(parseFloat(speed.toFixed(1)));

      // Pace in min/km: updates minute-by-minute (every 60s) to prevent second-by-second fluctuation
      const isFullMinute = seconds % 60 === 0;
      const isInitialEstimate = seconds === 15 && currentPace === '0:00';

      if (isFullMinute || isInitialEstimate) {
        const paceMinutes = (seconds / 60) / distanceKm;
        if (isFinite(paceMinutes) && paceMinutes > 0 && paceMinutes < 60) {
          const mins = Math.floor(paceMinutes);
          const secs = Math.round((paceMinutes - mins) * 60);
          setCurrentPace(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }
    } else if (seconds === 0) {
      setAvgSpeedKmh(0);
      setCurrentPace('0:00');
    }
  }, [seconds, distanceKm, currentPace]);

  // Handle GPS location streaming when running in real life
  useEffect(() => {
    if (!isRunning || isPaused || isSimulating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('GPS Not Supported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = [latitude, longitude];
        setGpsStatus(`GPS Active (±${Math.round(accuracy || 5)}m)`);

        setUserCoords(newCoords);
        updateUserMarker(newCoords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords, { animate: true, duration: 0.8 });
        }

        setRouteCoords((prev) => {
          if (prev.length === 0) {
            const nextRoute = [newCoords];
            if (polylineRef.current) polylineRef.current.setLatLngs(nextRoute);
            return nextRoute;
          }

          const lastCoords = prev[prev.length - 1];
          const delta = computeDistanceKm(lastCoords[0], lastCoords[1], newCoords[0], newCoords[1]);

          // Filter out tiny jitter < 2 meters (0.002 km)
          if (delta >= 0.002) {
            setDistanceKm((d) => parseFloat((d + delta).toFixed(3)));
            const nextRoute = [...prev, newCoords];
            if (polylineRef.current) polylineRef.current.setLatLngs(nextRoute);
            return nextRoute;
          }
          return prev;
        });
      },
      (error) => {
        console.warn('GPS watch error:', error.message);
        setGpsStatus('GPS Signal Weak');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isRunning, isPaused, isSimulating]);

  // Simulation mode loop (indoor / desktop testing)
  useEffect(() => {
    if (!isRunning || isPaused || !isSimulating) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      return;
    }

    // Step every 1 second: simulates a runner moving ~10.8 km/h (3 meters per second)
    simIntervalRef.current = setInterval(() => {
      setRouteCoords((prev) => {
        const center = prev.length > 0 ? prev[prev.length - 1] : (userCoords || [44.4268, 26.1025]);
        // Slight organic curves in heading
        const angle = (Date.now() / 3200) % (2 * Math.PI);
        const stepLat = Math.sin(angle) * 0.000035;
        const stepLng = Math.cos(angle) * 0.000035;

        const nextPoint = [center[0] + stepLat, center[1] + stepLng];
        const stepDist = computeDistanceKm(center[0], center[1], nextPoint[0], nextPoint[1]);

        setDistanceKm((d) => parseFloat((d + stepDist).toFixed(3)));
        setUserCoords(nextPoint);
        updateUserMarker(nextPoint);

        const updatedRoute = [...prev, nextPoint];
        if (polylineRef.current) polylineRef.current.setLatLngs(updatedRoute);
        if (mapInstanceRef.current) mapInstanceRef.current.panTo(nextPoint, { animate: true });

        return updatedRoute;
      });
    }, 1000);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, isSimulating, userCoords]);

  // Calories formula based on user weight and distance
  const userWeight = user?.weight ?? user?.Weight ?? 75;
  const caloriesBurned = Math.round(distanceKm * (userWeight * 1.036));

  const formatTime = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Workout
  const handleStartRun = (simulate = false) => {
    setIsSimulating(simulate);
    setSeconds(0);
    setDistanceKm(0);
    setRouteCoords([]);
    if (polylineRef.current) polylineRef.current.setLatLngs([]);
    setIsRunning(true);
    setIsPaused(false);

    if (simulate) {
      setGpsStatus('Demo Route Simulation Active');
    } else {
      setGpsStatus('Connecting GPS...');
    }

    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userCoords, 17, { animate: true });
    }
  };

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  // End Workout & persist to database
  const handleFinishRun = async () => {
    const userId = user?.id || user?.Id;

    if (distanceKm > 0.02 && userId) {
      try {
        const modeLabel = selectedMode === '5k_goal' ? '5K Pace Goal' : 'Running';
        const res = await fetchApi('/runs', {
          method: 'POST',
          body: JSON.stringify({
            userId: Number(userId),
            mode: modeLabel,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            durationSeconds: seconds,
            caloriesBurned,
            avgSpeedKmh,
            avgPace: currentPace,
            routeCoordinatesJson: JSON.stringify(routeCoords),
          }),
        });

        if (res.ok) {
          setToastMessage(`Run saved to your account! +${caloriesBurned} kcal`);
          setTimeout(() => setToastMessage(null), 3500);
          fetchRecentRuns();
        }
      } catch (err) {
        console.error('Error saving run session:', err);
      }
    }

    // Reset session state
    setIsRunning(false);
    setIsPaused(false);
    setIsSimulating(false);
    setSeconds(0);
    setDistanceKm(0);
    setRouteCoords([]);
    if (polylineRef.current) polylineRef.current.setLatLngs([]);
  };

  const handleRecenter = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userCoords, 17, { animate: true });
    }
  };

  const FIVE_K_KM = 5.0;
  const fiveKProgress = Math.min((distanceKm / FIVE_K_KM) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      <style>{`
        @keyframes gpsPulseRing {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif !important;
          z-index: 10;
        }
      `}</style>

      <Navbar user={user} />

      <main style={{ maxWidth: 1040, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '24px 18px 120px', display: 'flex', flexDirection: 'column', gap: 20, overflowX: 'hidden' }}>
        
        {/* Apple Fitness Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
              APPLE FITNESS • OUTDOOR TRACKING
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>
              Running
            </h1>
          </div>

          {/* Mode Selector (Strictly Running & 5K Pace Goal) */}
          <div className="ios-segmented-control" style={{ maxWidth: 340, width: '100%' }}>
            {RUN_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                disabled={isRunning}
                onClick={() => setSelectedMode(mode.id)}
                className={`ios-segment-btn ${selectedMode === mode.id ? 'active' : ''}`}
                style={{ opacity: isRunning && selectedMode !== mode.id ? 0.4 : 1, fontSize: 13, fontWeight: 700 }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5K Pace Goal Target Card (if 5K mode selected) */}
        {selectedMode === '5k_goal' && (
          <div className="ios-card" style={{ padding: '16px 20px', backgroundColor: 'rgba(0, 122, 255, 0.06)', border: '1px solid rgba(0, 122, 255, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>5K Target Progress</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-blue)', fontVariantNumeric: 'tabular-nums' }}>
                {distanceKm.toFixed(2)} / 5.00 km ({Math.round(fiveKProgress)}%)
              </span>
            </div>
            <div style={{ height: 6, width: '100%', backgroundColor: 'var(--bg-input)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fiveKProgress}%`, backgroundColor: 'var(--accent-blue)', borderRadius: 9999, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{ padding: '12px 20px', borderRadius: 12, backgroundColor: 'rgba(48, 209, 88, 0.15)', border: '1px solid rgba(48, 209, 88, 0.4)', color: 'var(--accent-green)', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>
            {toastMessage}
          </div>
        )}

        {/* ============================================================ */}
        {/* INTERACTIVE GPS MAP (Real-time Google/Apple Maps Style)      */}
        {/* ============================================================ */}
        <div className="ios-card" style={{ position: 'relative', overflow: 'hidden', padding: 0, height: 380, border: isRunning ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)', boxShadow: isRunning ? '0 12px 36px rgba(0, 122, 255, 0.2)' : 'var(--shadow-card)' }}>
          
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating GPS Status Pill */}
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 9999, backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(16px)', color: '#ffffff', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isRunning ? '#30d158' : '#007aff', animation: isRunning ? 'gpsPulseRing 1.5s infinite' : 'none' }} />
            <span>{gpsStatus}</span>
          </div>

          {/* Re-center Map Floating Button */}
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Re-center location"
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              width: 42,
              height: 42,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#007aff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </button>
        </div>

        {/* ============================================================ */}
        {/* RUNNING METRICS HUD (Calories, Pace, Time, Avg Speed, Dist) */}
        {/* ============================================================ */}
        <div className="ios-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.6px', color: isRunning ? (isPaused ? 'var(--accent-orange)' : 'var(--accent-blue)') : 'var(--text-muted)', textTransform: 'uppercase' }}>
              {isRunning ? (isPaused ? 'PAUSED' : 'LIVE RUNNING COCKPIT') : 'SESSION READY'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              {selectedMode === '5k_goal' ? '5K Target' : 'Free Run'}
            </span>
          </div>

          {/* Primary HUD Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, textAlign: 'center' }}>
            
            {/* Metric 1: Distance */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 16, padding: '16px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                DISTANCE
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {distanceKm.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>KM</div>
            </div>

            {/* Metric 2: Duration */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 16, padding: '16px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                TIME
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-cyan)', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(seconds)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>MM:SS</div>
            </div>

            {/* Metric 3: Current Pace */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 16, padding: '16px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                CURRENT PACE
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-orange)', fontVariantNumeric: 'tabular-nums' }}>
                {currentPace}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>MIN / KM</div>
            </div>

            {/* Metric 4: Average Speed */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 16, padding: '16px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                AVG SPEED
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
                {avgSpeedKmh}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>KM / H</div>
            </div>

            {/* Metric 5: Calories */}
            <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: 16, padding: '16px 10px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                CALORIES
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-red)', fontVariantNumeric: 'tabular-nums' }}>
                {caloriesBurned}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>KCAL</div>
            </div>

          </div>

          {/* Controls: Start, Pause/Resume, End Workout */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {!isRunning ? (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => handleStartRun(false)}
                  className="ios-button-primary"
                  style={{
                    padding: '14px 44px',
                    borderRadius: 9999,
                    fontSize: 16,
                    fontWeight: 800,
                    backgroundColor: 'var(--accent-blue)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Start Workout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 440 }}>
                <button
                  type="button"
                  onClick={handlePauseResume}
                  className="ios-button-secondary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 800,
                    color: isPaused ? 'var(--accent-green)' : 'var(--accent-orange)',
                  }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>

                <button
                  type="button"
                  onClick={handleFinishRun}
                  className="ios-button-primary"
                  style={{
                    flex: 1.4,
                    padding: '14px',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 800,
                    backgroundColor: 'var(--accent-red)',
                  }}
                >
                  End Workout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RECENT RUNS (Strictly Top 3 from Database)                   */}
        {/* ============================================================ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)', margin: 0 }}>
              Recent Runs
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              Last 3 sessions
            </span>
          </div>

          {loadingHistory ? (
            <div className="ios-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading recorded runs...
            </div>
          ) : recentRuns.length === 0 ? (
            <div className="ios-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-secondary)' }}>
                No completed runs recorded yet.
              </p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Hit Start Workout above to record your first run and save it to your account.
              </p>
            </div>
          ) : (
            <div className="ios-grouped-list" style={{ border: '0.5px solid var(--border-subtle)' }}>
              {recentRuns.map((run) => {
                const dateStr = new Date(run.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={run.id} className="ios-list-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0, 122, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007aff' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="15" cy="5" r="2" />
                          <path d="M7 21l3-5 3 2 4-6" />
                          <path d="M11 13l2-3 4 2" />
                          <path d="M4 14l4-3" />
                        </svg>
                      </div>

                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {run.mode}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                          {dateStr}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {run.distanceKm.toFixed(2)} km
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formatTime(run.durationSeconds)} • {run.avgPace}/km
                        </div>
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-red)', minWidth: 64, textAlign: 'right' }}>
                        {run.caloriesBurned} kcal
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

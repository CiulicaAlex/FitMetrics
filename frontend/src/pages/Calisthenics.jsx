import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { ExerciseMediaPreview } from '../components/ExerciseMediaPreview';
import WorkoutCompletionCelebration from '../components/WorkoutCompletionCelebration';
import { fetchApi } from '../api';

const CALISTHENICS_SKILLS = [
  {
    id: 'planche',
    title: 'Full Planche',
    category: 'STRAIGHT-ARM PUSH',
    difficulty: '5 / 5',
    muscles: 'Anterior Deltoids, Biceps Tendons, Core Compression, Serratus Anterior',
    description: 'The ultimate straight-arm pushing feat. Holding the entire body parallel to the ground supported solely by wrist and shoulder torque.',
    badgeColor: '#ef4444',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • Foundations & Joint Prep',
        xpReward: 350,
        objective: 'Develop maximum scapular protraction and condition the biceps tendons for straight-arm forward lean angles.',
        drills: [
          {
            name: 'Planche Lean (Floor or Parallettes)',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Lock elbows 100% straight, actively push shoulder blades forward and up (protraction), posterior pelvic tilt.',
            mistake: 'Bending the elbows even slightly or letting the lower back sag into extension.',
            motionLabel: 'Forward straight-arm lean',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lean-planche.gif',
          },
          {
            name: 'Scapular Pushups',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Keep arms straight throughout. Retract shoulder blades on descent, push the ground away explosively at the top.',
            mistake: 'Using triceps to pump or moving the lower back instead of the shoulder blades.',
            motionLabel: 'Scapular protraction and retraction',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/serratus-anterior/scapula-push-up.gif',
          },
          {
            name: 'Frog Stand (Crow Pose)',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Rest knees on outer triceps, shift center of mass onto fingers, find the balance pivot.',
            mistake: 'Looking down between your feet; keep your gaze slightly forward.',
            motionLabel: 'Balance pivot on wrists',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/frog-planche.gif',
          },
          {
            name: 'Hollow Body Compression Rock',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Glue lower back into the floor, ribs drawn toward pelvis, legs and arms fully extended.',
            mistake: 'Arching the lumbar spine off the floor.',
            motionLabel: 'Anterior core compression',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/crunch-floor.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Tuck Levers & Dynamic Presses',
        xpReward: 650,
        objective: 'Elevate hips to shoulder level and resist gravity with tucked knees and pseudo-planche pressing.',
        drills: [
          {
            name: 'Tuck Planche Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Bring knees to chest while keeping hips dead level with shoulders. Maximal scapular protraction.',
            mistake: 'Hips sinking below shoulder height or flexing elbows to compensate.',
            motionLabel: 'Static Tuck Planche',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/lean-planche.gif',
          },
          {
            name: 'Pseudo Planche Pushups (PPP)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Hands turned out beside hips, lean forward so chest drops well past hand line, push back up.',
            mistake: 'Losing forward lean angle as you push to top position.',
            motionLabel: 'Deep lean pushup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/full-planche-push-up.gif',
          },
          {
            name: 'Adv. Tuck Planche Kick-outs',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From Tuck Planche, open hips to a 90-degree angle for 2 seconds before returning.',
            mistake: 'Allowing hips to drop during extension.',
            motionLabel: 'Dynamic hip extension',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/straddle-planche.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Straddle & Full Levers',
        xpReward: 1200,
        objective: 'Full leg extension (Straddle and Full Planche holds) and dynamic press-to-handstand power.',
        drills: [
          {
            name: 'Straddle Planche Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Legs open wide in full straddle, toes pointed, body aligned horizontal to ground.',
            mistake: 'Banana back or hips piked upward.',
            motionLabel: 'Straddle Planche isometric',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/straddle-planche.gif',
          },
          {
            name: 'Planche to Handstand Press',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Lift body from Planche smoothly into Handstand using shoulder and core strength without kicking.',
            mistake: 'Using momentum or bending knees.',
            motionLabel: 'Straight-arm press to Handstand',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/full-planche.gif',
          },
          {
            name: 'Full Planche Negatives',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From Handstand, descend in a controlled 5-second arc to horizontal with straight arms.',
            mistake: 'Accelerating through the bottom portion.',
            motionLabel: 'Controlled eccentric lower',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/full-planche.gif',
          },
        ],
      },
    },
  },
  {
    id: 'front_lever',
    title: 'Front Lever',
    category: 'STRAIGHT-ARM PULL',
    difficulty: '5 / 5',
    muscles: 'Latissimus Dorsi, Teres Major, Posterior Deltoid, Rectus Abdominis',
    description: 'A static hold keeping the body fully horizontal suspended below a bar or gymnastics rings by straight-arm pulling force.',
    badgeColor: '#06b6d4',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • Hangs & Scapular Elevation',
        xpReward: 350,
        objective: 'Build lat engagement with straight arms and learn core compression under tension.',
        drills: [
          {
            name: 'Tuck Front Lever Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Knees tucked into ribs, depress and retract scapulae, drive hips up to bar height.',
            mistake: 'Allowing hips to sag down below chest height.',
            motionLabel: 'Tuck Front Lever',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
          {
            name: 'Scapular Straight-Arm Pulls',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From dead hang, pull down through the bar without bending elbows to elevate chest.',
            mistake: 'Bending elbows into a standard pullup.',
            motionLabel: 'Scapular pull on bar',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/traps/scapular-pull-up.gif',
          },
          {
            name: 'Dragon Flag Eccentrics',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'On bench, lift straight body to vertical and lower as slowly as possible without bending hips.',
            mistake: 'Bending at the hips (piking) instead of maintaining a straight line from ankles to shoulders.',
            motionLabel: 'Dragon Flag eccentric descent',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/incline-leg-hip-raise-leg-straight.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Open Lever Angles & Dynamic Raises',
        xpReward: 650,
        objective: 'Increase lever arm length with open hips and practice dynamic raises into the horizontal plane.',
        drills: [
          {
            name: 'Advanced Tuck Front Lever',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Open hip angle to 90 degrees, keep back dead flat, pull bar downward with straight arms.',
            mistake: 'Rounding the upper back or letting knees drift back toward chest.',
            motionLabel: 'Flat-back Advanced Tuck',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
          {
            name: 'Front Lever Raises (Hang to Bar)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From dead hang, pull entire straight body up into lever without momentum.',
            mistake: 'Using a kip or swinging legs upward.',
            motionLabel: 'Straight-arm lever raise',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
          {
            name: 'Ice Cream Makers',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From top of pullup, transition smoothly back and forth between horizontal lever and bent-arm hold.',
            mistake: 'Dropping hips below bar line.',
            motionLabel: 'Dynamic lever transition',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Full Lever & Lever Pullups',
        xpReward: 1200,
        objective: 'Execute full horizontal static holds and straight/bent-arm pulls in the lever position.',
        drills: [
          {
            name: 'Full Front Lever Static Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Full extension, legs together, toes pointed, body locked perfectly horizontal like a plank of wood.',
            mistake: 'Piking at hips or allowing head to crane back too far.',
            motionLabel: 'Full Front Lever Hold',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/front-lever.gif',
          },
          {
            name: 'Front Lever Pullups (Horizontal Rows)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'In full or straddle front lever, pull chest to touch the bar while remaining horizontal.',
            mistake: 'Dropping hips as chest pulls toward bar.',
            motionLabel: 'Horizontal lever pullup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
          {
            name: 'Touch-to-Bar Lever Pulls',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Straight-arm pull all the way from dead hang to touching shins or thighs to the bar.',
            mistake: 'Bending elbows during the pull.',
            motionLabel: 'Straight-arm shin-to-bar pull',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/front-lever-reps.gif',
          },
        ],
      },
    },
  },
  {
    id: 'handstand',
    title: 'Handstand & Balance',
    category: 'INVERSION & SHOULDER BALANCE',
    difficulty: '3 / 5',
    muscles: 'Trapezius, Anterior Deltoids, Forearm Flexors, Core, Glutes',
    description: 'The pillar of all calisthenics inversions. Finding effortless vertical balance stacked over the hands using finger and wrist micro-adjustments.',
    badgeColor: '#10b981',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • Wall Holds & Shoulder Alignment',
        xpReward: 250,
        objective: 'Develop 60-second endurance in vertical alignment and condition wrists for loaded extension.',
        drills: [
          {
            name: 'Chest-to-Wall Handstand Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Hands 15-20cm from wall, nose and toes touching wall, push through shoulders (elevation).',
            mistake: 'Back to wall with arched banana spine; always favor chest to wall.',
            motionLabel: 'Chest to wall vertical alignment',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
          {
            name: 'Wrist Conditioning & Finger Pulses',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'On all fours, shift weight forward and pulse onto fingertips, rolling through palm knuckles.',
            mistake: 'Rushing or bouncing on cold joints.',
            motionLabel: 'Wrist and finger pulse',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/forearms/barbell-palms-down-wrist-curl-over-a-bench.gif',
          },
          {
            name: 'Pike Hold on Box',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Feet on elevated box, hips stacked directly over shoulders and wrists in a sharp 90-degree pike.',
            mistake: 'Shoulders closed or lagging behind wrists.',
            motionLabel: 'Box pike 90-degree hold',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Balance Corrections & Bailouts',
        xpReward: 500,
        objective: 'Learn overbalance correction using finger grip (Toe Pulls) and master controlled kick-ups.',
        drills: [
          {
            name: 'Toe Pulls & Heel Pulls from Wall',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From chest-to-wall, grip floor hard with fingertips to pull toes away into freestanding balance, then return.',
            mistake: 'Kicking off the wall with feet; balance must come from finger pressure.',
            motionLabel: 'Finger-driven toe pull off wall',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
          {
            name: 'Controlled Kick-up to Freestanding',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Step forward, place hands firmly, kick one leg gently while keeping bottom leg as counterweight.',
            mistake: 'Kicking with both legs simultaneously and overshooting violently.',
            motionLabel: 'Controlled scissor kick-up',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
          {
            name: 'Handstand Shoulder Taps at Wall',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Shift weight slightly to one side and tap opposite shoulder with free hand.',
            mistake: 'Twisting hips aggressively.',
            motionLabel: 'Weight shift shoulder tap',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Freestanding Mastery & Pressing',
        xpReward: 900,
        objective: 'Hold 30+ second freestanding handstand on demand and master press-to-handstand variations.',
        drills: [
          {
            name: 'Freestanding Handstand Solid Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Glutes squeezed, ribs tucked, toes pointed straight up, micro-adjusting through finger pads.',
            mistake: 'Looking down at wrists; gaze should be between thumbs.',
            motionLabel: 'Freestanding Handstand',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
          {
            name: 'Handstand Walking',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Slightly lean in the direction of travel and place hands smoothly with minimal hip sway.',
            mistake: 'Rushing steps or collapsing arms.',
            motionLabel: 'Handstand forward walk',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
          {
            name: 'Straddle Press to Handstand',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From straddle stand, lean forward until shoulders carry full weight, compress hips and elevate legs.',
            mistake: 'Jumping off toes.',
            motionLabel: 'Straight-arm straddle press',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand.gif',
          },
        ],
      },
    },
  },
  {
    id: 'hspu',
    title: 'Handstand Pushup (HSPU)',
    category: 'OVERHEAD VERTICAL PUSH',
    difficulty: '4 / 5',
    muscles: 'Deltoids, Triceps, Upper Chest, Trapezius, Core',
    description: 'The premier vertical bodyweight pressing exercise. Lowering the head until it touches the ground in an inverted position and pressing back to lockout.',
    badgeColor: '#f59e0b',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • Pike Presses & Negatives',
        xpReward: 300,
        objective: 'Build overhead pressing capacity through elevated pike pushups and controlled wall negatives.',
        drills: [
          {
            name: 'Elevated Pike Pushups (Feet on Bench)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Hips high over shoulders, head travels forward of hands to form a tripod at the bottom.',
            mistake: 'Flaring elbows outward like a bench press.',
            motionLabel: 'Elevated Pike Pushup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
          {
            name: 'Wall HSPU Controlled Negatives',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Kick up to wall, lower head to ground over 4 full seconds, step down and reset.',
            mistake: 'Dropping down onto head without resisting gravity.',
            motionLabel: 'Eccentric wall lower',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
          {
            name: 'Deep Parallel Bar Dips',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Lower to full depth below 90 degrees, keep chest slightly forward, lockout triceps.',
            mistake: 'Short partial reps.',
            motionLabel: 'Deep bar dip',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Strict Wall HSPU & Deficits',
        xpReward: 600,
        objective: 'Execute full-range concentric pressing repetitions against the wall.',
        drills: [
          {
            name: 'Chest-to-Wall Strict HSPU',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Touch nose or crown of head gently to floor ahead of hands, press up to straight arms.',
            mistake: 'Kicking or kipping with legs.',
            motionLabel: 'Strict Wall Handstand Pushup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
          {
            name: 'Deficit Pike Pushups (Hands on Blocks)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Elevate hands on 10-15cm blocks to allow head to travel deeper than hand level.',
            mistake: 'Losing vertical pike angle.',
            motionLabel: 'Deficit range pike press',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
          {
            name: 'Wall HSPU Isometric Hold at 90°',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Pause halfway down with elbows at right angles for 5 seconds per rep.',
            mistake: 'Resting head on floor.',
            motionLabel: 'Mid-point isometric hold',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Freestanding & Deficit Mastery',
        xpReward: 1100,
        objective: 'Freestanding HSPU without wall contact and deep deficit parallette pressing.',
        drills: [
          {
            name: 'Freestanding Handstand Pushup',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Balance freestanding, shift shoulders forward to form tripod, press back to lockout.',
            mistake: 'Legs flailing to preserve balance during pressing phase.',
            motionLabel: 'Freestanding HSPU',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
          {
            name: 'Parallette Deficit HSPU at Wall',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'On high parallettes, lower shoulders until hands are at chest height before pressing up.',
            mistake: 'Arching lower back under deep load.',
            motionLabel: 'Full deficit parallette press',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/handstand-push-up.gif',
          },
        ],
      },
    },
  },
  {
    id: 'back_lever',
    title: 'Back Lever',
    category: 'POSTERIOR STRAIGHT-ARM HOLD',
    difficulty: '4 / 5',
    muscles: 'Biceps Tendons, Pectorals, Latissimus, Lumbar Spine, Glutes',
    description: 'Suspended facing the ground with arms behind the back in extreme shoulder extension. High joint conditioning for elbows and shoulders.',
    badgeColor: '#8b5cf6',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • German Hang & Rotations',
        xpReward: 300,
        objective: 'Safely condition the biceps tendons in maximum shoulder extension and master German Hang.',
        drills: [
          {
            name: 'German Hang Stretch & Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Pass feet between arms, lower down into full hang behind back with straight arms.',
            mistake: 'Tensing shoulders upward; relax into the stretch with gentle deep breaths.',
            motionLabel: 'German Hang extension',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/skin-the-cat.gif',
          },
          {
            name: 'Skin the Cat (Full Rotation)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Pike knees to chest, invert, lower into German Hang, then pull back to starting position.',
            mistake: 'Using momentum or bending knees excessively on the return.',
            motionLabel: '360 degree rotation',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/skin-the-cat.gif',
          },
          {
            name: 'Tuck Back Lever Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'With knees to chest, lower body until back is parallel to the ground. Protract shoulders.',
            mistake: 'Dropping below the horizontal plane.',
            motionLabel: 'Tuck Back Lever',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/back-lever.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Straddle & Inverted Hang Drops',
        xpReward: 600,
        objective: 'Open legs into straddle and lower slowly from vertical inverted hang.',
        drills: [
          {
            name: 'Straddle Back Lever Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Wide leg spread, squeeze glutes, look slightly forward.',
            mistake: 'Bending knees.',
            motionLabel: 'Straddle Back Lever',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/back-lever.gif',
          },
          {
            name: 'Inverted Hang to Back Lever Drops',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From vertical inverted hang, lower straight body to horizontal in 5 seconds.',
            mistake: 'Stopping too high above parallel.',
            motionLabel: 'Controlled eccentric drop',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/back-lever.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Supinated Grip & Full Lever',
        xpReward: 1050,
        objective: 'Full Back Lever with palms-down supinated grip for maximal biceps tendon loading.',
        drills: [
          {
            name: 'Full Back Lever Static Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Legs pinned together, toes pointed, body locked horizontal.',
            mistake: 'Shoulders rolling forward.',
            motionLabel: 'Full Back Lever',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/back-lever.gif',
          },
          {
            name: 'Pull-out from German Hang to Back Lever',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From lowest German Hang point, pull body back up to horizontal lever.',
            mistake: 'Kicking or swinging legs.',
            motionLabel: 'German hang pull-out',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/back-lever.gif',
          },
        ],
      },
    },
  },
  {
    id: 'muscle_up',
    title: 'Muscle-Up (Bar & Rings)',
    category: 'EXPLOSIVE POWER & TRANSITION',
    difficulty: '4 / 5',
    muscles: 'Lats, Triceps, Chest, Deltoids, Elbow Flexors',
    description: 'The iconic transition from below the bar into a dip above it. Combines explosive pulling with swift transition speed.',
    badgeColor: '#ec4899',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • High Pullups & Straight Bar Dips',
        xpReward: 350,
        objective: 'Develop high pull height to the sternum and single-bar dip strength.',
        drills: [
          {
            name: 'Explosive High Pullups (To Chest/Sternum)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Pull bar explosively toward sternum with maximum initial acceleration.',
            mistake: 'Pulling only to chin; aim to see bar beneath clavicle.',
            motionLabel: 'Explosive high pullup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif',
          },
          {
            name: 'Straight Bar Dips',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'On a single bar, lower chest to touch bar and push up with triceps.',
            mistake: 'Wildly kicking legs.',
            motionLabel: 'Straight bar dip',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/chest-dip-on-straight-bar.gif',
          },
          {
            name: 'Jumping Muscle-Up Negatives',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Jump into top support position and lower down as slowly as possible through the transition.',
            mistake: 'Dropping down abruptly through the transition point.',
            motionLabel: 'Controlled eccentric transition',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/kipping-muscle-up.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Strict Bar Muscle-Up',
        xpReward: 650,
        objective: 'Execute strict, symmetrical muscle-ups on bar without kipping or chicken-winging.',
        drills: [
          {
            name: 'Strict Bar Muscle-Up (Clean Symmetrical)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Both elbows come over the bar at the exact same instant. No chicken-winging.',
            mistake: 'One arm coming up first, which strains the shoulder joint.',
            motionLabel: 'Strict bar muscle up',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/muscle-up.gif',
          },
          {
            name: 'Chest-to-Bar Pullups with 2s Pause',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Pull chest firmly to touch bar, hold for 2 seconds, lower under control.',
            mistake: 'Dropping immediately after touching.',
            motionLabel: 'Pause at top bar contact',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/pull-up.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Gymnastic Rings & Slow Transitions',
        xpReward: 1100,
        objective: 'False-grip ring muscle-ups and slow-motion tempo muscle-ups without momentum.',
        drills: [
          {
            name: 'Strict Ring Muscle-Up (False Grip)',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Wrist crease wrapped securely over ring, pull to sternum, transition elbows backward tightly.',
            mistake: 'Losing false grip on the pull.',
            motionLabel: 'Rings false grip muscle up',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/muscle-up.gif',
          },
          {
            name: 'Slow Motion Bar Muscle-Up',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Eliminate all swing. Perform the pull, transition, and press at a slow, deliberate pace.',
            mistake: 'Using any explosive swing.',
            motionLabel: 'Slow tempo bar muscle up',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/muscle-up.gif',
          },
        ],
      },
    },
  },
  {
    id: 'human_flag',
    title: 'Human Flag',
    category: 'LATERAL CORE & PUSH-PULL TORQUE',
    difficulty: '5 / 5',
    muscles: 'Obliques, Lats, Deltoids, Serratus Anterior, Quadratus Lumborum',
    description: 'Gripping a vertical pole or stall bars, suspending the body perpendicular to the pole like a waving flag.',
    badgeColor: '#0ea5e9',
    levels: {
      beginner: {
        name: 'Beginner',
        badge: 'Level 1 • Lateral Core & Grip Torquing',
        xpReward: 350,
        objective: 'Develop lateral oblique strength and learn bottom-hand push vs top-hand pull mechanics.',
        drills: [
          {
            name: 'Side Plank with Leg Lift',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Elbow under shoulder, hips high, lift top leg straight up and hold for 2s.',
            mistake: 'Hips sagging toward floor.',
            motionLabel: 'Lateral core endurance',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/side-bridge-v-2.gif',
          },
          {
            name: 'Vertical Pole Push-Pull Grip Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Top hand pulls toward pole, bottom hand pushes away hard with straight arm.',
            mistake: 'Bending bottom elbow; keep it locked to create the structural pillar.',
            motionLabel: 'Push-pull grip setup',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/flag.gif',
          },
          {
            name: 'Hanging Windshield Wipers',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'Hang from bar, bring toes to bar, rotate legs left and right across 180 degrees.',
            mistake: 'Dropping legs below horizontal.',
            motionLabel: 'Rotational core wipers',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/hanging-straight-twisting-leg-hip-raise.gif',
          },
        ],
      },
      intermediate: {
        name: 'Intermediate',
        badge: 'Level 2 • Tucks & Straddle Negatives',
        xpReward: 650,
        objective: 'Elevate hips and legs off the ground into tucked and straddle flag positions.',
        drills: [
          {
            name: 'Tuck Human Flag Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Both knees tucked tightly against chest, push hard with bottom hand to level hips.',
            mistake: 'Shoulders twisting open toward the sky.',
            motionLabel: 'Tuck Human Flag',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/flag.gif',
          },
          {
            name: 'Straddle Flag Negatives',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From top vertical pole climb, lower legs into straddle horizontal slowly over 4 seconds.',
            mistake: 'Dropping abruptly through horizontal.',
            motionLabel: 'Straddle flag descent',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/flag.gif',
          },
        ],
      },
      advanced: {
        name: 'Advanced',
        badge: 'Level 3 • Full Human Flag & Flag Pulls',
        xpReward: 1200,
        objective: 'Hold full straight-leg horizontal human flag and perform dynamic pull-ups in flag position.',
        drills: [
          {
            name: 'Full Human Flag Static Hold',
            targetType: 'hold',
            defaultReps: 10,
            cue: 'Both legs straight, toes pointed, hips and shoulders facing forward, body dead horizontal.',
            mistake: 'Hips sagging or body twisting out of the frontal plane.',
            motionLabel: 'Full Human Flag Hold',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/flag.gif',
          },
          {
            name: 'Human Flag Dynamic Pulls',
            targetType: 'reps',
            defaultReps: 10,
            cue: 'From horizontal flag, pull top arm to elevate torso and lower with control.',
            mistake: 'Bending bottom elbow.',
            motionLabel: 'Dynamic flag pull',
            gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/flag.gif',
          },
        ],
      },
    },
  },
];

const REST_DURATION_DEFAULT = 90; // 90 seconds (1.5 min)

const CALI_SKILL_MUSCLES = {
  planche: ['SHOULDERS', 'CHEST', 'CORE'],
  front_lever: ['BACK', 'LATS', 'CORE'],
  handstand: ['SHOULDERS', 'CORE', 'TRAPS'],
  hspu: ['SHOULDERS', 'TRICEPS', 'CHEST'],
  back_lever: ['CHEST', 'BICEPS', 'LOWER BACK'],
  muscle_up: ['BACK', 'CHEST', 'TRICEPS'],
  human_flag: ['CORE', 'OBLIQUES', 'SHOULDERS'],
};

export default function Calisthenics() {
  const [user, setUser] = useState(null);
  const [initialUserProgress, setInitialUserProgress] = useState({});
  const [expandedSkillId, setExpandedSkillId] = useState('planche');
  const [selectedDifficulty, setSelectedDifficulty] = useState({
    planche: 'beginner',
    front_lever: 'beginner',
    handstand: 'beginner',
    hspu: 'beginner',
    back_lever: 'beginner',
    muscle_up: 'beginner',
    human_flag: 'beginner',
  });

  // Filter category
  const [filterCategory, setFilterCategory] = useState('all');

  // Calisthenics XP & History
  const [caliXp, setCaliXp] = useState(() => {
    return Number(localStorage.getItem('fitmetrics_calisthenics_xp') || 0);
  });
  const [completedSessionsCount, setCompletedSessionsCount] = useState(() => {
    return JSON.parse(localStorage.getItem('fitmetrics_cali_sessions_count') || '0');
  });

  // Celebration Modal
  const [celebrationModal, setCelebrationModal] = useState(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  // Active Guided Workout Session
  const [activeSession, setActiveSession] = useState(null);
  const [failureInputReps, setFailureInputReps] = useState(12);
  const [showExitModal, setShowExitModal] = useState(false);
  const [holdTimerRunning, setHoldTimerRunning] = useState(false);
  const [currentHoldSeconds, setCurrentHoldSeconds] = useState(15);
  const [prepCountdown, setPrepCountdown] = useState(null);

  // Load user data & muscle progress
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await fetchApi('/auth/me');
        if (res.ok) {
          const u = await res.json();
          setUser(u);
          const uId = u.id || u.Id;
          if (uId) {
            try {
              const pRes = await fetchApi(`/progress/user/${uId}`);
              if (pRes.ok) {
                const pData = await pRes.json();
                const map = {};
                let totalMuscleXp = 0;
                pData.forEach((item) => {
                  map[item.muscleGroup.toUpperCase()] = item.xp;
                  totalMuscleXp += (item.xp || 0);
                });
                setInitialUserProgress(map);

                // If user has 0 muscle progress in DB (account was reset), wipe calisthenics sessions!
                if (totalMuscleXp === 0) {
                  localStorage.removeItem(`fitmetrics_calisthenics_xp_${uId}`);
                  localStorage.removeItem(`fitmetrics_cali_sessions_count_${uId}`);
                  localStorage.removeItem('fitmetrics_calisthenics_xp');
                  localStorage.removeItem('fitmetrics_cali_sessions_count');
                  setCaliXp(0);
                  setCompletedSessionsCount(0);
                } else {
                  const savedXp = Number(localStorage.getItem(`fitmetrics_calisthenics_xp_${uId}`) || localStorage.getItem('fitmetrics_calisthenics_xp') || 0);
                  const savedCount = JSON.parse(localStorage.getItem(`fitmetrics_cali_sessions_count_${uId}`) || localStorage.getItem('fitmetrics_cali_sessions_count') || '0');
                  setCaliXp(savedXp);
                  setCompletedSessionsCount(savedCount);
                }
              }
            } catch (err) {
              console.error('Error fetching progress:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUserData();
  }, []);

  // Prep Countdown Interval before Live Hold
  useEffect(() => {
    let timer = null;
    if (prepCountdown !== null && prepCountdown > 0) {
      timer = setInterval(() => {
        setPrepCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            // Prep completed! Start the hold stopwatch
            setCurrentHoldSeconds(0);
            setHoldTimerRunning(true);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [prepCountdown]);

  // Active Workout Hold Stopwatch Interval
  useEffect(() => {
    let timer = null;
    if (holdTimerRunning) {
      timer = setInterval(() => {
        setCurrentHoldSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [holdTimerRunning]);

  // Active Workout Rest Timer Interval
  useEffect(() => {
    let timer = null;
    if (activeSession && activeSession.isResting && activeSession.restSecondsLeft > 0) {
      timer = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev || !prev.isResting) return prev;
          if (prev.restSecondsLeft <= 1) {
            // Rest finished! Transition to next set or next exercise
            return advanceToNextStep(prev);
          }
          return { ...prev, restSecondsLeft: prev.restSecondsLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession?.isResting, activeSession?.restSecondsLeft]);

  const advanceToNextStep = (session) => {
    setHoldTimerRunning(false);
    setPrepCountdown(null);
    if (session.currentSet < 3) {
      return {
        ...session,
        isResting: false,
        currentSet: session.currentSet + 1,
        restSecondsLeft: 45,
      };
    }

    // Completed Set 3 -> Advance to next drill
    const nextExIndex = session.exerciseIndex + 1;
    const drills = session.levelData.drills;

    if (nextExIndex < drills.length) {
      const nextDrill = drills[nextExIndex];
      if (nextDrill.targetType === 'hold') {
        setCurrentHoldSeconds(15);
      } else {
        setFailureInputReps(12);
      }

      return {
        ...session,
        isResting: false,
        exerciseIndex: nextExIndex,
        currentSet: 1,
        restSecondsLeft: 45,
      };
    } else {
      return {
        ...session,
        isResting: false,
        isFinished: true,
      };
    }
  };

  const handleStartWorkout = (skill, levelKey, levelData) => {
    const firstDrill = levelData.drills[0];
    setActiveSession({
      skill,
      levelKey,
      levelData,
      exerciseIndex: 0,
      currentSet: 1,
      isResting: false,
      restSecondsLeft: 45,
      isFinished: false,
      sessionLogs: [],
    });
    setHoldTimerRunning(false);
    setPrepCountdown(null);
    if (firstDrill?.targetType === 'hold') {
      setCurrentHoldSeconds(15);
    } else {
      setFailureInputReps(12);
    }
  };

  const handleCompleteSet = (valDone) => {
    if (!activeSession) return;
    setHoldTimerRunning(false);
    setPrepCountdown(null);
    const currentDrill = activeSession.levelData.drills[activeSession.exerciseIndex];
    const isHold = currentDrill.targetType === 'hold';

    const logEntry = {
      exerciseIndex: activeSession.exerciseIndex,
      exerciseName: currentDrill.name,
      set: activeSession.currentSet,
      targetType: currentDrill.targetType,
      value: valDone,
      label: isHold ? `${valDone}s hold` : `${valDone} reps`,
    };

    setActiveSession((prev) => ({
      ...prev,
      isResting: true,
      restSecondsLeft: 45,
      sessionLogs: [...prev.sessionLogs, logEntry],
    }));

    if (isHold) {
      setCurrentHoldSeconds(15);
    } else {
      setFailureInputReps(12);
    }
  };

  const switchExercise = (newIndex) => {
    if (!activeSession) return;
    setHoldTimerRunning(false);
    setPrepCountdown(null);
    const targetDrill = activeSession.levelData.drills[newIndex];
    const drillLogs = activeSession.sessionLogs.filter((l) => l.exerciseIndex === newIndex);
    const nextSet = drillLogs.length < 3 ? drillLogs.length + 1 : 3;

    setActiveSession((prev) => ({
      ...prev,
      exerciseIndex: newIndex,
      currentSet: nextSet,
      isResting: false,
      restSecondsLeft: 45,
    }));

    if (targetDrill?.targetType === 'hold') {
      setCurrentHoldSeconds(15);
    } else {
      setFailureInputReps(12);
    }
  };

  const handleSkipRest = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return advanceToNextStep(prev);
    });
  };

  const handleAdjustRest = (seconds) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const nextSecs = Math.max(5, prev.restSecondsLeft + seconds);
      return { ...prev, restSecondsLeft: nextSecs };
    });
  };

  const handleClaimXpAndFinish = async () => {
    if (!activeSession) return;
    const xpEarned = activeSession.levelData.xpReward;
    const newTotalXp = caliXp + xpEarned;
    const newCount = completedSessionsCount + 1;

    setCaliXp(newTotalXp);
    setCompletedSessionsCount(newCount);
    const uId = user?.id || user?.Id;
    if (uId) {
      localStorage.setItem(`fitmetrics_calisthenics_xp_${uId}`, String(newTotalXp));
      localStorage.setItem(`fitmetrics_cali_sessions_count_${uId}`, String(newCount));
    }
    localStorage.setItem('fitmetrics_calisthenics_xp', String(newTotalXp));
    localStorage.setItem('fitmetrics_cali_sessions_count', String(newCount));

    // Optionally log workout to backend if user is logged in
    if (user && user.id) {
      try {
        await fetchApi('/progress/log-workout', {
          method: 'POST',
          body: JSON.stringify({
            userId: user.id,
            exerciseId: 1,
            sets: activeSession.levelData.drills.length * 3,
            reps: 10,
            weightUsed: 0,
          }),
        });
      } catch (e) {
        // Safe fallback
      }
    }

    const skillId = activeSession.skill.id;
    const targetedMuscles = CALI_SKILL_MUSCLES[skillId] || ['CORE', 'SHOULDERS', 'BACK'];
    const xpPerGroup = Math.round(xpEarned / targetedMuscles.length);
    const groupsWorked = targetedMuscles.map((mgName) => ({
      name: mgName,
      earnedXp: xpPerGroup,
      baseXp: initialUserProgress[mgName] ?? 3000,
    }));

    setCelebrationData({
      workoutName: `${activeSession.skill.title} (${activeSession.levelData.name})`,
      totalXpEarned: xpEarned,
      muscleGroups: groupsWorked,
    });
    setShowCelebrationModal(true);

    setActiveSession(null);
  };

  const handleCancelWorkout = () => {
    setShowExitModal(true);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCaliRank = (xp) => {
    if (xp >= 10000) return { title: 'Titan Master', badge: 'RANK V', color: 'var(--text-primary)' };
    if (xp >= 5000) return { title: 'Elite Gymnast', badge: 'RANK IV', color: 'var(--text-primary)' };
    if (xp >= 2500) return { title: 'Urban Athlete', badge: 'RANK III', color: 'var(--text-primary)' };
    if (xp >= 1000) return { title: 'Trained Acrobat', badge: 'RANK II', color: 'var(--text-primary)' };
    return { title: 'Calisthenics Cadet', badge: 'RANK I', color: 'var(--text-primary)' };
  };

  const currentRank = getCaliRank(caliXp);

  const filteredSkills = CALISTHENICS_SKILLS.filter((s) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'levers') return s.id.includes('lever') || s.id === 'planche';
    if (filterCategory === 'inversions') return s.id === 'handstand' || s.id === 'hspu';
    if (filterCategory === 'power') return s.id === 'muscle_up' || s.id === 'human_flag';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      <Navbar user={user} />

{/* If Active Workout Session is running, render the Pro Calisthenics Workout Workspace */}
      {activeSession ? (
        <div style={{
          maxWidth: 1240,
          width: '100%',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: '28px 20px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}>
          {(() => {
            const currentDrill = activeSession.levelData.drills[activeSession.exerciseIndex];
            const isHold = currentDrill.targetType === 'hold';
            const completedDrillsCount = activeSession.levelData.drills.filter((d, i) => {
              const logs = activeSession.sessionLogs.filter((l) => l.exerciseIndex === i);
              return logs.length >= 3;
            }).length;

            const totalTensionSeconds = activeSession.sessionLogs
              .filter((l) => l.targetType === 'hold')
              .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
            const totalRepsDone = activeSession.sessionLogs
              .filter((l) => l.targetType !== 'hold')
              .reduce((sum, l) => sum + (Number(l.value) || 0), 0);

            const prevDrill = activeSession.exerciseIndex > 0 ? activeSession.levelData.drills[activeSession.exerciseIndex - 1] : null;
            const nextDrill = activeSession.exerciseIndex < activeSession.levelData.drills.length - 1 ? activeSession.levelData.drills[activeSession.exerciseIndex + 1] : null;

            if (activeSession.isFinished) {
              return (
                <div className="ios-card" style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  maxWidth: 680,
                  width: '100%',
                  margin: '40px auto 0',
                  borderRadius: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                }}>
                  <div style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #ffd60a 0%, #ff9f0a 70%, #000 120%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(255, 159, 10, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                  }}>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>

                  <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                      Routine Mastered!
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: 500 }}>
                      All {activeSession.levelData.drills.length} drills completed in full across 3 exhaustive sets!
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    width: '100%',
                    maxWidth: 480,
                    margin: '12px 0',
                  }}>
                    <div className="ios-card" style={{ padding: '14px', backgroundColor: 'var(--bg-input)', borderRadius: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL SETS</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{activeSession.sessionLogs.length}</div>
                    </div>
                    <div className="ios-card" style={{ padding: '14px', backgroundColor: 'var(--bg-input)', borderRadius: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TIME / REPS</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 4 }}>
                        {totalTensionSeconds > 0 ? `${totalTensionSeconds}s` : `${totalRepsDone}r`}
                      </div>
                    </div>
                    <div className="ios-card" style={{ padding: '14px', backgroundColor: 'var(--bg-input)', borderRadius: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>XP EARNED</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>+{activeSession.levelData.xpReward}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaimXpAndFinish}
                    className="ios-button-primary"
                    style={{
                      width: '100%',
                      maxWidth: 420,
                      padding: '16px',
                      borderRadius: 9999,
                      fontSize: 16,
                      fontWeight: 800,
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    Claim +{activeSession.levelData.xpReward} XP & Finish Routine
                  </button>
                </div>
              );
            }

            return (
              <>
                {/* Top Pro Header Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      CALISTHENICS WORKOUT • {activeSession.skill.title.toUpperCase()} • {activeSession.levelData.name.toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0', letterSpacing: '-0.5px' }}>
                      {currentDrill.name}
                    </h1>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowExitModal(true)}
                      className="ios-button-secondary"
                      style={{ padding: '9px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 700 }}
                    >
                      Exit Workout
                    </button>
                  </div>
                </div>

                {/* Live Session Metrics Ribbon */}
                <div className="ios-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      WORK LOGGED
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {totalTensionSeconds > 0 ? `${totalTensionSeconds}s hold` : `${totalRepsDone} reps`}
                    </div>
                  </div>

                  <div style={{ width: 1, height: 32, backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      CURRENT SET
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      Set {activeSession.currentSet} of 3
                    </div>
                  </div>

                  <div style={{ width: 1, height: 32, backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      DRILLS COMPLETED
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {completedDrillsCount} / {activeSession.levelData.drills.length}
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Workspace Grid */}
                <div className="workout-session-grid">
                  {/* Left Column: Active Exercise & Form Guidance */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="ios-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* Exercise Header Row & Prev/Next Quick Navigation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              backgroundColor: 'var(--bg-input)',
                              border: '0.5px solid var(--border-subtle)',
                              padding: '3px 9px',
                              borderRadius: 999,
                              letterSpacing: '0.4px',
                              textTransform: 'uppercase',
                            }}>
                              {isHold ? 'ISOMETRIC HOLD • 3 SETS TO FAILURE' : 'REPETITIONS • 2x10 + AMRAP'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', border: '0.5px solid var(--border-subtle)', padding: '3px 8px', borderRadius: 999 }}>
                              Drill {activeSession.exerciseIndex + 1} of {activeSession.levelData.drills.length}
                            </span>
                          </div>
                          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 2px' }}>
                            {currentDrill.name}
                          </h2>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {isHold
                              ? 'Hold until complete muscular failure on each set. Record your maximum hold seconds.'
                              : 'Perform 2 clean sets of 10 reps, then push the final set to failure (AMRAP).'}
                          </div>
                        </div>

                        {/* Prev / Next Quick Nav */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={prevDrill ? () => switchExercise(activeSession.exerciseIndex - 1) : undefined}
                            disabled={!prevDrill}
                            className="ios-button-secondary"
                            style={{
                              padding: '7px 12px',
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 600,
                              opacity: prevDrill ? 1 : 0.4,
                              cursor: prevDrill ? 'pointer' : 'default',
                            }}
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={nextDrill ? () => switchExercise(activeSession.exerciseIndex + 1) : undefined}
                            disabled={!nextDrill}
                            className="ios-button-secondary"
                            style={{
                              padding: '7px 14px',
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 700,
                              opacity: nextDrill ? 1 : 0.4,
                              cursor: nextDrill ? 'pointer' : 'default',
                            }}
                          >
                            Next Exercise
                          </button>
                        </div>
                      </div>

                      {/* Animated 3D Anatomical Form Demonstration */}
                      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <ExerciseMediaPreview
                          exerciseName={currentDrill.name}
                          videoUrl={currentDrill.gifUrl}
                          compact={false}
                        />
                      </div>

                      {/* Dynamic Stage: Rest / Prep Countdown / Hold Active / Reps Active */}
                      {activeSession.isResting ? (
                        /* REST INTERVAL */
                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 18,
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          border: '0.5px solid var(--border-subtle)',
                          gap: 14,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                            REST & RECOVERY INTERVAL
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                            Catch Your Breath
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 420 }}>
                            Prepare for {isHold
                              ? `Set ${activeSession.currentSet} Hold (Push to Failure)`
                              : activeSession.currentSet === 3
                              ? 'Set 3 (AMRAP to Failure)'
                              : `Set ${activeSession.currentSet} (10 Reps)`}
                          </div>

                          {/* Circular Rest Ring */}
                          <div style={{ position: 'relative', width: 110, height: 110, margin: '6px 0' }}>
                            <svg width="110" height="110" viewBox="0 0 110 110">
                              <circle cx="55" cy="55" r="46" fill="none" stroke="var(--border-subtle)" strokeWidth="7" />
                              <circle
                                cx="55"
                                cy="55"
                                r="46"
                                fill="none"
                                stroke="var(--text-primary)"
                                strokeWidth="7"
                                strokeDasharray={`${2 * Math.PI * 46}`}
                                strokeDashoffset={`${2 * Math.PI * 46 * (1 - activeSession.restSecondsLeft / 45)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 55 55)"
                                style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                              />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                              {formatTimer(activeSession.restSecondsLeft)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
                            <button type="button" onClick={() => handleAdjustRest(-15)} className="ios-button-secondary" style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                              -15s
                            </button>
                            <button type="button" onClick={() => handleAdjustRest(30)} className="ios-button-secondary" style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                              +30s
                            </button>
                          </div>

                          <button type="button" onClick={handleSkipRest} className="ios-button-primary" style={{ width: '100%', maxWidth: 320, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>
                            Skip Rest & Continue
                          </button>
                        </div>
                      ) : isHold && prepCountdown !== null ? (
                        /* GET READY / POSITION PREPARATION COUNTDOWN (5 SECONDS) */
                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 18,
                          padding: '32px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '0.5px solid var(--border-subtle)',
                          gap: 14,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                            GET READY
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            Assume your hold position on the bar or floor
                          </div>

                          {/* Big Numerical Countdown */}
                          <div style={{
                            fontSize: 72,
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-2px',
                            lineHeight: 1,
                            margin: '10px 0',
                          }}>
                            {prepCountdown}
                          </div>

                          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setPrepCountdown(null);
                                setCurrentHoldSeconds(0);
                                setHoldTimerRunning(true);
                              }}
                              className="ios-button-primary"
                              style={{
                                flex: 1,
                                padding: '11px',
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              Start Now
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrepCountdown(null)}
                              className="ios-button-secondary"
                              style={{
                                flex: 1,
                                padding: '11px',
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isHold ? (
                        /* HOLD ACTIVE STAGE (3 SETS TO FAILURE) */
                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 18,
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '0.5px solid var(--border-subtle)',
                          gap: 16,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: holdTimerRunning ? 'var(--text-primary)' : 'var(--text-muted)',
                            }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                              {holdTimerRunning ? 'HOLD IN PROGRESS • PUSH TO FAILURE' : `SET ${activeSession.currentSet} OF 3 • HOLD TO FAILURE`}
                            </span>
                          </div>

                          {/* Big Digital Seconds Display */}
                          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
                            {formatTimer(currentHoldSeconds)}
                          </div>

                          {/* Quick Preset Buttons / Steppers */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setCurrentHoldSeconds((s) => Math.max(5, s - 5))}
                              disabled={holdTimerRunning}
                              className="ios-button-secondary"
                              style={{ width: 38, height: 38, borderRadius: '50%', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              -
                            </button>
                            {[10, 15, 20, 30, 45, 60].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setCurrentHoldSeconds(preset)}
                                disabled={holdTimerRunning}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  border: '0.5px solid var(--border-subtle)',
                                  backgroundColor: currentHoldSeconds === preset ? 'var(--text-primary)' : 'var(--bg-card)',
                                  color: currentHoldSeconds === preset ? 'var(--bg-main)' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {preset}s
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCurrentHoldSeconds((s) => s + 5)}
                              disabled={holdTimerRunning}
                              className="ios-button-secondary"
                              style={{ width: 38, height: 38, borderRadius: '50%', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              +
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 380, marginTop: 6 }}>
                            {!holdTimerRunning ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentHoldSeconds(0);
                                    setPrepCountdown(5);
                                  }}
                                  className="ios-button-primary"
                                  style={{
                                    padding: '14px',
                                    borderRadius: 14,
                                    fontSize: 15,
                                    fontWeight: 800,
                                  }}
                                >
                                  Start Live Hold (5s Prep)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCompleteSet(currentHoldSeconds)}
                                  className="ios-button-secondary"
                                  style={{
                                    padding: '13px',
                                    borderRadius: 14,
                                    fontSize: 14,
                                    fontWeight: 700,
                                  }}
                                >
                                  Log Set {activeSession.currentSet} ({currentHoldSeconds}s Hold) & Rest
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCompleteSet(currentHoldSeconds)}
                                className="ios-button-primary"
                                style={{
                                  padding: '16px',
                                  borderRadius: 14,
                                  fontSize: 16,
                                  fontWeight: 800,
                                }}
                              >
                                Stop Hold ({currentHoldSeconds}s) & Log Set {activeSession.currentSet}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* REPS ACTIVE STAGE (2x10 + AMRAP) */
                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: 18,
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '0.5px solid var(--border-subtle)',
                          gap: 16,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                            {activeSession.currentSet < 3
                              ? `SET ${activeSession.currentSet} OF 3 • 10 CLEAN REPS`
                              : 'SET 3 OF 3 • AMRAP / PUSH TO FAILURE'}
                          </div>

                          {activeSession.currentSet < 3 ? (
                            <>
                              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                10
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6 }}>
                                Target Repetitions
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCompleteSet(10)}
                                className="ios-button-primary"
                                style={{
                                  width: '100%',
                                  maxWidth: 360,
                                  padding: '14px',
                                  borderRadius: 14,
                                  fontSize: 15,
                                  fontWeight: 800,
                                  marginTop: 8,
                                }}
                              >
                                Complete Set {activeSession.currentSet} (10 Reps) & Rest
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                {failureInputReps}
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6 }}>
                                Reps Logged to Muscular Failure
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                  type="button"
                                  onClick={() => setFailureInputReps((r) => Math.max(1, r - 1))}
                                  className="ios-button-secondary"
                                  style={{ width: 44, height: 44, borderRadius: '50%', fontSize: 20, fontWeight: 700 }}
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFailureInputReps((r) => r + 1)}
                                  className="ios-button-secondary"
                                  style={{ width: 44, height: 44, borderRadius: '50%', fontSize: 20, fontWeight: 700 }}
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCompleteSet(failureInputReps)}
                                className="ios-button-primary"
                                style={{
                                  width: '100%',
                                  maxWidth: 360,
                                  padding: '14px 20px',
                                  fontSize: 15,
                                  fontWeight: 800,
                                  borderRadius: 14,
                                  marginTop: 8,
                                }}
                              >
                                Log Failure Set ({failureInputReps} Reps) & Proceed
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Detailed Technique, Form & Biomechanics Breakdown */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 12,
                        marginTop: 4,
                      }}>
                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          border: '0.5px solid var(--border-subtle)',
                          borderRadius: 12,
                          padding: '14px 16px',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                            PROPER FORM & EXECUTION CUES
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                            {currentDrill.cue}
                          </p>
                        </div>

                        <div style={{
                          backgroundColor: 'var(--bg-input)',
                          border: '0.5px solid var(--border-subtle)',
                          borderRadius: 12,
                          padding: '14px 16px',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                            COMMON MISTAKES TO AVOID
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                            {currentDrill.mistake}
                          </p>
                        </div>
                      </div>

                      {/* Primary Motion & Musculature Details */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                        padding: '12px 16px',
                        borderRadius: 12,
                        backgroundColor: 'var(--bg-input)',
                        border: '0.5px solid var(--border-subtle)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            PRIMARY MOTION:
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {currentDrill.motionLabel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            TARGET MUSCLES:
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {activeSession.skill.muscles}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Routine Drills Checklist & Jump Drawer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="ios-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                          ROUTINE DRILLS ({activeSession.levelData.drills.length})
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                          {completedDrillsCount} / {activeSession.levelData.drills.length} DONE
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeSession.levelData.drills.map((drill, idx) => {
                          const isCurrent = idx === activeSession.exerciseIndex;
                          const drillLogs = activeSession.sessionLogs.filter((l) => l.exerciseIndex === idx);
                          const isCompleted = drillLogs.length >= 3;
                          const isDrillHold = drill.targetType === 'hold';

                          return (
                            <div
                              key={idx}
                              onClick={() => switchExercise(idx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderRadius: 14,
                                backgroundColor: isCurrent ? 'var(--bg-input)' : 'transparent',
                                border: isCurrent ? '1px solid var(--border-subtle)' : '0.5px solid var(--border-subtle)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: isCurrent ? 'var(--text-primary)' : 'var(--bg-input)',
                                  color: isCurrent ? 'var(--bg-main)' : 'var(--text-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                  border: '0.5px solid var(--border-subtle)',
                                }}>
                                  {isCompleted ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {drill.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {isDrillHold ? 'Hold • 3 sets to failure' : 'Reps • 2x10 + AMRAP'}
                                  </div>
                                </div>
                              </div>

                              <div style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 999,
                                backgroundColor: 'var(--bg-input)',
                                color: isCompleted ? 'var(--text-muted)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                                border: '0.5px solid var(--border-subtle)',
                                flexShrink: 0,
                              }}>
                                {isCompleted ? 'Done' : isCurrent ? `Set ${activeSession.currentSet}/3` : 'Pending'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* MAIN VIEW */
        <main style={styles.content}>
        {/* Celebration Toast Modal */}
        {celebrationModal && (
          <div className="ios-card" style={{ padding: '22px 24px', border: '1.5px solid var(--accent-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                WORKOUT COMPLETE
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                +{celebrationModal.xpGained} XP Earned!
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                You finished the <strong>{celebrationModal.skillTitle}</strong> ({celebrationModal.levelName}) program!
                Total Calisthenics XP: <strong>{celebrationModal.newTotal.toLocaleString()} XP</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationModal(null)}
              className="ios-button-primary"
              style={{ padding: '8px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 700 }}
            >
              Done
            </button>
          </div>
        )}

        {/* Hero Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={styles.eyebrow}>BODYWEIGHT ATHLETICISM • SKILL PROGRESSION</div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>
              Calisthenics
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0', maxWidth: 640 }}>
              Master the pinnacle bodyweight levers, handstands, and explosive bar transitions with structured progressions, technical execution cues, and XP rewards.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="ios-card" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RANK</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: currentRank.color }}>{currentRank.badge}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentRank.title}</span>
            </div>

            <div className="ios-card" style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOTAL XP</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
                +{caliXp.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{completedSessionsCount} sessions</span>
            </div>
          </div>
        </div>

        {/* Category Filters (Apple HIG Pills) */}
        <div className="cali-filter-scroll" style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Skills (7)' },
            { id: 'levers', label: 'Levers' },
            { id: 'inversions', label: 'Inversions' },
            { id: 'power', label: 'Power & Bar' },
          ].map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={isActive ? 'ios-button-primary' : 'ios-button-secondary'}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Skills Stack */}
        <div style={styles.skillsStack}>
          {filteredSkills.map((skill) => {
            const isExpanded = expandedSkillId === skill.id;
            const currentLevelKey = selectedDifficulty[skill.id] || 'beginner';
            const currentLevelData = skill.levels[currentLevelKey];

            return (
              <div
                key={skill.id}
                className="ios-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Skill Card Header */}
                <div
                  onClick={() => setExpandedSkillId((cur) => (cur === skill.id ? null : skill.id))}
                  className="cali-card-header"
                  style={styles.cardHeader}
                  role="button"
                  tabIndex={0}
                >
                  <div style={styles.cardHeaderLeft}>
                    <div style={styles.badgeRow}>
                      <span style={{ ...styles.categoryBadge, backgroundColor: `${skill.badgeColor}18`, color: skill.badgeColor }}>
                        {skill.category}
                      </span>
                      <span style={styles.starsBadge}>{skill.difficulty}</span>
                    </div>

                    <h2 style={styles.skillTitle}>{skill.title}</h2>
                    <p style={styles.skillDesc}>{skill.description}</p>
                    <div style={styles.musclesText}>
                      <strong style={{ color: 'var(--text-primary)' }}>Target Muscles:</strong> {skill.muscles}
                    </div>
                  </div>

                  <div style={styles.cardHeaderRight}>
                    <div style={styles.currentLevelIndicator}>
                      <span style={styles.indicatorLabel}>ACTIVE LEVEL</span>
                      <span style={styles.indicatorValue}>{currentLevelData.name}</span>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...styles.expandBtn,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      aria-label="Expand progression"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Drawer: 3 Workouts & Start Workout Trigger */}
                {isExpanded && (
                  <div className="expanded-cali-drawer" style={styles.expandedDrawer}>
                    {/* 3 Difficulty Selector iOS Segmented Control */}
                    <div style={styles.levelTabsRow}>
                      <div style={styles.levelTabsLabel}>SELECT PROGRAM LEVEL</div>
                      <div className="ios-segmented-control" style={{ maxWidth: 440 }}>
                        {[
                          { key: 'beginner', label: 'Beginner' },
                          { key: 'intermediate', label: 'Intermediate' },
                          { key: 'advanced', label: 'Advanced' },
                        ].map((tier) => {
                          const isActive = currentLevelKey === tier.key;
                          return (
                            <button
                              key={tier.key}
                              type="button"
                              onClick={() => setSelectedDifficulty((p) => ({ ...p, [skill.id]: tier.key }))}
                              className={`ios-segment-btn ${isActive ? 'active' : ''}`}
                            >
                              {tier.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Level Program Overview & Big Start Workout Trigger */}
                    <div className="level-overview-banner" style={styles.levelOverviewBanner}>
                      <div className="level-overview-info" style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <div style={styles.levelBadgeTag}>{currentLevelData.badge}</div>
                        <div style={styles.levelObjectiveText}>{currentLevelData.objective}</div>
                        <div style={styles.structureNote}>
                          Routine Format: <strong>2 sets × 10 reps</strong> + <strong>1 set to failure</strong> • 90s Rest
                        </div>
                      </div>

                      <div className="banner-right-actions" style={styles.bannerRightActions}>
                        <div style={styles.xpRewardTag}>
                          <span style={styles.xpRewardLabel}>REWARD</span>
                          <span style={styles.xpRewardValue}>+{currentLevelData.xpReward} XP</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartWorkout(skill, currentLevelKey, currentLevelData)}
                          style={styles.startWorkoutPrimaryBtn}
                        >
                          <span>START WORKOUT</span>
                        </button>
                      </div>
                    </div>

                    {/* Drills List Preview */}
                    <div style={styles.drillsList}>
                      <div style={styles.drillsSectionTitle}>
                        EXERCISES IN THIS ROUTINE ({currentLevelData.drills.length})
                      </div>

                      {currentLevelData.drills.map((drill, idx) => {
                        return (
                          <div key={idx} style={styles.drillItemCard}>
                            <div style={styles.drillTopRow}>
                              <div style={styles.drillNumberBadge}>{idx + 1}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={styles.drillName}>{drill.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                  <span style={styles.drillRepsBadge}>2 sets × 10 • 1 set to failure</span>
                                  <span style={styles.motionLabelTag}>{drill.motionLabel}</span>
                                </div>
                              </div>
                            </div>

                            {/* Cues and Mistakes */}
                            <div style={styles.drillGuidanceRow} className="drill-guidance-grid">
                              <div style={styles.cueBox}>
                                <span style={styles.cueLabel}>FORM & EXECUTION:</span>
                                <p style={styles.cueContent}>{drill.cue}</p>
                              </div>
                              <div style={styles.mistakeBox}>
                                <span style={styles.mistakeLabel}>COMMON MISTAKE:</span>
                                <p style={styles.mistakeContent}>{drill.mistake}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      )}

      {/* CUSTOM APPLE CONFIRMATION EXIT MODAL (NO WINDOW.CONFIRM) */}
      {showExitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: 20,
        }}>
          <div className="ios-card" style={{
            maxWidth: 400,
            width: '100%',
            padding: '28px 24px',
            textAlign: 'center',
            borderRadius: 24,
            boxShadow: 'var(--shadow-floating)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            border: '0.5px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-input)',
              border: '0.5px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Exit Calisthenics Session?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to exit? Your uncompleted sets for this routine will be lost.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="ios-button-secondary"
                style={{ flex: 1, padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  setPrepCountdown(null);
                  setHoldTimerRunning(false);
                  setActiveSession(null);
                }}
                className="ios-button-primary"
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  backgroundColor: 'var(--accent-red)',
                  color: '#ffffff',
                }}
              >
                Exit Session
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
          }}
          workoutName={celebrationData.workoutName}
          totalXpEarned={celebrationData.totalXpEarned}
          muscleGroups={celebrationData.muscleGroups}
          onFinish={() => {
            setShowCelebrationModal(false);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  content: {
    maxWidth: 1040,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '28px 20px 120px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    overflowX: 'hidden',
  },
  eyebrow: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 4,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
  },
  skillsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  cardHeader: {
    padding: '20px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  },
  cardHeaderLeft: {
    flex: '1 1 240px',
    minWidth: 0,
    maxWidth: '100%',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  categoryBadge: {
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.5px',
  },
  starsBadge: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 700,
  },
  skillTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: '2px 0 6px',
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)',
  },
  skillDesc: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.5,
    margin: '4px 0 8px',
  },
  musclesText: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  currentLevelIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  indicatorLabel: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  indicatorValue: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  expandBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-input)',
    border: '0.5px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  expandedDrawer: {
    borderTop: '0.5px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  levelTabsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  levelTabsLabel: {
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  levelOverviewBanner: {
    backgroundColor: 'var(--bg-input)',
    border: '0.5px solid var(--border-subtle)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  levelBadgeTag: {
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.4px',
    marginBottom: 4,
  },
  levelObjectiveText: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  structureNote: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 6,
  },
  bannerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  xpRewardTag: {
    backgroundColor: 'var(--bg-card)',
    border: '0.5px solid var(--border-subtle)',
    borderRadius: 10,
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  xpRewardLabel: {
    color: 'var(--text-muted)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  xpRewardValue: {
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 800,
  },
  startWorkoutPrimaryBtn: {
    backgroundColor: 'var(--text-primary)',
    color: 'var(--bg-main)',
    border: 'none',
    borderRadius: 9999,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  drillsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  drillsSectionTitle: {
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  drillItemCard: {
    backgroundColor: 'var(--bg-card)',
    border: '0.5px solid var(--border-subtle)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  drillTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  drillNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-input)',
    border: '0.5px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-primary)',
    flexShrink: 0,
  },
  drillName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  motionLabelTag: {
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-muted)',
    padding: '2px 8px',
    borderRadius: 9999,
  },
  activeFocusBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-input)',
    borderRadius: 12,
    padding: '10px 14px',
    border: '0.5px solid var(--border-subtle)',
  },
  drillRepsBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  drillGuidanceRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 10,
  },
  cueBox: {
    backgroundColor: 'var(--bg-input)',
    borderRadius: 10,
    padding: '10px 14px',
  },
  cueLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 2,
  },
  cueContent: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: 0,
  },
  mistakeBox: {
    backgroundColor: 'var(--bg-input)',
    borderRadius: 10,
    padding: '10px 14px',
  },
  mistakeLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 2,
  },
  mistakeContent: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: 0,
  },
  demoPlayerBox: {
    backgroundColor: 'var(--bg-input)',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  demoPlayerHeader: {
    backgroundColor: 'var(--bg-card)',
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '0.5px solid var(--border-subtle)',
  },
  demoPlayerTitle: {
    color: 'var(--text-primary)',
  },
  frameCounter: {
    color: 'var(--accent-cyan)',
  },

  /* ACTIVE WORKOUT OVERLAY */
  activeSessionOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
  },
  activeSessionModal: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92vh',
    overflowY: 'auto',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 24,
    padding: 24,
    boxShadow: 'var(--shadow-floating)',
    border: '0.5px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '0.5px solid var(--border-subtle)',
    paddingBottom: 14,
  },
  sessionEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: 'var(--accent-red)',
    textTransform: 'uppercase',
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: '2px 0 0',
    color: 'var(--text-primary)',
  },
  cancelSessionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 8,
  },
  exerciseActiveCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  exerciseHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  drillNameBig: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  targetRepsHint: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  currentSetPill: {
    backgroundColor: 'rgba(255, 45, 85, 0.12)',
    color: 'var(--accent-red)',
    borderRadius: 9999,
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.4px',
  },
  activeDemoBox: {
    borderRadius: 14,
    border: '0.5px solid var(--border-subtle)',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-input)',
  },
  activeDemoHeader: {
    backgroundColor: 'var(--bg-card)',
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    display: 'flex',
    justifyContent: 'space-between',
  },
  framePill: {
    color: 'var(--accent-cyan)',
    fontSize: 10,
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
  },
  tipBox: {
    backgroundColor: 'var(--bg-input)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  tipLabelGreen: {
    color: 'var(--accent-green)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
  },
  tipLabelRed: {
    color: 'var(--accent-red)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: 0,
  },
  setActionWrap: {
    marginTop: 4,
  },
  completeSetBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#30d158',
    color: '#ffffff',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: 'var(--shadow-sm)',
  },
  failureSetRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  failureInputGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-input)',
    borderRadius: 12,
    padding: '10px 16px',
  },
  failureLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  failureNumberInput: {
    width: 80,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'var(--bg-card)',
    border: '0.5px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
  },
  completeFailureBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ff2d55',
    color: '#ffffff',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: 'var(--shadow-sm)',
  },

  /* REST SCREEN */
  restTimerWrap: {
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  restBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--accent-orange)',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  restHeading: {
    fontSize: 22,
    fontWeight: 800,
    margin: '4px 0',
    color: 'var(--text-primary)',
  },
  restSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: 0,
  },

  /* FINISH SUMMARY */
  finishSummaryWrap: {
    padding: '24px 16px',
    textAlign: 'center',
  },
  finishTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: '4px 0 6px',
    color: 'var(--text-primary)',
  },
  finishSub: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    maxWidth: 520,
    margin: '0 auto 20px',
  },
  finishStatsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 20,
  },
  finishStatBox: {
    backgroundColor: 'var(--bg-input)',
    borderRadius: 14,
    padding: '14px',
  },
  finishStatLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 4,
  },
  finishStatValue: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
};

/**
 * PORTFOLIO SCRIPT
 * =================
 * Handles all logic for the Desktop Environment portfolio.
 * - Clock & Battery
 * - Window Management (Open, Close, Drag, Resize)
 * - App Logic (Terminal, Files, Thoughts, Stats)
 */

/* =========================================
   SYSTEM STATUS (Time & Battery)
   ========================================= */

function setRandomWallpaper() {
    // Generate a random seed to ensure a new image on every load
    const randomSeed = Math.floor(Math.random() * 100000);
    // Use Picsum Photos for reliable, high-quality random variation
    // 1920x1080 resolution, random seed ensures variety
    const wallpaperUrl = `https://picsum.photos/seed/${randomSeed}/1920/1080`;

    // Apply to Lock Screen and Desktop with a subtle gradient overlay for readability
    const overlay = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4))';
    const bgStyle = `${overlay}, url('${wallpaperUrl}')`;

    const lockScreen = document.getElementById('lockScreen');
    const desktop = document.getElementById('desktop');

    // Set background size explicitly to ensure cover
    if (lockScreen) {
        lockScreen.style.backgroundImage = bgStyle;
        lockScreen.style.backgroundSize = 'cover';
        lockScreen.style.backgroundPosition = 'center';
    }
    if (desktop) {
        desktop.style.backgroundImage = bgStyle;
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
    }

    console.log(`Wallpaper set using seed: ${randomSeed}`);
}

// Call immediately
setRandomWallpaper();

// Updates the Lock Screen and Top Bar clock
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Update Lock Screen
    const lockTime = document.getElementById('lockTime');
    const lockDate = document.getElementById('lockDate');
    if (lockTime) lockTime.textContent = timeStr;
    if (lockDate) lockDate.textContent = dateStr;

    // Update Top Bar
    const topBarTime = document.getElementById('topBarTime');
    if (topBarTime) {
        topBarTime.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '  ' + timeStr;
    }
}

// Fetches and updates battery status
async function updateBattery() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const batteryLevel = Math.round(battery.level * 100);
            const batteryIcon = document.getElementById('batteryIcon');
            const batteryLevelSpan = document.getElementById('batteryLevel');

            if (batteryLevelSpan) batteryLevelSpan.textContent = batteryLevel;

            // Update icon and color based on level/charging
            if (batteryIcon) {
                if (battery.charging) {
                    batteryIcon.innerHTML = `⚡ <span id="batteryLevel">${batteryLevel}</span>%`;
                } else if (batteryLevel > 80) {
                    batteryIcon.innerHTML = `🔋 <span id="batteryLevel">${batteryLevel}</span>%`;
                } else if (batteryLevel > 50) {
                    batteryIcon.innerHTML = `🔋 <span id="batteryLevel">${batteryLevel}</span>%`;
                } else if (batteryLevel > 20) {
                    batteryIcon.innerHTML = `🪫 <span id="batteryLevel">${batteryLevel}</span>%`;
                } else {
                    batteryIcon.innerHTML = `🪫 <span id="batteryLevel">${batteryLevel}</span>%`;
                    batteryIcon.style.color = '#ff5f56';
                }
            }

            // Listen for changes
            battery.addEventListener('levelchange', () => updateBattery());
            battery.addEventListener('chargingchange', () => updateBattery());
        } catch (error) {
            console.warn("Battery API error:", error);
            // Fallback
            const el = document.getElementById('batteryLevel');
            if (el) el.textContent = '100';
        }
    } else {
        // Fallback for unsupported browsers
        const el = document.getElementById('batteryLevel');
        if (el) el.textContent = '100';
    }
}

// Initialize system status
updateTime();
updateBattery();
setInterval(updateTime, 1000);

/* =========================================
   LOCK SCREEN LOGIC
   ========================================= */
function unlockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    const desktop = document.getElementById('desktop');

    if (lockScreen && desktop) {
        lockScreen.classList.add('hidden');
        desktop.classList.add('active');
    }
}

// Event Listeners for unlocking
document.getElementById('lockScreen')?.addEventListener('click', unlockScreen);
document.addEventListener('keydown', function (e) {
    const desktop = document.getElementById('desktop');
    if (desktop && !desktop.classList.contains('active')) {
        unlockScreen();
    }
});

/* =========================================
   WINDOW MANAGEMENT
   ========================================= */
let activeWindows = new Set([]); // No default open windows
let windowStates = {};
let cascadeCount = 0; // To track window offsetting

function openWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    // If we are starting fresh (no windows open), reset cascade
    if (activeWindows.size === 0) {
        cascadeCount = 0;
    }

    if (!activeWindows.has(windowId)) {
        // Apply cascading position for new window opens
        // Base: top 10vh, left 20vw
        // Shift: +3vh top, +2vw left per subsequent window

        // Check if window is maximized; if so, don't cascade (or reset max state?)
        // Assuming we open in restored state usually
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
        }

        const topOffset = 10 + (cascadeCount * 4); // vh
        const leftOffset = 20 + (cascadeCount * 3); // vw

        // Constraint to keep it on screen reasonably (optional, simple modulo or clamp?)
        // For now, simple increment is fine for 4-5 windows

        win.style.top = `${topOffset}vh`;
        win.style.left = `${leftOffset}vw`;
        win.style.width = '60vw';
        win.style.height = '75vh';

        cascadeCount++;
    }

    win.classList.add('active');
    win.style.display = 'flex';
    activeWindows.add(windowId);
    bringToFront(windowId);
    updateDockIcons();
}

function closeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    win.classList.remove('active');
    win.style.display = 'none'; // Completely hide
    activeWindows.delete(windowId);
    updateDockIcons();
}

function minimizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    win.style.display = 'none';
    setTimeout(() => {
        // This logic seems a bit odd in original, but intent is likely jsut to hide
        // If we want to restore later, we openWindow()
        win.classList.remove('active');
    }, 300);
    // Remove from active but keep tracking if needed? 
    // Logic in original removed it from activeWindows set so dock icon loses active status
    activeWindows.delete(windowId);
    updateDockIcons();
}

function toggleMaximize(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;

    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        if (windowStates[windowId]) {
            Object.assign(win.style, windowStates[windowId]);
        }
    } else {
        windowStates[windowId] = {
            top: win.style.top,
            left: win.style.left,
            width: win.style.width,
            height: win.style.height
        };
        win.classList.add('maximized');
    }
}

function bringToFront(windowId) {
    const windows = document.querySelectorAll('.window');
    windows.forEach(w => w.style.zIndex = 100);

    const target = document.getElementById(windowId);
    if (target) target.style.zIndex = 101;
}

// Update Dock indicators based on open windows
function updateDockIcons() {
    document.querySelectorAll('.dock-icon').forEach(icon => {
        icon.classList.remove('active');
    });

    if (activeWindows.has('filesWindow')) document.getElementById('filesIcon')?.classList.add('active');
    if (activeWindows.has('terminalWindow')) document.getElementById('terminalIcon')?.classList.add('active'); // Note: 'terminalIcon' isn't in HTML, assumed implicit or missing ID in original
    if (activeWindows.has('aboutWindow')) document.getElementById('aboutIcon')?.classList.add('active');
    if (activeWindows.has('thoughtsWindow')) document.getElementById('thoughtsIcon')?.classList.add('active');
    if (activeWindows.has('statsWindow')) document.getElementById('statsIcon')?.classList.add('active');
}

/* =========================================
   DRAGGABLE WINDOWS
   ========================================= */
let isDragging = false;
let currentWindow = null;
let offset = { x: 0, y: 0 };

document.querySelectorAll('.window-header').forEach(header => {
    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('window-control')) return;

        isDragging = true;
        currentWindow = header.closest('.window');
        const rect = currentWindow.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;

        bringToFront(currentWindow.id);
    });
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentWindow || currentWindow.classList.contains('maximized')) return;

    const x = e.clientX - offset.x;
    const y = e.clientY - offset.y;

    // Constrain to specific area if needed, e.g., avoid hiding under top bar
    currentWindow.style.left = Math.max(70, Math.min(x, window.innerWidth - 100)) + 'px';
    currentWindow.style.top = Math.max(28, Math.min(y, window.innerHeight - 50)) + 'px';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    currentWindow = null;
});

/* =========================================
   DOCK INTERACTIONS
   ========================================= */
document.getElementById('filesIcon')?.addEventListener('click', () => {
    activeWindows.has('filesWindow') ? minimizeWindow('filesWindow') : openWindow('filesWindow');
});

document.getElementById('aboutIcon')?.addEventListener('click', () => {
    activeWindows.has('aboutWindow') ? minimizeWindow('aboutWindow') : openWindow('aboutWindow');
});

document.getElementById('thoughtsIcon')?.addEventListener('click', () => {
    if (activeWindows.has('thoughtsWindow')) {
        minimizeWindow('thoughtsWindow');
    } else {
        openWindow('thoughtsWindow');
        const thoughtsList = document.getElementById('thoughtsList');
        if (thoughtsList && thoughtsList.children.length === 0) {
            generateThought();
        }
    }
});

document.getElementById('statsIcon')?.addEventListener('click', () => {
    if (activeWindows.has('statsWindow')) {
        minimizeWindow('statsWindow');
    } else {
        openWindow('statsWindow');
        animateStats(); // Trigger animation
    }
});

/* =========================================
   CONTEXT MENU
   ========================================= */
const contextMenu = document.getElementById('contextMenu');

document.getElementById('desktop')?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (contextMenu) {
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.classList.add('active');
    }
});

document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
        contextMenu.classList.remove('active');
    }
});

function resetUbuntu() {
    location.reload();
}

/* =========================================
   APP LOGIC: TERMINAL
   ========================================= */
function openTerminal(command) {
    // Open the window
    openWindow('terminalWindow');

    // Determine content based on command
    const terminalContent = document.getElementById('terminalContent');
    if (!terminalContent) return;

    let output = '';

    switch (command) {
        case 'publications':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">ls -la publications/journals/</span>

📝 Journal Publications (n=3)

1. <strong>Personalized Theta tACS and Gamma tACS bring Differential Neuromodulatory Effects</strong>
   Neuromodulation: Technology at the Neural Interface (2024)
   Authors: Rahul Venugopal, Arun Sasidharan, et al.

2. <strong>Beyond Hypnograms: Assessing Sleep Stability Using Acoustic and Electrical Stimulation</strong>
   Neuromodulation: Technology at the Neural Interface (2019)

3. <strong>Dissociating meditation proficiency and experience dependent EEG changes</strong>
   Biological Psychology (2018)
   Study: Traditional Vipassana meditation practice

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'preprints':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat preprints/recent.txt</span>

📋 Recent Preprints (n=10)

• Cross-Modal Computational Model of Brain-Heart Interactions (2026)
• Unveiling the Heart-Brain Connection - ECG in Cognitive Performance (2026)
• EEG Phase Slips in Novice Vipassana Meditators (bioRxiv 2025)
• Similar States, Different Paths: Neurodynamics of diverse meditation (bioRxiv 2025)
• Non-duality in Brain and Experience of Advanced Meditators (bioRxiv 2025)
• Time-to-onset and temporal dynamics during breath-watching meditation (bioRxiv 2025)
• The Balanced Mind and Intrinsic Neural Timescales (bioRxiv 2024)

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'phd':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat phd_thesis/abstract.md</span>

🎓 PhD Thesis (2018-2024)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: NEURAL OSCILLATORY DYNAMICS AND COGNITION: A NEUROPHYSIOLOGICAL STUDY

Institution: NIMHANS, Bengaluru, India
Degree: Doctor of Philosophy in Cognitive Neurosciences

Key Contributions:
• Designed real-time adaptive working memory paradigm with high-density EEG
• Studied neural oscillatory dynamics in Schizophrenia vs healthy controls
• Demonstrated differential effects of theta & gamma tACS on resting/task EEG
• Applied graph theory & dynamical systems to neural data analysis
• Developed personalized neuromodulation protocols

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;
        // Also supports conferences if needed, though not explicitly in original switch-case logic provided in view_file
        case 'conferences':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">ls conferences/</span>

🎤 Conference Presentations (47)
[Displaying recent...]
• Society for Neuroscience (SfN), Chicago 2024
• Human Brain Mapping (HBM), Seoul 2024
• Association for Scientific Study of Consciousness (ASSC), NYC 2023
...and 44 more.

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        default:
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">whoami</span>

Dr. Rahul Venugopal
Scientist (Cognitive Science)
Centre for Consciousness Studies, NIMHANS

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
    }

    terminalContent.innerHTML = output;
}

function openResearchArea(area) {
    openWindow('terminalWindow');
    const terminalContent = document.getElementById('terminalContent');
    if (!terminalContent) return;

    let output = '';

    switch (area) {
        case 'sense-of-self':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/sense_of_self.md</span>

🧠 SENSE OF SELF - Research Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Core Research Question:</strong>
How does the sense of self emerge, fragment, and radically alter across 
different states of consciousness?

<strong>Theoretical Framework:</strong>
My research bridges neuroscience, psychiatry, technology and contemplative 
science to explore the boundaries of selfhood.

<strong>Key Areas of Investigation:</strong>

1. EMERGENCE OF SELF
   • Neural correlates of self-awareness
   • Development of self-representation in the brain
   • Role of interoception in self-construction

2. FRAGMENTATION PATTERNS
   • Schizophrenia: Disrupted self-boundaries
   • Autism: Atypical self-other differentiation
   • Dissociative states: Temporary self-fragmentation

3. ALTERED STATES
   • Non-duality experiences in advanced meditation
   • Out-of-body experiences (OBEs)
   • Lucid dreaming and dream self-awareness
   • Psychedelic-induced ego dissolution

<strong>Methodological Approach:</strong>
• High-density EEG recordings
• Graph theory network analysis
• Phenomenological interviews
• Computational modeling of self-processes

<strong>Clinical Implications:</strong>
Understanding self-fragmentation can inform therapeutic interventions
for disorders where the sense of self is compromised.

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'neural-oscillations':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/neural_oscillations.md</span>

🌊 NEURAL OSCILLATORY DYNAMICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Research Focus:</strong>
Understanding how rhythmic patterns of neural activity support cognition,
particularly in working memory and executive functions.

<strong>Frequency Bands of Interest:</strong>

THETA (4-8 Hz)
• Working memory encoding and maintenance
• Cognitive control and task switching
• Long-range frontal-parietal synchronization

GAMMA (30-100 Hz)
• Local information processing
• Feature binding and integration
• Attention and sensory processing

<strong>Key Findings:</strong>

1. SCHIZOPHRENIA vs CONTROLS
   • Reduced theta-gamma coupling during working memory
   • Aberrant phase-amplitude relationships
   • Individual-specific network disruptions

2. TASK-EVOKED OSCILLATIONS
   • Capacity-dependent theta power modulation
   • Load-sensitive gamma band responses
   • Network reorganization during cognitive demands

3. SPECTRAL DYNAMICS
   • Aperiodic (1/f) noise as marker of E/I balance
   • Periodic oscillations vs background activity
   • Developmental and state-dependent changes

<strong>Analytical Techniques:</strong>
• Time-frequency decomposition
• Phase-amplitude coupling
• Graph theory metrics
• Dynamical systems approaches

<strong>Publications:</strong>
PhD Thesis: "Neural Oscillatory Dynamics and Cognition" (2024)

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'meditation':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/meditation_consciousness.md</span>

🧘 MEDITATION & CONSCIOUSNESS STUDIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Primary Focus:</strong>
Investigating neural signatures of contemplative practices and their
effects on consciousness and cognition.

<strong>Vipassana Meditation Research:</strong>

EXPERTISE LEVELS STUDIED:
• Novice practitioners (< 100 hours)
• Intermediate (100-1000 hours)
• Advanced (> 1000 hours)

KEY FINDINGS:

1. NON-LINEAR DYNAMICS
   • Increased complexity (permutation entropy) with expertise
   • Altered fractal dimensions during meditation
   • Dissociation of attention, mindfulness, loving-kindness states

2. NON-DUALITY EXPERIENCES
   • Intrinsic neural timescales in advanced meditators
   • Balanced mind states and neural dynamics
   • Different paths to similar meditative states

3. SLEEP IN MEDITATORS
   • Enhanced sleep stability markers
   • Age-independent spindle characteristics
   • Preserved sleep architecture despite aging

<strong>Meditation States Studied:</strong>
✓ Breath-watching meditation
✓ Body scan (Vipassana)
✓ Loving-kindness (Metta)
✓ Non-dual awareness practices

<strong>Measurement Approaches:</strong>
• 128-channel high-density EEG
• Whole-night polysomnography
• Phenomenological profiling
• Vipassana Proficiency Scale (validated)

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'sleep':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/sleep_research.md</span>

😴 SLEEP NEUROSCIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Research Experience:</strong>
125+ whole-night polysomnography studies conducted
Focus: Sleep stability, dreaming, and consciousness during sleep

<strong>Key Research Areas:</strong>

1. SLEEP STABILITY ASSESSMENT
   • Beyond traditional hypnograms
   • Event-Related Potentials during sleep
   • K-complexes and sleep spindles analysis
   • Response to acoustic/electrical perturbations

2. SLEEP NEUROMODULATION
   • Real-time stage-dependent stimulation
   • Transcranial Alternating Current Stimulation (tACS)
   • Closed-loop auditory neuromodulation
   • Slow-wave spindle coupling enhancement

3. DREAMING & CONSCIOUSNESS
   • Neural decoding of dream states
   • Serial awakening protocols
   • Dream recall vs no-recall patterns
   • Lucid dreaming induction attempts
   • Multivariate EEG patterns during REM

4. CLINICAL APPLICATIONS
   • Schizophrenia: Microstate dynamics during sleep
   • Mild Cognitive Impairment: Sleep biomarkers
   • Obstructive Sleep Apnea: HRV indices
   • Age-related sleep changes

<strong>Specialized Skills:</strong>
• AASM sleep staging guidelines
• K-complex & spindle detection algorithms
• Heart Evoked Potentials (HEPs) in sleep
• Multi-night serial sleep protocols

<strong>Technologies Used:</strong>
• 32-ch Nihon-Kohden PSG system
• High-density EEG during sleep
• Real-time sleep stage detection
• Automated analysis pipelines (Python/MATLAB)

<strong>Notable Publications:</strong>
"Beyond Hypnograms: Assessing Sleep Stability Using Acoustic and Electrical Stimulation" - Neuromodulation (2019)

<strong>Current Projects:</strong>
• Heart-brain interactions across wake and sleep
• Sleep stability in typical and atypical populations
• Aperiodic activity patterns during sleep stages

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'neuromodulation':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/neuromodulation_tacs.md</span>

⚡ NON-INVASIVE NEUROMODULATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Primary Technique: Transcranial Alternating Current Stimulation (tACS)</strong>

RESEARCH OBJECTIVES:
Enhance cognitive functions and treat clinical symptoms through
targeted, frequency-specific brain stimulation

<strong>Personalized tACS Protocols:</strong>

1. THETA tACS (4-8 Hz)
   Target: Working memory enhancement
   Findings: 
   • Differential effects on resting vs task EEG
   • Individual-specific response patterns
   • Temporal dynamics of after-effects

2. GAMMA tACS (30-80 Hz)
   Target: Attention and perceptual binding
   Findings:
   • Modulation of local gamma oscillations
   • Effects on aperiodic spectral components
   • Spatial specificity of stimulation

<strong>Key Research Contributions:</strong>

✓ PERSONALIZATION
  • Individual peak frequency targeting
  • Graph theory-based network profiling
  • Adaptive stimulation parameters

✓ MULTI-DIMENSIONAL CHARACTERIZATION
  • Temporal: Onset, duration, persistence of effects
  • Spatial: Electrode montages and field distribution
  • Spectral: Frequency-specific modulation patterns

✓ CLINICAL TRANSLATION
  • Working memory deficits in schizophrenia
  • Cognitive enhancement in healthy individuals
  • Sleep quality improvement

<strong>Stimulation Contexts:</strong>
• During wake (resting state)
• During cognitive tasks (online modulation)
• During sleep (NREM/REM-specific)
• Closed-loop adaptive protocols

<strong>Safety & Ethics:</strong>
• Rigorous safety screening protocols
• Individual comfort monitoring
• Adverse effects documentation
• Ethical considerations in cognitive enhancement

<strong>Equipment:</strong>
• Axxonet 4-channel tES device (Bluetooth control)
• Neuphony consumer-grade neurofeedback
• Custom stimulation parameter optimization

<strong>Major Publication:</strong>
"Personalized Theta tACS and Gamma tACS bring Differential Neuromodulatory Effects on Resting EEG" - Neuromodulation (2024)

<strong>Future Directions:</strong>
• Real-time EEG-driven adaptive tACS
• Multi-frequency simultaneous stimulation
• Long-term cognitive training protocols

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'brain-heart':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/brain_heart_interaction.md</span>

❤️ BRAIN-HEART INTERACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<strong>Interoception Research Program</strong>

CENTRAL QUESTION:
How does the brain process and represent internal bodily signals,
and how does this shape our sense of self and consciousness?

<strong>Heart Rate Variability (HRV) Analysis:</strong>

DOMAINS MEASURED:
1. Time Domain
   • RMSSD, SDNN, pNN50
   • Beat-to-beat variability

2. Frequency Domain  
   • LF/HF ratio
   • Spectral power distribution
   • Respiratory sinus arrhythmia

3. Non-linear Measures
   • Entropy measures
   • Fractal dimensions
   • Recurrence quantification

4. Synthetic Models
   • Computational HRV generation
   • Parameter space exploration

<strong>Heart Evoked Potentials (HEPs):</strong>
• Cortical responses to heartbeats
• Automated R-wave detection pipelines
• HEPs across sleep stages
• Variations in wellness vs illness

<strong>Research Contexts:</strong>

WAKE STATE
• Resting HRV profiling
• Task-related cardiac modulation
• Cognitive load effects on HRV

SLEEP STATE  
• HRV dynamics across sleep stages
• Autonomic patterns in NREM/REM
• Sleep quality prediction from HRV

NAP STUDIES
• Short-term autonomic recovery
• Age-related HRV differences
• Clinical populations (MCI, OSA)

<strong>Brain-Heart Coupling:</strong>
• Phase synchronization analysis
• Information flow between systems
• Predictive modeling of cognitive performance
• Role in spontaneous thought generation

<strong>Clinical Applications:</strong>
• Stress and wellbeing markers
• Obstructive Sleep Apnea diagnostics
• Cognitive decline early detection
• Meditation effects on autonomic regulation

<strong>Technical Implementation:</strong>
• Neurokit2 Python library
• Custom ECG processing pipelines
• Integrated EEG-ECG analysis
• Statistical inference frameworks

<strong>Recent Work:</strong>
"Cross-Modal Computational Model of Brain-Heart Interactions via HRV and EEG Features" - Conference paper (2025)

"Unveiling the Heart-Brain Connection: An Analysis of ECG in Cognitive Performance" - Conference paper (2025)

<strong>Ongoing Projects:</strong>
• Interoception across wake, sleep, wellness and illness
• Heart-brain synchrony in meditation
• Predictive models of mental states from cardiac signals

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;
    }

    terminalContent.innerHTML = output;
}

// Cursor blinking effect replacement (simple toggle)
setInterval(() => {
    const cursor = document.getElementById('cursor');
    if (cursor) {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }
}, 500);

/* =========================================
   APP LOGIC: FILES EXPLORER
   ========================================= */
function switchFolder(folder) {
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');

    const filesMain = document.getElementById('filesMain');
    let content = '';

    switch (folder) {
        case 'publications':
            content = `
                <div class="file-grid">
                    <div class="file-item" onclick="openTerminal('publications')">
                        <div class="file-icon"><i class="ph ph-scroll"></i></div>
                        <div class="file-name">Journal Papers (3)</div>
                    </div>
                    <div class="file-item" onclick="openTerminal('preprints')">
                        <div class="file-icon"><i class="ph ph-file-dashed"></i></div>
                        <div class="file-name">Preprints (10)</div>
                    </div>
                    <div class="file-item" onclick="openTerminal('conferences')">
                        <div class="file-icon"><i class="ph ph-microphone-stage"></i></div>
                        <div class="file-name">Conference Papers (47)</div>
                    </div>
                    <div class="file-item" onclick="openTerminal('phd')">
                        <div class="file-icon"><i class="ph ph-graduation-cap"></i></div>
                        <div class="file-name">PhD Thesis</div>
                    </div>
                </div>`;
            break;
        case 'research':
            content = `
                <div class="file-grid">
                    <div class="file-item" onclick="openResearchArea('sense-of-self')">
                        <div class="file-icon"><i class="ph ph-brain"></i></div>
                        <div class="file-name">Sense of Self</div>
                    </div>
                    <div class="file-item" onclick="openResearchArea('neural-oscillations')">
                        <div class="file-icon"><i class="ph ph-wave-sine"></i></div>
                        <div class="file-name">Neural Oscillations</div>
                    </div>
                    <div class="file-item" onclick="openResearchArea('meditation')">
                        <div class="file-icon"><i class="ph ph-flower-lotus"></i></div>
                        <div class="file-name">Meditation & Consciousness</div>
                    </div>
                    <div class="file-item" onclick="openResearchArea('sleep')">
                        <div class="file-icon"><i class="ph ph-moon-stars"></i></div>
                        <div class="file-name">Sleep Research</div>
                    </div>
                    <div class="file-item" onclick="openResearchArea('neuromodulation')">
                        <div class="file-icon"><i class="ph ph-lightning"></i></div>
                        <div class="file-name">Neuromodulation (tACS)</div>
                    </div>
                    <div class="file-item" onclick="openResearchArea('brain-heart')">
                        <div class="file-icon"><i class="ph ph-heartbeat"></i></div>
                        <div class="file-name">Brain-Heart Interaction</div>
                    </div>
                </div>`;
            break;
        case 'teaching':
            content = `
                <div class="file-grid">
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-users"></i></div>
                        <div class="file-name">Mentored 25+ Students</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-wave-sawtooth"></i></div>
                        <div class="file-name">Signal Processing</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-code"></i></div>
                        <div class="file-name">Python for Neuroscience</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-trend-up"></i></div>
                        <div class="file-name">Statistical Analysis</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-flask"></i></div>
                        <div class="file-name">Research Methods</div>
                    </div>
                </div>`;
            break;
        case 'awards':
            content = `
                <div class="file-grid">
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-trophy"></i></div>
                        <div class="file-name">CIFAR Fellow (₹5.5L)</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-globe-hemisphere-west"></i></div>
                        <div class="file-name">MESEC Scholar (₹1.25L)</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-medal"></i></div>
                        <div class="file-name">Best Poster EMBO</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-chart-pie-slice"></i></div>
                        <div class="file-name">Dataviz Winner</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-pen-nib"></i></div>
                        <div class="file-name">Brain Trivia Winner</div>
                    </div>
                </div>`;
            break;
    }

    filesMain.innerHTML = content;
}


/* =========================================
   APP LOGIC: RANDOM THOUGHTS
   ========================================= */
const thoughts = [
    // Original Curated Thoughts
    {
        text: "What if the 'self' is just a convenient fiction our brains construct to navigate social reality? When it dissolves in deep meditation or psychedelics, maybe we're glimpsing what consciousness actually is.",
        category: "Philosophy of Mind"
    },
    {
        text: "Theta oscillations in working memory aren't just correlates—they might be the computational mechanism. Each theta cycle could be a discrete 'moment' of working memory access.",
        category: "Neural Oscillations"
    },
    {
        text: "After analyzing 125+ sleep studies, I'm convinced we're asking the wrong questions about dreams. It's not 'why do we dream?' but 'why don't we dream more coherently?'",
        category: "Sleep Research"
    },
    {
        text: "Personalized neuromodulation is the future, but we need to move beyond one-size-fits-all frequencies. Graph theory shows each brain has unique connectivity fingerprints.",
        category: "Neuromodulation"
    },
    {
        text: "The heart-brain axis is bidirectional, but we've been mostly measuring brain→heart. What if emotions are actually heart→brain predictions that consciousness interprets?",
        category: "Interoception"
    },
    {
        text: "Advanced meditators show intrinsic neural timescales that defy our models. Are they accessing different temporal scales of consciousness? Time might literally feel different.",
        category: "Meditation Studies"
    },
    {
        text: "Schizophrenia research taught me that 'abnormal' neural patterns aren't broken—they're exploring different solution spaces. Sometimes the brain optimizes for things we don't understand yet.",
        category: "Clinical Neuroscience"
    },
    {
        text: "Non-linear EEG analysis reveals structure invisible to power spectra. Permutation entropy during meditation shows the brain isn't quieting—it's reorganizing at a deeper level.",
        category: "Signal Processing"
    },
    {
        text: "What if consciousness isn't in the brain at all, but in the dynamic patterns of interaction? Remove any single neuron and consciousness persists. It's the dance, not the dancers.",
        category: "Consciousness Theory"
    },
    {
        text: "After years of tACS research, I suspect we're modulating network dynamics more than local oscillations. The therapeutic effects might come from destabilizing pathological attractors.",
        category: "Brain Stimulation"
    },
    {
        text: "Sleep spindles couple with slow oscillations for memory consolidation, but in meditators this coupling persists into waking. Are they consolidating while awake?",
        category: "Sleep & Memory"
    },
    {
        text: "The aperiodic (1/f) component of EEG might be more important than oscillations. It could reflect the excitation-inhibition balance—the brain's fundamental setting.",
        category: "Spectral Analysis"
    },
    {
        text: "Lucid dreaming is consciousness recognizing itself in a self-generated simulation. If we can do it in sleep, what does that say about waking reality?",
        category: "Dream Research"
    },
    {
        text: "Machine learning on EEG can decode mental states, but understanding requires theory. We need models that explain why these patterns emerge, not just that they do.",
        category: "Computational Neuroscience"
    },
    {
        text: "The replication crisis taught me: publish your analysis code, share your data, preregister when possible. Science advances through transparency, not just clever experiments.",
        category: "Open Science"
    },
    // New Famous Quotes
    {
        text: "You, your joys and your sorrows, your memories and your ambitions, your sense of personal identity and free will, are in fact no more than the behavior of a vast assembly of nerve cells and their associated molecules.",
        category: "Francis Crick"
    },
    {
        text: "We hallucinate our reality. When we agree about our hallucinations, we call it reality.",
        category: "Anil Seth"
    },
    {
        text: "We are not thinking machines that feel; we are feeling machines that think.",
        category: "Antonio Damasio"
    },
    {
        text: "Consciousness is the central fact of your existence.",
        category: "Christof Koch"
    },
    {
        text: "Every man can, if he so desires, become the sculptor of his own brain.",
        category: "Santiago Ramón y Cajal"
    },
    {
        text: "The 'self' is not a holistic property of the entire brain; it is specific to certain neural circuits.",
        category: "V.S. Ramachandran"
    },
    {
        text: "Consciousness is global information broadcasting within the cortex.",
        category: "Stanislas Dehaene"
    },
    {
        text: "Every act of perception, is to some degree an act of creation, and every act of memory is to some degree an act of imagination.",
        category: "Oliver Sacks"
    },
    {
        text: "The stream of thought flows on; but most of its segments fall into the bottomless abyss of oblivion.",
        category: "William James"
    },
    {
        text: "Neurons that fire together, wire together.",
        category: "Donald Hebb"
    },
    {
        text: "Consciousness is integrated information.",
        category: "Giulio Tononi"
    },
    {
        text: "We are the last to know what our brain has done.",
        category: "Michael Gazzaniga"
    },
    {
        text: "The brain is an emulator of reality.",
        category: "Rodolfo Llinás"
    },
    {
        text: "The easy problems of consciousness are those that seem directly susceptible to the standard methods of cognitive science... The hard problem of consciousness is the problem of experience.",
        category: "David Chalmers"
    },
    {
        text: "Without consciousness the mind-body problem would be much less interesting. With consciousness it seems hopeless.",
        category: "Thomas Nagel"
    }
];

let availableIndices = [];

function generateThought() {
    const thoughtsList = document.getElementById('thoughtsList');
    const dice = document.getElementById('diceSpinner');

    if (!thoughtsList) return;

    // Spin the dice!
    if (dice) {
        dice.classList.add('spinning');
    }

    // Simulate "thinking" time
    setTimeout(() => {
        if (dice) dice.classList.remove('spinning');

        // Logic for sampling without replacement
        if (availableIndices.length === 0) {
            // Refill the deck
            availableIndices = Array.from({ length: thoughts.length }, (_, i) => i);
        }

        // Pick a random index from the available ones
        const randomIndexPointer = Math.floor(Math.random() * availableIndices.length);
        const selectedThoughtIndex = availableIndices.splice(randomIndexPointer, 1)[0];

        const randomThought = thoughts[selectedThoughtIndex];

        const thoughtCard = document.createElement('div');
        thoughtCard.className = 'thought-card animate-in';
        thoughtCard.innerHTML = `
            <div class="thought-text">"${randomThought.text}"</div>
            <div class="thought-meta">💡 Category: ${randomThought.category} | Generated ${new Date().toLocaleTimeString()}</div>
        `;

        thoughtsList.insertBefore(thoughtCard, thoughtsList.firstChild);

        // Keep only last 5 thoughts
        while (thoughtsList.children.length > 5) {
            thoughtsList.removeChild(thoughtsList.children[thoughtsList.children.length - 1]);
        }
    }, 600); // 600ms spin
}

/* =========================================
   APP LOGIC: STATS
   ========================================= */
function animateStats() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
}

function pulseCard(card) {
    card.style.transform = 'scale(1.05)';
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 200);
}

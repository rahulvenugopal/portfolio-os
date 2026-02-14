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

// Power Button Logic
document.getElementById('powerBtn')?.addEventListener('click', () => {
    // Attempt to close the window
    window.close();

    // Fallback if window.close() is blocked (which is common)
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.innerHTML = '<div style="height:100vh; display:flex; align-items:center; justify-content:center; color:white; background:black; flex-direction:column;"><h1>System Halted</h1><p>It is now safe to turn off your computer.</p></div>';
    }
});

// Initialize system status
updateTime();
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

📝 Journal Publications (n=5)

<div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
    <a href="https://www.sciencedirect.com/science/article/abs/pii/S0301051118301728" class="terminal-link" target="_blank">[1] Dissociating meditation proficiency and experience dependent EEG changes during traditional Vipassana... - Biological psychology (2018)</a>
    <a href="https://www.sciencedirect.com/science/article/abs/pii/S0002822321070231" class="terminal-link" target="_blank">[2] Beyond Hypnograms: Assessing Sleep Stability Using Acoustic and Electrical Stimulation - Neuromodulation (2019)</a>
    <a href="https://www.sciencedirect.com/science/article/abs/pii/S1094715924006731" class="terminal-link" target="_blank">[3] Personalized Theta tACS and Gamma tACS bring Differential Neuromodulatory Effects on the Resting EEG - Neuromodulation (2024)</a>
    <a href="https://www.sciencedirect.com/science/article/abs/pii/S0954611126000223" class="terminal-link" target="_blank">[4] Ultra-short term Heart Rate Variability in Moderate and Severe Obstructive Sleep Apnea - Respiratory Medicine (2026)</a>
    <a href="#" class="terminal-link" target="_blank">[5] Temporal Dynamics of EEG During Focused-Attention Meditation - Mindfulness (2026)</a>
</div>

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'preprints':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat preprints/recent.txt</span>

📋 Recent Preprints (n=11)

<div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
    <a href="https://www.biorxiv.org/content/10.1101/2022.09.27.509655v1" class="terminal-link" target="_blank">[1] Simple Neurofeedback via Machine Learning: Challenges in real time multivariate... - bioRxiv (2022)</a>
    <a href="https://doi.org/10.13140/RG.2.2.34911.43687" class="terminal-link" target="_blank">[2] Extending wireless wearable EEG device with Single Board Computer for real-time... - RG (2022)</a>
    <a href="https://doi.org/10.1101/2024.08.29.609126" class="terminal-link" target="_blank">[3] The Balanced Mind and its Intrinsic Neural Timescales in Advanced Meditators - bioRxiv (2024)</a>
    <a href="https://www.qeios.com/read/9L3L83" class="terminal-link" target="_blank">[4] Is there a direct relation between EEG band spectrum and DMN activity in fMRI? - Qeios (2025)</a>
    <a href="https://www.biorxiv.org/content/10.1101/2025.02.11.637771v1" class="terminal-link" target="_blank">[5] Time-to-onset and temporal dynamics of EEG during breath-watching meditation - bioRxiv (2025)</a>
    <a href="https://doi.org/10.1101/2024.08.29.609126" class="terminal-link" target="_blank">[6] Non-duality in Brain and Experience of Advanced Meditators - bioRxiv (2025)</a>
    <a href="https://www.biorxiv.org/content/10.1101/2025.06.20.660652v1" class="terminal-link" target="_blank">[7] Similar States, Different Paths Neurodynamics of diverse meditation techniques - bioRxiv (2025)</a>
    <a href="https://www.biorxiv.org/content/10.1101/2025.09.03.674031v1" class="terminal-link" target="_blank">[8] EEG Phase Slips Reveal Detailed Brain Activity Patterns of Novice Vipassana Meditators... - bioRxiv (2025)</a>
    <a href="https://arxiv.org/abs/2601.014241" class="terminal-link" target="_blank">[9] Unveiling the Heart-Brain Connection - An Analysis of ECG in Cognitive Performance - aRxiv (2026)</a>
    <a href="https://arxiv.org/abs/2601.06792" class="terminal-link" target="_blank">[10] Cross-Modal Computational Model of Brain-Heart Interactions via HRV and EEG Feature - aRxiv (2026)</a>
    <a href="https://arxiv.org/abs/2602.10614" class="terminal-link" target="_blank">[11] Pupillometry and Brain Dynamics for Cognitive Load in Working Memory - aRxiv (2026)</a>
</div>

<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'phd':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat phd_thesis/abstract.md</span>

🎓 PhD Thesis (2018-2024)

Title: Neural Oscillatory Dynamics and Cognition: A neurophysiological Study

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
<div class="terminal-output">
🧠 SENSE OF SELF - Research Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Exploring how the "self" emerges from neural activity and how it 
fragments or dissolves in clinical and altered states.

🎯 <strong>Key Objectives:</strong>
• Mapping the neural correlates of self-awareness
• Understanding self-fragmentation in Schizophrenia and Autism
• Investigating ego-dissolution in meditation and psychedelics

🛠️ <strong>Methodologies:</strong>
• High-density EEG (128-channel)
• Graph theory network analysis
• Phenomenological profiling
• Computational self-modeling

🔬 <strong>Significant Findings:</strong>
• Identified distinct neural signatures of self-boundary fragmentation
• Correlated interoceptive accuracy with self-coherence
• Mapped neural pathways of non-dual consciousness

📍 <strong>Future Directions:</strong>
• Developing real-time self-coherence monitoring
• Informing therapies for dissociative disorders
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'neural-oscillations':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/neural_oscillations.md</span>
<div class="terminal-output">
🌊 NEURAL OSCILLATORY DYNAMICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Deciphering how brain rhythms (Theta, Gamma) coordinate cognition, 
memory, and network communication.

🎯 <strong>Key Objectives:</strong>
• Modeling cross-frequency coupling (Theta-Gamma)
• Evaluating 1/f aperiodic activity as E/I balance markers
• Investigating network disruptions in Neuropsychiatry

🛠️ <strong>Methodologies:</strong>
• Time-frequency decomposition
• Phase-amplitude coupling (PAC)
• Dynamical systems modeling
• Power spectrum density (PSD) analysis

🔬 <strong>Significant Findings:</strong>
• Discovered reduced coupling markers in Schizophrenia
• Demonstrated capacity-dependent Theta power modulation
• linked spectral tilt to cognitive decline biomarkers

📍 <strong>Future Directions:</strong>
• Personalized oscillatory fingerprinting
• Closed-loop spectral regulation
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'meditation':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/meditation_consciousness.md</span>
<div class="terminal-output">
🧘 MEDITATION & CONSCIOUSNESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Quantifying the neural signatures of contemplative states and non-dual
awareness via long-term practitioner studies.

🎯 <strong>Key Objectives:</strong>
• Characterizing Vipassana meditation neurodynamics
• Studying the "Balanced Mind" in advanced practitioners
• Investigating age-preserved neural markers in meditators

🛠️ <strong>Methodologies:</strong>
• Non-linear EEG complexity analysis
• Permutation Entropy & Fractal Dimensions
• Intrinsic Neural Timescales analysis
• Vipassana Proficiency Scale (VPS)

🔬 <strong>Significant Findings:</strong>
• Increased neural complexity with meditative expertise
• Documented age-independent sleep spindle stability
• Differentiated states of focused vs open awareness

📍 <strong>Future Directions:</strong>
• Longitudinal tracking of meditation induction nuerodynamics
• Developing accessible neurofeedback for novices
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'sleep':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/sleep_research.md</span>
<div class="terminal-output">
😴 SLEEP NEUROSCIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Leveraging 125+ polysomnography studies to explore sleep stability, 
memory consolidation, and dream consciousness.

🎯 <strong>Key Objectives:</strong>
• Beyond Hypnograms: Quantifying sleep stability
• Decoding neural patterns of dream recall
• Investigating sleep biomarkers of cognitive decline

🛠️ <strong>Methodologies:</strong>
• Full-night Polysomnography (PSG)
• K-complex & Spindle detection algorithms
• Serial awakening dream-capture protocols
• Heart Evoked Potentials (HEP) in sleep

🔬 <strong>Significant Findings:</strong>
• Validated sleep stability makers via acoustic perturbations
• Link between spindle-slow wave coupling and memory
• Mapped microstate transitions across NREM/REM

📍 <strong>Future Directions:</strong>
• Real-time stage-specific neuromodulation
• Dream-content decoding via machine learning
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'neuromodulation':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/neuromodulation_tacs.md</span>
<div class="terminal-output">
⚡ NEUROMODULATION (tACS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Designing personalized frequency-specific brain stimulation (tACS) to 
enhance cognition and treat psychiatric symptoms.

🎯 <strong>Key Objectives:</strong>
• Personalizing Theta/Gamma tACS protocols
• Enhancing working memory in Schizophrenia
• Optimizing stimulation based on graph-theory metrics

🛠️ <strong>Methodologies:</strong>
• Multi-channel tES systems
• Peak frequency individualization
• Online/Offline stimulation effects tracking
• Personalized montage optimization

🔬 <strong>Significant Findings:</strong>
• Demonstrated differential effects of Theta vs Gamma tACS 
• identified temporal persistence of neuromodulatory after-effects
• Mapped network-wide redistribution of neural power

📍 <strong>Future Directions:</strong>
• EEG-driven closed-loop adaptive tACS
• Multi-frequency cross-modal stimulation
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'brain-heart':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/brain_heart_interaction.md</span>
<div class="terminal-output">
❤️ BRAIN-HEART INTERACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Investigating interoception—the brain's representation of internal bodily 
signals—and its role in shaping consciousness.

🎯 <strong>Key Objectives:</strong>
• Mapping Heart Evoked Potentials (HEP) across states
• Modeling Heart Rate Variability (HRV) in clinical populations
• Decoding cardiac-neural coupling dynamics

🛠️ <strong>Methodologies:</strong>
• Neurokit2 & Custom ECG pipelines
• Phase synchronization Analysis
• Multi-modal EEG-ECG integration
• Non-linear HRV metrics

🔬 <strong>Significant Findings:</strong>
• Modeled HRV biomarkers for OSA severity
• Demonstrated cardiac-phase dependent cognitive performance
• Linked brain-heart coupling to spontaneous thoughts

📍 <strong>Future Directions:</strong>
• Predictive mental-state models from cardiac signals
• Heart-brain neurofeedback for stress regulation
</div>
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span id="cursor">█</span>`;
            break;

        case 'behavioral-modeling':
            output = `
<span class="terminal-prompt">rahul@consciousness-lab:~$</span> <span class="terminal-command">cat research/behavioral_modeling.md</span>
<div class="terminal-output">
🏹 BEHAVIORAL MODELING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <strong>Overview:</strong>
Decoding the computational principles of human choice via mathematical 
models of evidence accumulation and reward learning.

🎯 <strong>Key Objectives:</strong>
• Modeling evidence accumulation (Drift Diffusion)
• Studying value-based choice in advanced meditators
• Identifying decision markers of clinical impulsivity

🛠️ <strong>Methodologies:</strong>
• Hierarchical Drift Diffusion Models (HDDM)
• Reinforcement Learning (RL) frameworks
• Bayesian Parameter Estimation
• Behavioral-EEG joint modeling

🔬 <strong>Significant Findings:</strong>
• Quantified speed-accuracy trade-off across task types
• mapped choice-fragmentation in Schizophrenia states
• Differentiated belief-updating patterns in Autism

📍 <strong>Future Directions:</strong>
• Computational psychiatry clinical diagnostics
• Modeling social decision dynamics
</div>
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
                        <div class="file-name">Journal Papers</div>
                    </div>
                    <div class="file-item" onclick="openTerminal('preprints')">
                        <div class="file-icon"><i class="ph ph-file-dashed"></i></div>
                        <div class="file-name">Preprints</div>
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
                    <div class="file-item" onclick="openResearchArea('behavioral-modeling')">
                        <div class="file-icon"><i class="ph ph-arrows-split"></i></div>
                        <div class="file-name">Behavioral Modeling</div>
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
                        <div class="file-name">CIFAR Neuroscience of Consciousness Winter School at Mexico 🇲🇽</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-globe-hemisphere-west"></i></div>
                        <div class="file-name">MESEC workshop on Non-ordinary states of consciousness, France 🇫🇷</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-medal"></i></div>
                        <div class="file-name">EMBO Summer School for Advanced Modeling of Behavior, Spain 🇪🇸</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-chart-pie-slice"></i></div>
                        <div class="file-name">Dataviz winner of Royal Belgian Society Dataviz challenge, Belgium 🇧🇪</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-pen-nib"></i></div>
                        <div class="file-name">Brain Trivia winner, Dana Foundation 🇺🇸</div>
                    </div>
                    <div class="file-item">
                        <div class="file-icon"><i class="ph ph-scroll"></i></div>
                        <div class="file-name">Full Fellowships for MPhil and PhD (Monthly Stipends) 🇮🇳</div>
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

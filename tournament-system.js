// =====================================================
// TETRIS AI TOURNAMENT SYSTEM - Genome DNA & Lineage Tracking
// =====================================================

class GenomeIdentifier {
    constructor() {
        this.genomeDatabase = new Map();
        this.loadFromStorage();
    }

    // Generate unique hash from 4 weight values
    generateHash(weights) {
        const str = `${weights.aggregateHeight.toFixed(6)}|${weights.completeLines.toFixed(6)}|${weights.holes.toFixed(6)}|${weights.bumpiness.toFixed(6)}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    }

    // Create genome ID with generation
    createGenomeId(weights, generation) {
        const hash = this.generateHash(weights);
        return `TETRIS-${hash}-${generation}`;
    }

    // Register a new genome with full metadata
    registerGenome(weights, generation, parentIds = [], mutationType = null, mutationDelta = 0) {
        const id = this.createGenomeId(weights, generation);
        
        const genome = {
            id: id,
            weights: { ...weights },
            metadata: {
                generation: generation,
                birthTimestamp: Date.now(),
                parentIds: parentIds,
                mutationType: mutationType,
                mutationDelta: mutationDelta,
                bestScore: 0,
                totalGamesPlayed: 0,
                tournamentWins: 0,
                offspring: [],
                nickname: this.generateNickname(weights)
            },
            performance: {
                avgScore: 0,
                maxLines: 0,
                avgSurvivalTime: 0,
                tournamentHistory: [],
                strategy: this.classifyStrategy(weights)
            }
        };

        this.genomeDatabase.set(id, genome);
        this.saveToStorage();
        
        // Update parent's offspring list
        parentIds.forEach(parentId => {
            const parent = this.genomeDatabase.get(parentId);
            if (parent) {
                parent.metadata.offspring.push(id);
            }
        });

        return genome;
    }

    // Classify strategy based on weight ratios
    classifyStrategy(weights) {
        const ratios = {
            heightFocus: Math.abs(weights.aggregateHeight),
            lineFocus: Math.abs(weights.completeLines),
            holeFocus: Math.abs(weights.holes),
            smoothnessFocus: Math.abs(weights.bumpiness)
        };

        const total = Object.values(ratios).reduce((a, b) => a + b, 0);
        const normalized = {};
        for (let key in ratios) {
            normalized[key] = ratios[key] / total;
        }

        // Determine primary strategy
        if (normalized.lineFocus > 0.4) {
            return "aggressive-line-clearer";
        } else if (normalized.heightFocus > 0.4) {
            return "height-manager";
        } else if (normalized.holeFocus > 0.4) {
            return "hole-avoider";
        } else if (normalized.smoothnessFocus > 0.3) {
            return "smooth-builder";
        } else {
            return "balanced";
        }
    }

    // Generate a fun nickname based on strategy
    generateNickname(weights) {
        const strategy = this.classifyStrategy(weights);
        const prefixes = {
            "aggressive-line-clearer": ["LineSlayer", "TetrisHunter", "RowReaper"],
            "height-manager": ["LowRider", "HeightHater", "GroundKeeper"],
            "hole-avoider": ["PerfectStacker", "HoleFiller", "SolidBuilder"],
            "smooth-builder": ["SmoothOperator", "FlatLiner", "LevelMaster"],
            "balanced": ["TheBalancer", "AllRounder", "Equilibrium"]
        };
        
        const options = prefixes[strategy] || prefixes["balanced"];
        const suffix = Math.floor(Math.random() * 1000);
        return `${options[Math.floor(Math.random() * options.length)]}_${suffix}`;
    }

    // Update genome performance
    updatePerformance(genomeId, gameResult) {
        const genome = this.genomeDatabase.get(genomeId);
        if (!genome) return;

        genome.metadata.totalGamesPlayed++;
        genome.metadata.bestScore = Math.max(genome.metadata.bestScore, gameResult.score);
        
        // Update running averages
        const n = genome.metadata.totalGamesPlayed;
        genome.performance.avgScore = ((n - 1) * genome.performance.avgScore + gameResult.score) / n;
        genome.performance.avgSurvivalTime = ((n - 1) * genome.performance.avgSurvivalTime + gameResult.survivalTime) / n;
        genome.performance.maxLines = Math.max(genome.performance.maxLines, gameResult.lines);

        this.saveToStorage();
    }

    // Find similar genomes (convergent evolution)
    findSimilarGenomes(weights, threshold = 0.1) {
        const similar = [];
        
        this.genomeDatabase.forEach((genome, id) => {
            let totalDiff = 0;
            for (let key in weights) {
                totalDiff += Math.abs(weights[key] - genome.weights[key]);
            }
            
            if (totalDiff < threshold && totalDiff > 0) {
                similar.push({
                    genome: genome,
                    difference: totalDiff
                });
            }
        });

        return similar.sort((a, b) => a.difference - b.difference);
    }

    // Get lineage tree for a genome
    getLineage(genomeId, depth = 3) {
        const genome = this.genomeDatabase.get(genomeId);
        if (!genome || depth <= 0) return null;

        const lineage = {
            id: genome.id,
            weights: genome.weights,
            strategy: genome.performance.strategy,
            generation: genome.metadata.generation,
            score: genome.metadata.bestScore,
            parents: []
        };

        if (genome.metadata.parentIds.length > 0) {
            genome.metadata.parentIds.forEach(parentId => {
                const parentLineage = this.getLineage(parentId, depth - 1);
                if (parentLineage) {
                    lineage.parents.push(parentLineage);
                }
            });
        }

        return lineage;
    }

    // Save to localStorage
    saveToStorage() {
        const data = Array.from(this.genomeDatabase.entries());
        localStorage.setItem('tetris_genome_database', JSON.stringify(data));
    }

    // Load from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('tetris_genome_database');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.genomeDatabase = new Map(data);
            } catch (e) {
                console.error('Failed to load genome database:', e);
            }
        }
    }
}

// =====================================================
// TOURNAMENT SUBMISSION SYSTEM
// =====================================================

class TournamentSystem {
    constructor(genomeIdentifier) {
        this.genomeIdentifier = genomeIdentifier;
        this.apiEndpoint = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api';
        this.submissionQueue = [];
        this.eliteGenomes = new Map();
        this.loadElites();
    }

    // Check if genome qualifies for tournament
    canSubmitToTournament(genome) {
        return genome.metadata.bestScore >= 100000 && 
               genome.metadata.totalGamesPlayed >= 5;
    }

    // Submit genome to tournament
    async submitToTournament(genomeId) {
        const genome = this.genomeIdentifier.genomeDatabase.get(genomeId);
        if (!genome) {
            throw new Error('Genome not found');
        }

        if (!this.canSubmitToTournament(genome)) {
            throw new Error('Genome does not meet tournament requirements');
        }

        const submission = {
            id: genome.id,
            weights: genome.weights,
            metadata: {
                generation: genome.metadata.generation,
                bestScore: genome.metadata.bestScore,
                strategy: genome.performance.strategy,
                nickname: genome.metadata.nickname,
                avgScore: genome.performance.avgScore,
                totalGamesPlayed: genome.metadata.totalGamesPlayed
            },
            submittedAt: Date.now()
        };

        try {
            const response = await fetch(`${this.apiEndpoint}/tournament/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submission)
            });

            if (!response.ok) {
                throw new Error(`Submission failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Add to tournament history
            genome.performance.tournamentHistory.push({
                tournamentId: result.tournamentId,
                submittedAt: submission.submittedAt,
                status: 'pending'
            });
            
            this.genomeIdentifier.saveToStorage();
            
            return result;
        } catch (error) {
            console.error('Tournament submission error:', error);
            
            // Fallback to local queue if server is unavailable
            this.submissionQueue.push(submission);
            this.saveQueue();
            
            return {
                status: 'queued_locally',
                message: 'Submission saved locally. Will retry when server is available.',
                queuePosition: this.submissionQueue.length
            };
        }
    }

    // Fetch elite genomes from server
    async fetchEliteGenomes() {
        try {
            const response = await fetch(`${this.apiEndpoint}/genomes/elite`);
            if (!response.ok) {
                throw new Error(`Failed to fetch elites: ${response.statusText}`);
            }

            const elites = await response.json();
            
            // Store elites locally
            elites.forEach(elite => {
                this.eliteGenomes.set(elite.id, elite);
            });
            
            this.saveElites();
            return elites;
        } catch (error) {
            console.error('Failed to fetch elite genomes:', error);
            // Return cached elites if available
            return Array.from(this.eliteGenomes.values());
        }
    }

    // Import elite genome into local population
    importEliteGenome(eliteId) {
        const elite = this.eliteGenomes.get(eliteId);
        if (!elite) {
            throw new Error('Elite genome not found');
        }

        // Register as imported genome
        const imported = this.genomeIdentifier.registerGenome(
            elite.weights,
            0, // Reset generation for imported
            [], // No local parents
            'imported',
            0
        );

        // Copy elite's metadata
        imported.metadata.nickname = `Import_${elite.metadata.nickname}`;
        imported.metadata.bestScore = elite.metadata.bestScore;
        imported.performance.strategy = elite.performance.strategy;
        
        return imported;
    }

    // Mix strategies from multiple champions
    mixStrategies(genomeIds, mixRatios = null) {
        const genomes = genomeIds.map(id => {
            const genome = this.eliteGenomes.get(id) || 
                          this.genomeIdentifier.genomeDatabase.get(id);
            if (!genome) throw new Error(`Genome ${id} not found`);
            return genome;
        });

        if (!mixRatios) {
            mixRatios = new Array(genomes.length).fill(1 / genomes.length);
        }

        const mixedWeights = {
            aggregateHeight: 0,
            completeLines: 0,
            holes: 0,
            bumpiness: 0
        };

        // Weighted average of all weights
        genomes.forEach((genome, i) => {
            for (let key in mixedWeights) {
                mixedWeights[key] += genome.weights[key] * mixRatios[i];
            }
        });

        // Create new mixed genome
        const mixed = this.genomeIdentifier.registerGenome(
            mixedWeights,
            0,
            genomeIds,
            'strategy_mix',
            0
        );

        mixed.metadata.nickname = `MixMaster_${Math.floor(Math.random() * 1000)}`;
        
        return mixed;
    }

    // Get tournament schedule
    async getTournamentSchedule() {
        try {
            const response = await fetch(`${this.apiEndpoint}/tournament/schedule`);
            if (!response.ok) {
                throw new Error(`Failed to fetch schedule: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch tournament schedule:', error);
            return {
                nextTournament: 'Server unavailable',
                frequency: 'Unknown'
            };
        }
    }

    // Get tournament results
    async getTournamentResults(tournamentId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/tournament/results/${tournamentId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch results: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch tournament results:', error);
            return null;
        }
    }

    // Retry queued submissions
    async retryQueuedSubmissions() {
        if (this.submissionQueue.length === 0) return;

        const queue = [...this.submissionQueue];
        this.submissionQueue = [];

        for (let submission of queue) {
            try {
                await this.submitToTournament(submission.id);
            } catch (error) {
                // Re-queue if still failing
                this.submissionQueue.push(submission);
            }
        }

        this.saveQueue();
    }

    // Save/Load methods
    saveElites() {
        const data = Array.from(this.eliteGenomes.entries());
        localStorage.setItem('tetris_elite_genomes', JSON.stringify(data));
    }

    loadElites() {
        const saved = localStorage.getItem('tetris_elite_genomes');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.eliteGenomes = new Map(data);
            } catch (e) {
                console.error('Failed to load elite genomes:', e);
            }
        }
    }

    saveQueue() {
        localStorage.setItem('tetris_submission_queue', JSON.stringify(this.submissionQueue));
    }

    loadQueue() {
        const saved = localStorage.getItem('tetris_submission_queue');
        if (saved) {
            try {
                this.submissionQueue = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load submission queue:', e);
            }
        }
    }
}

// =====================================================
// WEIGHT VISUALIZATION COMPONENT
// =====================================================

class WeightVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initializeUI();
    }

    initializeUI() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="weight-visualizer">
                <h3>AI Weight Configuration</h3>
                <div class="weight-bars">
                    <div class="weight-bar">
                        <label>Height Penalty</label>
                        <div class="bar-container">
                            <div class="bar height-bar" data-weight="aggregateHeight"></div>
                            <span class="value">0.000</span>
                        </div>
                    </div>
                    <div class="weight-bar">
                        <label>Line Reward</label>
                        <div class="bar-container">
                            <div class="bar lines-bar" data-weight="completeLines"></div>
                            <span class="value">0.000</span>
                        </div>
                    </div>
                    <div class="weight-bar">
                        <label>Hole Penalty</label>
                        <div class="bar-container">
                            <div class="bar holes-bar" data-weight="holes"></div>
                            <span class="value">0.000</span>
                        </div>
                    </div>
                    <div class="weight-bar">
                        <label>Bumpiness Penalty</label>
                        <div class="bar-container">
                            <div class="bar bumpiness-bar" data-weight="bumpiness"></div>
                            <span class="value">0.000</span>
                        </div>
                    </div>
                </div>
                <div class="strategy-display">
                    <h4>Strategy Type: <span id="strategy-type">Unknown</span></h4>
                    <p id="strategy-description"></p>
                </div>
                <div class="genome-info">
                    <p>Genome ID: <span id="genome-id">Not Generated</span></p>
                    <p>Generation: <span id="generation">0</span></p>
                    <p>Best Score: <span id="best-score">0</span></p>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('weight-visualizer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'weight-visualizer-styles';
        style.textContent = `
            .weight-visualizer {
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #0ff;
                border-radius: 10px;
                padding: 15px;
                color: white;
                font-family: monospace;
                margin: 10px 0;
            }
            
            .weight-bars {
                margin: 20px 0;
            }
            
            .weight-bar {
                margin: 10px 0;
            }
            
            .weight-bar label {
                display: inline-block;
                width: 150px;
                color: #0ff;
            }
            
            .bar-container {
                display: inline-block;
                width: 200px;
                height: 20px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #0ff;
                position: relative;
                vertical-align: middle;
                margin: 0 10px;
            }
            
            .bar {
                height: 100%;
                transition: width 0.3s ease;
                position: absolute;
            }
            
            .height-bar { background: linear-gradient(90deg, #ff0000, #ff6600); }
            .lines-bar { background: linear-gradient(90deg, #00ff00, #00ff88); }
            .holes-bar { background: linear-gradient(90deg, #ff00ff, #ff66ff); }
            .bumpiness-bar { background: linear-gradient(90deg, #ffff00, #ffff66); }
            
            .bar-container .value {
                position: absolute;
                right: -50px;
                top: 0;
                color: #0ff;
            }
            
            .strategy-display {
                background: rgba(0, 255, 255, 0.1);
                padding: 10px;
                border-radius: 5px;
                margin: 15px 0;
            }
            
            .strategy-display h4 {
                margin: 0 0 5px 0;
                color: #0ff;
            }
            
            #strategy-type {
                color: #00ff00;
                font-weight: bold;
            }
            
            .genome-info {
                font-size: 12px;
                color: #888;
                margin-top: 10px;
            }
            
            .genome-info span {
                color: #0ff;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    updateWeights(weights, genome = null) {
        // Update bar widths
        for (let key in weights) {
            const bar = this.container.querySelector(`[data-weight="${key}"]`);
            const value = this.container.querySelector(`[data-weight="${key}"]`)
                ?.parentElement?.querySelector('.value');
            
            if (bar && value) {
                const normalizedValue = Math.abs(weights[key]);
                const maxValue = 1.0;
                const percentage = Math.min(100, (normalizedValue / maxValue) * 100);
                
                bar.style.width = `${percentage}%`;
                value.textContent = weights[key].toFixed(3);
                
                // Color code based on positive/negative
                if (weights[key] < 0) {
                    bar.style.opacity = '0.7';
                }
            }
        }

        // Update genome info if provided
        if (genome) {
            document.getElementById('genome-id').textContent = genome.id || 'Not Generated';
            document.getElementById('generation').textContent = genome.metadata?.generation || 0;
            document.getElementById('best-score').textContent = genome.metadata?.bestScore || 0;
            document.getElementById('strategy-type').textContent = genome.performance?.strategy || 'Unknown';
            
            // Add strategy description
            const descriptions = {
                'aggressive-line-clearer': 'Focuses on clearing lines quickly, accepting higher stacks',
                'height-manager': 'Keeps the stack low at all costs, conservative placement',
                'hole-avoider': 'Prioritizes clean stacking without gaps',
                'smooth-builder': 'Maintains flat, even surfaces for easy recovery',
                'balanced': 'Balanced approach across all metrics'
            };
            
            document.getElementById('strategy-description').textContent = 
                descriptions[genome.performance?.strategy] || 'Strategy analysis pending...';
        }
    }
}

// =====================================================
// TOURNAMENT UI COMPONENT
// =====================================================

class TournamentUI {
    constructor(genomeIdentifier, tournamentSystem) {
        this.genomeIdentifier = genomeIdentifier;
        this.tournamentSystem = tournamentSystem;
        this.initializeUI();
    }

    initializeUI() {
        // Add tournament panel to page
        const panel = document.createElement('div');
        panel.id = 'tournament-panel';
        panel.className = 'tournament-panel';
        panel.innerHTML = `
            <div class="tournament-header">
                <h2>🏆 Tournament System</h2>
                <button id="close-tournament" class="close-btn">×</button>
            </div>
            
            <div class="tournament-tabs">
                <button class="tab-btn active" data-tab="submit">Submit</button>
                <button class="tab-btn" data-tab="champions">Champions</button>
                <button class="tab-btn" data-tab="lineage">Lineage</button>
                <button class="tab-btn" data-tab="schedule">Schedule</button>
            </div>
            
            <div class="tab-content" id="submit-tab">
                <h3>Submit to Tournament</h3>
                <div id="eligible-genomes"></div>
                <button id="submit-best" class="action-btn">Submit Best Genome</button>
                <div id="submission-status"></div>
            </div>
            
            <div class="tab-content" id="champions-tab" style="display:none;">
                <h3>Elite Champions</h3>
                <button id="fetch-elites" class="action-btn">Refresh Champions</button>
                <div id="elite-list"></div>
                <div class="strategy-mixer">
                    <h4>Strategy Mixer</h4>
                    <div id="mix-selection"></div>
                    <button id="mix-strategies" class="action-btn">Create Mix</button>
                </div>
            </div>
            
            <div class="tab-content" id="lineage-tab" style="display:none;">
                <h3>Genome Lineage</h3>
                <select id="genome-selector"></select>
                <div id="lineage-tree"></div>
                <div id="convergent-evolution"></div>
            </div>
            
            <div class="tab-content" id="schedule-tab" style="display:none;">
                <h3>Tournament Schedule</h3>
                <div id="schedule-info"></div>
                <h3>Recent Results</h3>
                <div id="recent-results"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.addStyles();
        this.attachEventListeners();
        this.updateEligibleGenomes();
    }

    addStyles() {
        if (document.getElementById('tournament-ui-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tournament-ui-styles';
        style.textContent = `
            .tournament-panel {
                position: fixed;
                right: -400px;
                top: 50%;
                transform: translateY(-50%);
                width: 380px;
                max-height: 80vh;
                background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
                border: 2px solid #0ff;
                border-radius: 15px;
                color: white;
                font-family: 'Courier New', monospace;
                z-index: 10000;
                transition: right 0.3s ease;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
            }
            
            .tournament-panel.open {
                right: 20px;
            }
            
            .tournament-header {
                background: linear-gradient(90deg, #0ff, #00f);
                padding: 15px;
                border-radius: 13px 13px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .tournament-header h2 {
                margin: 0;
                color: #000;
                font-size: 20px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #000;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .tournament-tabs {
                display: flex;
                background: rgba(0, 255, 255, 0.1);
                padding: 5px;
            }
            
            .tab-btn {
                flex: 1;
                padding: 8px;
                background: none;
                border: 1px solid transparent;
                color: #0ff;
                cursor: pointer;
                transition: all 0.3s;
                font-family: inherit;
            }
            
            .tab-btn:hover {
                background: rgba(0, 255, 255, 0.2);
            }
            
            .tab-btn.active {
                background: rgba(0, 255, 255, 0.3);
                border-color: #0ff;
            }
            
            .tab-content {
                padding: 20px;
            }
            
            .action-btn {
                background: linear-gradient(90deg, #00ff00, #00ff88);
                color: #000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin: 10px 0;
                width: 100%;
                transition: all 0.3s;
            }
            
            .action-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
            }
            
            .action-btn:disabled {
                background: #555;
                color: #999;
                cursor: not-allowed;
                transform: none;
            }
            
            .genome-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid #0ff;
                border-radius: 8px;
                padding: 10px;
                margin: 10px 0;
                transition: all 0.3s;
            }
            
            .genome-card:hover {
                background: rgba(0, 255, 255, 0.1);
                transform: translateX(5px);
            }
            
            .genome-card h4 {
                margin: 0 0 5px 0;
                color: #0ff;
            }
            
            .genome-card .stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                font-size: 12px;
            }
            
            .genome-card .strategy {
                color: #00ff00;
                font-weight: bold;
                margin-top: 5px;
            }
            
            .lineage-node {
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid #0ff;
                border-radius: 5px;
                padding: 8px;
                margin: 5px;
                font-size: 11px;
            }
            
            .lineage-connector {
                width: 2px;
                height: 20px;
                background: #0ff;
                margin: 0 auto;
            }
            
            #submission-status {
                margin-top: 15px;
                padding: 10px;
                border-radius: 5px;
                text-align: center;
                font-weight: bold;
            }
            
            #submission-status.success {
                background: rgba(0, 255, 0, 0.2);
                border: 1px solid #0f0;
                color: #0f0;
            }
            
            #submission-status.error {
                background: rgba(255, 0, 0, 0.2);
                border: 1px solid #f00;
                color: #f00;
            }
            
            #submission-status.pending {
                background: rgba(255, 255, 0, 0.2);
                border: 1px solid #ff0;
                color: #ff0;
            }
            
            .toggle-tournament-btn {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #0ff, #00f);
                color: #000;
                border: none;
                padding: 10px;
                border-radius: 10px 0 0 10px;
                cursor: pointer;
                font-weight: bold;
                z-index: 9999;
                transition: all 0.3s;
                writing-mode: vertical-rl;
                text-orientation: mixed;
            }
            
            .toggle-tournament-btn:hover {
                padding-right: 15px;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }
        `;
        document.head.appendChild(style);

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-tournament-btn';
        toggleBtn.textContent = 'TOURNAMENT';
        toggleBtn.onclick = () => this.togglePanel();
        document.body.appendChild(toggleBtn);
    }

    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                
                e.target.classList.add('active');
                const tabId = e.target.dataset.tab + '-tab';
                document.getElementById(tabId).style.display = 'block';
            });
        });

        // Close button
        document.getElementById('close-tournament').addEventListener('click', () => {
            this.togglePanel();
        });

        // Submit best genome
        document.getElementById('submit-best').addEventListener('click', () => {
            this.submitBestGenome();
        });

        // Fetch elites
        document.getElementById('fetch-elites').addEventListener('click', () => {
            this.fetchAndDisplayElites();
        });

        // Mix strategies
        document.getElementById('mix-strategies').addEventListener('click', () => {
            this.mixSelectedStrategies();
        });

        // Genome selector for lineage
        document.getElementById('genome-selector').addEventListener('change', (e) => {
            this.displayLineage(e.target.value);
        });
    }

    togglePanel() {
        const panel = document.getElementById('tournament-panel');
        panel.classList.toggle('open');
    }

    updateEligibleGenomes() {
        const eligibleContainer = document.getElementById('eligible-genomes');
        const genomes = Array.from(this.genomeIdentifier.genomeDatabase.values())
            .filter(g => this.tournamentSystem.canSubmitToTournament(g))
            .sort((a, b) => b.metadata.bestScore - a.metadata.bestScore);

        if (genomes.length === 0) {
            eligibleContainer.innerHTML = '<p>No genomes qualify yet. Score 100,000+ points!</p>';
            document.getElementById('submit-best').disabled = true;
        } else {
            eligibleContainer.innerHTML = genomes.slice(0, 3).map(g => `
                <div class="genome-card">
                    <h4>${g.metadata.nickname}</h4>
                    <div class="stats">
                        <span>Score: ${g.metadata.bestScore}</span>
                        <span>Gen: ${g.metadata.generation}</span>
                        <span>Games: ${g.metadata.totalGamesPlayed}</span>
                        <span>Avg: ${Math.round(g.performance.avgScore)}</span>
                    </div>
                    <div class="strategy">${g.performance.strategy}</div>
                </div>
            `).join('');
            document.getElementById('submit-best').disabled = false;
        }

        // Update genome selector
        const selector = document.getElementById('genome-selector');
        selector.innerHTML = '<option value="">Select a genome...</option>' +
            genomes.map(g => `<option value="${g.id}">${g.metadata.nickname} (Gen ${g.metadata.generation})</option>`).join('');
    }

    async submitBestGenome() {
        const genomes = Array.from(this.genomeIdentifier.genomeDatabase.values())
            .filter(g => this.tournamentSystem.canSubmitToTournament(g))
            .sort((a, b) => b.metadata.bestScore - a.metadata.bestScore);

        if (genomes.length === 0) return;

        const best = genomes[0];
        const statusDiv = document.getElementById('submission-status');
        
        statusDiv.className = 'pending';
        statusDiv.textContent = 'Submitting genome...';

        try {
            const result = await this.tournamentSystem.submitToTournament(best.id);
            
            if (result.status === 'queued_locally') {
                statusDiv.className = 'pending';
                statusDiv.textContent = result.message;
            } else {
                statusDiv.className = 'success';
                statusDiv.textContent = `Submitted! Tournament ID: ${result.tournamentId}`;
            }
        } catch (error) {
            statusDiv.className = 'error';
            statusDiv.textContent = `Error: ${error.message}`;
        }
    }

    async fetchAndDisplayElites() {
        const elites = await this.tournamentSystem.fetchEliteGenomes();
        const container = document.getElementById('elite-list');
        
        if (elites.length === 0) {
            container.innerHTML = '<p>No elite genomes available yet.</p>';
        } else {
            container.innerHTML = elites.slice(0, 5).map(elite => `
                <div class="genome-card">
                    <h4>${elite.metadata.nickname}</h4>
                    <div class="stats">
                        <span>Score: ${elite.metadata.bestScore}</span>
                        <span>Wins: ${elite.metadata.tournamentWins}</span>
                    </div>
                    <div class="strategy">${elite.performance.strategy}</div>
                    <button class="action-btn" onclick="tournamentUI.importElite('${elite.id}')">
                        Import to Local
                    </button>
                </div>
            `).join('');
        }

        // Update mix selection
        const mixContainer = document.getElementById('mix-selection');
        mixContainer.innerHTML = elites.slice(0, 5).map(elite => `
            <label>
                <input type="checkbox" value="${elite.id}">
                ${elite.metadata.nickname}
            </label><br>
        `).join('');
    }

    importElite(eliteId) {
        try {
            const imported = this.tournamentSystem.importEliteGenome(eliteId);
            alert(`Successfully imported ${imported.metadata.nickname}!`);
            this.updateEligibleGenomes();
        } catch (error) {
            alert(`Failed to import: ${error.message}`);
        }
    }

    mixSelectedStrategies() {
        const checkboxes = document.querySelectorAll('#mix-selection input:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedIds.length < 2) {
            alert('Select at least 2 genomes to mix!');
            return;
        }

        try {
            const mixed = this.tournamentSystem.mixStrategies(selectedIds);
            alert(`Created mixed genome: ${mixed.metadata.nickname}`);
            this.updateEligibleGenomes();
        } catch (error) {
            alert(`Failed to mix strategies: ${error.message}`);
        }
    }

    displayLineage(genomeId) {
        if (!genomeId) return;
        
        const lineage = this.genomeIdentifier.getLineage(genomeId, 3);
        const container = document.getElementById('lineage-tree');
        
        if (!lineage) {
            container.innerHTML = '<p>No lineage data available.</p>';
            return;
        }

        container.innerHTML = this.renderLineageNode(lineage);

        // Also show convergent evolution
        const genome = this.genomeIdentifier.genomeDatabase.get(genomeId);
        if (genome) {
            const similar = this.genomeIdentifier.findSimilarGenomes(genome.weights, 0.2);
            const convergentContainer = document.getElementById('convergent-evolution');
            
            if (similar.length > 0) {
                convergentContainer.innerHTML = '<h4>Convergent Evolution</h4>' +
                    '<p>Similar genomes from different lineages:</p>' +
                    similar.slice(0, 3).map(s => `
                        <div class="genome-card">
                            <h5>${s.genome.metadata.nickname}</h5>
                            <span>Difference: ${s.difference.toFixed(4)}</span>
                        </div>
                    `).join('');
            } else {
                convergentContainer.innerHTML = '';
            }
        }
    }

    renderLineageNode(node) {
        let html = `
            <div class="lineage-node">
                <strong>${node.id}</strong><br>
                Gen ${node.generation} | Score: ${node.score}<br>
                Strategy: ${node.strategy}
            </div>
        `;
        
        if (node.parents && node.parents.length > 0) {
            html += '<div class="lineage-connector"></div>';
            html += '<div style="display: flex; justify-content: space-around;">';
            node.parents.forEach(parent => {
                html += '<div>' + this.renderLineageNode(parent) + '</div>';
            });
            html += '</div>';
        }
        
        return html;
    }
}

// Export for use in main game
window.TetrisTournament = {
    GenomeIdentifier,
    TournamentSystem,
    WeightVisualizer,
    TournamentUI
};

// =====================================================
// TOURNAMENT SYSTEM INTEGRATION FOR EXISTING TETRIS GAME
// =====================================================
// This file integrates the tournament system with the existing Tetris game
// Add this script to index.html to enable tournament features

(function() {
    // Wait for the game to load
    window.addEventListener('load', function() {
        console.log('Initializing Tetris Tournament System...');
        
        // =====================================================
        // GENOME TRACKING INTEGRATION
        // =====================================================
        
        let genomeIdentifier = null;
        let tournamentSystem = null;
        let weightVisualizer = null;
        let tournamentUI = null;
        let currentGeneration = 0;
        let genomeHistory = new Map();
        
        // Initialize tournament systems
        function initializeTournamentSystem() {
            genomeIdentifier = new TetrisTournament.GenomeIdentifier();
            tournamentSystem = new TetrisTournament.TournamentSystem(genomeIdentifier);
            
            // Create weight visualizer container
            const vizContainer = document.createElement('div');
            vizContainer.id = 'weight-visualizer-container';
            vizContainer.style.position = 'fixed';
            vizContainer.style.bottom = '20px';
            vizContainer.style.left = '20px';
            vizContainer.style.zIndex = '9998';
            document.body.appendChild(vizContainer);
            
            weightVisualizer = new TetrisTournament.WeightVisualizer('weight-visualizer-container');
            tournamentUI = new TetrisTournament.TournamentUI(genomeIdentifier, tournamentSystem);
            
            console.log('Tournament system initialized');
        }
        
        // Hook into existing genetic algorithm functions
        const originalSaveAIWeights = window.saveAIWeights;
        const originalLoadAIWeights = window.loadAIWeights;
        const originalMutateWeights = window.mutateWeights;
        const originalCrossoverWeights = window.crossoverWeights;
        
        // Override save function to track genomes
        window.saveAIWeights = function(state) {
            // Call original save
            if (originalSaveAIWeights) {
                originalSaveAIWeights(state);
            }
            
            // Track genomes in tournament system
            if (genomeIdentifier && state.population) {
                state.population.forEach(genome => {
                    // Ensure genome is registered and get its persistent ID
                    let registeredId = genomeHistory.get(genome.id);
                    if (!registeredId) {
                        const parentIds = genome.parentIds || [];
                        const registered = genomeIdentifier.registerGenome(
                            genome.weights || genome,
                            currentGeneration,
                            parentIds,
                            genome.mutationType,
                            genome.mutationDelta || 0
                        );
                        registeredId = registered.id;
                        genomeHistory.set(genome.id, registeredId);
                    }

                    // Always update performance if we have fitness data
                    if (genome.fitness > 0) {
                        genomeIdentifier.updatePerformance(registeredId, {
                            score: genome.fitness,
                            lines: genome.lines || 0,
                            survivalTime: genome.survivalTime || 0
                        });
                    }
                });
                
                currentGeneration++;
            }
        };
        
        // Override load function to restore genome tracking
        window.loadAIWeights = function() {
            const result = originalLoadAIWeights ? originalLoadAIWeights() : null;
            
            if (result && result.population && genomeIdentifier) {
                // Restore genome tracking for loaded population
                result.population.forEach(genome => {
                    if (!genomeHistory.has(genome.id)) {
                        const registered = genomeIdentifier.registerGenome(
                            genome.weights || genome,
                            currentGeneration,
                            [],
                            'loaded',
                            0
                        );
                        genomeHistory.set(genome.id, registered.id);
                    }
                });
            }
            
            return result;
        };
        
        // Override mutate function to track mutations
        window.mutateWeights = function(base, strength) {
            const mutated = originalMutateWeights ? originalMutateWeights(base, strength) : base;
            
            // Track which weight was mutated
            let maxDelta = 0;
            let mutationType = null;
            
            for (let key in base) {
                const delta = Math.abs(mutated[key] - base[key]);
                if (delta > maxDelta) {
                    maxDelta = delta;
                    mutationType = key;
                }
            }
            
            // Store mutation info
            mutated.mutationType = mutationType;
            mutated.mutationDelta = maxDelta;
            
            return mutated;
        };
        
        // Override crossover function to track parents
        window.crossoverWeights = function(a, b) {
            const child = originalCrossoverWeights ? originalCrossoverWeights(a, b) : a;
            
            // Track parent IDs
            child.parentIds = [];
            if (genomeHistory.has(a.id)) {
                child.parentIds.push(genomeHistory.get(a.id));
            }
            if (genomeHistory.has(b.id)) {
                child.parentIds.push(genomeHistory.get(b.id));
            }
            
            return child;
        };
        
        // =====================================================
        // GAME STATE MONITORING
        // =====================================================
        
        let activeGenomes = new Map();
        let gameStats = new Map();
        
        // Monitor game updates
        function monitorGameState() {
            // Hook into game loop if available
            const originalGameTick = window.gameTick || window.update || window.gameLoop;
            
            if (originalGameTick) {
                const wrappedTick = function() {
                    originalGameTick.apply(this, arguments);
                    updateTournamentDisplay();
                };
                
                if (window.gameTick) window.gameTick = wrappedTick;
                if (window.update) window.update = wrappedTick;
                if (window.gameLoop) window.gameLoop = wrappedTick;
            }
            
            // Monitor score changes
            setInterval(checkScoreUpdates, 1000);
        }
        
        // Check for score updates and track performance
        function checkScoreUpdates() {
            // Look for score elements in the DOM
            const scoreElements = document.querySelectorAll('[id*="score"], .score');
            
            scoreElements.forEach((elem, index) => {
                const score = parseInt(elem.textContent) || 0;
                const playerId = `player_${index}`;
                
                if (score > 0) {
                    if (!gameStats.has(playerId)) {
                        gameStats.set(playerId, {
                            maxScore: 0,
                            totalGames: 0,
                            currentScore: 0
                        });
                    }
                    
                    const stats = gameStats.get(playerId);
                    
                    if (score < stats.currentScore) {
                        // New game started
                        stats.totalGames++;
                    }
                    
                    stats.currentScore = score;
                    stats.maxScore = Math.max(stats.maxScore, score);
                    
                    // Check if eligible for tournament
                    if (stats.maxScore >= 100000) {
                        enableTournamentSubmission(playerId, stats);
                    }
                }
            });
        }
        
        // Update tournament display with current genome info
        function updateTournamentDisplay() {
            if (!weightVisualizer) return;
            
            // Get current weights from game state
            const aiState = window.AI_STATE || {};
            const population = aiState.population || [];
            
            if (population.length > 0) {
                // Display best genome
                const best = population.reduce((a, b) => 
                    (a.fitness || 0) > (b.fitness || 0) ? a : b
                );
                
                if (best && best.weights) {
                    const genomeId = genomeHistory.get(best.id);
                    const genome = genomeId ? genomeIdentifier.genomeDatabase.get(genomeId) : null;
                    
                    weightVisualizer.updateWeights(best.weights, genome);
                }
            }
        }
        
        // Enable tournament submission when threshold is reached
        function enableTournamentSubmission(playerId, stats) {
            // Show notification
            if (!document.getElementById('tournament-notification')) {
                const notification = document.createElement('div');
                notification.id = 'tournament-notification';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #00ff00, #00ff88);
                    color: #000;
                    padding: 15px 20px;
                    border-radius: 10px;
                    font-weight: bold;
                    z-index: 10001;
                    cursor: pointer;
                    animation: pulse 2s infinite;
                `;
                notification.innerHTML = `
                    🏆 Your AI qualifies for tournaments!<br>
                    Score: ${stats.maxScore}<br>
                    Click to submit →
                `;
                notification.onclick = () => {
                    if (tournamentUI) {
                        tournamentUI.togglePanel();
                        tournamentUI.updateEligibleGenomes();
                    }
                    notification.remove();
                };
                
                document.body.appendChild(notification);
                
                // Add pulse animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // =====================================================
        // ELITE GENOME IMPORT
        // =====================================================
        
        // Add import elite button to game menu
        function addEliteImportButton() {
            const menu = document.querySelector('.menu, #menu, [class*="menu"]');
            
            if (menu) {
                const importBtn = document.createElement('button');
                importBtn.className = 'menuButton';
                importBtn.style.cssText = `
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #000;
                    margin: 10px;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                `;
                importBtn.textContent = '⚡ Import Elite AI';
                importBtn.onclick = async () => {
                    await importEliteGenome();
                };
                
                menu.appendChild(importBtn);
            }
        }
        
        // Import an elite genome into the game
        async function importEliteGenome() {
            if (!tournamentSystem) {
                alert('Tournament system not initialized');
                return;
            }
            
            try {
                // Fetch elite genomes
                const elites = await tournamentSystem.fetchEliteGenomes();
                
                if (elites.length === 0) {
                    alert('No elite genomes available yet');
                    return;
                }
                
                // Show selection dialog
                const elite = elites[0]; // Use best elite for now
                const imported = tournamentSystem.importEliteGenome(elite.id);
                
                // Add to current population
                if (window.AI_STATE && window.AI_STATE.population) {
                    window.AI_STATE.population.push({
                        id: imported.id,
                        weights: imported.weights,
                        fitness: 0,
                        evaluated: false
                    });
                    
                    // Save updated population
                    window.saveAIWeights(window.AI_STATE);
                    
                    alert(`Imported elite AI: ${imported.metadata.nickname}\nStrategy: ${imported.performance.strategy}`);
                }
            } catch (error) {
                console.error('Failed to import elite:', error);
                alert('Failed to import elite genome. Server may be offline.');
            }
        }
        
        // =====================================================
        // KEYBOARD SHORTCUTS
        // =====================================================
        
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + T: Toggle tournament panel
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                if (tournamentUI) {
                    tournamentUI.togglePanel();
                }
            }
            
            // Ctrl/Cmd + W: Toggle weight visualizer
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                const viz = document.getElementById('weight-visualizer-container');
                if (viz) {
                    viz.style.display = viz.style.display === 'none' ? 'block' : 'none';
                }
            }
            
            // Ctrl/Cmd + S: Submit to tournament
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (tournamentUI) {
                    tournamentUI.submitBestGenome();
                }
            }
        });
        
        // =====================================================
        // AUTO-SYNC WITH SERVER
        // =====================================================
        
        let autoSyncInterval = null;
        
        function startAutoSync(intervalMinutes = 5) {
            if (autoSyncInterval) {
                clearInterval(autoSyncInterval);
            }
            
            autoSyncInterval = setInterval(async () => {
                // Retry queued submissions
                if (tournamentSystem) {
                    await tournamentSystem.retryQueuedSubmissions();
                }
                
                // Fetch latest elites
                if (tournamentSystem) {
                    await tournamentSystem.fetchEliteGenomes();
                }
                
                // Update UI
                if (tournamentUI) {
                    tournamentUI.updateEligibleGenomes();
                }
            }, intervalMinutes * 60 * 1000);
        }
        
        // =====================================================
        // CONVERGENCE ANALYSIS
        // =====================================================
        
        function analyzeConvergence() {
            if (!genomeIdentifier) return;
            
            const allGenomes = Array.from(genomeIdentifier.genomeDatabase.values());
            
            // Group by generation
            const generationGroups = {};
            allGenomes.forEach(genome => {
                const gen = genome.metadata.generation;
                if (!generationGroups[gen]) {
                    generationGroups[gen] = [];
                }
                generationGroups[gen].push(genome);
            });
            
            // Analyze weight convergence over generations
            const convergenceData = [];
            Object.entries(generationGroups).forEach(([gen, genomes]) => {
                const avgWeights = {
                    aggregateHeight: 0,
                    completeLines: 0,
                    holes: 0,
                    bumpiness: 0
                };
                
                genomes.forEach(genome => {
                    for (let key in avgWeights) {
                        avgWeights[key] += genome.weights[key] || 0;
                    }
                });
                
                for (let key in avgWeights) {
                    avgWeights[key] /= genomes.length;
                }
                
                convergenceData.push({
                    generation: parseInt(gen),
                    weights: avgWeights,
                    diversity: calculateDiversity(genomes)
                });
            });
            
            return convergenceData;
        }
        
        function calculateDiversity(genomes) {
            if (genomes.length < 2) return 0;
            
            let totalDistance = 0;
            let comparisons = 0;
            
            for (let i = 0; i < genomes.length - 1; i++) {
                for (let j = i + 1; j < genomes.length; j++) {
                    const w1 = genomes[i].weights;
                    const w2 = genomes[j].weights;
                    
                    let distance = 0;
                    for (let key in w1) {
                        distance += Math.abs((w1[key] || 0) - (w2[key] || 0));
                    }
                    
                    totalDistance += distance;
                    comparisons++;
                }
            }
            
            return totalDistance / comparisons;
        }
        
        // =====================================================
        // PERFORMANCE ANALYTICS
        // =====================================================
        
        function generatePerformanceReport() {
            if (!genomeIdentifier) return null;
            
            const allGenomes = Array.from(genomeIdentifier.genomeDatabase.values());
            const strategies = {};
            
            // Analyze by strategy
            allGenomes.forEach(genome => {
                const strategy = genome.performance.strategy;
                if (!strategies[strategy]) {
                    strategies[strategy] = {
                        count: 0,
                        totalScore: 0,
                        maxScore: 0,
                        avgWeights: {
                            aggregateHeight: 0,
                            completeLines: 0,
                            holes: 0,
                            bumpiness: 0
                        }
                    };
                }
                
                const s = strategies[strategy];
                s.count++;
                s.totalScore += genome.metadata.bestScore;
                s.maxScore = Math.max(s.maxScore, genome.metadata.bestScore);
                
                for (let key in s.avgWeights) {
                    s.avgWeights[key] += genome.weights[key] || 0;
                }
            });
            
            // Calculate averages
            Object.values(strategies).forEach(s => {
                s.avgScore = s.totalScore / s.count;
                for (let key in s.avgWeights) {
                    s.avgWeights[key] /= s.count;
                }
            });
            
            return {
                totalGenomes: allGenomes.length,
                generations: currentGeneration,
                strategies: strategies,
                convergence: analyzeConvergence()
            };
        }
        
        // =====================================================
        // INITIALIZATION
        // =====================================================
        
        // Initialize all systems
        initializeTournamentSystem();
        monitorGameState();
        addEliteImportButton();
        startAutoSync(5);
        
        // Expose API for debugging
        window.TetrisTournamentAPI = {
            genomeIdentifier,
            tournamentSystem,
            weightVisualizer,
            tournamentUI,
            getReport: generatePerformanceReport,
            analyzeConvergence,
            submitBest: () => tournamentUI && tournamentUI.submitBestGenome()
        };
        
        console.log('Tetris Tournament System fully integrated!');
        console.log('Press Ctrl+T to open tournament panel');
        console.log('Press Ctrl+W to toggle weight visualizer');
        console.log('Press Ctrl+S to submit to tournament');
    });
})();

// =====================================================
// TETRIS AI TOURNAMENT BACKEND SERVER
// =====================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const seedrandom = require('seedrandom');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'tournament.db');
const db = new sqlite3.Database(dbPath);

// =====================================================
// DATABASE INITIALIZATION
// =====================================================

function initDatabase() {
    db.serialize(() => {
        // Genomes table - stores all submitted genomes
        db.run(`
            CREATE TABLE IF NOT EXISTS genomes (
                id TEXT PRIMARY KEY,
                aggregate_height REAL NOT NULL,
                complete_lines REAL NOT NULL,
                holes REAL NOT NULL,
                bumpiness REAL NOT NULL,
                generation INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                parent_ids TEXT,
                best_score INTEGER,
                avg_score REAL,
                total_games INTEGER DEFAULT 0,
                tournament_wins INTEGER DEFAULT 0,
                strategy_type TEXT,
                nickname TEXT,
                metadata TEXT
            )
        `);

        // Tournaments table
        db.run(`
            CREATE TABLE IF NOT EXISTS tournaments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                status TEXT DEFAULT 'pending',
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                seed INTEGER,
                config TEXT,
                winner_id TEXT,
                total_participants INTEGER DEFAULT 0
            )
        `);

        // Tournament entries table
        db.run(`
            CREATE TABLE IF NOT EXISTS tournament_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tournament_id INTEGER,
                genome_id TEXT,
                submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                avg_score REAL,
                max_score INTEGER,
                total_lines INTEGER,
                games_played INTEGER,
                rank INTEGER,
                detailed_results TEXT,
                FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
                FOREIGN KEY (genome_id) REFERENCES genomes(id)
            )
        `);

        // Elite genomes table - top performers
        db.run(`
            CREATE TABLE IF NOT EXISTS elite_genomes (
                genome_id TEXT PRIMARY KEY,
                elite_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_tournament_wins INTEGER DEFAULT 0,
                avg_tournament_score REAL,
                dominance_score REAL,
                FOREIGN KEY (genome_id) REFERENCES genomes(id)
            )
        `);

        // Strategy statistics table
        db.run(`
            CREATE TABLE IF NOT EXISTS strategy_stats (
                strategy_type TEXT PRIMARY KEY,
                total_genomes INTEGER DEFAULT 0,
                avg_score REAL,
                best_score INTEGER,
                tournament_wins INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized successfully');
    });
}

// =====================================================
// TOURNAMENT ENGINE
// =====================================================

class TournamentEngine {
    constructor() {
        this.runningTournament = null;
        this.tournamentInterval = null;
    }

    // Start automated tournaments
    startScheduledTournaments(intervalMinutes = 60) {
        // Run a tournament immediately
        this.runTournament();
        
        // Schedule future tournaments
        this.tournamentInterval = setInterval(() => {
            this.runTournament();
        }, intervalMinutes * 60 * 1000);
    }

    // Run a single tournament
    async runTournament() {
        if (this.runningTournament) {
            console.log('Tournament already in progress');
            return;
        }

        return new Promise((resolve, reject) => {
            // Get pending entries
            db.all(`
                SELECT DISTINCT g.* 
                FROM genomes g
                WHERE g.id NOT IN (
                    SELECT genome_id FROM tournament_entries 
                    WHERE tournament_id IN (
                        SELECT id FROM tournaments WHERE status = 'completed'
                    )
                )
                ORDER BY g.best_score DESC
                LIMIT 50
            `, (err, genomes) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (genomes.length < 2) {
                    console.log('Not enough genomes for tournament');
                    resolve(null);
                    return;
                }

                // Create tournament
                const seed = Math.floor(Math.random() * 1000000);
                const config = {
                    gamesPerGenome: 10,
                    maxPieces: 2000,
                    boardWidth: 10,
                    boardHeight: 20,
                    pieceTypes: 7
                };

                db.run(`
                    INSERT INTO tournaments (status, started_at, seed, config, total_participants)
                    VALUES ('running', datetime('now'), ?, ?, ?)
                `, [seed, JSON.stringify(config), genomes.length], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const tournamentId = this.lastID;
                    console.log(`Starting tournament ${tournamentId} with ${genomes.length} participants`);

                    // Run tournament games
                    const results = [];
                    genomes.forEach(genome => {
                        const genomeResults = simulateTetrisGames(genome, config, seed);
                        results.push({
                            genome: genome,
                            results: genomeResults
                        });

                        // Insert entry
                        db.run(`
                            INSERT INTO tournament_entries 
                            (tournament_id, genome_id, avg_score, max_score, total_lines, games_played, detailed_results)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [
                            tournamentId,
                            genome.id,
                            genomeResults.avgScore,
                            genomeResults.maxScore,
                            genomeResults.totalLines,
                            config.gamesPerGenome,
                            JSON.stringify(genomeResults.games)
                        ]);
                    });

                    // Rank participants
                    results.sort((a, b) => b.results.avgScore - a.results.avgScore);
                    results.forEach((result, index) => {
                        db.run(`
                            UPDATE tournament_entries 
                            SET rank = ? 
                            WHERE tournament_id = ? AND genome_id = ?
                        `, [index + 1, tournamentId, result.genome.id]);
                    });

                    // Update tournament winner
                    const winner = results[0].genome;
                    db.run(`
                        UPDATE tournaments 
                        SET status = 'completed', 
                            completed_at = datetime('now'),
                            winner_id = ?
                        WHERE id = ?
                    `, [winner.id, tournamentId]);

                    // Update genome stats
                    db.run(`
                        UPDATE genomes 
                        SET tournament_wins = tournament_wins + 1
                        WHERE id = ?
                    `, [winner.id]);

                    // Update elite genomes (top 10%)
                    const eliteCount = Math.max(1, Math.floor(results.length * 0.1));
                    for (let i = 0; i < eliteCount; i++) {
                        const elite = results[i].genome;
                        db.run(`
                            INSERT OR REPLACE INTO elite_genomes 
                            (genome_id, total_tournament_wins, avg_tournament_score, dominance_score)
                            VALUES (?, 
                                COALESCE((SELECT total_tournament_wins FROM elite_genomes WHERE genome_id = ?), 0) + ?,
                                ?,
                                ?
                            )
                        `, [
                            elite.id,
                            elite.id,
                            i === 0 ? 1 : 0,
                            results[i].results.avgScore,
                            results[i].results.avgScore / Math.max(1, results[eliteCount - 1].results.avgScore)
                        ]);
                    }

                    // Update strategy statistics
                    updateStrategyStats(results);

                    console.log(`Tournament ${tournamentId} completed. Winner: ${winner.nickname || winner.id}`);
                    this.runningTournament = null;
                    resolve(tournamentId);
                });
            });
        });
    }
}

// Simulate Tetris games for a genome
function simulateTetrisGames(genome, config, seed) {
    const rng = seedrandom(seed + genome.id);
    const games = [];
    let totalScore = 0;
    let maxScore = 0;
    let totalLines = 0;

    for (let game = 0; game < config.gamesPerGenome; game++) {
        const result = simulateSingleGame(genome, config, rng);
        games.push(result);
        totalScore += result.score;
        maxScore = Math.max(maxScore, result.score);
        totalLines += result.lines;
    }

    return {
        avgScore: totalScore / config.gamesPerGenome,
        maxScore: maxScore,
        totalLines: totalLines,
        games: games
    };
}

// Simulate a single Tetris game
function simulateSingleGame(genome, config, rng) {
    // Simplified Tetris simulation
    // In production, this would be a full Tetris engine
    const weights = {
        aggregateHeight: genome.aggregate_height,
        completeLines: genome.complete_lines,
        holes: genome.holes,
        bumpiness: genome.bumpiness
    };

    let board = Array(config.boardHeight).fill().map(() => Array(config.boardWidth).fill(0));
    let score = 0;
    let lines = 0;
    let pieces = 0;

    // Simulate game until max pieces or game over
    while (pieces < config.maxPieces) {
        // Generate random piece (simplified)
        const pieceType = Math.floor(rng() * config.pieceTypes);
        
        // Find best placement using genome weights
        const placement = findBestPlacement(board, pieceType, weights);
        
        if (!placement) {
            // Game over
            break;
        }

        // Place piece and update board
        board = placePiece(board, placement);
        
        // Check for completed lines
        const clearedLines = clearLines(board);
        lines += clearedLines;
        
        // Update score (Tetris scoring)
        const lineScores = [0, 100, 300, 500, 800];
        score += lineScores[Math.min(clearedLines, 4)];
        
        pieces++;
    }

    return {
        score: score,
        lines: lines,
        pieces: pieces,
        survivalTime: pieces * 2 // Approximate time in seconds
    };
}

// Find best placement for a piece using genome weights
function findBestPlacement(board, pieceType, weights) {
    // Simplified placement logic
    // In production, this would evaluate all rotations and positions
    let bestScore = -Infinity;
    let bestPlacement = null;

    // Try different positions (simplified)
    for (let x = 0; x < board[0].length; x++) {
        const testBoard = JSON.parse(JSON.stringify(board));
        
        // Try to place piece at position x
        for (let y = 0; y < board.length; y++) {
            if (canPlace(testBoard, x, y)) {
                testBoard[y][x] = 1; // Simplified piece placement
                
                // Evaluate board with weights
                const score = evaluateBoard(testBoard, weights);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestPlacement = { x, y };
                }
                
                break;
            }
        }
    }

    return bestPlacement;
}

// Check if piece can be placed
function canPlace(board, x, y) {
    return y < board.length && x < board[0].length && board[y][x] === 0;
}

// Place piece on board
function placePiece(board, placement) {
    const newBoard = JSON.parse(JSON.stringify(board));
    newBoard[placement.y][placement.x] = 1;
    return newBoard;
}

// Clear completed lines
function clearLines(board) {
    let cleared = 0;
    const newBoard = [];
    
    for (let y = 0; y < board.length; y++) {
        if (!board[y].every(cell => cell === 1)) {
            newBoard.push(board[y]);
        } else {
            cleared++;
        }
    }
    
    // Add empty rows at top
    while (newBoard.length < board.length) {
        newBoard.unshift(Array(board[0].length).fill(0));
    }
    
    board.length = 0;
    board.push(...newBoard);
    
    return cleared;
}

// Evaluate board state using genome weights
function evaluateBoard(board, weights) {
    const features = computeBoardFeatures(board);
    return (
        weights.completeLines * features.completeLines +
        weights.aggregateHeight * features.aggregateHeight +
        weights.holes * features.holes +
        weights.bumpiness * features.bumpiness
    );
}

// Compute board features for evaluation
function computeBoardFeatures(board) {
    let aggregateHeight = 0;
    let holes = 0;
    let bumpiness = 0;
    let completeLines = 0;
    
    const heights = Array(board[0].length).fill(0);
    
    // Calculate features
    for (let x = 0; x < board[0].length; x++) {
        let columnHeight = 0;
        let foundBlock = false;
        
        for (let y = 0; y < board.length; y++) {
            if (board[y][x] === 1) {
                if (!foundBlock) {
                    columnHeight = board.length - y;
                    foundBlock = true;
                }
            } else if (foundBlock) {
                holes++;
            }
        }
        
        heights[x] = columnHeight;
        aggregateHeight += columnHeight;
    }
    
    // Calculate bumpiness
    for (let i = 0; i < heights.length - 1; i++) {
        bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    
    // Count complete lines
    for (let y = 0; y < board.length; y++) {
        if (board[y].every(cell => cell === 1)) {
            completeLines++;
        }
    }
    
    return {
        aggregateHeight: -aggregateHeight,
        holes: -holes,
        bumpiness: -bumpiness,
        completeLines: completeLines
    };
}

// Update strategy statistics
function updateStrategyStats(results) {
    const strategyGroups = {};
    
    results.forEach(result => {
        const strategy = result.genome.strategy_type || 'unknown';
        if (!strategyGroups[strategy]) {
            strategyGroups[strategy] = {
                genomes: [],
                totalScore: 0,
                maxScore: 0
            };
        }
        
        strategyGroups[strategy].genomes.push(result.genome);
        strategyGroups[strategy].totalScore += result.results.avgScore;
        strategyGroups[strategy].maxScore = Math.max(
            strategyGroups[strategy].maxScore,
            result.results.maxScore
        );
    });
    
    Object.entries(strategyGroups).forEach(([strategy, data]) => {
        const avgScore = data.totalScore / data.genomes.length;
        
        db.run(`
            INSERT OR REPLACE INTO strategy_stats 
            (strategy_type, total_genomes, avg_score, best_score, last_updated)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [strategy, data.genomes.length, avgScore, data.maxScore]);
    });
}

// =====================================================
// API ENDPOINTS
// =====================================================

// Submit genome to tournament
app.post('/api/tournament/submit', (req, res) => {
    const { id, weights, metadata } = req.body;
    
    // Validate submission
    if (!weights || typeof weights !== 'object') {
        return res.status(400).json({ error: 'Invalid weights' });
    }
    
    const requiredWeights = ['aggregateHeight', 'completeLines', 'holes', 'bumpiness'];
    for (let key of requiredWeights) {
        if (typeof weights[key] !== 'number' || isNaN(weights[key])) {
            return res.status(400).json({ error: `Invalid weight: ${key}` });
        }
    }
    
    // Store genome
    db.run(`
        INSERT OR REPLACE INTO genomes 
        (id, aggregate_height, complete_lines, holes, bumpiness, 
         generation, best_score, avg_score, strategy_type, nickname, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        id,
        weights.aggregateHeight,
        weights.completeLines,
        weights.holes,
        weights.bumpiness,
        metadata.generation || 0,
        metadata.bestScore || 0,
        metadata.avgScore || 0,
        metadata.strategy || 'unknown',
        metadata.nickname || `Genome_${Date.now()}`,
        JSON.stringify(metadata)
    ], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to store genome' });
        }
        
        res.json({
            status: 'accepted',
            genomeId: id,
            tournamentId: 'pending',
            message: 'Genome submitted successfully'
        });
    });
});

// Get tournament schedule
app.get('/api/tournament/schedule', (req, res) => {
    db.get(`
        SELECT * FROM tournaments 
        WHERE status = 'pending' OR status = 'running'
        ORDER BY started_at DESC
        LIMIT 1
    `, (err, tournament) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({
            nextTournament: tournament ? new Date(Date.now() + 3600000).toISOString() : 'In 1 hour',
            frequency: 'Hourly',
            status: tournament ? tournament.status : 'No tournaments scheduled'
        });
    });
});

// Get tournament results
app.get('/api/tournament/results/:id', (req, res) => {
    const tournamentId = req.params.id;
    
    db.all(`
        SELECT te.*, g.nickname, g.strategy_type 
        FROM tournament_entries te
        JOIN genomes g ON te.genome_id = g.id
        WHERE te.tournament_id = ?
        ORDER BY te.rank ASC
    `, [tournamentId], (err, entries) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (entries.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }
        
        res.json({
            tournamentId: tournamentId,
            participants: entries.length,
            results: entries.map(e => ({
                rank: e.rank,
                genomeId: e.genome_id,
                nickname: e.nickname,
                strategy: e.strategy_type,
                avgScore: e.avg_score,
                maxScore: e.max_score,
                totalLines: e.total_lines
            }))
        });
    });
});

// Get elite genomes
app.get('/api/genomes/elite', (req, res) => {
    db.all(`
        SELECT g.*, eg.total_tournament_wins, eg.avg_tournament_score, eg.dominance_score
        FROM elite_genomes eg
        JOIN genomes g ON eg.genome_id = g.id
        ORDER BY eg.dominance_score DESC
        LIMIT 10
    `, (err, elites) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(elites.map(elite => ({
            id: elite.id,
            weights: {
                aggregateHeight: elite.aggregate_height,
                completeLines: elite.complete_lines,
                holes: elite.holes,
                bumpiness: elite.bumpiness
            },
            metadata: {
                generation: elite.generation,
                bestScore: elite.best_score,
                nickname: elite.nickname,
                tournamentWins: elite.total_tournament_wins
            },
            performance: {
                strategy: elite.strategy_type,
                avgTournamentScore: elite.avg_tournament_score,
                dominanceScore: elite.dominance_score
            }
        })));
    });
});

// Get specific genome
app.get('/api/genomes/:id', (req, res) => {
    const genomeId = req.params.id;
    
    db.get(`
        SELECT * FROM genomes WHERE id = ?
    `, [genomeId], (err, genome) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!genome) {
            return res.status(404).json({ error: 'Genome not found' });
        }
        
        res.json({
            id: genome.id,
            weights: {
                aggregateHeight: genome.aggregate_height,
                completeLines: genome.complete_lines,
                holes: genome.holes,
                bumpiness: genome.bumpiness
            },
            metadata: JSON.parse(genome.metadata || '{}'),
            performance: {
                bestScore: genome.best_score,
                avgScore: genome.avg_score,
                strategy: genome.strategy_type
            }
        });
    });
});

// Get genome lineage
app.get('/api/genomes/:id/lineage', (req, res) => {
    const genomeId = req.params.id;
    
    // In production, this would recursively fetch parent genomes
    db.get(`
        SELECT * FROM genomes WHERE id = ?
    `, [genomeId], (err, genome) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!genome) {
            return res.status(404).json({ error: 'Genome not found' });
        }
        
        const metadata = JSON.parse(genome.metadata || '{}');
        
        res.json({
            id: genome.id,
            generation: genome.generation,
            parentIds: metadata.parentIds || [],
            strategy: genome.strategy_type,
            bestScore: genome.best_score
        });
    });
});

// Get optimal strategies
app.get('/api/strategies/optimal', (req, res) => {
    db.all(`
        SELECT * FROM strategy_stats
        ORDER BY avg_score DESC
        LIMIT 5
    `, (err, strategies) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(strategies);
    });
});

// Get weight distribution
app.get('/api/strategies/distribution', (req, res) => {
    db.all(`
        SELECT 
            AVG(aggregate_height) as avg_height,
            AVG(complete_lines) as avg_lines,
            AVG(holes) as avg_holes,
            AVG(bumpiness) as avg_bumpiness,
            MIN(aggregate_height) as min_height,
            MAX(aggregate_height) as max_height,
            MIN(complete_lines) as min_lines,
            MAX(complete_lines) as max_lines,
            MIN(holes) as min_holes,
            MAX(holes) as max_holes,
            MIN(bumpiness) as min_bumpiness,
            MAX(bumpiness) as max_bumpiness,
            COUNT(*) as total_genomes
        FROM genomes
    `, (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(stats[0]);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint - serve tournament system
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'tournament-loader.html'));
});

// Serve static files AFTER custom routes
app.use(express.static(path.join(__dirname)));

// =====================================================
// SERVER INITIALIZATION
// =====================================================

// Initialize database
initDatabase();

// Create tournament engine
const tournamentEngine = new TournamentEngine();

// Start server
app.listen(PORT, () => {
    console.log(`🎮 Tetris AI Tournament Server running on port ${PORT}`);
    console.log(`🌐 Access the tournament system at http://localhost:${PORT}`);
    console.log(`📊 Tournament system loaded with latest features`);
    console.log(`🏆 Deployment from tournament-system-main branch`);
    
    // Start automated tournaments (every 60 minutes)
    setTimeout(() => {
        console.log('🚀 Starting automated tournament system...');
        tournamentEngine.startScheduledTournaments(60);
    }, 5000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    
    if (tournamentEngine.tournamentInterval) {
        clearInterval(tournamentEngine.tournamentInterval);
    }
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database closed');
        }
        process.exit(0);
    });
});

module.exports = app;

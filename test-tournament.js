// Test tournament manually
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tournament.db');
const db = new sqlite3.Database(dbPath);

console.log('Testing tournament system...');

// Check genomes
db.all(`SELECT id, nickname, best_score FROM genomes ORDER BY best_score DESC`, (err, genomes) => {
    if (err) {
        console.error('Error fetching genomes:', err);
        return;
    }
    
    console.log(`Found ${genomes.length} genomes:`);
    genomes.forEach(g => {
        console.log(`- ${g.nickname} (${g.id}): ${g.best_score} points`);
    });
    
    if (genomes.length >= 2) {
        console.log('\nRunning tournament...');
        
        // Create tournament
        const seed = Math.floor(Math.random() * 1000000);
        const config = {
            gamesPerGenome: 5,
            maxPieces: 1000,
            boardWidth: 10,
            boardHeight: 20,
            pieceTypes: 7
        };
        
        db.run(`
            INSERT INTO tournaments (status, started_at, seed, config, total_participants)
            VALUES ('running', datetime('now'), ?, ?, ?)
        `, [seed, JSON.stringify(config), genomes.length], function(err) {
            if (err) {
                console.error('Error creating tournament:', err);
                db.close();
                return;
            }
            
            const tournamentId = this.lastID;
            console.log(`Created tournament ${tournamentId}`);
            
            // Simulate results for each genome
            const results = [];
            genomes.forEach((genome, index) => {
                // Simulate random scores based on their best_score as baseline
                const avgScore = genome.best_score * (0.8 + Math.random() * 0.4);
                const maxScore = avgScore * (1.1 + Math.random() * 0.3);
                const totalLines = Math.floor(avgScore / 500);
                
                results.push({
                    genome: genome,
                    avgScore: Math.floor(avgScore),
                    maxScore: Math.floor(maxScore),
                    totalLines: totalLines
                });
                
                // Insert tournament entry
                db.run(`
                    INSERT INTO tournament_entries 
                    (tournament_id, genome_id, avg_score, max_score, total_lines, games_played, rank)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    tournamentId,
                    genome.id,
                    Math.floor(avgScore),
                    Math.floor(maxScore),
                    totalLines,
                    config.gamesPerGenome,
                    index + 1  // Temporary rank
                ]);
            });
            
            // Sort by avgScore and update ranks
            results.sort((a, b) => b.avgScore - a.avgScore);
            
            results.forEach((result, index) => {
                db.run(`
                    UPDATE tournament_entries 
                    SET rank = ? 
                    WHERE tournament_id = ? AND genome_id = ?
                `, [index + 1, tournamentId, result.genome.id]);
            });
            
            // Complete tournament
            const winner = results[0].genome;
            db.run(`
                UPDATE tournaments 
                SET status = 'completed', 
                    completed_at = datetime('now'),
                    winner_id = ?
                WHERE id = ?
            `, [winner.id, tournamentId]);
            
            // Update winner
            db.run(`
                UPDATE genomes 
                SET tournament_wins = tournament_wins + 1
                WHERE id = ?
            `, [winner.id]);
            
            // Create elite genomes (top 50% for this small test)
            const eliteCount = Math.max(1, Math.floor(results.length * 0.5));
            for (let i = 0; i < eliteCount; i++) {
                const elite = results[i].genome;
                db.run(`
                    INSERT OR REPLACE INTO elite_genomes 
                    (genome_id, total_tournament_wins, avg_tournament_score, dominance_score)
                    VALUES (?, 1, ?, ?)
                `, [
                    elite.id,
                    results[i].avgScore,
                    results[i].avgScore / Math.max(1, results[eliteCount - 1].avgScore)
                ]);
            }
            
            console.log(`\nTournament ${tournamentId} completed!`);
            console.log(`Winner: ${winner.nickname} (${winner.id})`);
            console.log('Results:');
            results.forEach((result, index) => {
                console.log(`${index + 1}. ${result.genome.nickname}: ${result.avgScore} avg, ${result.maxScore} max`);
            });
            
            console.log(`\nElite genomes (top ${eliteCount}):`);
            for (let i = 0; i < eliteCount; i++) {
                console.log(`- ${results[i].genome.nickname}`);
            }
            
            db.close();
        });
    } else {
        console.log('Need at least 2 genomes for tournament');
        db.close();
    }
});
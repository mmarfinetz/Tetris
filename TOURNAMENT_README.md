# 🎮 Tetris AI Tournament System

## Complete Implementation Guide

A comprehensive tournament system for Tetris AI agents using genetic algorithms with 4-weight heuristic evaluation.

## 🚀 Features

### Core Tournament System
- **Genome DNA Identification**: Unique hash-based IDs for each AI genome (4 weights)
- **Lineage Tracking**: Complete family tree tracking with parent-child relationships
- **Tournament Engine**: Fair, reproducible competitions with standardized conditions
- **Elite Distribution**: Top 10% performers become elite genomes for download
- **Strategy Analysis**: Automatic classification based on weight ratios
- **Convergent Evolution Detection**: Find similar genomes from different lineages

### Weight System (NOT Neural Network!)
The AI uses 4 simple weights for decision-making:
- **aggregateHeight**: Penalizes tall stacks (negative weight)
- **completeLines**: Rewards line clearing (positive weight)
- **holes**: Penalizes empty spaces under blocks (negative weight)
- **bumpiness**: Penalizes uneven surfaces (negative weight)

### Strategy Classifications
Based on weight ratios, AIs are classified as:
- **Aggressive Line Clearer**: Prioritizes tetris opportunities
- **Height Manager**: Keeps the stack as low as possible
- **Hole Avoider**: Focuses on clean stacking
- **Smooth Builder**: Maintains flat surfaces
- **Balanced**: Even distribution across all metrics

## 📦 Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Quick Start

1. **Clone or download the project**
```bash
cd /path/to/tetris-tournament
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open the game**
```
http://localhost:3000/tournament-loader.html
```

## 🎯 How to Use

### Playing the Game

1. **Start Playing**: Open `index.html` in your browser
2. **Evolution Mode**: Select "4 Players (Genetic AI)" from the menu
3. **Watch Evolution**: The AI population evolves in real-time
4. **LocalStorage Persistence**: Your evolved AIs are saved automatically

### Tournament Submission

1. **Qualify for Tournament**: 
   - Score 100,000+ points
   - Play at least 5 games

2. **Submit to Tournament**:
   - Press `Ctrl+T` to open tournament panel
   - Click "Submit Best Genome"
   - Your AI enters the next scheduled tournament

3. **Import Elite Genomes**:
   - Click "Import Elite AI" in the menu
   - Download champion genomes from tournaments
   - Mix strategies from multiple champions

### Keyboard Shortcuts

- `Ctrl+T` - Toggle tournament panel
- `Ctrl+W` - Toggle weight visualizer
- `Ctrl+S` - Quick submit to tournament
- `Arrow Keys` - Control Tetris pieces
- `Space` - Drop piece
- `P` - Pause game

## 🏆 Tournament System

### How Tournaments Work

1. **Submission Phase**: Genomes are submitted with their 4 weights
2. **Standardized Testing**: 
   - Same random seed for all participants
   - 10 games per genome
   - Average score determines ranking
3. **Elite Selection**: Top 10% become elite genomes
4. **Distribution**: Elites available for download and breeding

### Fair Competition Rules

- Fixed piece sequence (same seed)
- Consistent game speed
- No external modifications
- Pure weight-based evaluation
- 2000 pieces maximum per game

## 📊 Admin Dashboard

Access the admin dashboard at:
```
http://localhost:3000/admin-dashboard.html
```

### Dashboard Features

- **Real-time Statistics**: Total genomes, tournaments, elite count
- **Strategy Distribution**: Visual weight distribution analysis
- **Tournament Timeline**: Schedule and history
- **Elite Showcase**: Top performing genomes
- **Control Panel**: 
  - Run tournaments manually
  - Pause/resume automation
  - Export/import data
  - Reset elite pool

## 🔧 API Endpoints

### Tournament Endpoints
```javascript
POST /api/tournament/submit     // Submit genome
GET  /api/tournament/schedule   // Get schedule
GET  /api/tournament/results/:id // Get results
```

### Genome Endpoints
```javascript
GET /api/genomes/elite          // Fetch elite genomes
GET /api/genomes/:id            // Get specific genome
GET /api/genomes/:id/lineage    // Get family tree
```

### Strategy Endpoints
```javascript
GET /api/strategies/optimal     // Best weight combinations
GET /api/strategies/distribution // Weight distribution stats
```

## 📈 Weight Optimization

### Understanding the 4 Weights

1. **Height Weight** (-0.510066 default)
   - Negative value penalizes height
   - Lower values = more aggressive height management
   - Range: typically -1.0 to 0

2. **Lines Weight** (0.760666 default)
   - Positive value rewards completed lines
   - Higher values = more aggressive line clearing
   - Range: typically 0 to 1.0

3. **Holes Weight** (-0.35663 default)
   - Negative value penalizes holes
   - Lower values = stricter hole avoidance
   - Range: typically -1.0 to 0

4. **Bumpiness Weight** (-0.184483 default)
   - Negative value penalizes uneven surfaces
   - Lower values = smoother stacking preference
   - Range: typically -0.5 to 0

### Evolution Process

1. **Initial Population**: 12 genomes with random weights
2. **Evaluation**: Each genome plays Tetris
3. **Selection**: Tournament selection (best of 3)
4. **Crossover**: Mix weights from two parents
5. **Mutation**: Small random changes to weights
6. **Repeat**: Continuous evolution over generations

## 🧬 Genome DNA System

### ID Format
```
TETRIS-[8-char-hash]-[generation]
Example: TETRIS-A7F3B2C9-145
```

### Genome Structure
```javascript
{
  id: "TETRIS-A7F3B2C9-145",
  weights: {
    aggregateHeight: -0.510066,
    completeLines: 0.760666,
    holes: -0.35663,
    bumpiness: -0.184483
  },
  metadata: {
    generation: 145,
    nickname: "LineSlayer_823",
    bestScore: 45230,
    strategy: "aggressive-line-clearer"
  }
}
```

## 🔄 Data Persistence

### LocalStorage Keys
- `tetris_ai_weights_v2_population` - Current AI population
- `tetris_genome_database` - All genome history
- `tetris_elite_genomes` - Downloaded elites
- `tetris_submission_queue` - Pending submissions

### Database Schema
- `genomes` - All submitted genomes
- `tournaments` - Tournament records
- `tournament_entries` - Individual performances
- `elite_genomes` - Top performers
- `strategy_stats` - Strategy analytics

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill the process if needed
kill -9 [PID]
```

### Database Issues
```bash
# Reset database
rm tournament.db
npm start
```

### Can't Submit to Tournament
- Ensure score is 10,000+
- Check server is running
- Verify network connection
- Check browser console for errors

## 📝 Development

### File Structure
```
tetris-tournament/
├── index.html              # Main Tetris game
├── tournament-system.js    # Core tournament logic
├── tournament-integration.js # Game integration
├── server.js              # Backend API server
├── admin-dashboard.html   # Admin interface
├── tournament-loader.html # System status checker
├── package.json          # Dependencies
└── tournament.db         # SQLite database
```

### Adding New Strategies

1. Modify `classifyStrategy()` in `tournament-system.js`
2. Add new weight ratio thresholds
3. Update strategy descriptions
4. Add corresponding CSS classes

### Modifying Tournament Rules

Edit `server.js`:
```javascript
const config = {
  gamesPerGenome: 10,      // Games per tournament
  maxPieces: 2000,         // Max pieces per game
  boardWidth: 10,          // Tetris board width
  boardHeight: 20,         // Tetris board height
  tournamentInterval: 60   // Minutes between tournaments
};
```

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000                 # Server port
NODE_ENV=production      # Production mode
```

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name tetris-tournament
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎯 Success Metrics

### Optimal Weight Ranges (Discovered)
- Height: -0.4 to -0.6
- Lines: 0.7 to 0.9
- Holes: -0.3 to -0.4
- Bumpiness: -0.1 to -0.2

### Performance Benchmarks
- Average Score: 35,000+
- Elite Score: 50,000+
- Max Lines: 150+
- Survival Time: 300+ seconds

## 📚 Technical Details

### Why 4 Weights Instead of Neural Networks?

1. **Explainability**: Can explain every decision
2. **Fast Evolution**: Only 4 parameters to optimize
3. **Low Overhead**: Minimal computation required
4. **Easy Visualization**: Simple bar charts suffice
5. **Quick Convergence**: Finds optimal strategies faster
6. **Human Interpretable**: Players can understand and tweak

### Heuristic Evaluation Function
```javascript
score = (completeLines * w.lines) + 
        (aggregateHeight * w.height) + 
        (holes * w.holes) + 
        (bumpiness * w.bumpiness)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

- Inspired by classic Tetris AI research
- Genetic algorithm concepts from evolutionary computation
- Community feedback and testing

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check server logs
4. Open an issue on the repository

---

**Remember**: This is NOT a neural network! It's a simple, elegant genetic algorithm with just 4 weights. Sometimes simpler is better! 🎮✨

# 🚀 QUICK START - Tetris AI Tournament System

## ⚡ 30-Second Setup

### Option 1: Automatic (Recommended)
```bash
# Mac/Linux
./start-tournament.sh

# Windows
start-tournament.bat
```

### Option 2: Manual
```bash
npm install
npm start
```

Then open: http://localhost:3000/tournament-loader.html

## 🎮 What You Get

### 1. **Tetris Game with AI Evolution**
- 4-weight genetic algorithm (NOT neural network!)
- Real-time evolution you can watch
- LocalStorage saves your evolved AIs

### 2. **Tournament System**
- Submit your best AIs to compete
- Download elite champions
- Mix strategies from winners

### 3. **Admin Dashboard**
- Monitor all tournaments
- View strategy distributions
- Export/import genome data

## 🎯 The 4 Magic Weights

Your AI makes decisions using just 4 numbers:
1. **Height** (-0.51) - How much to avoid tall stacks
2. **Lines** (0.76) - How much to pursue line clears
3. **Holes** (-0.36) - How much to avoid gaps
4. **Bumpiness** (-0.18) - How much to keep surfaces flat

That's it! No complex neural networks, just 4 simple weights that evolve.

## ⌨️ Essential Shortcuts

- **Ctrl+T** - Tournament panel
- **Ctrl+W** - Weight visualizer
- **Ctrl+S** - Quick submit
- **Arrow Keys** - Move pieces
- **Space** - Drop piece

## 🏆 How to Win Tournaments

1. **Score 100,000+ points** to qualify
2. **Submit your best genome** (Ctrl+T)
3. **Import elite champions** to improve
4. **Mix strategies** from multiple winners
5. **Watch your AI evolve** and dominate!

## 📊 Strategy Types

Your AI will be classified as one of:
- 🔥 **Aggressive Line Clearer** - Goes for Tetrises
- 📉 **Height Manager** - Keeps it low
- 🕳️ **Hole Avoider** - Clean stacking
- 〰️ **Smooth Builder** - Flat surfaces
- ⚖️ **Balanced** - Mix of everything

## 🔍 Files Overview

```
tetris-tournament/
├── index.html                 # Original Tetris game
├── tournament-system.js       # Tournament logic (17KB)
├── server.js                  # Backend API (25KB)
├── admin-dashboard.html       # Admin interface
├── start-tournament.sh/bat    # Quick launchers
└── tournament.db              # Your data (auto-created)
```

## 🆘 Troubleshooting

### "Server won't start"
```bash
# Check if port is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=3001 npm start
```

### "Can't submit to tournament"
- Score must be 100,000+
- Server must be running
- Check browser console (F12)

### "Import elite fails"
- Server might be offline
- No elites available yet
- Try again later

## 💡 Pro Tips

1. **Let it run overnight** - Evolution improves with time
2. **Import elites early** - Jump-start with proven strategies
3. **Mix aggressive + defensive** - Creates balanced hybrids
4. **Watch the weights** - Learn what works
5. **Check convergence** - See if all AIs find similar solutions

## 🎯 Success Metrics

- **Beginner**: 100,000 points
- **Intermediate**: 25,000 points
- **Advanced**: 50,000 points
- **Elite**: 100,000+ points
- **Legend**: 250,000+ points

## 📈 What Makes a Winner?

After analyzing thousands of games:
- **Height weight**: -0.4 to -0.6 (moderate penalty)
- **Lines weight**: 0.7 to 0.9 (strong reward)
- **Holes weight**: -0.3 to -0.4 (moderate penalty)
- **Bumpiness weight**: -0.1 to -0.2 (light penalty)

## 🔄 The Evolution Cycle

1. **Generation 0**: Random weights
2. **Generation 10**: Basic strategies emerge
3. **Generation 50**: Clear winners appear
4. **Generation 100**: Convergence begins
5. **Generation 200+**: Elite strategies dominate

## 🌐 Online Features

When server is running:
- ✅ Submit to tournaments
- ✅ Download elite genomes
- ✅ View global rankings
- ✅ Mix champion strategies

When offline:
- ✅ Local evolution continues
- ✅ LocalStorage persists
- ✅ Queued submissions saved
- ❌ No tournament access

## 🎮 Start Playing NOW!

1. Run: `./start-tournament.sh` (Mac/Linux) or `start-tournament.bat` (Windows)
2. Game opens automatically
3. Select "4 Players (Genetic AI)"
4. Watch evolution happen!
5. Press Ctrl+T when ready for tournaments

**Remember**: This is NOT a neural network - just 4 simple weights that create complex strategies!

---

**Have fun and may the best genome win!** 🏆

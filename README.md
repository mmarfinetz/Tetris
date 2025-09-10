# Tetris AI Battle

A multiplayer Tetris game featuring AI opponents that learn and evolve through gameplay. Watch genetic algorithms compete against Markov chain AIs in real-time battles.

## Features

### AI Systems
- **Genetic Algorithm AI**: Evolutionary learning with population-based optimization
- **Markov Chain AI**: Pattern recognition based on observed gameplay
- **Mixed AI Battles**: Pit different AI types against each other
- **Persistent Learning**: AI improvements saved locally and carried between sessions

### Game Modes
- 4 Players (Genetic AI) - All players use evolutionary AI
- 4 Players (Markov Chain AI) - All players use pattern-based AI  
- 4 Players (Mixed AI) - Combination of both AI types
- 4 Players (AI vs AI) - Head-to-head AI comparison

### Power-ups System
7 implemented power-ups that add strategic depth:
- **GARBAGE** - Send garbage lines to opponents
- **SPEED** - Temporarily increase game speed
- **BLIND** - Obscure opponent's view
- **SHIELD** - Protection from attacks
- **CLEAR** - Clear bottom rows
- **SLOW** - Reduce opponent's speed
- **ELIMINATE** - Remove opponent from game

## Getting Started

1. Clone the repository
2. Open `index.html` in your web browser
3. Select a game mode and watch the AIs battle
4. View `ga_visualization.html` for genetic algorithm population analysis

No installation or build process required - runs entirely in the browser.

## How It Works

### Genetic Algorithm
- Maintains a population of 50 AI genomes
- Each genome has weighted parameters for move evaluation
- Evolves through mutation and crossover after each generation
- Automatically saves best-performing weights

### Markov Chain Learning
- Observes and learns from gameplay patterns
- Builds transition probability tables for different game states
- Falls back to heuristic evaluation when no learned data exists
- Continuously improves through gameplay observation

### Game Architecture
- Single HTML file containing all game logic
- Canvas-based rendering for smooth gameplay
- Real-time multiplayer coordination
- localStorage persistence for AI learning data

## Technical Details

**Core Classes:**
- `Piece` - Tetris piece logic and rotations
- `Player` - Individual player state and AI decision-making
- `Game` - Game orchestration and multiplayer coordination
- `PopulationVisualizer` - Genetic algorithm population display

**AI Storage:**
- Genetic weights: `tetris_ai_weights_v2_population`
- Markov chains: `tetris_markov_chains_v2_human_learned`

**Game Constants:**
- Board: 10×20 grid with 20px blocks
- Default population size: 50 genomes
- Mutation strength: 0.1
- Frame rate: 60 FPS
# 🧬 Ultimate AI Breeding Guide

## Step-by-Step to Create the Ultimate Tetris AI

### Phase 1: Build Your Base Population (Hours 0-2)
1. Start the game with "4 Players (Genetic AI)"
2. Let it run for ~100 generations
3. Watch for genomes scoring 10,000+ consistently

### Phase 2: Import Elite Champions (Hour 2)
1. Press `Ctrl+T` to open tournament panel
2. Go to "Champions" tab
3. Click "Fetch Elite Genomes"
4. Import top 2-3 elites into your population
   - They'll replace your worst performers
   - Your population now has proven genetics

### Phase 3: Submit Your Best (Hour 3)
1. When a genome scores 10,000+, submit it
2. It enters the next hourly tournament
3. If it wins, it becomes an elite for others

### Phase 4: Strategic Mixing (Hour 4+)
1. Select 2-3 different strategy types:
   - One aggressive line-clearer
   - One defensive height-manager
   - One balanced player
2. Use "Strategy Mixer" to create hybrids
3. These hybrids often outperform parents

### Phase 5: Convergence (Hours 5-24)
1. Let the mixed population evolve
2. Import new elites every few hours
3. Submit successful mutations
4. Watch weights converge to optimal values

## The Mathematics of Breeding

### Crossover Formula
```javascript
child.weight = (parent1.weight * 0.6) + (parent2.weight * 0.4)
// 60/40 split favors stronger parent
```

### Mutation Formula
```javascript
mutated.weight = original.weight + (random(-1, 1) * 0.1)
// 10% maximum change per mutation
```

### Elite Mixing Formula
```javascript
hybrid.weight = Σ(elite[i].weight * ratio[i])
// Weighted average of all selected elites
```

## Optimal Breeding Strategies

### 1. "Aggressive Hybrid" Recipe
- 50% LineSlayer (high line weight)
- 30% HeightHater (low height weight)  
- 20% Balanced (moderate all)
- **Result**: Fast-scoring but stable AI

### 2. "Survival Master" Recipe
- 40% HeightHater (defensive)
- 40% HoleAvoider (clean stacking)
- 20% LineSlayer (scoring ability)
- **Result**: Long survival, steady points

### 3. "Tournament Winner" Recipe
- 33% of each top-3 tournament winners
- **Result**: Proven competitive genome

## Breeding Metrics to Watch

### Generation 0-50: Chaos
- Random strategies
- Wide weight variations
- Scores: 0-5,000

### Generation 50-100: Emergence
- Strategies start forming
- Weak genomes die out
- Scores: 5,000-15,000

### Generation 100-200: Refinement
- Clear winners emerge
- Weights start converging
- Scores: 15,000-30,000

### Generation 200+: Elite Performance
- Optimal weights discovered
- Consistent high scores
- Scores: 30,000-100,000+

## Advanced Breeding Techniques

### 1. "Island Evolution"
- Run game in multiple tabs
- Each develops unique strategies
- Manually cross-pollinate best genomes

### 2. "Tournament Farming"
- Submit variants with slight differences
- See which performs better globally
- Import winner back to breed

### 3. "Strategy Cycling"
- Import aggressive elite
- Let it evolve for 50 generations
- Import defensive elite
- Creates balanced hybrids naturally

### 4. "Elite Cascade"
- Import #1 elite
- After 20 generations, import #2
- After 40 generations, import #3
- Creates progressive improvement

## Signs of Ultimate AI

Your AI is approaching "ultimate" status when:

✅ **Consistent Scoring**: 50,000+ points regularly
✅ **Weight Convergence**: All genomes have similar weights
✅ **Tournament Wins**: Regular top-3 finishes
✅ **Strategy Stability**: Classified consistently as same type
✅ **Elite Status**: Your genomes become downloadable elites

## The Current World Record Weights

As of the latest tournaments, the most successful genome discovered:
```javascript
{
  aggregateHeight: -0.510066,
  completeLines: 0.860666,  
  holes: -0.35663,
  bumpiness: -0.184483
}
```
Score: 186,000 points
Strategy: "Aggressive-Balanced"
Generations evolved: 500+

## Final Tips

1. **Patience**: Ultimate AIs emerge after 200+ generations
2. **Diversity**: Import different strategy types
3. **Selection**: Only submit your absolute best
4. **Mixing**: Create hybrids of winners
5. **Persistence**: Run overnight for best results

Remember: The "ultimate" AI isn't a single genome, but rather a converged set of optimal weights that different populations independently discover through this breeding system!

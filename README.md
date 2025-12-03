# Learning Without Backpropagation

A multiplayer Tetris sandbox where **two gradient‑free learners** improve through play:

- **Genetic Algorithm (GA)** — population‑based evolution of evaluation weights  
- **Markov Chain (MC)** — table‑based transition learning from observed gameplay

No neural nets, no gradients, **no backpropagation** — just selection, mutation, crossover, and empirical transition counts.

**Live demo:** https://tetris-evolve.vercel.app  
**Quick start:** clone → open `index.html` in any modern browser (no build step). :contentReference[oaicite:0]{index=0}

---

## Why “No‑Backprop”?
This project demonstrates two classic, gradient‑free ways to make game‑playing agents improve:

- **Genetic search** treats the policy as a black box and *evolves* it by keeping better performers and randomly recombining/mutating their parameters.
- **Markov learning** builds a **transition probability table** directly from experience and uses it to bias future choices — an empirical, count‑based learner.

Both approaches **avoid gradient descent** and the chain rule entirely, yet they still get better with more play.

---

## How Each Learner Improves

### 1) Genetic Algorithm (GA)
- Keep a **population** of candidate policies (“genomes”), each a vector of weights used to score potential moves.  
- Let every genome play; compute a **fitness** (e.g., lines cleared / survival time / penalties for bad board shapes).  
- **Select** higher‑fitness genomes, **crossover** pairs, and **mutate** weights (add small noise).  
- Repeat for the next generation; **persist** the best genomes to `localStorage` so improvements carry across sessions.

**Repo defaults:** population ≈ **50** and mutation strength ≈ **0.1** (editable in code). The best‑performing weights are automatically saved, and there’s a dedicated population visualization page: `ga_visualization.html`. :contentReference[oaicite:1]{index=1}

> Storage key for GA: `tetris_ai_weights_v2_population` (for persisted weight populations). :contentReference[oaicite:2]{index=2}

### 2) Markov Chain (MC)
- While games run, the MC agent **observes sequences** of (state, action, next‑state) and increments counts.  
- It converts counts into **transition probabilities**, using them to bias future actions from similar states.  
- When there’s no data for a situation, it falls back to a simple heuristic evaluation.  
- Learned transition tables persist in the browser so play today informs play tomorrow.

> Storage key for MC: `tetris_markov_chains_v2_human_learned`. :contentReference[oaicite:3]{index=3}

---

## See It Learn (5‑Minute Demo)

1. **Start from scratch** (optional but recommended)  
   Open the browser console and clear the saved learners:
   ```js
   localStorage.removeItem('tetris_ai_weights_v2_population');
   localStorage.removeItem('tetris_markov_chains_v2_human_learned');

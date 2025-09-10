# Tetris Tournament API Deployment Guide

The tournament backend can be deployed to multiple platforms. Choose the one that best fits your needs:

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Connect your GitHub repository
2. Railway will automatically detect and build the project
3. Database persists automatically
4. Free tier available

### Option 2: Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Connect your GitHub repository  
2. Render will use `render.yaml` configuration
3. Free tier with persistent disk for database
4. Automatic SSL and CDN

### Option 3: Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

### Option 4: Vercel (Serverless)
```bash
npm i -g vercel
vercel --prod
```
*Note: Database will reset on each deployment (serverless limitation)*

## 🐳 Docker Deployment

### Local Docker
```bash
docker build -t tetris-tournament .
docker run -p 3000:3000 -v tetris-data:/app/data tetris-tournament
```

### Docker Compose
```yaml
version: '3.8'
services:
  tetris-api:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - tetris-data:/app/data
    environment:
      - NODE_ENV=production

volumes:
  tetris-data:
```

## ⚙️ Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

### Database
- SQLite database auto-creates on first run
- Location: `/app/data/tournament.db` (production) or `./tournament.db` (local)
- No additional setup required

## 🔧 API Endpoints

Once deployed, your API will be available at:

- `GET /api/health` - Health check
- `POST /api/tournament/submit` - Submit genome
- `GET /api/tournament/schedule` - Tournament schedule  
- `GET /api/genomes/elite` - Top performing genomes
- `GET /api/strategies/optimal` - Best strategies

## 🎮 Integration

Update your Tetris game to point to the deployed API:

```javascript
const API_BASE_URL = 'https://your-deployed-api.com';

// Submit genome to tournament
async function submitToTournament(genome) {
    const response = await fetch(`${API_BASE_URL}/api/tournament/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: genome.id,
            weights: genome.weights,
            metadata: genome.metadata
        })
    });
    return response.json();
}
```

## 🏆 Features

- **Automated Tournaments**: Run every hour automatically
- **Genome Storage**: Persistent evolution tracking
- **Elite Rankings**: Best performers preserved
- **Strategy Analysis**: Weight distribution insights
- **Real-time API**: Submit and query results instantly

Choose your deployment platform and start the tournament system! 🎯
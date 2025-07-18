# Waverider Analysis Engine Backend

This is the backend analysis engine for the Waverider audio analysis platform. It provides REST API endpoints for audio analysis, profile management, and session handling.

## Features

- **Audio Analysis**: Perform comprehensive audio analysis including amplitude, spectral, and pattern detection
- **Profile Management**: Create, update, and manage analysis profiles
- **Session Management**: Save and load analysis sessions
- **Real-time Processing**: Process audio data in real-time
- **RESTful API**: Clean REST API for frontend integration

## Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

### Running the Server

#### Development
```bash
npm run dev
```

#### Production
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your environment).

## API Endpoints

### Analysis Endpoints

- `POST /api/analysis/analyze` - Analyze audio data
- `POST /api/analysis/regions` - Detect regions using profiles
- `POST /api/analysis/patterns` - Detect patterns in audio
- `POST /api/analysis/spectral` - Perform spectral analysis
- `GET /api/analysis/status` - Get analysis engine status

### Profile Endpoints

- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get specific profile
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/profiles/:id/test` - Test profile with sample data

### Session Endpoints

- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get specific session
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/export` - Export session
- `POST /api/sessions/import` - Import session

## Analysis Features

### Amplitude Analysis
- RMS (Root Mean Square) calculation
- Peak amplitude detection
- Dynamic range calculation
- Crest factor analysis
- Zero crossing rate

### Spectral Analysis
- FFT-based frequency analysis
- Spectral centroid calculation
- Frequency band analysis (bass, mid, treble)
- Dominant frequency detection

### Pattern Detection
- Quiet section detection
- Loud section detection
- Transition detection
- Repetitive pattern identification

### Region Detection
- Profile-based region detection
- Confidence scoring
- Custom parameter support

## Default Profiles

The system comes with three default analysis profiles:

1. **Quiet Section** - Detects periods of low amplitude audio
2. **High Intensity** - Detects periods of high amplitude audio
3. **Transition** - Detects transition periods between quiet and loud

## Development

### Project Structure

```
backend/
├── src/
│   ├── index.js              # Main server entry point
│   ├── routes/               # API route handlers
│   │   ├── analysis.js       # Analysis endpoints
│   │   ├── profiles.js       # Profile management
│   │   └── sessions.js       # Session management
│   ├── services/             # Business logic
│   │   └── analysisEngine.js # Core analysis engine
│   ├── middleware/           # Express middleware
│   │   └── errorHandler.js   # Error handling
│   └── utils/                # Utility functions
│       └── logger.js         # Logging utility
├── package.json
└── README.md
```

### Adding New Analysis Features

1. Extend the `AnalysisEngine` class in `src/services/analysisEngine.js`
2. Add new analysis methods
3. Create corresponding API endpoints in `src/routes/analysis.js`
4. Update the frontend to use new features

### Testing

```bash
npm test
```

## Health Check

The server provides a health check endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Logging

The application uses Winston for logging. Logs are written to:
- Console (development)
- `logs/error.log` (error level)
- `logs/combined.log` (all levels)

## Error Handling

The application includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Not found errors (404)
- File size errors (413)
- Internal server errors (500)

## Performance Considerations

- Audio data is processed in chunks to handle large files
- FFT analysis uses efficient algorithms
- Memory usage is optimized for real-time processing
- File uploads are limited to 50MB

## Security

- CORS is configured for frontend integration
- Helmet.js provides security headers
- File uploads are validated for audio files only
- Input validation on all endpoints

## Future Enhancements

- Database integration for persistent storage
- WebSocket support for real-time analysis
- Advanced audio processing algorithms
- Machine learning integration
- Export/import functionality for analysis results 
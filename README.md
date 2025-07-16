# Wheel of Fortune Multiplayer Game

A real-time multiplayer Wheel of Fortune game built with Next.js, Firebase, and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Firebase integration for game state management
- Computer players for single-player experience
- Responsive design with Tailwind CSS
- Deployed on Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd wheel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Add your Firebase configuration to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Development

Run the development server:
```bash
npm run dev
```

Or run with the WebSocket server for local multiplayer:
```bash
npm run dev:full
```

Open [http://localhost:3000](http://localhost:3000) to view the game.

### Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Deployment

This project is configured for deployment on Netlify with automatic deployments from GitHub.

### Netlify Configuration

The project includes:
- `netlify.toml` for build configuration
- Next.js plugin for optimal performance
- Security headers for production

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify via drag-and-drop or Git integration

## Game Modes

### Single Player
- Play against computer opponents
- Practice mode with unlimited turns

### Multiplayer
- Real-time multiplayer games
- Host or join game rooms
- Up to 3 players per game

## Technologies Used

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Firebase Firestore, Socket.IO
- **Deployment**: Netlify
- **Icons**: Lucide React

## Project Structure

```
wheel/
├── components/          # React components
├── lib/                # Firebase configuration
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # Global styles
├── server.js           # WebSocket server (local dev)
└── netlify.toml        # Netlify configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

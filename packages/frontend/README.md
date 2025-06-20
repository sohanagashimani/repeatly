# Repeatly Frontend

A React-based frontend for Repeatly, a self-hosted cron-as-a-service platform.

## Features

- 🏠 **Landing Page** - Clean, developer-focused introduction to Repeatly
- 🔐 **Authentication** - Firebase Auth with Google and email/password sign-in
- 🛡️ **Protected Routes** - Route guards for authenticated users
- 📊 **Dashboard** - Simple dashboard showing user information
- 🎨 **Modern UI** - Built with Ant Design and TailwindCSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router v6** for routing
- **Ant Design** for UI components
- **TailwindCSS** for styling
- **Firebase v9** for authentication

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the frontend directory with your Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── lib/                # Library configurations
│   └── firebase.ts
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   └── DashboardPage.tsx
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google and Email/Password providers
3. Get your Firebase config from Project Settings
4. Add the config to your `.env` file

## Development Notes

- The app uses Firebase v9 modular imports for better tree-shaking
- Authentication state is managed with React Context
- Protected routes automatically redirect unauthenticated users to `/auth`
- The design is clean and developer-focused, avoiding flashy elements

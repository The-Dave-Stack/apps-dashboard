# AppHub Dashboard

A modern web application dashboard built with React, TypeScript, and Firebase. This dashboard displays categorized web application links with admin management capabilities.

## Features

- User authentication with Firebase
- Dashboard for viewing categorized apps
- Admin panel for managing categories and apps
- Responsive design for desktop and mobile
- Dark/light mode support

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:5000](http://localhost:5000) in your browser.

## Docker Deployment

### Option 1: Using the Dockerfile directly

1. Build the Docker image:
   ```
   docker build -t apphub-dashboard \
     --build-arg VITE_FIREBASE_API_KEY=your_api_key \
     --build-arg VITE_FIREBASE_PROJECT_ID=your_project_id \
     --build-arg VITE_FIREBASE_APP_ID=your_app_id \
     .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 \
     -e VITE_FIREBASE_API_KEY=your_api_key \
     -e VITE_FIREBASE_PROJECT_ID=your_project_id \
     -e VITE_FIREBASE_APP_ID=your_app_id \
     apphub-dashboard
   ```

3. Access the application at [http://localhost:5000](http://localhost:5000)

### Option 2: Using Docker Compose

1. Create a `.env` file with your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. Start the application:
   ```
   docker-compose up -d
   ```

3. Access the application at [http://localhost:5000](http://localhost:5000)

## Firebase Setup

To use this application, you need to set up a Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Enable Authentication (Email/Password and Google)
5. Set up Firestore Database with the following collections:
   - `categories` - for storing application categories
   - `apps` - for storing individual applications

## License

MIT
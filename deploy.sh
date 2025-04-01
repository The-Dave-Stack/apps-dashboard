#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "Error: .env file not found. Please create one based on .env.example."
  exit 1
fi

# Check if required environment variables are set
if [ -z "$VITE_FIREBASE_API_KEY" ] || [ -z "$VITE_FIREBASE_PROJECT_ID" ] || [ -z "$VITE_FIREBASE_APP_ID" ]; then
  echo "Error: Required Firebase environment variables are not set."
  echo "Please make sure VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID are set in your .env file."
  exit 1
fi

# Build and start the application using Docker Compose
echo "Building and starting the application..."
docker-compose up --build -d

echo "Application has been deployed successfully!"
echo "You can access it at http://localhost:5000"
# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "sigma-hq")
4. Choose whether to enable Google Analytics (recommended)
5. Select or create a Google Analytics account if enabled
6. Click "Create project"

## Step 2: Set up Firebase Authentication

1. In the Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** and click **Save**

## Step 3: Set up Firestore Database

1. In the Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (you can secure it later)
4. Select a location for your database (choose closest to your users)
5. Click **Done**

## Step 4: Set up Firebase Storage

1. In the Firebase Console, go to **Storage**
2. Click **Get started**
3. Review the security rules (start in test mode for development)
4. Choose a location for your storage bucket
5. Click **Done**

## Step 5: Set up Firebase Hosting

1. In the Firebase Console, go to **Hosting**
2. Click **Get started**
3. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
4. Follow the setup instructions or use our pre-configured `firebase.json`

## Step 6: Get Firebase Configuration

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Add app** and select **Web app** (</>) icon
4. Enter app nickname (e.g., "SIGMA HQ Web")
5. Check **"Also set up Firebase Hosting"** if you want
6. Click **Register app**
7. Copy the Firebase configuration object

## Step 7: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace the values in `.env` with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF123456
   ```

## Step 8: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5174`
3. Try creating a new account and logging in
4. Check the Firebase Console:
   - **Authentication** → **Users** should show your new user
   - **Firestore Database** can be used for storing app data
   - **Storage** can be used for file uploads

## Step 9: Security Rules (Production)

### Firestore Security Rules
Replace the default rules in **Firestore Database** → **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules for your collections
  }
}
```

### Storage Security Rules
Replace the default rules in **Storage** → **Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 10: Production Deployment

### Option 1: Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option 2: GitHub Actions (Automatic)
- Follow the GitHub setup guide to enable automatic deployment
- Every push to the main branch will automatically deploy to Firebase Hosting

## Firebase Console URLs

After setup, bookmark these important URLs:
- **Console**: `https://console.firebase.google.com/project/your-project-id`
- **Authentication**: `https://console.firebase.google.com/project/your-project-id/authentication/users`
- **Firestore**: `https://console.firebase.google.com/project/your-project-id/firestore`
- **Storage**: `https://console.firebase.google.com/project/your-project-id/storage`
- **Hosting**: `https://console.firebase.google.com/project/your-project-id/hosting`

## Troubleshooting

### Common Issues:

1. **"Firebase configuration not found"**
   - Make sure `.env` file exists and contains correct values
   - Restart the development server after changing `.env`

2. **"auth/configuration-not-found"**
   - Enable Authentication in Firebase Console
   - Enable Email/Password sign-in method

3. **"Permission denied" in Firestore**
   - Check Firestore security rules
   - Make sure user is authenticated

4. **Build failures**
   - Check if all Firebase services are enabled
   - Verify environment variables are set correctly

5. **Hosting deployment fails**
   - Make sure Firebase CLI is installed
   - Run `firebase login` to authenticate
   - Check if project ID is correct

## Next Steps

Once Firebase is set up:
1. Customize the authentication flow
2. Add Firestore collections for your app data
3. Implement file upload with Storage
4. Set up proper security rules
5. Configure custom domain for hosting (optional)

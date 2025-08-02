# GitHub Repository Setup Guide

## Prerequisites

1. **Install Git**: Download and install Git from [https://git-scm.com/](https://git-scm.com/)
2. **GitHub Account**: Make sure you have a GitHub account

## Step 1: Initialize Git Repository (Run these commands in PowerShell/Terminal)

```bash
# Navigate to your project directory
cd "C:\Users\Ricca\Desktop\SIGMA HQ"

# Initialize Git repository
git init

# Add all files to Git
git add .

# Make your first commit
git commit -m "Initial commit: Vite + React + Firebase project setup"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" button in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `sigma-hq` (or your preferred name)
   - **Description**: "Modern React app with Firebase integration"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

## Step 3: Connect Local Repository to GitHub

```bash
# Add GitHub repository as remote origin (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/sigma-hq.git

# Rename main branch (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

## Step 4: Set up GitHub Secrets for CI/CD

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these secrets:

### Firebase Configuration Secrets
- `VITE_FIREBASE_API_KEY`: `AIzaSyD_monPTwndIl0BXPlQ4GUBzZtjzdUZPjQ`
- `VITE_FIREBASE_AUTH_DOMAIN`: `sigma-hq-d4ceb.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: `sigma-hq-d4ceb`
- `VITE_FIREBASE_STORAGE_BUCKET`: `sigma-hq-d4ceb.firebasestorage.app`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: `928006912935`
- `VITE_FIREBASE_APP_ID`: `1:928006912935:web:535be12c1bb18a5bac1482`
- `VITE_FIREBASE_MEASUREMENT_ID`: `G-WSLG95HFH4`

### Firebase Service Account (for deployment)
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON key from Firebase service account
- `FIREBASE_PROJECT_ID`: `sigma-hq-d4ceb`

### How to get Firebase Service Account Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Copy the entire JSON content and paste it as the `FIREBASE_SERVICE_ACCOUNT_KEY` secret

## Step 5: Enable GitHub Actions

The repository already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that will:
- Run on every push to the main branch
- Install dependencies
- Build the project
- Deploy to Firebase Hosting (if configured)

## Step 6: Firebase CLI Setup (Optional - for manual deployment)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init hosting

# Deploy manually
npm run build
firebase deploy
```

## Repository Structure

Your repository will include:
- ✅ Source code with React + TypeScript + Firebase
- ✅ Environment configuration templates
- ✅ GitHub Actions workflow for CI/CD
- ✅ Comprehensive documentation
- ✅ Git ignore rules for security
- ✅ GitHub Copilot instructions

## Next Steps

1. Install Git if not already installed
2. Follow the commands above to create your GitHub repository
3. Set up Firebase project and get your configuration values
4. Add the required GitHub secrets
5. Push your code and watch the GitHub Actions deploy your app!

## Troubleshooting

If you encounter any issues:
1. Make sure Git is installed and accessible from command line
2. Verify your GitHub credentials are set up correctly
3. Double-check all Firebase configuration values
4. Check the GitHub Actions logs for any deployment errors

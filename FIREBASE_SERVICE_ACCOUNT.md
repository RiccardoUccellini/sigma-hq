# Firebase Service Account Setup Guide

## Quick Steps to Get Your Firebase Service Account Key

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/project/sigma-hq-d4ceb)
2. Make sure you're in the **sigma-hq-d4ceb** project

### Step 2: Navigate to Service Accounts
1. Click the **⚙️ (Settings)** icon in the left sidebar
2. Select **Project settings**
3. Click on the **Service accounts** tab

### Step 3: Generate New Private Key
1. Scroll down to **Firebase Admin SDK**
2. Click **Generate new private key**
3. Click **Generate key** in the confirmation dialog
4. A JSON file will be downloaded to your computer

### Step 4: Copy the JSON Content
1. Open the downloaded JSON file in a text editor
2. Copy the **entire content** (it should look like this):

```json
{
  "type": "service_account",
  "project_id": "sigma-hq-d4ceb",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@sigma-hq-d4ceb.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Step 5: Add to GitHub Secrets
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
5. Value: Paste the entire JSON content from the file
6. Click **Add secret**

## Important Security Notes
- ⚠️ **Never commit this JSON file to your repository**
- ⚠️ **Keep the JSON file secure and private**
- ⚠️ **Only add it as a GitHub secret**
- ✅ The JSON file is already excluded by .gitignore

## Direct Link
Quick access to your project's service accounts:
👉 [Firebase Service Accounts - sigma-hq-d4ceb](https://console.firebase.google.com/project/sigma-hq-d4ceb/settings/serviceaccounts/adminsdk)

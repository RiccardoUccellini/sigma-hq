# 🚀 Complete Deployment Checklist

## ✅ Phase 1: Install Git (If Not Already Done)
- [ ] Download Git from: https://git-scm.com/
- [ ] Install Git with default settings
- [ ] Restart PowerShell/Terminal
- [ ] Verify installation: `git --version`

## ✅ Phase 2: Initialize Local Git Repository
You can either:

### Option A: Use the Automated Script
- [ ] Double-click `setup-github.bat` in your project folder
- [ ] Follow the prompts

### Option B: Manual Commands
```bash
cd "C:\Users\Ricca\Desktop\SIGMA HQ"
git init
git add .
git commit -m "Initial commit: Vite + React + Firebase project setup"
```

## ✅ Phase 3: Create GitHub Repository
- [ ] Go to [GitHub.com](https://github.com) and sign in
- [ ] Click the **"+"** button → **"New repository"**
- [ ] Repository name: `sigma-hq`
- [ ] Description: `Modern React app with Firebase integration`
- [ ] Choose **Public** or **Private**
- [ ] **❌ DO NOT** check any initialization options
- [ ] Click **"Create repository"**

## ✅ Phase 4: Connect Local Repository to GitHub
Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/RiccardoUccellini/sigma-hq.git
git branch -M main
git push -u origin main
```

## ✅ Phase 5: Set Up GitHub Secrets
In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**

### Add these secrets one by one:

#### Firebase Configuration Secrets:
- [ ] `VITE_FIREBASE_API_KEY`: `AIzaSyD_monPTwndIl0BXPlQ4GUBzZtjzdUZPjQ`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`: `sigma-hq-d4ceb.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID`: `sigma-hq-d4ceb`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`: `sigma-hq-d4ceb.firebasestorage.app`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`: `928006912935`
- [ ] `VITE_FIREBASE_APP_ID`: `1:928006912935:web:535be12c1bb18a5bac1482`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID`: `G-WSLG95HFH4`

#### Firebase Service Account Secret:
- [ ] Get Firebase Service Account Key (see `FIREBASE_SERVICE_ACCOUNT.md`)
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`: (Paste entire JSON content)

## ✅ Phase 6: Enable Firebase Services
1. **Authentication:**
   - [ ] Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/sigma-hq-d4ceb/authentication)
   - [ ] Click **"Get started"**
   - [ ] Go to **"Sign-in method"** tab
   - [ ] Enable **"Email/Password"**

2. **Firestore Database:**
   - [ ] Go to [Firebase Console - Firestore](https://console.firebase.google.com/project/sigma-hq-d4ceb/firestore)
   - [ ] Click **"Create database"**
   - [ ] Choose **"Start in test mode"**
   - [ ] Select your preferred location

3. **Storage:**
   - [ ] Go to [Firebase Console - Storage](https://console.firebase.google.com/project/sigma-hq-d4ceb/storage)
   - [ ] Click **"Get started"**
   - [ ] Choose **"Start in test mode"**
   - [ ] Select your preferred location

## ✅ Phase 7: Test Deployment
- [ ] Push any change to your main branch
- [ ] Check **Actions** tab in your GitHub repository
- [ ] Wait for the deployment to complete
- [ ] Visit your live site: `https://sigma-hq-d4ceb.web.app`

## 🎯 Expected Results
Once completed, you'll have:
- ✅ Automated deployment on every push to main branch
- ✅ Live website at: `https://sigma-hq-d4ceb.web.app`
- ✅ Working authentication system
- ✅ Firestore database ready for your data
- ✅ File storage capabilities
- ✅ Professional CI/CD pipeline

## 🆘 Need Help?
- Check `GITHUB_SETUP.md` for detailed instructions
- Check `FIREBASE_SETUP.md` for Firebase configuration
- Check `FIREBASE_SERVICE_ACCOUNT.md` for service account setup

## 🚀 Quick Commands Reference
```bash
# Local development
npm run dev

# Build locally
npm run build

# Deploy manually (after firebase login)
npm run deploy

# Check deployment status
firebase hosting:list
```

---
**Tip:** Bookmark this checklist and check off items as you complete them!

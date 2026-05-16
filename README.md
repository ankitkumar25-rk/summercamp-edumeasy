# 🎮 EduMEasy — Algebra Summer Camp Platform

EduMEasy is a premium, gamified LIVE online learning platform designed specifically for school kids (Class 6 to 10). It turns the "scary" subject of Algebra into an exciting video game adventure!

![EduMEasy Banner](client/src/assets/hero-classroom.png)

## 🚀 Key Features

- **🎮 Gamified Dashboard**: Students earn XP, level up (from Rookie to Math Wizard), and track their progress.
- **🏆 Live Leaderboard**: Real-time rankings of top students to encourage healthy competition.
- **🎥 Live Class Portal**: Integrated portal for joining daily sessions, asking doubts, and marking attendance.
- **🛡️ Secure Auth**: Production-grade authentication using **Google OAuth 2.0** and **PASETO V3** (Platform-Agnostic Security Tokens).
- **💳 Secure Payments**: Integrated Razorpay workflow for easy camp enrollment.
- **🎨 Neubrutalist UI**: A stunning "Video Game meets School" aesthetic with playful animations and bold 3D effects.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Framer Motion (Animations), CSS Modules.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Security**: PASETO (Symmetric Encryption), Passport.js (Google Strategy).
- **Payment**: Razorpay integration.

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/edumeasy.git
cd edumeasy
```

### 2. Install Dependencies
**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd client
npm install
cd ..
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
PASETO_SECRET_KEY=your_32_byte_hex_key
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4. Run the Application
**Start Backend:**
```bash
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```

## 🎨 Design Rules
EduMEasy follows a strict **"Video Game"** design language:
- **Wobbly Borders**: `border-radius: 22px` minimum.
- **3D Effects**: Thick colored borders and `box-shadow` offsets.
- **Interactive**: Bouncy hover effects and wiggling icons.

---

Made with ❤️ by the EduMEasy Team.

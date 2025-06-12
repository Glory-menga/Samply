# 🎧 Samply - Ai samples Generator

Samply is an AI-powered web platform where users can **generate, edit, and share musical samples** using text prompts. It's a one-stop creative tool for music producers who want to kickstart ideas or remix generated samples. This project was created as the **final thesis for the Multimedia and Creative Technology program** and represents a year of dedicated work.

---

## 📂 Project Structure

```
Samply/
├── backend/
│   ├── config/
│   │   └── replicate.js
│   ├── routes/
│   │   ├── community.js
│   │   ├── replicate.js
│   │   └── samples.js
│   ├── subapaseClient.js
│   ├── index.js
│   └── .env
├── Samply/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── audio/
│   │   │   │   ├── Generated_Voice.mp3
│   │   │   │   ├── intro_voice.mp3
│   │   │   │   └── Space_Background_Music.mp3
│   │   │   ├── fonts/
│   │   │   │   └── AltoneTrial-Bold.ttf
│   │   │   ├── images/
│   │   │   └── video/
│   │   ├── components/
│   │   │   ├── 3DObjects/
│   │   │   │   ├── Galaxy.jsx
│   │   │   │   ├── Metaball.jsx
│   │   │   │   └── Sphere.jsx
│   │   │   ├── background/
│   │   │   │   ├── AnimatedBackground.jsx
│   │   │   │   └── BlurredBubbleBackground.jsx
│   │   │   ├── tabs/
│   │   │   ├── Knob.jsx
│   │   │   ├── LoadingPage.jsx
│   │   │   ├── Nav.jsx
│   │   │   ├── RedirectIfLoggedIn.jsx
│   │   │   └── ScrollToTopButton.jsx
│   │   ├── context/
│   │   │   └── UserContext.jsx
│   │   ├── css/
│   │   │   ├── CommentSample.css
│   │   │   ├── Community.css
│   │   │   ├── EditSample.css
│   │   │   ├── Generate.css
│   │   │   ├── Home.css
│   │   │   ├── Knob.css
│   │   │   ├── LoadingPage.css
│   │   │   ├── Login.css
│   │   │   ├── NotFound.css
│   │   │   ├── Profile.css
│   │   │   ├── SampleGenerated.css
│   │   │   ├── Samples.css
│   │   │   ├── SavedSamples.css
│   │   │   ├── saignup.css
│   │   │   └── tabs.css
│   │   ├── pages/
│   │   │   ├── CommentSample.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── EditSample.jsx
│   │   │   ├── Generate.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── LikedSamples.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── PhoneOrTablet.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── SampleGenerated.jsx
│   │   │   ├── Samples.jsx
│   │   │   ├── SavedSamples.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── supabaseClient.js
│   └── index.html
```

---

## ✨ What Samply Can Do

- 🎼 **Generate musical samples** by typing in a creative prompt.
- 🎚️ **Edit generated samples** by:
  - Adjusting pitch (up/down)
  - Changing tempo (faster/slower)
  - Reversing the sample
- 💾 **Download original or edited samples** for use in any DAW.
- 🌐 **Community page**:
  - Like and comment on samples shared by others
  - Browse public creations for inspiration
- 👤 **User authentication** via email or Google
- 🖼️ **Upload a profile picture** and view other users’ samples
- 🎛️ **Modern audio waveform UI**, powered by Wavesurfer and Tone.js

---

## 🧠 Why I Made This

This project is my **graduation project** for the final year of my **Multimedia and Creative Technology** studies. I created Samply to **empower artists and producers** to spark creativity using AI-assisted audio generation and provide a social space to share and explore ideas.

---

## 🔗 Resources & Documentation

### 🔤 UI Effects
- [Underline effect on Nav](https://codepen.io/jstn/pen/mdoOZJ)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI (Checkbox)](https://www.radix-ui.com/primitives/docs/components/checkbox)
- [Lucide Icons](https://lucide.dev/)

### 🌌 3D & Visuals
- [3D space environment](https://youtu.be/XehC_E2cP-0?si=l53uB-NmyGMqx6Vh)
- [ChatGPT organic sphere generation](https://chatgpt.com/share/6835b2c6-abf8-800b-a2fd-34959b2d463a)
- [Three.js Docs](https://threejs.org/docs/)
- [react-three-fiber](https://docs.pmnd.rs/react-three-fiber)
- [drei helpers](https://github.com/pmndrs/drei)

### 🔊 Audio Tools
- [Tone.js](https://tonejs.github.io/)
- [Wavesurfer.js](https://wavesurfer-js.org/docs/)
- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### 🔐 Authentication / Database / Storage
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://youtu.be/1KBV8M0mpYI)
- [Supabase + React](https://dev.to/vjygour/connecting-supabase-with-react-app-346l)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

### 🤖 AI Models
- [Replicate Node.js SDK](https://www.npmjs.com/package/replicate)
- [MusicGen API](https://replicate.com/meta/musicgen/versions/671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb)
- [LLaMA-3 for prompt rewriting](https://replicate.com/meta/meta-llama-3-70b-instruct)

### 🧠 Other Tech
- [Express.js Docs](https://expressjs.com/)
- [dotenv npm](https://www.npmjs.com/package/dotenv)
- [React-toastify](https://fkhadra.github.io/react-toastify/introduction/)
- [CORS fix guide](https://medium.com/@dhanushsaireddy8/resolving-cors-issues-in-express-and-react-js-a-comprehensive-guide-31ca5d58f90b)

---

## 🚀 Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Backend (API & DB Functions)**: Hosted on [Railway](https://railway.app)
- **Database & Auth**: Managed by [Supabase](https://supabase.com)

> 🔐 **Auth**: Google & Email sign-in  
> 📁 **Storage**: Profile images and sample files

---

## 💻 How To Run Locally

### 🧩 Requirements

- Node.js v23.0.0 or higher
- Visual Studio Code

### 🖥️ Frontend

```bash
git clone https://github.com/Glory-menga/Samply.git
cd Samply/Samply
npm install
npm run dev
```

➡ Website: http://localhost:5173

---

### 🛠️ Backend

```bash
cd Samply/backend
npm install
node index.js
```

> ⚠️ Change fetch URLs in frontend from  
> `https://samply-production.up.railway.app/...` to  
> `http://localhost:5000/...` for local testing.

---

## 🧱 Supabase Setup

- **Auth**:
  - Email login
  - Google OAuth
- **Database Tables**:
  - `users`
  - `samples`
  - `comments`
  - `likes`
- **Storage**:
  - Profile pictures
  - Uploaded/generated audio

---

## 🌳 Git Workflow

- `main` – Stable production branch
- `dev` – Active development
- Feature branches:
  - `feature/threeJs-environment`
  - `bugfix/scroll-bar-community`
  - `docs/documentation`
  - `...`

Use pull requests to merge into `dev`, and later into `main`.

---

## 📬 Contact

For any questions or feedback:

📧 **Email**: mengaglory@gmail.com

---

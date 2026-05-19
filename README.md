<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BariVara - Professional House Rental Finder

BariVara is a modern, AI-powered house rental platform designed to connect homeowners and tenants seamlessly. Built with React 19, Firebase, and Google Gemini AI.

## ✨ Features

- **🤖 AI Assistant**: A built-in AI chatbot to help users find properties and answer questions about listings.
- **📝 AI Description Generator**: Landlords can generate professional property descriptions instantly using AI.
- **💡 AI Property Insights**: Smart summaries for every property, highlighting value and lifestyle benefits.
- **🚀 Professional UI**: Fast, responsive design with skeleton loaders and fluid animations.
- **🔍 Advanced Search**: Filter properties by category (Bachelor, Family, Office), area, and price range.
- **💬 Real-time Chat**: Secure messaging system for tenants and owners.
- **📱 Mobile Optimized**: PWA-ready and optimized for a native-like mobile experience.

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **AI**: Google Gemini Pro (via `@google/generative-ai`)
- **SEO**: Dynamic meta tags with `react-helmet-async`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Google AI Studio API Key (Gemini API)

### Installation

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 🌐 Deployment

This app is ready to be deployed to **Firebase Hosting**:

```bash
firebase deploy
```

---
Built with ❤️ using Google AI Studio.

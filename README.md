# DRISHTI - Disaster Intelligence Command Center 🌪️

**DRISHTI** is a real-time, highly interactive disaster intelligence and telemetry dashboard. It empowers emergency responders, volunteers, and citizens with actionable, hyper-local data to stay ahead of critical situations even before they happen.

## 🚀 Key Features

- **📡 Live Telemetry**: Real-time environmental signals (Temperature, Humidity, Precipitation, Wind) with GPU-accelerated smooth animations.
- **🗺️ Interactive Disaster Map**: A responsive, live-updating map pinpointing critical incidents, shelters, hospitals, and high-risk zones.
- **🚨 Intelligent Alerts System**: Context-aware warning system pushing vital notifications based on your exact location.
- **🤝 Volunteer Coordination**: Specialized dashboard for emergency responders to coordinate effectively.
- **📱 Mobile-First & Offline Ready**: Highly responsive design utilizing premium glassmorphism aesthetics, designed to work smoothly even on unstable connections.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Custom modern CSS with advanced CSS variables and flexbox/grid architectures.
- **Data Visualization**: Recharts
- **Mapping**: React-Leaflet
- **Animations**: Framer Motion & native CSS `@keyframes`
- **Icons**: Lucide-React

## 💻 Running Locally

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd disastermanagement
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:5173`

## 🌍 Deployment

DRISHTI is built with Vite, making it incredibly fast to build and deploy to modern edge platforms.

### Deploying to Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your GitHub repository.
4. Vercel will automatically detect that it's a Vite project. Leave the default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your app will be live in seconds!

### Deploying to Netlify
1. Push your code to a GitHub repository.
2. Go to [Netlify](https://netlify.com/) and click "Add new site" -> "Import an existing project".
3. Connect your GitHub account and select your repository.
4. Set the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.

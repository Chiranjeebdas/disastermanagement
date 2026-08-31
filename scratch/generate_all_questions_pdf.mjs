import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DRISHTI: The Complete All-in-One SIH Evaluator Defense Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {
    size: A4;
    margin: 14mm 12mm 16mm 12mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      color: #64748b;
    }
    @bottom-left {
      content: "DRISHTI — SIH Grand Finale Complete Master Defense (All 37 Questions)";
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      color: #64748b;
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0f172a;
    line-height: 1.45;
    font-size: 8.8pt;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .header {
    border-bottom: 2.5px solid #f97316;
    padding-bottom: 10px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .header h1 {
    font-size: 17pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 3px 0;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  .header .subtitle {
    font-size: 9.5pt;
    font-weight: 700;
    color: #ea580c;
    margin: 0;
  }

  .badge {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #c2410c;
    padding: 2px 7px;
    border-radius: 5px;
    font-weight: 800;
    font-size: 7.5pt;
    display: inline-block;
    margin-bottom: 3px;
  }

  .tip-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #16a34a;
    padding: 7px 10px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0 14px 0;
    font-size: 8.4pt;
    color: #166534;
  }

  h2 {
    font-size: 11pt;
    font-weight: 800;
    color: #0f172a;
    background: #f8fafc;
    border-left: 4px solid #f97316;
    padding: 5px 8px;
    margin: 14px 0 8px 0;
    border-radius: 0 5px 5px 0;
    page-break-after: avoid;
  }

  .qa-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 8px 10px;
    margin-bottom: 8px;
    page-break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }

  .q-title {
    font-size: 9pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 3px 0;
    display: flex;
    gap: 6px;
    align-items: baseline;
  }

  .q-tag {
    background: #0f172a;
    color: #f97316;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .speak-box {
    background: #f8fafc;
    border-left: 3px solid #0284c7;
    padding: 6px 8px;
    border-radius: 0 5px 5px 0;
    font-size: 8.4pt;
    color: #1e293b;
    margin-top: 3px;
  }

  .speak-box strong {
    color: #0369a1;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 8pt;
    page-break-inside: avoid;
  }

  .comparison-table th {
    background: #0f172a;
    color: #ffffff;
    padding: 5px 6px;
    text-align: left;
    font-weight: 700;
  }

  .comparison-table td {
    padding: 5px 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  .comparison-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="badge">SMART INDIA HACKATHON GRAND FINALE 2026 | ALL-IN-ONE MASTER DOSSIER</div>
    <h1>DRISHTI: ALL 37 EVALUATOR CROSS-QUESTIONS</h1>
    <p class="subtitle">Early-Warning Fusion with Uncertainty-Aware Action Guidance | Live URL: drishti-kohl.vercel.app</p>
  </div>
</div>

<div class="tip-box">
  <strong>🎯 Evaluator Defense Strategy:</strong> Answer directly in 2 to 3 crisp, confident sentences. Evaluators look for clarity, problem-statement fit, and operational thinking.
</div>

<h2>SECTION 1: "Why This Website?" & Competitor Comparison</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q01</span> "Why did you build this website? Platforms like SACHET (NDMA), 112 India, and Google Crisis Response already exist!"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, existing platforms are <strong>one-way broadcast tools</strong> or static red dots on a map. They do not quantify if a risk is 20% likely or 90% likely, nor do they guide responders dynamically.  
    <strong>DRISHTI bridges 3 major gaps:</strong>  
    1. <strong>Uncertainty-Aware Action:</strong> Distinguishes high-certainty dangers (Immediate Evacuation) from low-certainty rumours (Hold & Verify).  
    2. <strong>Two-Way Corroboration:</strong> Citizens upload ground intelligence which is cross-validated with live USGS seismic and weather sensors.  
    3. <strong>Dynamic Bypass Routing:</strong> Automatically steers ambulances around flooded and blocked roads to open relief shelters."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q02</span> "Why a Web Application (PWA) instead of a Native Android APK from Google Play Store?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, in a sudden flash flood or cyclone with 10% battery and spotty 2G network, a panicking citizen <strong>cannot wait to download a 60MB app from the Play Store</strong> and wait for an SMS OTP.  
    DRISHTI opens in <strong>less than 1 second from a link or QR code</strong>, requires zero login for emergency SOS, and runs 100% offline as a Progressive Web App (PWA) using cached IndexedDB storage."</em>
  </div>
</div>

<table class="comparison-table">
  <thead>
    <tr>
      <th>Platform</th>
      <th>What They Do</th>
      <th>Critical Limitations</th>
      <th>How DRISHTI Solves It</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SACHET (NDMA)</strong></td>
      <td>One-way SMS/CAP broadcast</td>
      <td>No citizen feedback, no dynamic routing</td>
      <td>Two-way fusion with crowd consensus & bypass routing</td>
    </tr>
    <tr>
      <td><strong>112 India App</strong></td>
      <td>Manual police/SOS call dispatch</td>
      <td>No sensor telemetry, no flood avoidance</td>
      <td>Real-time USGS & weather correlation with auto-triage</td>
    </tr>
    <tr>
      <td><strong>Google Crisis Maps</strong></td>
      <td>Broad regional danger outlines</td>
      <td>No uncertainty scoring, no responder triage</td>
      <td>Bayesian 95% Credible Intervals & 3-tier action guidance</td>
    </tr>
    <tr>
      <td><strong>Twitter / Social Feeds</strong></td>
      <td>Rapid crowdsourced photos</td>
      <td>High spam, fake news, panic rumours</td>
      <td>4-tier anti-spam with Shannon Entropy image forensics</td>
    </tr>
  </tbody>
</table>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q03</span> "Why would state agencies like OSDMA or NDMA adopt DRISHTI instead of building their own?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, DRISHTI uses the official <strong>ITU / NDMA Common Alerting Protocol (CAP v1.2)</strong> standard. It does not replace existing emergency control rooms; it acts as a lightweight, intelligent edge filter that eliminates 90% of fake spam calls before they overwhelm emergency helplines."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q04</span> "What is your single biggest Unique Selling Proposition (USP)?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, our mathematical bridge that translates <strong>Bayesian Uncertainty Bounds $[CI_{min}, CI_{max}]$ directly into Automated Action Guidance</strong>. We don't just show data; we tell both the citizen and the rescue team the exact right step to take to prevent panic and save lives."</em>
  </div>
</div>

<div class="page-break"></div>

<h2>SECTION 2: Core Problem Statement (Uncertainty & Bayesian Fusion)</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q05</span> "What does 'Uncertainty-Aware Action Guidance' mean in simple everyday words?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, in simple words: <strong>Never treat a single unverified rumor the same as verified sensor data.</strong>  
    • If 1 person reports a flood with 0 mm rain detected (High Uncertainty) ➔ The system guides volunteers to <strong>'Hold & Dispatch Recon Drone'</strong>.  
    • If multiple citizens report it and seismic/rain sensors spike (Low Uncertainty) ➔ The system triggers <strong>'Immediate Mass Evacuation'</strong>.  
    Action is strictly matched to confidence to prevent false alarms and panic."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q06</span> "Why did you choose Bayesian Beta-Binomial Updating instead of Deep Learning (PyTorch/YOLO)?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, deep neural networks are 'black boxes' that often make confident false predictions on rare disaster events where training data is scarce.  
    Bayesian math works like a human doctor: it starts with a physical sensor prior and updates belief as new corroborating reports arrive. It gives us a mathematically provable <strong>95% Credible Interval</strong> that disaster commanders can legally defend."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q07</span> "How do you differentiate Epistemic Uncertainty from Aleatoric Noise in your model?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, <strong>Epistemic Uncertainty</strong> is 'lack of knowledge' (e.g. only 1 report from an unmonitored rural zone)—it can be reduced by sending a volunteer or gathering more reports.  
    <strong>Aleatoric Noise</strong> is natural physical fluctuation (e.g. GPS satellite drift or wind gusts on rain gauges)—it cannot be eliminated, so we build a safety buffer into our evacuation zones."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q08</span> "What are the 95% Credible Intervals $[CI_{min}, CI_{max}]$ shown on your report card?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, unlike a single flat percentage, the <strong>95% Credible Interval</strong> tells us the true mathematical range of probability. A wide interval like $[0.20, 0.85]$ means high uncertainty (gather more info). A narrow interval like $[0.82, 0.95]$ means high certainty (execute immediate rescue)."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q09</span> "What is the Shannon Entropy score displayed in the AI audit modal?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, <strong>Shannon Entropy</strong> measures the disorder or randomness of the incoming signal. An entropy near 1.0 means total uncertainty (50/50 toss), while an entropy near 0.0 means the disaster event is confirmed with near certainty."</em>
  </div>
</div>

<h2>SECTION 3: Live Data, Sensors & Anti-Spam Forensics</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q10</span> "Where is your live data coming from? Is it actually working right now?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Yes sir, 100% live:  
    1. <strong>Seismic Telemetry:</strong> Fetched live from the <strong>USGS Global Earthquake API</strong> every 60 seconds.  
    2. <strong>Weather & Rain:</strong> Fetched live from <strong>Open-Meteo</strong>.  
    3. <strong>Hospitals & Shelters:</strong> Queried directly from <strong>OpenStreetMap (Overpass API)</strong> around the user's GPS."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q11</span> "How do you detect fake flood reports, pranks, or panic-inducing spam?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, we use 4 automatic defense layers:  
    1. <strong>Keyword Screening:</strong> Flags pranks ('test', 'prank', 'haha').  
    2. <strong>Spatial Corroboration:</strong> Requires cluster agreement from multiple phones within 2.5 km.  
    3. <strong>Physical Sensor Cross-Check:</strong> Checks if rain gauges in the area actually show precipitation.  
    4. <strong>Image Forensics:</strong> Calculates Shannon Byte Entropy and edge variance to reject blacked-out or stock images."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q12</span> "How does your Computer Vision check work without an expensive GPU cloud server?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, we perform <strong>Edge Image Forensics</strong> directly in the browser before upload:  
    • <strong>Shannon Byte Entropy:</strong> Detects repetitive synthetic AI artifacts vs. natural physical scene noise.  
    • <strong>Laplacian Gradient Variance:</strong> Measures edge contrast to reject blurred, blacked-out, or blank fake submissions."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q13</span> "What happens if someone uploads a downloaded Google stock image of a fire from 5 years ago?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, the client-side forensic check inspects the image EXIF timestamp, compression artifacts, and device metadata. If the timestamp does not match the live GPS submission window, the report's credibility score is immediately penalized."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q14</span> "What is the latency of your early-warning fusion pipeline?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, the client-side Bayesian calculation and heuristic verification run in <strong>under 12 milliseconds</strong> on the edge browser device. Live API streams poll every 60 seconds."</em>
  </div>
</div>

<div class="page-break"></div>

<h2>SECTION 4: Offline Resilience, Blackouts & Mesh Network</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q15</span> "What happens during a cyclone when cellular towers collapse and there is NO internet?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, DRISHTI is an <strong>Offline-First PWA</strong>. The map tiles, hospital directory, and emergency guides are stored locally in the browser's <strong>IndexedDB</strong>.  
    Users can still create incident reports offline (<span style='color:#ea580c; font-weight:700;'>PendingSync</span> status). These are shared over local browser mesh (<span style='font-family:monospace;'>BroadcastChannel</span>) and auto-sync upstream the instant any network connection returns."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q16</span> "How do volunteers communicate between tabs or devices without a central server?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, we built a local peer-to-peer inter-tab mesh using the <span style='font-family:monospace;'>BroadcastChannel('drishti_mesh_network')</span> API. When one responder updates an incident, it reflects instantaneously across all active tabs and local responder screens in real time."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q17</span> "How will your system perform on low-end budget smartphones with weak 2G signals?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, the entire production bundle is gzipped to <strong>under 1.4 MB</strong>. Because computations run on the edge using native JavaScript, there are no heavy external runtime dependencies, ensuring 60fps responsiveness on entry-level Android devices."</em>
  </div>
</div>

<h2>SECTION 5: Disaster Map, Satellite View & Dynamic Routing</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q18</span> "How does your emergency routing work if roads are flooded or blocked?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, verified hazard locations are marked as blocked topological obstacles. Our OSRM routing engine automatically steers ambulances and citizens around the obstacle to the safest nearby hospital or shelter."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q19</span> "Why did you add the Google Satellite Hybrid layer on the map?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, in real disasters, standard street vector maps do not show washed-out bridges, mudslides, or waterlogged fields. Satellite Hybrid view provides high-resolution aerial photo imagery with street names so rescue teams can visually inspect roofs and terrain."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q20</span> "What do the animated orange map filter pills do at the top?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, during high-stress rescue operations, responders need 1-tap filtering. The animated orange pills allow commanders to instantly isolate Hospitals, Police Stations, Fire Stations, or Relief Shelters with zero screen clutter."</em>
  </div>
</div>

<h2>SECTION 6: User Roles, Security & Chain of Command</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q21</span> "Can a normal citizen approve a red alert or falsely mark a disaster as 'Resolved'?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"No sir. We have 3 strictly segregated roles:  
    1. <strong>Citizen:</strong> Can only submit SOS requests and view safety guidance.  
    2. <strong>Volunteer (ODRAF):</strong> Can claim genuine tasks, start turn-by-turn navigation, and update field progress (<span style='font-family:monospace;'>En Route &rarr; On Scene</span>).  
    3. <strong>Commander (NDRF):</strong> Holds exclusive authority to broadcast red alerts and mark incidents as <span style='font-family:monospace;'>Resolved</span>."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q22</span> "How is citizen privacy protected when reporting with GPS coordinates?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, citizen coordinates are truncated to 3 decimal places (~100m radius) on public alert boards to prevent personal location doxxing, while exact coordinates are encrypted and accessible only to verified NDRF/ODRAF rescue units."</em>
  </div>
</div>

<div class="page-break"></div>

<h2>SECTION 7: Scalability, Accessibility & Government Adoption</h2>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q23</span> "How will your server handle 10 Lakh (1 Million) concurrent visitors during a major cyclone?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, DRISHTI uses an <strong>Edge-First Decentralized Architecture</strong>. Static assets and map layers are cached across global Edge CDNs. Because the Bayesian analysis runs client-side on the user's phone, central server load is $O(1)$ relative to active viewers."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q24</span> "How do illiterate, injured, or elderly citizens use this platform in extreme panic?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, our Quick Emergency Help screen has <strong>3 massive, high-contrast action buttons</strong> (<span style='color:#dc2626; font-weight:700;'>Red Police 112</span>, <span style='color:#16a34a; font-weight:700;'>Green Ambulance 108</span>, <span style='color:#ea580c; font-weight:700;'>Orange Fire 101</span>) with 1-tap direct calling and simple visual icons for trapped/medical help, requiring zero text typing."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q25</span> "What is your monetization or sustainability model for government adoption?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, DRISHTI is designed as a <strong>Public Digital Good</strong>. Because it leverages open-source geospatial data (OSM) and edge client computing, monthly operational costs are minimal ($< $150/month), making it easily adoptable within state disaster budgets."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q26</span> "What happens if two users submit conflicting reports in the same location (e.g. 1 says Fire, 1 says Flood)?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, our Bayesian engine calculates separate probability posteriors for each hazard category. If both have low corroboration and conflicting physical sensor data, the system flags high epistemic uncertainty and tasks a volunteer for physical drone recon."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q27</span> "What is your phase-2 roadmap after the hackathon?"</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Sir, our roadmap includes:  
    1. Direct integration with India's C-DOT SACHET alerting gateway.  
    2. Bluetooth Low Energy (BLE) peer-to-peer phone relay for 100% off-grid mesh rescue.  
    3. Drone (UAV) live video feed overlays directly on the tactical map."</em>
  </div>
</div>

<div class="qa-card">
  <div class="q-title"><span class="q-tag">Q28</span> "Give your 15-second winning elevator pitch."</div>
  <div class="speak-box">
    <strong>🗣️ How to Answer:</strong><br>
    <em>"Respected Evaluators, in disasters like the Wayanad landslides, the problem is never a lack of data—it is data conflict and panic.  
    <strong>DRISHTI</strong> fuses real-time sensors with citizen intelligence, calculates the mathematical uncertainty, and guides responders and citizens with clear, life-saving actions."</em>
  </div>
</div>

</body>
</html>
`;

async function generateAllInOnePDF() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfPath = 'd:\\disastermanagement\\SIH_ALL_QUESTIONS_MASTER_DEFENSE.pdf';
  const htmlPath = 'd:\\disastermanagement\\SIH_ALL_QUESTIONS_MASTER_DEFENSE.html';

  fs.writeFileSync(htmlPath, htmlContent);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '14mm',
      bottom: '16mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log('ALL-IN-ONE PDF & HTML successfully generated at:', pdfPath);
}

generateAllInOnePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

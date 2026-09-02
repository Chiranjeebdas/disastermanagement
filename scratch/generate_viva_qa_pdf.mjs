import puppeteer from 'puppeteer';
import fs from 'fs';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Technical Approaches - DRISHTI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {
    size: A4;
    margin: 10mm 10mm 12mm 10mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
    }
    @bottom-left {
      content: "Technical Approaches • DRISHTI Disaster Management System";
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0f172a;
    line-height: 1.45;
    font-size: 8.5pt;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  .header {
    border-bottom: 3px solid #0284c7;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .header-left h1 {
    font-size: 17pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 2px 0;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  .header-left .subtitle {
    font-size: 9pt;
    font-weight: 600;
    color: #0284c7;
    margin: 0;
  }

  .badge {
    background: #e0f2fe;
    border: 1px solid #bae6fd;
    color: #0369a1;
    padding: 2.5px 7px;
    border-radius: 4px;
    font-weight: 800;
    font-size: 7pt;
    display: inline-block;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .meta-box {
    text-align: right;
    font-size: 7.5pt;
    color: #64748b;
    line-height: 1.35;
  }

  .meta-box strong {
    color: #0f172a;
  }

  .qa-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 9px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }

  .qa-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .qa-module-tag {
    font-size: 6.8pt;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
    padding: 1.5px 5px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .qa-question {
    font-size: 9.2pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 6px;
    border-left: 3.5px solid #0284c7;
    padding-left: 6px;
    line-height: 1.35;
  }

  .qa-answer {
    font-size: 8.1pt;
    color: #1e293b;
    line-height: 1.42;
  }

  .bullet-point {
    margin-bottom: 3px;
  }

  .bullet-point strong {
    color: #0369a1;
  }

  .why-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 3.5px solid #16a34a;
    padding: 5px 8px;
    border-radius: 0 4px 4px 0;
    margin-top: 5px;
    font-size: 7.8pt;
    color: #14532d;
    line-height: 1.38;
  }

  .why-title {
    font-weight: 800;
    color: #15803d;
    margin-bottom: 2px;
  }

  table.summary-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 7.6pt;
    page-break-inside: avoid;
  }

  table.summary-table th {
    background: #0f172a;
    color: #ffffff;
    padding: 5px 6.5px;
    text-align: left;
    font-weight: 700;
    font-size: 7.4pt;
    border: 1px solid #0f172a;
  }

  table.summary-table td {
    padding: 4.5px 6.5px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
    line-height: 1.35;
  }

  table.summary-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="header-left">
    <div class="badge">DRISHTI PLATFORM</div>
    <h1>Technical Approaches</h1>
    <p class="subtitle">AI, Algorithms, Thresholds & API Architecture Guide</p>
  </div>
  <div class="meta-box">
    <div><strong>Document:</strong> Technical Approaches Guide</div>
    <div><strong>Format:</strong> Q&A with Rules & Justification</div>
    <div><strong>System:</strong> DRISHTI (Disaster Management)</div>
  </div>
</div>

<!-- Q1: REPORT SECTION -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 1: REPORT SECTION & AI VERIFICATION</span>
  </div>
  <div class="qa-question">
    Q1: "In the Report section, which AI is used, how does the algorithm verify fake vs genuine reports, which API is used, and why this model instead of heavy LLMs?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa AI Hai:</strong> Rule-Based NLP Agent aur In-Browser Computer Vision (Image Checker).</div>
    <div class="bullet-point"><strong>Kaise Check Karta Hai (Algorithm Rules):</strong>
      <div style="margin-left: 8px; margin-top: 2px;">
        1. <strong>Fake Filter:</strong> Agar message me <em>'test', 'prank', 'joke', 'haha'</em> likha hai, ya 15 letter se chota hai, ya photo mobile ka screenshot hai &rarr; AI turant use <strong>Fake / Spam</strong> mark kar deta hai.<br>
        2. <strong>Zameen Check (Terrain Physics):</strong> Agar Cuttack jaisi flat zameen par koi <em>'Landslide'</em> report karega, toh AI reject kar dega kyunki flat zameen par pahad nahi hote.<br>
        3. <strong>Points Add Karna:</strong> Bada descriptive message (+25), GPS location (+15), asli camera photo (+20), mausam match (+20) milte hain.<br>
        4. <strong>Faisla:</strong>
        <span style="color: #16a34a; font-weight: 700;">Score 70% se zyada &rarr; Genuine (Asli Report)</span>, 
        <span style="color: #ea580c; font-weight: 700;">40% se 70% &rarr; Needs Review</span>, 
        <span style="color: #dc2626; font-weight: 700;">40% se kam &rarr; Fake / Spam</span>.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi APIs:</strong> Phone ka GPS (<code>Geolocation API</code>), Photo checker (<code>Canvas API</code>), aur local storage (<code>IndexedDB</code>).</div>
    <div class="why-box">
      <div class="why-title">🎤 Why This Model & Why Not Heavy LLMs (GPT-4 / Cloud CNN)?</div>
      <em>"Sir, disaster me internet aur tower band ho jate hain. Agar hum heavy GPT-4 ya cloud model lagate, toh bina internet ke app fail ho jata aur mehenga bhi padta. Hamara model browser ke CPU par 1 millisecond me bina internet ke 100% offline chalta hai."</em>
    </div>
  </div>
</div>

<!-- Q2: LIVE ALERTS -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 2: LIVE ALERTS & TELEMETRY</span>
  </div>
  <div class="qa-question">
    Q2: "In the Live Alerts section, how are earthquakes and floods detected, what algorithm is used, and which APIs are integrated?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa System Hai:</strong> Telemetry Anomaly Detector (Live Sensor Processor).</div>
    <div class="bullet-point"><strong>Kaise Calculate Karta Hai (Algorithm Rules):</strong>
      <div style="margin-left: 8px; margin-top: 2px;">
        1. <strong>Earthquake (Bhukamp):</strong> USGS API se live Richter scale magnitude dekhta hai:
        <br>&bull; Agar magnitude <strong>5.5 se zyada</strong> hai &rarr; <strong>Critical Red Alert</strong> banta hai.
        <br>&bull; Agar magnitude <strong>4.0 se 5.4 ke beech</strong> hai &rarr; <strong>Warning Yellow Alert</strong> banta hai.
        <br>&bull; Kitne kilometer tak asar hoga (Impact Radius) nikal kar map par circle bana deta hai.
        <br>2. <strong>Flood (Baadh) & Toofan:</strong> Open-Meteo satellite se barish aur hawa check karta hai:
        <br>&bull; Agar barish <strong>5 mm/hour se zyada</strong> hai &rarr; <strong>Flash Flood Warning</strong> banti hai.
        <br>&bull; Agar hawa ki speed <strong>35 km/hour se zyada</strong> hai &rarr; <strong>Cyclone / Gale Alert</strong> banta hai.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi APIs:</strong> <code>USGS Global Earthquake API</code> aur <code>Open-Meteo Weather API</code>.</div>
    <div class="why-box">
      <div class="why-title">🎤 Why These APIs & Why Not Paid Ones?</div>
      <em>"Sir, USGS aur Open-Meteo government aur open-science live feeds hain. Yeh 100% free hain, inme koi billing limit nahi hoti aur asli physical sensors ka data deti hain jisse jhoothe alerts nahi aate."</em>
    </div>
  </div>
</div>

<!-- Q3: RISK FORECAST & RADAR -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 3: RISK PROBABILITY & RADAR</span>
  </div>
  <div class="qa-question">
    Q3: "In the Dashboard & Risk Forecast section, how is disaster risk probability calculated, and why use this model instead of simple percentages?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa Model Hai:</strong> Bayesian Bell Curve (Risk Graph) aur 6-Axis Radar Chart.</div>
    <div class="bullet-point"><strong>Kaise Calculate Karta Hai (Algorithm Rules):</strong>
      <div style="margin-left: 8px; margin-top: 2px;">
        1. <strong>Bell Curve Graph:</strong> Live mausam ke hisaab se curve ka peak aage-piche shift hota hai:
        <br>&bull; Normal mausam me curve <strong>Low Risk (20-25%)</strong> par rehta hai.
        <br>&bull; Jaise hi barish aur hawa badhti hai, curve ka peak <strong>High Risk (75-85%)</strong> par shift ho jata hai.
        <br>2. <strong>Radar Chart:</strong> Ek sath 6 khatron (Flood, Cyclone, Heatwave, Earthquake, Drought, Tsunami) ka live 0 se 100% meter ek hi hexagon graph me dikhata hai.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi API / Tool:</strong> <code>Open-Meteo Weather API</code> aur <code>Recharts</code> visualization library.</div>
    <div class="why-box">
      <div class="why-title">🎤 Why This Model & Why Not Simple Static Percentages?</div>
      <em>"Sir, sirf '60% barish hogi' bolne se disaster ka exact khatra samajh nahi aata. Bell Curve graph citizen aur rescue teams ko poora probability spread aur sensor ka confidence dikhata hai."</em>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- Q4: DISASTER MAP & ROUTING -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 4: DISASTER MAP & SAFE ROUTING</span>
  </div>
  <div class="qa-question">
    Q4: "In the Map & Navigation section, how does shortest safe path routing work, which algorithm is used, and what happens when internet goes down?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa Algorithm Hai:</strong>
      <div style="margin-left: 8px; margin-top: 2px;">
        1. <strong>Shortest Safe Path ke liye:</strong> <strong>Dijkstra / OSRM Algorithm</strong> (ye road network par flooded aur blocked raste ko chhodkar sabse chhota aur safe rasta nikalta hai).<br>
        2. <strong>Do Points ke beech Distance ke liye:</strong> <strong>Haversine Algorithm</strong> (GPS coordinates se exact kilometer distance calculate karta hai).<br>
        3. <strong>Offline Mode ke liye:</strong> Agar internet band ho, toh hamara offline curve formula 32 km/h emergency speed ke hisaab se turn-by-turn rasta aur pahuche ka time (ETA) nikal deta hai.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi APIs:</strong> <code>Project OSRM Routing Machine</code>, <code>Komoot Photon OpenStreetMap API</code>, aur <code>Leaflet Map</code>.</div>
    <div class="why-box">
      <div class="why-title">🎤 Why Leaflet & OSRM Instead of Google Maps API?</div>
      <em>"Sir, Google Maps API mehenge charges lagati hai aur offline caching allow nahi karti. Leaflet aur OSRM 100% free hain, open-source hain aur flooded khatron ko bypass karke offline safe path nikalte hain."</em>
    </div>
  </div>
</div>

<!-- Q5: NEARBY HELP & 1-TAP SOS -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 5: NEARBY HELP & 1-TAP SOS</span>
  </div>
  <div class="qa-question">
    Q5: "In the Emergency Help section, how are nearby hospitals and shelters found, and how does 1-tap SOS work?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa Algorithm Hai:</strong> <strong>Bounding Box Search + Proximity Sorting</strong>.
      <div style="margin-left: 8px; margin-top: 2px;">
        User ke GPS se 15-45km radius me hospitals, police station, fire brigade, aur cyclone shelter dhoondh kar sabse paas wale ko top par sort karta hai.
      </div>
    </div>
    <div class="bullet-point"><strong>1-Tap SOS Kaise Kaam Karta Hai:</strong>
      <div style="margin-left: 8px; margin-top: 2px;">
        Direct phone ka dialer open karta hai bina kisi typing ke:
        <br>&bull; Police: <code>112</code> &bull; Ambulance: <code>108</code> &bull; Fire Brigade: <code>101</code>
        <br>Sath hi WhatsApp/SMS par exact GPS location broadcast kar deta hai.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi APIs:</strong> <code>Komoot Photon OSM API</code>, <code>Tel URI Protocol</code>, aur <code>Web Share API</code>.</div>
    <div class="why-box">
      <div class="why-title">🎤 Why Direct Hardware Protocol?</div>
      <em>"Sir, emergency me victim ke paas type karne ka time nahi hota. 1-Tap direct phone call lagata hai aur bina internet ke location share kar deta hai."</em>
    </div>
  </div>
</div>

<!-- Q6: VOLUNTEER DASHBOARD & TRIAGE -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 6: VOLUNTEER DASHBOARD & TRIAGE</span>
  </div>
  <div class="qa-question">
    Q6: "In the Volunteer Dashboard, how are genuine incidents prioritized and dispatched to volunteers?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa Algorithm Hai:</strong> <strong>Priority Triage Sorting + 6-Step Mission Flow</strong>.
      <div style="margin-left: 8px; margin-top: 2px;">
        1. Sabhi fake aur unverified reports ko hata deta hai (sirf <code>isGenuine === true</code> dikhti hain).<br>
        2. Priority ranking: <strong>Critical (Jaan ka khatra) &gt; Medium &gt; Low</strong>.<br>
        3. Same priority me jo incident volunteer ke sabse paas hai, wo sabse upar aata hai.<br>
        4. <strong>6-Step Flow:</strong> Report aayi &rarr; Claim kiya &rarr; EnRoute (Raste me) &rarr; OnScene (Pahucha) &rarr; Madad di &rarr; Resolved (Complete).
      </div>
    </div>
    <div class="why-box">
      <div class="why-title">🎤 Why This Model?</div>
      <em>"Sir, volunteers ka time bohot keemti hota hai. Ye system fake calls ko rokta hai aur ensure karta hai ki duplicate rescue teams ek hi jagah na jayein."</em>
    </div>
  </div>
</div>

<!-- Q7: OFFLINE DATABASE & SYNC -->
<div class="qa-card">
  <div class="qa-card-header">
    <span class="qa-module-tag">MODULE 7: OFFLINE PERSISTENCE & SYNC</span>
  </div>
  <div class="qa-question">
    Q7: "In the Offline Data section, how does the app store data during network blackouts and sync when internet comes back?"
  </div>
  <div class="qa-answer">
    <div class="bullet-point"><strong>Kaunsa Architecture Hai:</strong> <strong>IndexedDB Local Database + Offline Sync Queue</strong>.
      <div style="margin-left: 8px; margin-top: 2px;">
        1. Internet na hone par report phone ke <code>IndexedDB</code> me <code>PendingSync</code> tag ke sath save ho jaati hai.<br>
        2. Jaise hi internet aata hai, hamara <code>OfflineSyncManager</code> background me chupke se reports server par sync karke status <code>Verified</code> kar deta hai.
      </div>
    </div>
    <div class="bullet-point"><strong>Kaunsi Browser APIs:</strong> <code>IndexedDB v2</code> (5 Stores) aur <code>Vite PWA Service Worker</code>.</div>
    <div class="why-box">
      <div class="why-title">🎤 Why IndexedDB Why Not LocalStorage?</div>
      <em>"Sir, LocalStorage sirf 5MB data rakh sakta hai aur phone ko hang kar deta hai. IndexedDB 500MB+ data aur photos ko bina kisi UI lag ke offline store kar sakta hai."</em>
    </div>
  </div>
</div>

<!-- SUMMARY TABLE -->
<table class="summary-table">
  <thead>
    <tr>
      <th style="width: 20%;">Section</th>
      <th style="width: 25%;">Kaunsa Model Hai?</th>
      <th style="width: 30%;">Kaunsa Algorithm Chal Raha Hai?</th>
      <th style="width: 25%;">Why This Model? (1 Line)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Report Section</strong></td>
      <td>Bayesian NLP + Image Checker</td>
      <td>Points Scoring (&ge; 70% Genuine, &lt; 40% Spam)</td>
      <td>Bina internet ke phone me 1ms me chalta hai.</td>
    </tr>
    <tr>
      <td><strong>2. Live Alerts</strong></td>
      <td>Earthquake & Flood Detector</td>
      <td>USGS Richter (&ge; 5.5 Critical) + Rain (&ge; 5mm Flood)</td>
      <td>Real government sensor data, zero false alarms.</td>
    </tr>
    <tr>
      <td><strong>3. Risk Forecast</strong></td>
      <td>Bayesian Bell Curve + Radar</td>
      <td>Live Weather Shift (Low 25% &rarr; High 85%)</td>
      <td>Static number ke badle complete risk spread dikhata hai.</td>
    </tr>
    <tr>
      <td><strong>4. Disaster Map</strong></td>
      <td>OSRM Dijkstra + Sinusoidal</td>
      <td>Haversine Distance + Flooded Obstacle Bypass</td>
      <td>100% Free, open-source aur offline safe rasta deta hai.</td>
    </tr>
    <tr>
      <td><strong>5. Volunteer Desk</strong></td>
      <td>Priority Triage + 6-Step Flow</td>
      <td>Critical &gt; Medium &gt; Nearest Proximity</td>
      <td>Fake calls rokta hai aur duplicate rescue bachata hai.</td>
    </tr>
    <tr>
      <td><strong>6. Offline Sync</strong></td>
      <td>IndexedDB + Sync Queue</td>
      <td>FIFO Auto Reconnection Sync</td>
      <td>500MB+ offline storage deta hai bina phone hang kiye.</td>
    </tr>
  </tbody>
</table>

</body>
</html>
`;

async function generateCleanTitlePDF() {
  console.log('Launching Puppeteer to generate Technical Approaches PDF with clean heading...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfPath = 'd:\\disastermanagement\\Technical_Approaches.pdf';
  const htmlPath = 'd:\\disastermanagement\\Technical_Approaches.html';

  fs.writeFileSync(htmlPath, htmlContent);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm'
    }
  });

  await browser.close();
  console.log('Technical Approaches PDF successfully generated at:', pdfPath);
}

generateCleanTitlePDF().catch(err => {
  console.error('Error generating clean title PDF:', err);
  process.exit(1);
});

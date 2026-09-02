import puppeteer from 'puppeteer';
import fs from 'fs';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Technical Approach</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {
    size: A4;
    margin: 10mm 12mm 12mm 12mm;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
    }
    @bottom-left {
      content: "Technical Approach";
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
    line-height: 1.5;
    font-size: 8.8pt;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Clean Minimal Header */
  .main-header {
    border-bottom: 2.5px solid #0284c7;
    padding-bottom: 8px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .main-header h1 {
    font-size: 20pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  .main-header .header-tag {
    font-size: 8pt;
    font-weight: 700;
    color: #0284c7;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* Q&A Cards */
  .qa-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }

  .qa-question {
    font-size: 9.5pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 6px;
    border-left: 3.5px solid #0284c7;
    padding-left: 8px;
    line-height: 1.35;
  }

  .qa-answer {
    font-size: 8.5pt;
    color: #1e293b;
    line-height: 1.45;
  }

  .qa-item {
    margin-bottom: 4px;
  }

  .qa-item strong {
    color: #0369a1;
  }

  .rule-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 8.2pt;
    line-height: 1.4;
  }

  .rule-line {
    margin-bottom: 2px;
  }

  .rule-line strong {
    color: #0f172a;
  }

  .why-box {
    background: #f0fdf4;
    border-left: 3px solid #16a34a;
    padding: 6px 10px;
    border-radius: 0 4px 4px 0;
    margin-top: 6px;
    font-size: 8.2pt;
    color: #14532d;
    line-height: 1.4;
  }

  .why-box strong {
    color: #15803d;
  }

  /* Clean Summary Table */
  table.clean-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 14px;
    font-size: 8pt;
    page-break-inside: avoid;
  }

  table.clean-table th {
    background: #0f172a;
    color: #ffffff;
    padding: 6px 8px;
    text-align: left;
    font-weight: 700;
    font-size: 7.8pt;
    border: 1px solid #0f172a;
    text-transform: uppercase;
  }

  table.clean-table td {
    padding: 5.5px 8px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
    line-height: 1.35;
  }

  table.clean-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<!-- Header -->
<div class="main-header">
  <h1>Technical Approach</h1>
  <span class="header-tag">DRISHTI PLATFORM</span>
</div>

<!-- Q1: REPORT SECTION -->
<div class="qa-card">
  <div class="qa-question">
    Q1: In the Report Section, which AI is used, how does the algorithm verify fake vs genuine reports, which API is used, and why this model?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa AI Hai:</strong> Rule-Based NLP Agent aur In-Browser Computer Vision (Image Checker).</div>
    
    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Fake Filter:</strong> Agar description me <em>'test', 'prank', 'joke', 'haha'</em> likha hai, ya 15 letter se chota message hai, ya photo mobile ka screenshot hai &rarr; AI use turant <strong>Fake / Spam</strong> mark kar deta hai.</div>
      <div class="rule-line">&bull; <strong>Zameen Physics Check:</strong> Flat zameen (Cuttack) par agar koi <em>'Landslide'</em> report karega, toh AI use reject kar dega kyunki flat zameen par pahad nahi hote.</div>
      <div class="rule-line">&bull; <strong>Points & Thresholds:</strong> Bada message (+25), GPS (+15), photo (+20), mausam match (+20) se score banta hai:
        <span style="color:#16a34a; font-weight:700;">Score 70% se zyada &rarr; Genuine (Asli)</span>, 
        <span style="color:#ea580c; font-weight:700;">40% se 70% &rarr; Needs Review</span>, 
        <span style="color:#dc2626; font-weight:700;">40% se kam &rarr; Fake / Spam</span>.
      </div>
    </div>

    <div class="qa-item"><strong>Kaunsi APIs:</strong> Mobile ka GPS (<code>Geolocation API</code>), Photo checker (<code>Canvas API</code>), aur local storage (<code>IndexedDB</code>).</div>

    <div class="why-box">
      <strong>Why this model:</strong> Disaster me internet band ho jata hai. Heavy GPT-4 ya cloud model bina internet fail ho jate. Hamara model browser ke CPU par 1 millisecond me bina internet ke 100% offline chalta hai.
    </div>
  </div>
</div>

<!-- Q2: LIVE ALERTS -->
<div class="qa-card">
  <div class="qa-card-header">
  </div>
  <div class="qa-question">
    Q2: In the Live Alerts section, how are earthquakes and floods detected, which algorithm is used, and which APIs are integrated?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa System Hai:</strong> Telemetry Anomaly Detector (Live Sensor Processor).</div>

    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Earthquake (Bhukamp):</strong> USGS API se live Richter magnitude dekhta hai:
        <strong>Magnitude 5.5 se zyada</strong> &rarr; <span style="color:#dc2626; font-weight:700;">Critical Red Alert</span>, 
        <strong>4.0 se 5.4</strong> &rarr; <span style="color:#ea580c; font-weight:700;">Warning Alert</span>. Sath hi map par impact radius ka circle bana deta hai.
      </div>
      <div class="rule-line">&bull; <strong>Flood (Baadh) & Toofan:</strong> Open-Meteo satellite se live barish aur hawa check karta hai:
        <strong>Barish 5 mm/hour se zyada</strong> &rarr; <span style="color:#dc2626; font-weight:700;">Flash Flood Warning</span>, 
        <strong>Hawa 35 km/hour se zyada</strong> &rarr; <span style="color:#dc2626; font-weight:700;">Cyclone / Gale Alert</span>.
      </div>
    </div>

    <div class="qa-item"><strong>Kaunsi APIs:</strong> <code>USGS Global Earthquake API</code> aur <code>Open-Meteo Weather API</code>.</div>

    <div class="why-box">
      <strong>Why these APIs:</strong> USGS aur Open-Meteo open-science live feeds hain jo 100% free hain, inme koi billing limit nahi hoti aur real sensors ka data milta hai.
    </div>
  </div>
</div>

<!-- Q3: RISK FORECAST -->
<div class="qa-card">
  <div class="qa-question">
    Q3: In the Dashboard & Risk Forecast section, how is disaster risk probability calculated, and why use this model instead of simple percentages?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa Model Hai:</strong> Bayesian Bell Curve (Risk Graph) aur 6-Axis Radar Chart.</div>

    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Bell Curve Graph:</strong> Live mausam ke hisaab se curve ka peak aage-piche shift hota hai:
        Normal mausam me curve <strong>Low Risk (20-25%)</strong> par rehta hai, lekin barish aur hawa badhne par curve ka peak <strong>High Risk (75-85%)</strong> par shift ho jata hai.
      </div>
      <div class="rule-line">&bull; <strong>Radar Chart:</strong> Ek sath 6 khatron (Flood, Cyclone, Heatwave, Earthquake, Drought, Tsunami) ka live 0 se 100% meter ek hi graph me dikhata hai.</div>
    </div>

    <div class="qa-item"><strong>Kaunsi API / Tool:</strong> <code>Open-Meteo Weather API</code> aur <code>Recharts</code> library.</div>

    <div class="why-box">
      <strong>Why this model:</strong> Sirf '60% barish hogi' bolne ke badle, Bell Curve graph rescue teams ko poora risk spread aur sensor confidence dikhata hai.
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- Q4: DISASTER MAP & ROUTING -->
<div class="qa-card">
  <div class="qa-question">
    Q4: In the Map & Navigation section, how does shortest safe path routing work, which algorithm is used, and what happens when internet goes down?
  </div>
  <div class="qa-answer">
    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Shortest Safe Path ke liye:</strong> <strong>Dijkstra / OSRM Algorithm</strong> (ye road network par flooded aur blocked raste ko bypass karke sabse chhota aur safe road rasta nikalta hai).</div>
      <div class="rule-line">&bull; <strong>Distance ke liye:</strong> <strong>Haversine Algorithm</strong> (GPS coordinates se exact kilometer distance calculate karta hai).</div>
      <div class="rule-line">&bull; <strong>Offline Mode ke liye:</strong> Agar internet band ho, toh hamara offline curve formula 32 km/h emergency speed ke hisaab se turn-by-turn rasta aur pahuche ka time (ETA) nikal deta hai.</div>
    </div>

    <div class="qa-item"><strong>Kaunsi APIs:</strong> <code>Project OSRM Routing Machine</code>, <code>Komoot Photon OpenStreetMap API</code>, aur <code>Leaflet Map</code>.</div>

    <div class="why-box">
      <strong>Why Leaflet & OSRM:</strong> Google Maps mehenga hai aur offline caching allow nahi karta. Leaflet aur OSRM 100% free hain, open-source hain aur flooded khatron ko bypass karke offline safe path nikalte hain.
    </div>
  </div>
</div>

<!-- Q5: NEARBY HELP & 1-TAP SOS -->
<div class="qa-card">
  <div class="qa-question">
    Q5: In the Emergency Help section, how are nearby hospitals and shelters found, and how does 1-tap SOS work?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa Algorithm Hai:</strong> <strong>Bounding Box Search + Proximity Sorting</strong> (User ke GPS se 15-45km radius me hospitals, police thana, fire brigade, aur shelters dhoondh kar sabse paas wale ko top par sort karta hai).</div>

    <div class="rule-box">
      <div class="rule-line">&bull; <strong>1-Tap SOS:</strong> Direct phone ka dialer open karta hai bina kisi typing ke (Police: <code>112</code>, Ambulance: <code>108</code>, Fire: <code>101</code>) aur sath hi WhatsApp/SMS par exact GPS location share kar deta hai.</div>
    </div>

    <div class="qa-item"><strong>Kaunsi APIs:</strong> <code>Komoot Photon OSM API</code>, <code>Tel URI Protocol</code>, aur <code>Web Share API</code>.</div>

    <div class="why-box">
      <strong>Why direct protocol:</strong> Emergency me victim ke paas type karne ka time nahi hota. 1-Tap direct phone call lagata hai aur location share kar deta hai.
    </div>
  </div>
</div>

<!-- Q6: VOLUNTEER DASHBOARD & TRIAGE -->
<div class="qa-card">
  <div class="qa-question">
    Q6: In the Volunteer Dashboard, how are genuine incidents prioritized and dispatched to volunteers?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa Algorithm Hai:</strong> <strong>Priority Triage Sorting + 6-Step Mission Lifecycle</strong>.</div>

    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Triage Rules:</strong> Sabhi fake aur unverified reports ko hata deta hai. Ranking: <strong>Critical (Jaan ka khatra) &gt; Medium &gt; Nearest Proximity</strong>.</div>
      <div class="rule-line">&bull; <strong>6-Step Flow:</strong> Report aayi &rarr; Claim kiya &rarr; EnRoute (Raste me) &rarr; OnScene (Pahucha) &rarr; Madad di &rarr; Resolved (Complete).</div>
    </div>

    <div class="why-box">
      <strong>Why this model:</strong> Volunteers ka time waste nahi hota, fake calls rukti hain aur duplicate rescue teams ek hi jagah nahi jaati.
    </div>
  </div>
</div>

<!-- Q7: OFFLINE DATABASE & SYNC -->
<div class="qa-card">
  <div class="qa-question">
    Q7: In the Offline Data section, how does the app store data during network blackouts and sync when internet comes back?
  </div>
  <div class="qa-answer">
    <div class="qa-item"><strong>Kaunsa Architecture Hai:</strong> <strong>IndexedDB Local Database + Offline Sync Queue</strong>.</div>

    <div class="rule-box">
      <div class="rule-line">&bull; <strong>Offline Storage:</strong> Internet na hone par report phone ke <code>IndexedDB</code> me <code>PendingSync</code> tag ke sath save ho jaati hai.</div>
      <div class="rule-line">&bull; <strong>Auto Sync:</strong> Jaise hi internet aata hai, <code>OfflineSyncManager</code> background me reports upload karke status <code>Verified</code> kar deta hai.</div>
    </div>

    <div class="qa-item"><strong>Kaunsi Browser APIs:</strong> <code>IndexedDB v2</code> (5 Stores) aur <code>Vite PWA Service Worker</code>.</div>

    <div class="why-box">
      <strong>Why IndexedDB why not LocalStorage:</strong> LocalStorage sirf 5MB data store kar sakta hai aur phone hang karta hai. IndexedDB 500MB+ data aur photos ko bina kisi lag ke offline store karta hai.
    </div>
  </div>
</div>

<!-- CLEAN SUMMARY TABLE -->
<table class="clean-table">
  <thead>
    <tr>
      <th style="width: 22%;">Section</th>
      <th style="width: 26%;">Kaunsa Model Hai?</th>
      <th style="width: 30%;">Kaunsa Algorithm Chal Raha Hai?</th>
      <th style="width: 22%;">Why This Model?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Report Section</strong></td>
      <td>Bayesian NLP + Image Checker</td>
      <td>Score &ge; 70% Genuine, &lt; 40% Spam</td>
      <td>Bina internet phone me 1ms me chalta hai.</td>
    </tr>
    <tr>
      <td><strong>2. Live Alerts</strong></td>
      <td>Earthquake & Flood Detector</td>
      <td>USGS Richter &ge; 5.5 Critical, Rain &ge; 5mm Flood</td>
      <td>Real government sensor data, zero false alarm.</td>
    </tr>
    <tr>
      <td><strong>3. Risk Forecast</strong></td>
      <td>Bayesian Bell Curve + Radar</td>
      <td>Live Weather Shift (Low 25% &rarr; High 85%)</td>
      <td>Poora risk spread aur confidence dikhata hai.</td>
    </tr>
    <tr>
      <td><strong>4. Disaster Map</strong></td>
      <td>OSRM Dijkstra + Sinusoidal</td>
      <td>Haversine Distance + Flooded Road Bypass</td>
      <td>100% Free aur offline safe rasta deta hai.</td>
    </tr>
    <tr>
      <td><strong>5. Volunteer Desk</strong></td>
      <td>Priority Triage + 6-Step Flow</td>
      <td>Critical &gt; Medium &gt; Nearest Proximity</td>
      <td>Fake calls rokta hai, duplicate rescue bachata hai.</td>
    </tr>
    <tr>
      <td><strong>6. Offline Sync</strong></td>
      <td>IndexedDB + Sync Queue</td>
      <td>FIFO Auto Reconnection Sync</td>
      <td>500MB+ storage deta hai bina phone hang kiye.</td>
    </tr>
  </tbody>
</table>

</body>
</html>
`;

async function generateCleanTechnicalApproachPDF() {
  console.log('Generating Clean Technical Approach PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfPath = 'd:\\disastermanagement\\Technical_Approach.pdf';
  const htmlPath = 'd:\\disastermanagement\\Technical_Approach.html';

  fs.writeFileSync(htmlPath, htmlContent);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  console.log('Clean Technical Approach PDF successfully generated at:', pdfPath);
}

generateCleanTechnicalApproachPDF().catch(err => {
  console.error('Error generating clean PDF:', err);
  process.exit(1);
});

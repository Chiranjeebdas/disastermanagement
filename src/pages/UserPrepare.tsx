import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Waves,
  Flame,
  Wind,
  Activity,
  PackageCheck,
  Check,
  Home as HomeIcon,
  Map as MapIcon,
  Bell,
  LifeBuoy,
  BookOpen,
  Info
} from 'lucide-react';
import '../styles/UserPrepare.css';

type PrepareCategory = 'flood' | 'fire' | 'cyclone' | 'earthquake' | 'kit';

interface PhaseGuide {
  title: string;
  category: PrepareCategory;
  themeClass: string;
  icon: React.ReactNode;
  description: string;
  before: string[];
  during: string[];
  after: string[];
}

const SAFETY_GUIDES: Record<PrepareCategory, PhaseGuide> = {
  flood: {
    title: 'Flood Safety Guide',
    category: 'flood',
    themeClass: 'theme-flood',
    icon: <Waves size={24} />,
    description: 'Practical steps before, during, and after rising water levels and seasonal monsoon flooding.',
    before: [
      'Keep your phone and power banks fully charged.',
      'Pack an emergency pouch with essential medications, dry food, and copies of important documents.',
      'Know the location of your nearest elevated ground or municipal relief shelter.',
      'Move valuable household items and electrical appliances to higher floors.'
    ],
    during: [
      'Avoid flooded roads — never walk, swim, or drive through moving water.',
      'Turn off main electricity and cooking gas supplies if floodwater enters your home.',
      'Move to higher floors or designated evacuation shelters immediately if advised by authorities.',
      'Stay away from power poles, electrical wires, and unstable riverbanks.'
    ],
    after: [
      'Return home only after local authorities announce it is safe to do so.',
      'Do not drink tap or well water until it has been tested and declared safe; boil water before drinking.',
      'Watch for broken glass, damaged electrical wiring, and snakes/reptiles seeking shelter indoors.',
      'Take photos of damage for municipal relief assistance and insurance records.'
    ]
  },
  fire: {
    title: 'Fire & Wildfire Safety Guide',
    category: 'fire',
    themeClass: 'theme-fire',
    icon: <Flame size={24} />,
    description: 'Essential guidance to protect your family from domestic fires, smoke inhalation, and wildfires.',
    before: [
      'Clear dry brush, dead leaves, and combustible materials within 10 meters of your building.',
      'Plan at least two clear evacuation routes from every room and from your neighborhood.',
      'Ensure fire extinguishers and smoke detectors are in working order and easily accessible.',
      'Keep emergency helpline numbers (112, 101) saved on all family devices.'
    ],
    during: [
      'Stay low under smoke where air is cooler and cleaner; cover mouth and nose with a damp cloth.',
      'Feel closed doors with the back of your hand before opening; do not open doors that feel hot.',
      'Evacuate immediately if ordered by emergency services; do not delay to collect belongings.',
      'If your clothing catches fire: Stop, Drop to the ground, and Roll to smother the flames.'
    ],
    after: [
      'Do not re-enter burned structures until fire officials confirm the building is structurally sound.',
      'Wear a protective mask (N95) and sturdy footwear when entering smoke-damaged areas.',
      'Discard food, medicine, and water bottles that have been exposed to extreme heat or smoke.',
      'Report any lingering embers or hot spots to the fire department (101).'
    ]
  },
  cyclone: {
    title: 'Cyclone & High Wind Safety Guide',
    category: 'cyclone',
    themeClass: 'theme-cyclone',
    icon: <Wind size={24} />,
    description: 'Preparation and safety measures for tropical cyclones, gales, and severe windstorms.',
    before: [
      'Secure or bring indoors loose objects (tin sheets, flower pots, outdoor furniture, loose signs).',
      'Tape or shutter large glass windows to prevent shattering from flying debris.',
      'Store at least 3 days of non-perishable food and 3 liters of drinking water per person per day.',
      'Ensure vehicles are parked away from tall trees and utility poles.'
    ],
    during: [
      'Stay inside the strongest central room of your home, away from glass windows and doors.',
      'Do not go outside during the calm "eye" of the cyclone — destructive winds will resume suddenly from the opposite direction.',
      'Keep your radio or mobile phone tuned to official municipal bulletins.',
      'Unplug electrical equipment to avoid damage from sudden power surges.'
    ],
    after: [
      'Beware of fallen power lines, fallen trees, and compromised bridges; assume all fallen wires are live.',
      'Report damaged electrical wires and water pipe bursts to the emergency helpline (112).',
      'Avoid driving through fallen tree limbs and debris until access roads are cleared by municipal crews.',
      'Help neighbors, children, and elderly individuals in your immediate vicinity.'
    ]
  },
  earthquake: {
    title: 'Earthquake & Tremor Safety Guide',
    category: 'earthquake',
    themeClass: 'theme-earthquake',
    icon: <Activity size={24} />,
    description: 'Instant response actions during ground tremors and structural safety checks.',
    before: [
      'Fasten tall cupboards, bookcases, and heavy ceiling fans securely to structural walls.',
      'Identify safe spots in each room: under sturdy tables or against solid interior walls.',
      'Practice "Drop, Cover, and Hold On" drills with family members.',
      'Keep a flashlight and sturdy shoes next to your bed.'
    ],
    during: [
      'DROP to your hands and knees to prevent falling.',
      'COVER your head and neck under a sturdy table or desk. If no shelter is nearby, cover against an interior wall.',
      'HOLD ON to your shelter until all shaking stops completely.',
      'If outdoors, move immediately to an open area away from buildings, power cables, and flyovers.'
    ],
    after: [
      'Check yourself and family for injuries; administer basic first aid.',
      'Be prepared for aftershocks, which can cause secondary damage to already weakened buildings.',
      'Do not use elevators; use stairwells carefully and exit to open ground.',
      'Check for gas leaks and electrical short circuits; turn off main switches if damage is suspected.'
    ]
  },
  kit: {
    title: '72-Hour Emergency Go-Bag',
    category: 'kit',
    themeClass: 'theme-kit',
    icon: <PackageCheck size={24} />,
    description: 'A pre-packed disaster survival bag ensures rapid evacuation readiness in any crisis.',
    before: [],
    during: [],
    after: []
  }
};

const GO_BAG_ITEMS = [
  { id: 'water', label: 'Drinking Water', sub: 'At least 3 liters per person per day for 3 days' },
  { id: 'food', label: 'Non-Perishable Food', sub: 'Ready-to-eat rations, energy bars, dry fruit, manual can opener' },
  { id: 'meds', label: 'First Aid Kit & Medications', sub: 'Bandages, antiseptic, personal prescription medicines (7-day supply)' },
  { id: 'light', label: 'Flashlight & Spare Batteries', sub: 'LED torch or emergency hand-crank light' },
  { id: 'power', label: 'Charged Power Bank & Cables', sub: 'Portable phone charger and backup power cables' },
  { id: 'docs', label: 'Important Documents in Pouch', sub: 'Waterproof bag with Aadhaar/IDs, insurance, medical records, cash' },
  { id: 'whistle', label: 'Whistle & Emergency Signal', sub: 'To signal emergency search and rescue teams if trapped' },
  { id: 'mask', label: 'Dust Masks & Wet Wipes', sub: 'N95 masks to protect lungs against smoke and dust' },
  { id: 'sanitation', label: 'Basic Hygiene Items', sub: 'Soap, hand sanitizer, feminine hygiene, trash bags' },
  { id: 'radio', label: 'Battery or Solar FM Radio', sub: 'To receive official government alerts when cellular networks fail' }
];

export const UserPrepare: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<PrepareCategory>('flood');
  const [checkedKitItems, setCheckedKitItems] = useState<Set<string>>(new Set(['water', 'light', 'meds']));

  const activeGuide = SAFETY_GUIDES[activeCategory];

  const toggleKitItem = (id: string) => {
    setCheckedKitItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="user-prepare-container">
      {/* 1. Header */}
      <header className="user-prepare-header">
        <div className="user-prepare-header-left">
          <button
            type="button"
            onClick={() => navigate('/user')}
            className="user-prepare-back-btn"
            title="Return to Citizen Dashboard"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="user-prepare-header-title-wrap">
            <h1 className="user-prepare-header-title">Citizen Safety Guidance</h1>
            <span className="user-prepare-header-sub">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Disaster Preparedness & Response</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content */}
      <main className="user-prepare-content">
        {/* Official Authority Priority Directive */}
        <div className="user-prepare-authority-banner">
          <Info size={20} className="user-prepare-authority-icon" />
          <div>
            <h2 className="user-prepare-authority-title">Important Public Safety Notice</h2>
            <p className="user-prepare-authority-desc">
              Always follow instructions from local civil authorities, disaster management agencies (NDMA/SDMA), and emergency first responders. DRISHTI provides informational guidance and does not supersede official municipal evacuation directives.
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="user-prepare-tabs" role="tablist">
          <button
            type="button"
            onClick={() => setActiveCategory('flood')}
            className={`user-prepare-tab-btn ${activeCategory === 'flood' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeCategory === 'flood'}
          >
            <Waves size={13} />
            <span>Flood</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('fire')}
            className={`user-prepare-tab-btn ${activeCategory === 'fire' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeCategory === 'fire'}
          >
            <Flame size={13} />
            <span>Fire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('cyclone')}
            className={`user-prepare-tab-btn ${activeCategory === 'cyclone' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeCategory === 'cyclone'}
          >
            <Wind size={13} />
            <span>Cyclone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('earthquake')}
            className={`user-prepare-tab-btn ${activeCategory === 'earthquake' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeCategory === 'earthquake'}
          >
            <Activity size={13} />
            <span>Earthquake</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('kit')}
            className={`user-prepare-tab-btn ${activeCategory === 'kit' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeCategory === 'kit'}
          >
            <PackageCheck size={13} />
            <span>Go-Bag Kit</span>
          </button>
        </div>

        {/* Hazard Hero Header Card */}
        <section className={`user-prepare-hero-card ${activeGuide.themeClass}`}>
          <div className="user-prepare-hero-icon-box">
            {activeGuide.icon}
          </div>
          <div>
            <h2 className="user-prepare-hero-title">{activeGuide.title}</h2>
            <p className="user-prepare-hero-desc">{activeGuide.description}</p>
          </div>
        </section>

        {/* Timeline Content: BEFORE, DURING, AFTER */}
        {activeCategory !== 'kit' ? (
          <div className="user-prepare-timeline-grid">
            {/* 1. BEFORE (Preparation) */}
            <article className="user-prepare-phase-card phase-before">
              <div className="user-prepare-phase-header">
                <span className="user-prepare-phase-badge badge-before">BEFORE</span>
                <span className="user-prepare-phase-subtitle">Preparation & Precautions</span>
              </div>
              <ul className="user-prepare-steps-list">
                {activeGuide.before.map((step, idx) => (
                  <li key={idx} className="user-prepare-step-item">
                    <span className="user-prepare-step-num">{idx + 1}</span>
                    <p className="user-prepare-step-text">{step}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* 2. DURING (Immediate Action) */}
            <article className="user-prepare-phase-card phase-during">
              <div className="user-prepare-phase-header">
                <span className="user-prepare-phase-badge badge-during">DURING</span>
                <span className="user-prepare-phase-subtitle">Immediate Safety & Response</span>
              </div>
              <ul className="user-prepare-steps-list">
                {activeGuide.during.map((step, idx) => (
                  <li key={idx} className="user-prepare-step-item">
                    <span className="user-prepare-step-num">{idx + 1}</span>
                    <p className="user-prepare-step-text">{step}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* 3. AFTER (Recovery) */}
            <article className="user-prepare-phase-card phase-after">
              <div className="user-prepare-phase-header">
                <span className="user-prepare-phase-badge badge-after">AFTER</span>
                <span className="user-prepare-phase-subtitle">Safety & Returning Home</span>
              </div>
              <ul className="user-prepare-steps-list">
                {activeGuide.after.map((step, idx) => (
                  <li key={idx} className="user-prepare-step-item">
                    <span className="user-prepare-step-num">{idx + 1}</span>
                    <p className="user-prepare-step-text">{step}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        ) : (
          /* 72-Hour Emergency Kit Checklist */
          <section aria-label="72-Hour Emergency Kit Checklist">
            <div className="user-prepare-checklist-grid">
              {GO_BAG_ITEMS.map(item => {
                const isChecked = checkedKitItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleKitItem(item.id)}
                    className={`user-checklist-item ${isChecked ? 'checked' : ''}`}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleKitItem(item.id);
                      }
                    }}
                  >
                    <div className="user-checklist-checkbox">
                      {isChecked && <Check size={14} />}
                    </div>
                    <div>
                      <h4 className="user-checklist-label">{item.label}</h4>
                      <p className="user-checklist-sub">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 3. Citizen Bottom Navigation Bar */}
      <nav className="user-bottom-nav" aria-label="Citizen Navigation Bar">
        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user')}
        >
          <HomeIcon size={18} />
          <span>HOME</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/map')}
        >
          <MapIcon size={18} />
          <span>MAP</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/alerts')}
        >
          <Bell size={18} />
          <span>ALERTS</span>
        </button>

        <button
          type="button"
          className="user-nav-item"
          onClick={() => navigate('/user/help')}
        >
          <LifeBuoy size={18} />
          <span>HELP</span>
        </button>

        <button
          type="button"
          className="user-nav-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <BookOpen size={18} />
          <span>PREPARE</span>
        </button>
      </nav>
    </div>
  );
};

export default UserPrepare;

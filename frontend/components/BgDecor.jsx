// Subtle background decoration layer — food & fitness SVG shapes, low-opacity
const DECORATIONS = {
  food: [
    // Avocado — top-left
    <svg key="avocado" className="bg-decor" style={{ top: '6%', left: '2%', width: 110, height: 110, animationDelay: '0s' }} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="50" cy="65" rx="32" ry="48" fill="#2c7e4a8f" fillOpacity="0.55"/>
      <ellipse cx="50" cy="68" rx="18" ry="26" fill="#d9f1e2" fillOpacity="0.6"/>
      <circle cx="50" cy="72" r="12" fill="#979491" fillOpacity="0.55"/>
      <ellipse cx="50" cy="26" rx="8" ry="12" fill="#16a34a" fillOpacity="0.7"/>
    </svg>,

    // Salad bowl — bottom-right
    <svg key="salad" className="bg-decor" style={{ bottom: '8%', right: '3%', width: 130, height: 130, animationDelay: '1.2s' }} viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="65" cy="70" rx="55" ry="28" fill="#22d3ee" fillOpacity="0.2"/>
      <ellipse cx="65" cy="68" rx="52" ry="25" fill="#10b981" fillOpacity="0.22"/>
      <circle cx="42" cy="54" r="11" fill="#4ade80" fillOpacity="0.55"/>
      <circle cx="68" cy="50" r="9" fill="#ee0d0d" fillOpacity="0.5"/>
      <circle cx="88" cy="56" r="10" fill="#caa956" fillOpacity="0.5"/>
      <circle cx="55" cy="44" r="7" fill="#34d399" fillOpacity="0.6"/>
      <path d="M30 68Q65 90 100 68" stroke="#059669" strokeWidth="5" strokeLinecap="round"/>
    </svg>,

    // Apple — mid-right edge
    <svg key="apple" className="bg-decor" style={{ top: '42%', right: '1%', width: 80, height: 80, animationDelay: '0.6s' }} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M40 20C40 20 25 10 20 25C15 40 18 70 40 78C62 70 65 40 60 25C55 10 40 20 40 20Z" fill="#f87171" fillOpacity="0.5"/>
      <path d="M40 20C38 10 44 4 48 6" stroke="#16a34a" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="30" cy="44" rx="7" ry="12" fill="#fca5a5" fillOpacity="0.35" transform="rotate(-15 30 44)"/>
    </svg>,

    // Carrot — bottom-left
    <svg key="carrot" className="bg-decor" style={{ bottom: '18%', left: '1.5%', width: 70, height: 100, animationDelay: '2s' }} viewBox="0 0 60 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M30 8L10 95Q30 108 50 95L30 8Z" fill="#fb923c" fillOpacity="0.5"/>
      <path d="M30 8C22 2 16 8 20 18" stroke="#4ade80" strokeWidth="4" strokeLinecap="round"/>
      <path d="M30 8C38 2 44 8 40 18" stroke="#4ade80" strokeWidth="4" strokeLinecap="round"/>
      <path d="M30 8C30 0 30 -4 30 2" stroke="#16a34a" strokeWidth="4" strokeLinecap="round"/>
    </svg>,
  ],

  fitness: [
    // Running silhouette — top-right
    <svg key="runner" className="bg-decor" style={{ top: '4%', right: '2%', width: 120, height: 140, animationDelay: '0.3s' }} viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="62" cy="14" r="11" fill="#10b981" fillOpacity="0.5"/>
      <path d="M62 25L54 55L38 80" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M54 55L72 75L80 95" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M62 25L48 38L30 30" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M62 25L76 42L92 38" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,

    // Dumbbell — bottom-left
    <svg key="dumbbell" className="bg-decor" style={{ bottom: '6%', left: '2%', width: 140, height: 60, animationDelay: '1s' }} viewBox="0 0 140 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="8" y="14" width="20" height="32" rx="7" fill="#10b981" fillOpacity="0.5"/>
      <rect x="4" y="20" width="10" height="20" rx="5" fill="#059669" fillOpacity="0.45"/>
      <rect x="112" y="14" width="20" height="32" rx="7" fill="#10b981" fillOpacity="0.5"/>
      <rect x="126" y="20" width="10" height="20" rx="5" fill="#059669" fillOpacity="0.45"/>
      <rect x="28" y="25" width="84" height="10" rx="5" fill="#34d399" fillOpacity="0.45"/>
    </svg>,

    // Heart-rate line — mid-left
    <svg key="heartrate" className="bg-decor" style={{ top: '48%', left: '1%', width: 120, height: 50, animationDelay: '1.8s' }} viewBox="0 0 130 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M0 25L22 25L32 8L44 42L56 14L66 32L76 25L130 25" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fillOpacity="0"/>
    </svg>,

    // Bicycle — top-left
    <svg key="bicycle" className="bg-decor" style={{ top: '12%', left: '1%', width: 110, height: 80, animationDelay: '0.8s' }} viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="24" cy="55" r="19" stroke="#10b981" strokeWidth="5" fill="none"/>
      <circle cx="86" cy="55" r="19" stroke="#10b981" strokeWidth="5" fill="none"/>
      <path d="M24 55L45 22L86 55" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M45 22L55 15L65 22" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M86 55L72 22" stroke="#34d399" strokeWidth="4.5" strokeLinecap="round"/>
      <circle cx="24" cy="55" r="5" fill="#34d399" fillOpacity="0.55"/>
      <circle cx="86" cy="55" r="5" fill="#34d399" fillOpacity="0.55"/>
    </svg>,
  ],

  meal: [
    // Fork & knife — top-right
    <svg key="cutlery" className="bg-decor" style={{ top: '5%', right: '2%', width: 80, height: 120, animationDelay: '0.4s' }} viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22 8V48" stroke="#10b981" strokeWidth="5" strokeLinecap="round"/>
      <path d="M14 8V28Q14 40 22 40Q30 40 30 28V8" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 48V105" stroke="#10b981" strokeWidth="5" strokeLinecap="round"/>
      <path d="M50 8Q50 8 56 30Q58 48 52 52L52 105" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,

    // Bowl of rice — bottom-left
    <svg key="bowl" className="bg-decor" style={{ bottom: '8%', left: '2%', width: 120, height: 80, animationDelay: '1.5s' }} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M10 38Q10 72 60 72Q110 72 110 38Z" fill="#10b981" fillOpacity="0.22"/>
      <path d="M10 38Q60 20 110 38" stroke="#10b981" strokeWidth="4" fill="none"/>
      <ellipse cx="60" cy="38" rx="50" ry="6" fill="#34d399" fillOpacity="0.18"/>
      <circle cx="42" cy="30" r="5" fill="#fbbf24" fillOpacity="0.6"/>
      <circle cx="60" cy="26" r="5" fill="#4ade80" fillOpacity="0.6"/>
      <circle cx="78" cy="30" r="5" fill="#f87171" fillOpacity="0.55"/>
      <circle cx="52" cy="20" r="4" fill="#34d399" fillOpacity="0.55"/>
      <circle cx="70" cy="20" r="4" fill="#fb923c" fillOpacity="0.55"/>
      <path d="M60 38L60 8" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
    </svg>,

    // Broccoli — mid-right
    <svg key="broccoli" className="bg-decor" style={{ top: '40%', right: '1.5%', width: 75, height: 95, animationDelay: '2.2s' }} viewBox="0 0 75 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="24" cy="28" r="18" fill="#22c55e" fillOpacity="0.5"/>
      <circle cx="46" cy="22" r="15" fill="#16a34a" fillOpacity="0.48"/>
      <circle cx="58" cy="38" r="14" fill="#4ade80" fillOpacity="0.45"/>
      <circle cx="20" cy="44" r="12" fill="#22c55e" fillOpacity="0.4"/>
      <path d="M36 54L36 88" stroke="#15803d" strokeWidth="6" strokeLinecap="round"/>
      <path d="M36 72L24 82" stroke="#15803d" strokeWidth="5" strokeLinecap="round"/>
      <path d="M36 72L48 82" stroke="#15803d" strokeWidth="5" strokeLinecap="round"/>
    </svg>,
  ],

  mixed: [
    // Watermelon slice — top-right
    <svg key="watermelon" className="bg-decor" style={{ top: '4%', right: '2%', width: 110, height: 80, animationDelay: '0.2s' }} viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 72Q15 20 55 8Q95 20 95 72Z" fill="#f87171" fillOpacity="0.45"/>
      <path d="M22 72Q22 32 55 18Q88 32 88 72Z" fill="#fca5a5" fillOpacity="0.3"/>
      <path d="M14 72Q55 62 96 72" stroke="#16a34a" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="42" cy="52" r="4" fill="#111827" fillOpacity="0.3"/>
      <circle cx="56" cy="44" r="4" fill="#111827" fillOpacity="0.3"/>
      <circle cx="70" cy="52" r="4" fill="#111827" fillOpacity="0.3"/>
    </svg>,

    // Yoga pose — bottom-left
    <svg key="yoga" className="bg-decor" style={{ bottom: '6%', left: '1.5%', width: 100, height: 130, animationDelay: '1.4s' }} viewBox="0 0 90 130" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="45" cy="14" r="11" fill="#10b981" fillOpacity="0.5"/>
      <path d="M45 25L45 62" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/>
      <path d="M45 38L20 52" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M45 38L70 52" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M45 62L28 88" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M45 62L62 88" stroke="#10b981" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M28 88L14 108" stroke="#10b981" strokeWidth="5" strokeLinecap="round"/>
      <path d="M62 88L76 108" stroke="#10b981" strokeWidth="5" strokeLinecap="round"/>
    </svg>,

    // Lemon — mid-left
    <svg key="lemon" className="bg-decor" style={{ top: '45%', left: '1%', width: 70, height: 70, animationDelay: '3s' }} viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="35" cy="35" rx="28" ry="22" fill="#fde047" fillOpacity="0.5" transform="rotate(-20 35 35)"/>
      <path d="M10 24Q20 12 40 14" stroke="#eab308" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M35 35L35 10" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
    </svg>,
  ],
};

export default function BgDecor({ theme = 'food' }) {
  return (
    <div className="bg-decor-layer" aria-hidden="true">
      {DECORATIONS[theme] || DECORATIONS.food}
    </div>
  );
}

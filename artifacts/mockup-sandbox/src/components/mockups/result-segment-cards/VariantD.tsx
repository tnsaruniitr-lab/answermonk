import React from 'react';

const brands = [
  { rank: 1, name: 'Call Doctor', score: 100, you: false },
  { rank: 2, name: 'Housecall', score: 75, you: false },
  { rank: 3, name: 'First Response', score: 63, you: true },
  { rank: 4, name: 'Aster Clinic', score: 44, you: false },
  { rank: 5, name: 'Nightingale Health', score: 38, you: false },
  { rank: 6, name: 'Mediclinic', score: 25, you: false },
  { rank: 7, name: 'TruDoc 24x7', score: 25, you: false },
  { rank: 8, name: 'KindCare Home', score: 25, you: false },
];

export function VariantD() {
  return (
    <div style={{ backgroundColor: '#060f1e', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ─── SEGMENT CARD ─── */}
        <div style={{
          backgroundColor: '#0d1526',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>

          {/* ★ YOU APPEAR BANNER — full-width, top of card */}
          <div style={{
            background: 'linear-gradient(100deg, #3730a3 0%, #4f46e5 45%, #6d28d9 100%)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}>
            {/* Big % */}
            <div style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              flexShrink: 0,
              textShadow: '0 0 20px rgba(255,255,255,0.3)'
            }}>
              63%
            </div>
            {/* Divider */}
            <div style={{ width: '1px', height: '44px', backgroundColor: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            {/* Text */}
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: 1.3, marginBottom: '3px' }}>
                of the time you appear
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                when potential customers search for this service on AI engines
              </div>
            </div>
          </div>

          {/* Card identity */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px', border: '1px solid rgba(59,130,246,0.25)' }}>
                SERVICE
              </div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>Doctor On Call</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>"doctor on call in Dubai"</div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>50%</div>
                <div>Top 3</div>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>#1.9</div>
                <div>Avg Rank</div>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#e2e8f0' }}>232</div>
                <div>Citations</div>
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div style={{ padding: '20px 24px' }}>

            {/* Context line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px' }}>🔍</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>See who appears when customers search for</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 10px', borderRadius: '100px' }}>
                doctor on call in Dubai
              </span>
            </div>

            <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>AI Search Rankings</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {brands.map((b) => (
                <div key={b.rank} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  ...(b.you ? {
                    backgroundColor: 'rgba(67,56,202,0.14)',
                    padding: '8px 10px',
                    margin: '0 -10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(67,56,202,0.3)'
                  } : {})
                }}>
                  <div style={{ width: '20px', fontSize: '12px', fontWeight: 'bold', color: b.you ? '#a5b4fc' : '#475569', textAlign: 'right', flexShrink: 0 }}>{b.rank}</div>
                  <div style={{ width: '148px', fontSize: '13px', fontWeight: b.you ? '700' : '500', color: b.you ? '#ffffff' : '#cbd5e1', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    {b.you && <span style={{ backgroundColor: '#4338ca', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '100px', fontWeight: 'bold', flexShrink: 0 }}>YOU</span>}
                  </div>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${b.score}%`, height: '100%', background: b.you ? 'linear-gradient(90deg,#4338ca,#818cf8)' : '#1e3a5f', borderRadius: '3px', boxShadow: b.you ? '0 0 8px rgba(67,56,202,0.4)' : 'none' }} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: b.you ? '#c7d2fe' : '#475569', width: '36px', textAlign: 'right', flexShrink: 0 }}>{b.score}%</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
              Analysis across 8 unique prompts · ChatGPT, Gemini, Claude
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';

const brands = [
  { rank: 1, name: 'Call Doctor', count: 8, you: false },
  { rank: 2, name: 'Housecall', count: 6, you: false },
  { rank: 3, name: 'First Response', count: 5, you: true },
  { rank: 4, name: 'Aster Clinic', count: 4, you: false },
  { rank: 5, name: 'Nightingale Health', count: 3, you: false },
  { rank: 6, name: 'Mediclinic', count: 2, you: false },
  { rank: 7, name: 'TruDoc 24x7', count: 2, you: false },
  { rank: 8, name: 'KindCare Home', count: 2, you: false },
];

const TOTAL = 8;

export function RankDots() {
  return (
    <div style={{ backgroundColor: '#060f1e', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <div style={{ backgroundColor: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>

          {/* Card Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px', border: '1px solid rgba(59,130,246,0.25)' }}>
                SERVICE
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>Doctor On Call</h3>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>"doctor on call in Dubai"</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1 }}>63%</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Visibility</div>
            </div>
          </div>

          {/* Rankings */}
          <div style={{ padding: '24px' }}>

            {/* Context callout */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '16px', flexShrink: 0 }}>🔍</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0', marginBottom: '3px' }}>When someone searches "doctor on call in Dubai"…</div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>AI engines recommend these brands to your customers — before they ever reach your website.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Search Rankings</div>
              <div style={{ fontSize: '10px', color: '#475569' }}>each dot = 1 of 8 prompts</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {brands.map((b) => (
                <div key={b.rank} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  ...(b.you ? {
                    backgroundColor: 'rgba(67,56,202,0.12)',
                    padding: '8px 10px',
                    margin: '0 -10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(67,56,202,0.25)'
                  } : {})
                }}>
                  {/* Rank number */}
                  <div style={{ width: '20px', fontSize: '12px', fontWeight: 'bold', color: b.you ? '#a5b4fc' : '#475569', textAlign: 'right', flexShrink: 0 }}>{b.rank}</div>

                  {/* Brand name */}
                  <div style={{ width: '148px', fontSize: '13px', fontWeight: b.you ? '700' : '500', color: b.you ? '#ffffff' : '#cbd5e1', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    {b.you && <span style={{ backgroundColor: '#4338ca', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '100px', fontWeight: 'bold', flexShrink: 0 }}>YOU</span>}
                  </div>

                  {/* Dot matrix */}
                  <div style={{ display: 'flex', gap: '5px', flex: 1, alignItems: 'center' }}>
                    {Array.from({ length: TOTAL }).map((_, i) => (
                      <div key={i} style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: i < b.count
                          ? (b.you ? '#818cf8' : '#3b82f6')
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: i < b.count && b.you ? '0 0 6px rgba(129,140,248,0.5)' : 'none'
                      }} />
                    ))}
                    <div style={{ marginLeft: '6px', fontSize: '12px', fontWeight: '600', color: b.you ? '#c7d2fe' : '#475569' }}>
                      {b.count}/{TOTAL}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
              Analysis across 8 unique prompts · ChatGPT, Gemini, Claude
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '11px', color: '#475569' }}>Style Option 1 — Dot Matrix</div>
      </div>
    </div>
  );
}

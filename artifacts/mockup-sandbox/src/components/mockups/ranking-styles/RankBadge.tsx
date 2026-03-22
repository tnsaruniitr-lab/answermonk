import React from 'react';

const brands = [
  { rank: 1, name: 'Call Doctor', pct: 100, engines: ['ChatGPT', 'Gemini', 'Claude'], you: false },
  { rank: 2, name: 'Housecall', pct: 75, engines: ['ChatGPT', 'Gemini'], you: false },
  { rank: 3, name: 'First Response', pct: 63, engines: ['Gemini', 'ChatGPT'], you: true },
  { rank: 4, name: 'Aster Clinic', pct: 44, engines: ['Gemini'], you: false },
  { rank: 5, name: 'Nightingale Health', pct: 38, engines: ['ChatGPT'], you: false },
  { rank: 6, name: 'Mediclinic', pct: 25, engines: ['Gemini'], you: false },
  { rank: 7, name: 'TruDoc 24x7', pct: 25, engines: ['Claude'], you: false },
  { rank: 8, name: 'KindCare Home', pct: 25, engines: ['ChatGPT'], you: false },
];

const rankColors: Record<number, { bg: string; text: string; glow: string }> = {
  1: { bg: '#854d0e', text: '#fde68a', glow: 'rgba(234,179,8,0.3)' },
  2: { bg: '#374151', text: '#e2e8f0', glow: 'rgba(148,163,184,0.2)' },
  3: { bg: '#1e3a5f', text: '#93c5fd', glow: 'rgba(59,130,246,0.2)' },
};

export function RankBadge() {
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

            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>AI Search Rankings</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {brands.map((b) => {
                const medal = rankColors[b.rank];
                return (
                  <div key={b.rank} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: b.you ? 'rgba(67,56,202,0.12)' : 'rgba(255,255,255,0.02)',
                    border: b.you ? '1px solid rgba(67,56,202,0.3)' : '1px solid rgba(255,255,255,0.04)',
                  }}>

                    {/* Rank badge */}
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                      backgroundColor: medal ? medal.bg : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: medal ? `0 0 10px ${medal.glow}` : 'none'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: medal ? medal.text : (b.you ? '#a5b4fc' : '#475569') }}>
                        {b.rank}
                      </span>
                    </div>

                    {/* Name + engines */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: b.you ? '700' : '500', color: b.you ? '#ffffff' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.name}
                        </span>
                        {b.you && (
                          <span style={{ backgroundColor: '#4338ca', color: 'white', fontSize: '9px', padding: '2px 7px', borderRadius: '100px', fontWeight: 'bold', flexShrink: 0 }}>YOU</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {b.engines.map(e => (
                          <span key={e} style={{ fontSize: '10px', color: '#64748b', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{e}</span>
                        ))}
                      </div>
                    </div>

                    {/* Percentage */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: b.you ? '#a5b4fc' : (b.rank <= 3 ? '#e2e8f0' : '#475569'), lineHeight: 1 }}>
                        {b.pct}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>visibility</div>
                    </div>

                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
              Analysis across 8 unique prompts · ChatGPT, Gemini, Claude
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '11px', color: '#475569' }}>Style Option 3 — Rank Badge + Engine Tags</div>
      </div>
    </div>
  );
}

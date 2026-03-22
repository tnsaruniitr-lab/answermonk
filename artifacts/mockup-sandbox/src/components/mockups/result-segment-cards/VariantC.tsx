import React from 'react';

export function VariantC() {
  return (
    <div style={{ backgroundColor: '#060f1e', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        
        {/* RESULT CARD */}
        <div style={{
          width: '100%',
          maxWidth: '660px',
          backgroundColor: '#0d1526',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {/* Header Row: Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#3730a3', color: 'white', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.5px' }}>
              Your Results
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
              Dubai
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
              48 responses
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
              3/3 segments
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                First Response Healthcare
              </h1>
              <div style={{ height: '3px', width: '60px', backgroundColor: '#4f46e5', borderRadius: '2px' }}></div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#fbbf24', lineHeight: '1' }}>#5</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>of 27 brands</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
            {/* Circular Ring Area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #1e3a8a',
                borderTopColor: '#3b82f6', borderRightColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)', transform: 'rotate(-45deg)'
              }}>
                <span style={{ transform: 'rotate(45deg)', fontSize: '22px', fontWeight: 'bold', color: 'white' }}>47%</span>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>AI VISIBILITY</span>
            </div>

            {/* Stats Grid */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '6px' }}>25% TOP 3 RATE</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>25%</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '6px' }}>AVG RANK</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>#4.1</div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '6px' }}>RATING</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fcd34d' }}>MODERATE</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Search Engine Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>ChatGPT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '33%', height: '100%', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>33%</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>Gemini</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>60%</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>Claude</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '0%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEGMENT CARD */}
        <div style={{
          width: '100%',
          maxWidth: '660px',
          backgroundColor: '#0d1526',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: '10px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.5px', marginBottom: '12px' }}>
                SERVICE
              </div>
              <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: 'white', textAlign: 'left' }}>
                Doctor On Call
              </h2>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
              63%
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#e2e8f0', textAlign: 'left', fontStyle: 'italic' }}>"trusted doctor on call services in Dubai"</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Top 3 Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>50%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Avg Rank</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>#1.9</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: '600' }}>Citations</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>232</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>Gemini 75%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>ChatGPT 50%</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold', color: 'white' }}>Who AI Recommends</h3>
              <p style={{ margin: '0', fontSize: '11px', color: '#94a3b8' }}>Top brands when customers search this query</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { rank: 1, name: 'Call Doctor', score: 131, isTop: true, isYou: false },
                { rank: 2, name: 'Housecall', score: 75, isTop: true, isYou: false },
                { rank: 3, name: 'First Response Healthcare', score: 63, isTop: true, isYou: true },
                { rank: 4, name: 'Aster Clinic', score: 44, isTop: false, isYou: false },
                { rank: 5, name: 'Nightingale Health Services', score: 31, isTop: false, isYou: false },
                { rank: 6, name: 'Mediclinic', score: 25, isTop: false, isYou: false },
                { rank: 7, name: 'TruDoc 24x7', score: 25, isTop: false, isYou: false },
                { rank: 8, name: 'KindCare Home HealthCare', score: 25, isTop: false, isYou: false },
              ].map((brand, i) => {
                const barWidth = `${(brand.score / 131) * 100}%`;
                
                return (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: brand.isYou ? '10px 12px' : '6px 0',
                    backgroundColor: brand.isYou ? 'rgba(55, 48, 163, 0.3)' : 'transparent',
                    borderRadius: brand.isYou ? '8px' : '0',
                    border: brand.isYou ? '1px solid rgba(79, 70, 229, 0.4)' : 'none',
                    margin: brand.isYou ? '4px -12px' : '0'
                  }}>
                    <div style={{ width: '28px', fontSize: '13px', color: brand.isYou ? '#818cf8' : '#64748b', fontWeight: 'bold' }}>{brand.rank}.</div>
                    <div style={{ 
                      width: '200px', 
                      fontSize: '13-14px', 
                      fontWeight: brand.isTop ? 'bold' : 'normal',
                      color: brand.isYou ? 'white' : (brand.isTop ? '#e2e8f0' : '#cbd5e1'),
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingRight: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {brand.name}
                      {brand.isYou && (
                        <div style={{ padding: '2px 6px', backgroundColor: '#4f46e5', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px' }}>
                          YOU
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: brand.isYou ? '14px' : '10px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                          width: barWidth, 
                          height: '100%', 
                          backgroundColor: brand.isYou ? '#4f46e5' : '#1e4080', 
                          opacity: brand.isYou ? 1 : 0.7,
                          borderRadius: '4px',
                          background: brand.isYou ? 'linear-gradient(90deg, #4f46e5, #818cf8)' : undefined
                        }}></div>
                      </div>
                      <div style={{ width: '40px', fontSize: '13px', fontWeight: 'bold', color: brand.isYou ? '#818cf8' : '#94a3b8', textAlign: 'right' }}>
                        {brand.score}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

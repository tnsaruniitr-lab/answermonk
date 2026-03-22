import React from 'react';

export function VariantA() {
  return (
    <div style={{ backgroundColor: '#060f1e', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* RESULT CARD */}
        <div style={{ 
          backgroundColor: '#0d1526', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* Header Area */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                color: '#4ade80', 
                padding: '4px 12px', 
                borderRadius: '100px', 
                fontSize: '11px', 
                fontWeight: '700',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                Your Results
              </div>
              <div style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                color: '#fbbf24', 
                padding: '6px 14px', 
                borderRadius: '100px', 
                fontSize: '13px', 
                fontWeight: '600',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.1)'
              }}>
                #5 of 27 brands
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4338ca, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 4px 12px rgba(67, 56, 202, 0.4)'
              }}>
                F
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>
                  First Response Healthcare
                </h2>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#94a3b8', fontSize: '13px' }}>
                  <span>Dubai</span>
                  <span>•</span>
                  <span>3/3 segments</span>
                  <span>•</span>
                  <span>48 responses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Area */}
          <div style={{ padding: '24px', display: 'flex', gap: '32px' }}>
            
            {/* Score Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                border: '8px solid rgba(255,255,255,0.05)',
                borderTopColor: '#3b82f6',
                borderRightColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-45deg)',
                marginBottom: '12px'
              }}>
                <div style={{ transform: 'rotate(45deg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>47%</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.05em' }}>
                VISIBILITY SCORE
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '500' }}>ChatGPT</span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>33%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '33%', height: '100%', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Gemini</span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>60%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Claude</span>
                  <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>0%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '0%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: '3px' }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Footer */}
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: '16px 24px', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Top 3 Rate</div>
              <div style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>25%</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Avg Rank</div>
              <div style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }}>#4.1</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Rating</div>
              <div style={{ fontSize: '16px', color: '#fcd34d', fontWeight: '600' }}>Moderate</div>
            </div>
          </div>
        </div>


        {/* SEGMENT CARD */}
        <div style={{ 
          backgroundColor: '#0d1526', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ 
                display: 'inline-block',
                backgroundColor: 'rgba(59,130,246,0.15)', 
                color: '#93c5fd', 
                padding: '2px 8px', 
                borderRadius: '4px', 
                fontSize: '10px', 
                fontWeight: '600',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                border: '1px solid rgba(59,130,246,0.25)'
              }}>
                SERVICE
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', textAlign: 'left' }}>
                Doctor On Call
              </h3>
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'left' }}>
                "doctor on call in Dubai"
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                <span><strong style={{color: '#e2e8f0'}}>63%</strong> Appearance</span>
                <span><strong style={{color: '#e2e8f0'}}>50%</strong> Top 3</span>
                <span><strong style={{color: '#e2e8f0'}}>#1.9</strong> Avg Rank</span>
                <span><strong style={{color: '#e2e8f0'}}>232</strong> Citations</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#ffffff', lineHeight: 1 }}>63%</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Visibility</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Gemini 75% / ChatGPT 50%</div>
            </div>
          </div>

          {/* Rankings Section */}
          <div style={{ padding: '24px' }}>

            {/* Context callout */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>🔍</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px', letterSpacing: '0.01em' }}>
                  When someone searches "doctor on call in Dubai"…
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  AI engines read hundreds of sources and recommend the brands below. This is who your customers are told to call — before they ever reach your website.
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Search Rankings</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Row 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', textAlign: 'left' }}>1</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#e2e8f0', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Call Doctor</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>131%</span>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', textAlign: 'left' }}>2</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#e2e8f0', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Housecall</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '75%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>75%</span>
                </div>
              </div>

              {/* Row 3 (YOU) */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                position: 'relative',
                backgroundColor: 'rgba(67, 56, 202, 0.15)',
                padding: '8px 12px',
                margin: '0 -12px',
                borderRadius: '8px',
                border: '1px solid rgba(67, 56, 202, 0.3)'
              }}>
                <div style={{ width: '12px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', textAlign: 'left' }}>3</div>
                <div style={{ width: '140px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  First Response...
                  <span style={{ backgroundColor: '#4338ca', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '100px', fontWeight: 'bold' }}>YOU</span>
                </div>
                <div style={{ flex: 1, height: '28px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '63%', height: '100%', background: 'linear-gradient(90deg, #4338ca, #818cf8)', borderRadius: '4px', boxShadow: '0 0 10px rgba(67,56,202,0.4)' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>63%</span>
                </div>
              </div>

              {/* Row 4 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', textAlign: 'left' }}>4</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#e2e8f0', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Aster Clinic</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '44%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>44%</span>
                </div>
              </div>

              {/* Row 5 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textAlign: 'left' }}>5</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#cbd5e1', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Nightingale Health...</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '31%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>31%</span>
                </div>
              </div>

              {/* Row 6 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textAlign: 'left' }}>6</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#cbd5e1', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mediclinic</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '25%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>25%</span>
                </div>
              </div>
              
              {/* Row 7 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textAlign: 'left' }}>7</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#cbd5e1', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TruDoc 24x7</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '25%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>25%</span>
                </div>
              </div>

              {/* Row 8 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '24px', fontSize: '13px', fontWeight: 'bold', color: '#64748b', textAlign: 'left' }}>8</div>
                <div style={{ width: '140px', fontSize: '13px', color: '#cbd5e1', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>KindCare Home...</div>
                <div style={{ flex: 1, height: '24px', backgroundColor: 'transparent', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '25%', height: '100%', backgroundColor: '#1e3a5f', borderRadius: '4px' }}></div>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '12px', fontWeight: '600', color: '#93c5fd' }}>25%</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

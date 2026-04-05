import { useState } from 'react';

const TABS = [
  { id: 'claim', label: '✅ Claim Check' },
  { id: 'fallacies', label: '⚠️ Fallacies' },
  { id: 'strength', label: '💪 Strength' },
  { id: 'refs', label: '🔗 References' },
];

function ClaimTab({ analysis }) {
  const verified = analysis.claim_verified;
  const verifiedLabel = verified === true ? 'Verified' : verified === false ? 'Disputed' : 'Unverifiable';
  const verifiedClass = verified === true ? 'claim-true' : verified === false ? 'claim-false' : 'claim-unverifiable';

  return (
    <div>
      <div className="ai-claim-status">
        <span className={`claim-badge ${verifiedClass}`}>{verifiedLabel}</span>
      </div>
      {analysis.claim_summary && (
        <p className="ai-summary-text">{analysis.claim_summary}</p>
      )}
      {analysis.off_topic_warning && (
        <div style={{
          marginTop: '12px',
          background: 'var(--warn-dim)',
          border: '1px solid rgba(255,183,77,0.3)',
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: 'var(--warn)',
          fontFamily: 'var(--font-mono)',
        }}>
          ⚠ {analysis.off_topic_warning}
        </div>
      )}
    </div>
  );
}

function FallaciesTab({ analysis }) {
  const fallacies = analysis.fallacies || [];

  if (fallacies.length === 0) {
    return (
      <div className="no-fallacies">
        ✓ No logical fallacies detected
      </div>
    );
  }

  return (
    <div className="fallacy-list">
      {fallacies.map((f, i) => (
        <div key={i} className="fallacy-item">
          <div className="fallacy-name">{f.name}</div>
          <div className="fallacy-explanation">{f.explanation}</div>
        </div>
      ))}
    </div>
  );
}

function StrengthTab({ analysis }) {
  const strength = analysis.argument_strength || 'moderate';
  const strengthClass = `strength-${strength}`;

  return (
    <div className="strength-display">
      <div className={`strength-badge-large ${strengthClass}`}>
        {strength === 'strong' ? '▲ Strong' : strength === 'moderate' ? '◆ Moderate' : '▽ Weak'}
      </div>
      {analysis.strength_reason && (
        <p className="strength-reason">{analysis.strength_reason}</p>
      )}
    </div>
  );
}

function RefsTab({ analysis }) {
  const refs = analysis.references || [];

  if (refs.length === 0) {
    return <div className="no-refs">No references provided.</div>;
  }

  return (
    <div className="refs-list">
      {refs.map((r, i) => (
        <div key={i} className="ref-item">
          <div className="ref-title">
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                {r.title} ↗
              </a>
            ) : (
              r.title
            )}
          </div>
          {r.relevance && <div className="ref-relevance">{r.relevance}</div>}
        </div>
      ))}
    </div>
  );
}

export default function AIAnalysisPanel({ analysis }) {
  const [activeTab, setActiveTab] = useState('claim');

  return (
    <div className="ai-panel">
      <div className="ai-panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ai-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ai-panel-content">
        {activeTab === 'claim' && <ClaimTab analysis={analysis} />}
        {activeTab === 'fallacies' && <FallaciesTab analysis={analysis} />}
        {activeTab === 'strength' && <StrengthTab analysis={analysis} />}
        {activeTab === 'refs' && <RefsTab analysis={analysis} />}
      </div>
    </div>
  );
}

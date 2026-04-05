import { useState } from 'react';
import AIAnalysisPanel from './AIAnalysisPanel';

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ArgumentCard({ arg, slot }) {
  const [expanded, setExpanded] = useState(false);

  const isPending = arg.ai_analysis_status === 'pending';
  const isDone = arg.ai_analysis_status === 'done';
  const isFailed = arg.ai_analysis_status === 'failed';

  return (
    <div className={`argument-card arg-card-p${slot}`}>
      <div className="argument-card-header">
        <div className="arg-header-left">
          <span className="arg-participant">P{slot}</span>
          <span className="arg-round">Round {arg.roundNumber}</span>
        </div>
        <span className="arg-timestamp">{formatTime(arg.submittedAt)}</span>
      </div>

      <div className="argument-card-analysis-section">
        {isPending && (
          <div className="ai-status-pending" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            <span className="spinner spinner-sm" />
            Analysing...
          </div>
        )}
        {isFailed && (
          <div className="ai-status-failed" style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--danger)' }}>Analysis unavailable</div>
        )}
        {isDone && arg.ai_analysis && (
          <>
            <button
              className="ai-toggle-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'var(--bg-inset)', border: 'none', borderBottom: expanded ? '1px solid var(--border)' : 'none', borderRadius: expanded ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)' }}
            >
              AI Analysis {expanded ? '▴' : '▾'}
            </button>
            {expanded && (
              <AIAnalysisPanel analysis={arg.ai_analysis} />
            )}
          </>
        )}
      </div>

      <div className="argument-card-body" style={{ marginTop: '0', paddingTop: '12px' }}>
        <p className="argument-text">{arg.content}</p>
      </div>
    </div>
  );
}

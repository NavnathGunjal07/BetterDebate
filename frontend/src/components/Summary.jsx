export default function Summary({ summary, debate, onNewDebate }) {
  if (!summary) return null;

  const { participant1, participant2, point_by_point_comparison, conclusion } = summary;

  const winnerIsP1 = conclusion?.winner === 'participant1';
  const winnerColor = winnerIsP1 ? 'var(--p1-color)' : 'var(--p2-color)';

  function strengthClass(s) {
    if (s === 'strong') return 'strength-strong';
    if (s === 'weak') return 'strength-weak';
    return 'strength-moderate';
  }

  function roundWinnerClass(winner) {
    if (winner === 'participant1') return 'rw-p1';
    if (winner === 'participant2') return 'rw-p2';
    return 'rw-tie';
  }

  function roundWinnerLabel(winner, data) {
    if (winner === 'participant1') return participant1?.name || 'P1';
    if (winner === 'participant2') return participant2?.name || 'P2';
    return 'Tie';
  }

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h1>⚖️ Debate Verdict</h1>
        {debate?.topic && (
          <p className="summary-topic">"{debate.topic}"</p>
        )}
      </div>

      {/* Participant cards */}
      <div className="summary-participants">
        {/* P1 */}
        {participant1 && (
          <div className="summary-participant-card sp-p1">
            <div className="sp-name">{participant1.name}</div>

            <div className="sp-section-label">Key Arguments</div>
            <ul className="sp-key-args">
              {(participant1.key_arguments || []).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>

            <div className="sp-section-label">Strongest Argument</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
              {participant1.strongest_argument}
            </p>

            <div className="sp-section-label">Fallacies Used</div>
            {(participant1.fallacies_used || []).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>None detected</span>
            ) : (
              <div className="sp-fallacies">
                {participant1.fallacies_used.map((f, i) => (
                  <span key={i} className="sp-fallacy-tag">{f}</span>
                ))}
              </div>
            )}

            <div className="sp-section-label">Overall Strength</div>
            <span className={`strength-badge-large ${strengthClass(participant1.overall_strength)}`}>
              {participant1.overall_strength?.toUpperCase() || '—'}
            </span>
          </div>
        )}

        {/* P2 */}
        {participant2 && (
          <div className="summary-participant-card sp-p2">
            <div className="sp-name">{participant2.name}</div>

            <div className="sp-section-label">Key Arguments</div>
            <ul className="sp-key-args">
              {(participant2.key_arguments || []).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>

            <div className="sp-section-label">Strongest Argument</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
              {participant2.strongest_argument}
            </p>

            <div className="sp-section-label">Fallacies Used</div>
            {(participant2.fallacies_used || []).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>None detected</span>
            ) : (
              <div className="sp-fallacies">
                {participant2.fallacies_used.map((f, i) => (
                  <span key={i} className="sp-fallacy-tag">{f}</span>
                ))}
              </div>
            )}

            <div className="sp-section-label">Overall Strength</div>
            <span className={`strength-badge-large ${strengthClass(participant2.overall_strength)}`}>
              {participant2.overall_strength?.toUpperCase() || '—'}
            </span>
          </div>
        )}
      </div>

      {/* Round-by-round table */}
      {point_by_point_comparison && point_by_point_comparison.length > 0 && (
        <div className="summary-rounds-table">
          <h2>Round-by-Round Breakdown</h2>
          <table className="rounds-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>{participant1?.name || 'P1'}</th>
                <th>{participant2?.name || 'P2'}</th>
                <th>Winner</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {point_by_point_comparison.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    #{row.round || i + 1}
                  </td>
                  <td>{row.p1_argument_summary}</td>
                  <td>{row.p2_argument_summary}</td>
                  <td>
                    <span className={`round-winner-badge ${roundWinnerClass(row.winner)}`}>
                      {roundWinnerLabel(row.winner)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Conclusion */}
      {conclusion && (
        <div className="summary-conclusion">
          <div className="conclusion-label">🏆 Winner</div>
          <div className="conclusion-winner" style={{ color: winnerColor }}>
            {conclusion.winner_name || '—'}
          </div>

          {conclusion.decisive_argument && (
            <blockquote className="conclusion-decisive-arg">
              "{conclusion.decisive_argument}"
            </blockquote>
          )}

          {conclusion.reasoning && (
            <p className="conclusion-reasoning">
              {conclusion.reasoning}
            </p>
          )}
        </div>
      )}

      <div className="summary-actions">
        <button
          id="new-debate-from-summary-btn"
          className="btn btn-primary btn-lg"
          onClick={onNewDebate}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

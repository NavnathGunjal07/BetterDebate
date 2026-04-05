import { useState, useEffect } from 'react';
import client from '../api/client';

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'waiting' ? 'Waiting' : status === 'active' ? 'Active' : 'Done'}
    </span>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard({ userName, onLogout, onNewDebate, onJoinDebate, onEnterArena }) {
  const [debates, setDebates] = useState([]);
  const [loadingDebates, setLoadingDebates] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchDebates();
  }, []);

  async function fetchDebates() {
    try {
      const res = await client.get('/debates');
      setDebates(res.data);
    } catch {
      // silently fail, shows empty state
    } finally {
      setLoadingDebates(false);
    }
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await client.post('/debates/join-by-code', { joinCode: joinCode.trim() });
      onEnterArena(res.data.debateId);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Could not join debate');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-brand">&gt; BetterDebate</div>
          <div className="dashboard-welcome">Welcome, {userName}</div>
        </div>
        <button id="dashboard-logout-btn" className="btn btn-ghost btn-sm" onClick={onLogout}>
          Switch User
        </button>
      </header>

      <div className="dashboard-sections">
        {/* Left: Actions */}
        <div className="dashboard-actions">
          <h2 className="mb-4">Start a Debate</h2>

          <button
            id="start-new-debate-btn"
            className="btn btn-primary w-full"
            onClick={onNewDebate}
          >
            + New Debate
          </button>

          <hr className="divider" />

          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Join a Debate
          </h3>
          <div className="join-code-input-group">
            <input
              id="join-code-input"
              className="form-input"
              type="text"
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              id="join-code-submit-btn"
              className="btn btn-secondary"
              onClick={handleJoinByCode}
              disabled={!joinCode.trim() || joining}
            >
              {joining ? <span className="spinner spinner-sm" /> : 'Join'}
            </button>
          </div>
          {joinError && (
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
              {joinError}
            </p>
          )}
        </div>

        {/* Right: Debates list */}
        <div>
          <h2 className="mb-4">Your Debates</h2>

          {loadingDebates ? (
            <div className="loading-state">
              <span className="spinner" />
              Loading debates...
            </div>
          ) : debates.length === 0 ? (
            <div className="empty-state">
              No debates yet.<br />Start one above or join with a code.
            </div>
          ) : (
            <div className="debates-list">
              {debates.map((d) => (
                <div
                  key={d.id}
                  className="debate-list-item"
                  onClick={() => {
                    if (d.status === 'waiting' && !d.opponentName) {
                      onJoinDebate(d.id, d.joinCode);
                    } else {
                      onEnterArena(d.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onEnterArena(d.id)}
                >
                  <div
                    className="debate-list-topic"
                    title={d.topic}
                  >
                    {d.topic}
                  </div>
                  <div className="debate-list-meta">
                    <StatusBadge status={d.status} />
                    <span className="debate-list-opponent">
                      {d.opponentName ? `vs ${d.opponentName}` : 'Waiting for opponent'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(d.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

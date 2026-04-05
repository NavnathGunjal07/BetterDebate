import { useState, useEffect } from 'react';
import client from '../api/client';

export default function Login({ onLogin, login, onPublicDebateClick }) {
  const [name, setName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [publicDebates, setPublicDebates] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    async function fetchPublicDebates() {
      setLoadingPublic(true);
      try {
        const res = await client.get('/debates/public', {
          params: { page, limit: 6, search: searchQuery }
        });
        setPublicDebates(res.data.debates || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch public debates', err);
      } finally {
        setLoadingPublic(false);
      }
    }
    fetchPublicDebates();
  }, [page, searchQuery]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !passkey) return;
    setLoading(true);
    setError('');

    try {
      const data = await login(name.trim(), passkey);
      onLogin(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'row', flexWrap: 'wrap' }}>
      
      {/* Left Half: Login */}
      <div style={{ 
        flex: '1 1 50%', 
        minWidth: '320px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem',
        backgroundColor: 'var(--bg-dark)'
      }}>
        <div className="login-card" style={{ width: '100%', maxWidth: '420px', margin: 0 }}>
          <div className="login-logo">
            <span className="login-logo-mark">BetterDebate</span>
            <span className="login-logo-sub">AI-Powered Debate Arena</span>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-name">Debater Name</label>
              <input
                id="login-name"
                className="form-input"
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-passkey">Passkey</label>
              <input
                id="login-passkey"
                className="form-input"
                type="password"
                placeholder="Your secret passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit-btn"
              className="btn btn-primary btn-lg w-full"
              type="submit"
              disabled={loading || !name.trim() || !passkey}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" />
                  Entering Arena...
                </>
              ) : (
                'Enter Arena →'
              )}
            </button>
          </form>

          <p className="login-footer">
            New here? Your account is created automatically on first login.
          </p>
        </div>
      </div>

      {/* Right Half: Public Debates */}
      <div style={{ 
        flex: '1 1 50%', 
        minWidth: '320px', 
        backgroundColor: 'var(--bg-mid)', 
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100vh'
      }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Completed Public Debates</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          paddingRight: '0.5rem'
        }}>
          {loadingPublic ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <span className="spinner spinner-md" style={{ marginRight: '0.5rem' }} />
              Loading completed debates...
            </div>
          ) : publicDebates.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              No completed debates match your search.
            </div>
          ) : (
            publicDebates.map(debate => (
              <div 
                key={debate.id} 
                className="debate-card" 
                style={{ 
                  cursor: debate.summary ? 'pointer' : 'default', 
                  backgroundColor: 'var(--bg-card)', 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onClick={() => {
                  if (debate.summary && onPublicDebateClick) {
                    onPublicDebateClick(debate);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start', gap: '1rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.4' }}>{debate.topic}</span>
                  <span className="status-badge status-completed" style={{ flexShrink: 0 }}>Done</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {debate.participant1?.name || 'Waiting...'} 
                  <span style={{ margin: '0 0.5rem', color: 'var(--text-secondary)' }}>vs</span> 
                  {debate.participant2?.name || 'Waiting...'}
                </div>
                {debate.summary && (
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                    View Summary 
                    <span style={{ marginLeft: '4px' }}>→</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loadingPublic && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)'
          }}>
            <button 
              className="btn btn-secondary" 
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '0.5rem 1rem' }}
            >
              ← Previous
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary" 
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '0.5rem 1rem' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

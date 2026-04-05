import { useState, useEffect, useRef } from 'react';
import { useDebate } from '../hooks/useDebate';

export default function JoinCode({ debateId, joinCode, onDebateActive }) {
  const [copied, setCopied] = useState(false);
  const { debate, fetchDebate } = useDebate(debateId, 3000);
  const pollRef = useRef(null);

  // Start polling when component mounts
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const d = await fetchDebate();
      if (d?.status === 'active') {
        clearInterval(pollRef.current);
        onDebateActive(debateId);
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [debateId]);

  // Also react to debate state changes
  useEffect(() => {
    if (debate?.status === 'active') {
      clearInterval(pollRef.current);
      onDebateActive(debateId);
    }
  }, [debate?.status]);

  function copyCode() {
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="joincode-page">
      <div className="joincode-card card card-elevated">
        <h1 className="mb-4" style={{ textAlign: 'center' }}>Debate Created</h1>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0' }}>
          Share this code with your opponent
        </p>

        <span id="join-code-display" className="join-code-display">{joinCode}</span>

        <button
          id="copy-join-code-btn"
          className="btn btn-secondary w-full"
          onClick={copyCode}
        >
          {copied ? '✓ Copied!' : '⎘ Copy Code'}
        </button>

        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-4)',
          marginTop: 'var(--space-5)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
        }}>
          <strong style={{ color: 'var(--text-secondary)' }}>How to join:</strong><br />
          Your opponent enters this code on their dashboard under "Join a Debate".
        </div>

        <div className="joincode-waiting">
          <span className="spinner" />
          Waiting for opponent to join...
        </div>

        {debate?.topic && (
          <div style={{
            marginTop: 'var(--space-5)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}>
            Topic: <em style={{ color: 'var(--text-secondary)' }}>{debate.topic}</em>
          </div>
        )}
      </div>
    </div>
  );
}

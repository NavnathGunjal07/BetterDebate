import { useState, useEffect, useRef } from 'react';
import { useDebate } from '../hooks/useDebate';
import ArgumentCard from './ArgumentCard';
import client from '../api/client';

const MAX_CHARS = 1000;
const MAX_POSITION_CHARS = 200;

export default function DebateArena({ debateId, userId, onSummary, onBack }) {
  const { debate, loading, error, fetchDebate } = useDebate(debateId, 4000);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const pollRef = useRef(null);

  // Position modal state
  const [positionInput, setPositionInput] = useState('');
  const [positionError, setPositionError] = useState('');
  const [submittingPosition, setSubmittingPosition] = useState(false);
  const [positionSubmitted, setPositionSubmitted] = useState(false);

  // Start polling
  useEffect(() => {
    fetchDebate();
    pollRef.current = setInterval(() => {
      fetchDebate();
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [debateId]);

  // Stop polling when completed
  useEffect(() => {
    if (debate?.status === 'completed') {
      clearInterval(pollRef.current);
    }
  }, [debate?.status]);

  // Auto-forward to summary if completed and summary exists
  useEffect(() => {
    if (debate?.status === 'completed' && debate?.summary) {
      onSummary(debate.summary, debate);
    }
  }, [debate?.status, debate?.summary, debate, onSummary]);

  if (loading && !debate) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <span className="spinner spinner-lg" />
        Loading debate...
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{error}</p>
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
      </div>
    );
  }

  if (!debate) return null;

  const p1 = debate.participant1;
  const p2 = debate.participant2;

  // Determine user's slot
  let mySlot = null;
  if (p1 && p1.id === userId) mySlot = 1;
  else if (p2 && p2.id === userId) mySlot = 2;

  const myPosition = mySlot === 1 ? debate.p1Position : debate.p2Position;
  const showPositionModal =
    debate.status === 'active' && !positionSubmitted && !myPosition;

  const isMyTurn = mySlot !== null && debate.currentTurn === mySlot && debate.status === 'active';
  const isCompleted = debate.status === 'completed';
  const isWaiting = debate.status === 'waiting';

  // Split arguments by slot
  const p1Args = (debate.arguments || []).filter((a) => a.participantSlot === 1);
  const p2Args = (debate.arguments || []).filter((a) => a.participantSlot === 2);

  const currentRound = Math.max(p1Args.length, p2Args.length, 1);

  async function handlePositionSubmit() {
    if (!positionInput.trim()) return;
    setSubmittingPosition(true);
    setPositionError('');
    try {
      await client.post(`/debates/${debateId}/position`, { position: positionInput.trim() });
      setPositionSubmitted(true);
      fetchDebate();
    } catch (err) {
      setPositionError(err.response?.data?.error || 'Failed to save your position. Try again.');
    } finally {
      setSubmittingPosition(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await client.post(`/debates/${debateId}/arguments`, { content: content.trim() });
      setContent('');
      fetchDebate();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit argument');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    try {
      const res = await client.post(`/debates/${debateId}/summary`);
      onSummary(res.data.summary, debate);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to generate summary');
      setGeneratingSummary(false);
    }
  }

  const charCount = content.length;
  const charClass = charCount > 950 ? 'at-limit' : charCount > 800 ? 'near-limit' : '';

  const turnLabel =
    debate.currentTurn === 1
      ? `${p1?.name || 'P1'}'s turn`
      : `${p2?.name || 'P2'}'s turn`;

  const turnClass = debate.currentTurn === 1 ? 'turn-p1' : 'turn-p2';

  return (
    <div className="arena-page">
      {/* Position Modal Overlay */}
      {showPositionModal && (
        <div className="position-modal-overlay">
          <div className="position-modal">
            <div className="position-modal-icon">🎯</div>
            <h2 className="position-modal-title">State Your Position</h2>
            <p className="position-modal-topic">
              <span className="position-modal-topic-label">Topic:</span>{' '}
              {debate.topic}
            </p>
            <p className="position-modal-hint">
              In one or two sentences, state your claim or the side you're defending.
              This will be pinned to your column so your opponent can see it.
            </p>
            <textarea
              id="position-input"
              className="form-textarea"
              placeholder={`e.g. "I argue that ${debate.topic.toLowerCase()} is beneficial because..."`}
              value={positionInput}
              onChange={(e) => {
                if (e.target.value.length <= MAX_POSITION_CHARS) {
                  setPositionInput(e.target.value);
                  setPositionError('');
                }
              }}
              rows={3}
              autoFocus
            />
            <div className="position-modal-footer">
              <span className={`char-counter ${positionInput.length > 180 ? 'near-limit' : ''}`}>
                {positionInput.length}/{MAX_POSITION_CHARS}
              </span>
              {positionError && (
                <span style={{ color: 'var(--danger)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {positionError}
                </span>
              )}
              <button
                id="submit-position-btn"
                className="btn btn-primary"
                onClick={handlePositionSubmit}
                disabled={!positionInput.trim() || submittingPosition}
              >
                {submittingPosition ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Saving...
                  </>
                ) : (
                  'Lock In Position →'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="arena-header">
        <div className="arena-header-top">
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ flexShrink: 0 }}>
            ←
          </button>
          <div className="arena-topic" title={debate.topic}>
            {debate.topic}
          </div>
          <div className="arena-meta">
            <span className="arena-round">
              Round {currentRound}/{debate.maxTurns}
            </span>
            {!isCompleted && !isWaiting && (
              <span className={`arena-turn-indicator ${turnClass}`}>
                {turnLabel}
              </span>
            )}
            {isCompleted && (
              <span className="badge badge-completed">Completed</span>
            )}
            {isWaiting && (
              <span className="badge badge-waiting">Waiting</span>
            )}
          </div>
        </div>

        {(p1 || p2) && (
          <div className="arena-players">
            <span className="player-name-p1">{p1?.name || 'P1'}</span>
            <span className="player-vs">vs</span>
            <span className="player-name-p2">{p2?.name || 'Waiting...'}</span>
          </div>
        )}
      </header>

      {/* Debate columns */}
      <div className="arena-body">
        {isWaiting ? (
          <div className="loading-state" style={{ flex: 1 }}>
            <span className="spinner spinner-lg" />
            <p style={{ fontFamily: 'var(--font-mono)' }}>Waiting for opponent to join...</p>
          </div>
        ) : (
          <div className="arena-columns">
            {/* P1 column */}
            <div className="arena-column col-p1">
              <div className="arena-column-header">
                <span style={{ color: 'var(--p1-color)' }}>◆</span>
                {p1?.name || 'Participant 1'}
              </div>
              {/* P1 Position Banner */}
              {debate.p1Position && (
                <div className="position-banner position-banner-p1">
                  <span className="position-banner-label">📌 Position:</span>
                  <span className="position-banner-text">{debate.p1Position}</span>
                </div>
              )}
              {p1Args.length === 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
                  No arguments yet
                </div>
              )}
              {[...p1Args].reverse().map((arg) => (
                <ArgumentCard key={arg.id} arg={arg} slot={1} />
              ))}
            </div>

            {/* P2 column */}
            <div className="arena-column col-p2">
              <div className="arena-column-header">
                <span style={{ color: 'var(--p2-color)' }}>◆</span>
                {p2?.name || 'Participant 2'}
              </div>
              {/* P2 Position Banner */}
              {debate.p2Position && (
                <div className="position-banner position-banner-p2">
                  <span className="position-banner-label">📌 Position:</span>
                  <span className="position-banner-text">{debate.p2Position}</span>
                </div>
              )}
              {p2Args.length === 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
                  No arguments yet
                </div>
              )}
              {[...p2Args].reverse().map((arg) => (
                <ArgumentCard key={arg.id} arg={arg} slot={2} />
              ))}
            </div>
          </div>
        )}

        {/* Input / completed area */}
        {isCompleted ? (
          <div className="debate-completed-msg">
            <p>The debate is over. Ready for judgment?</p>
            <button
              id="generate-summary-btn"
              className="btn btn-primary btn-lg"
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
            >
              {generatingSummary ? (
                <>
                  <span className="spinner spinner-sm" />
                  Judge is deliberating...
                </>
              ) : (
                '⚖️ Generate Summary'
              )}
            </button>
            {submitError && (
              <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginTop: '8px' }}>
                {submitError}
              </p>
            )}
          </div>
        ) : !isWaiting && (
          <div className="arena-input-area">
            <div className="arena-input-inner">
              {isMyTurn ? (
                <>


                  <textarea
                    id="argument-input"
                    className="form-textarea"
                    placeholder="Make your argument..."
                    value={content}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CHARS) {
                        setContent(e.target.value);
                      }
                    }}
                    disabled={submitting}
                    rows={4}
                  />

                  <div className="input-bottom-row">
                    <span className={`char-counter ${charClass}`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                    {submitError && (
                      <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {submitError}
                      </span>
                    )}
                    <button
                      id="submit-argument-btn"
                      className="btn btn-primary"
                      onClick={() => handleSubmit()}
                      disabled={!content.trim() || submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner spinner-sm" />
                          Submitting...
                        </>
                      ) : (
                        'Submit →'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="waiting-turn-msg">
                  <span className="spinner spinner-sm" />
                  Waiting for {debate.currentTurn === 1 ? (p1?.name || 'P1') : (p2?.name || 'P2')}'s argument...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

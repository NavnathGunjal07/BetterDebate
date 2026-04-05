import { useState } from 'react';
import client from '../api/client';

const PRESET_TOPICS = [
  { category: 'Tech', text: 'AI will eliminate more jobs than it creates in the next decade' },
  { category: 'Tech', text: 'Open source software is more secure than proprietary software' },
  { category: 'Tech', text: 'Social media does more harm than good to society' },
  { category: 'Tech', text: 'Cryptocurrency is the future of global finance' },
  { category: 'Politics', text: 'Universal Basic Income should be implemented globally' },
  { category: 'Politics', text: 'Democracy is the best form of government' },
  { category: 'Politics', text: 'Nations should prioritize economic growth over climate action' },
  { category: 'Politics', text: 'Immigration restrictions should be more lenient' },
  { category: 'Ethics', text: 'Genetic engineering of humans should be permitted' },
  { category: 'Ethics', text: 'Capital punishment is ever morally justifiable' },
  { category: 'Ethics', text: 'Animals have the same moral rights as people' },
  { category: 'Society', text: 'Remote work is more productive than office work' },
  { category: 'Society', text: 'College education is overrated and overpriced' },
  { category: 'Society', text: 'Social media influencers have replaced traditional media' },
  { category: 'Society', text: 'Space exploration funding should be redirected to Earth problems' },
];

export default function TopicPicker({ onBack, onCreated }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [maxTurns, setMaxTurns] = useState(5);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const activeTopic = showCustom ? customTopic.trim() : selectedTopic;

  async function handleCreate() {
    if (!activeTopic) return;
    setCreating(true);
    setError('');
    try {
      const res = await client.post('/debates', {
        topic: activeTopic,
        customTopic: showCustom,
        maxTurns,
      });
      onCreated(res.data.debateId, res.data.joinCode);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create debate');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="topic-picker-page">
      <div className="topic-picker-header">
        <button className="btn btn-ghost btn-sm mb-4" onClick={onBack}>
          ← Back
        </button>
        <h1>Choose a Topic</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          Select a preset or write your own
        </p>
      </div>

      <div className="topic-grid">
        {PRESET_TOPICS.map((t, i) => (
          <button
            key={i}
            id={`topic-card-${i}`}
            className={`topic-card ${!showCustom && selectedTopic === t.text ? 'selected' : ''}`}
            onClick={() => {
              setShowCustom(false);
              setSelectedTopic(t.text);
            }}
          >
            <div className="topic-card-category">{t.category}</div>
            <div className="topic-card-text">{t.text}</div>
          </button>
        ))}

        {/* Custom topic card */}
        <button
          id="custom-topic-card"
          className={`topic-card custom-card ${showCustom ? 'selected' : ''}`}
          onClick={() => {
            setShowCustom(true);
            setSelectedTopic(null);
          }}
        >
          <div className="topic-card-category">Custom</div>
          <div className="topic-card-text">✍️ Write your own topic...</div>
        </button>

        {/* Expanded custom input */}
        {showCustom && (
          <div className="custom-topic-expanded">
            <input
              id="custom-topic-input"
              className="form-input"
              type="text"
              placeholder="e.g. Nuclear energy is the only viable path to net-zero..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Turns selector */}
      <div>
        <h3 className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Turns per participant
        </h3>
        <div className="turns-selector">
          {[3, 5, 7].map((t) => (
            <button
              key={t}
              id={`turns-${t}-btn`}
              className={`turns-option ${maxTurns === t ? 'selected' : ''}`}
              onClick={() => setMaxTurns(t)}
            >
              {t} turns
            </button>
          ))}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ({maxTurns * 2} total arguments)
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-dim)',
          border: '1px solid rgba(239,83,80,0.3)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-3) var(--space-4)',
          color: 'var(--danger)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          marginBottom: 'var(--space-4)',
        }}>
          {error}
        </div>
      )}

      <button
        id="create-debate-btn"
        className="btn btn-primary btn-lg"
        onClick={handleCreate}
        disabled={!activeTopic || creating}
      >
        {creating ? (
          <>
            <span className="spinner spinner-sm" />
            Creating...
          </>
        ) : (
          'Create Debate →'
        )}
      </button>
    </div>
  );
}

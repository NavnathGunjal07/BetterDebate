import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TopicPicker from './components/TopicPicker';
import JoinCode from './components/JoinCode';
import DebateArena from './components/DebateArena';
import Summary from './components/Summary';

// Simple state-based routing
const SCREENS = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  TOPIC_PICKER: 'topic_picker',
  JOIN_CODE: 'join_code',
  ARENA: 'arena',
  SUMMARY: 'summary',
};

export default function App() {
  const { isAuthenticated, name, userId, logout, login } = useAuth();
  const [screen, setScreen] = useState(isAuthenticated ? SCREENS.DASHBOARD : SCREENS.LOGIN);
  const [currentDebateId, setCurrentDebateId] = useState(null);
  const [currentJoinCode, setCurrentJoinCode] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryDebate, setSummaryDebate] = useState(null);

  // Listen for forced logout event (401 response)
  useEffect(() => {
    function handleLogout() {
      setScreen(SCREENS.LOGIN);
      setCurrentDebateId(null);
    }
    window.addEventListener('bd_logout', handleLogout);
    return () => window.removeEventListener('bd_logout', handleLogout);
  }, []);

  function handleLogin() {
    setScreen(SCREENS.DASHBOARD);
  }

  function handleLogout() {
    logout();
    setScreen(SCREENS.LOGIN);
    setCurrentDebateId(null);
  }

  function handleNewDebate() {
    setScreen(SCREENS.TOPIC_PICKER);
  }

  function handleDebateCreated(debateId, joinCode) {
    setCurrentDebateId(debateId);
    setCurrentJoinCode(joinCode);
    setScreen(SCREENS.JOIN_CODE);
  }

  function handleJoinDebate(debateId, joinCode) {
    setCurrentDebateId(debateId);
    setCurrentJoinCode(joinCode);
    setScreen(SCREENS.JOIN_CODE);
  }

  function handleEnterArena(debateId) {
    setCurrentDebateId(debateId);
    setScreen(SCREENS.ARENA);
  }

  function handleDebateActive(debateId) {
    setCurrentDebateId(debateId);
    setScreen(SCREENS.ARENA);
  }

  function handleSummary(summary, debate) {
    setSummaryData(summary);
    setSummaryDebate(debate);
    setScreen(SCREENS.SUMMARY);
  }

  function handleNewDebateFromSummary() {
    setSummaryData(null);
    setSummaryDebate(null);
    setCurrentDebateId(null);
    setScreen(isAuthenticated ? SCREENS.DASHBOARD : SCREENS.LOGIN);
  }

  // Render
  if ((screen === SCREENS.LOGIN || !isAuthenticated) && screen !== SCREENS.SUMMARY) {
    return (
      <Login 
        onLogin={handleLogin} 
        login={login} 
        onPublicDebateClick={(debate) => handleSummary(debate.summary, debate)} 
      />
    );
  }

  if (screen === SCREENS.DASHBOARD) {
    return (
      <Dashboard
        userName={name}
        onLogout={handleLogout}
        onNewDebate={handleNewDebate}
        onJoinDebate={handleJoinDebate}
        onEnterArena={handleEnterArena}
      />
    );
  }

  if (screen === SCREENS.TOPIC_PICKER) {
    return (
      <TopicPicker
        onBack={() => setScreen(SCREENS.DASHBOARD)}
        onCreated={handleDebateCreated}
      />
    );
  }

  if (screen === SCREENS.JOIN_CODE && currentDebateId) {
    return (
      <JoinCode
        debateId={currentDebateId}
        joinCode={currentJoinCode}
        onDebateActive={handleDebateActive}
      />
    );
  }

  if (screen === SCREENS.ARENA && currentDebateId) {
    return (
      <DebateArena
        debateId={currentDebateId}
        userId={userId}
        onSummary={handleSummary}
        onBack={() => setScreen(SCREENS.DASHBOARD)}
      />
    );
  }

  if (screen === SCREENS.SUMMARY && summaryData) {
    return (
      <Summary
        summary={summaryData}
        debate={summaryDebate}
        onNewDebate={handleNewDebateFromSummary}
      />
    );
  }

  // Fallback
  return <Login onLogin={handleLogin} login={login} />;
}

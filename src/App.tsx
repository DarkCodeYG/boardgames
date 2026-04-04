import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import SpymasterKeyPage from './components/SpymasterKeyPage';

type Page = 'home' | 'game' | 'spymaster';

function App() {
  const [page, setPage] = useState<Page>('home');

  // URL에 seed 파라미터가 있으면 팀장 답안 페이지로
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('seed')) {
      setPage('spymaster');
    }
  }, []);

  if (page === 'spymaster') {
    return <SpymasterKeyPage />;
  }

  if (page === 'game') {
    return <GamePage onGoHome={() => setPage('home')} />;
  }

  return <HomePage onStartGame={() => setPage('game')} />;
}

export default App;

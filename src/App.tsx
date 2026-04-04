import { useState, useEffect } from 'react';
import Home from './pages/Home';
import CodenamesHome from './games/codenames/pages/HomePage';
import CodenamesGame from './games/codenames/pages/GamePage';
import SpymasterKeyPage from './games/codenames/components/SpymasterKeyPage';
import SpyfallHome from './games/spyfall/pages/HomePage';
import SpyfallGame from './games/spyfall/pages/GamePage';
import SpyfallPlayerCard from './games/spyfall/components/PlayerCard';
import WitnessesHome from './games/witnesses/pages/HomePage';
import WitnessesGame from './games/witnesses/pages/GamePage';
import WitnessesOnlineGame from './games/witnesses/pages/OnlineGamePage';
import WitnessesPlayerPage from './games/witnesses/pages/PlayerPage';

type Page =
  | 'home'
  | 'codenames-home' | 'codenames-game' | 'spymaster'
  | 'spyfall-home' | 'spyfall-game' | 'spyfall-player'
  | 'witnesses-home' | 'witnesses-game' | 'witnesses-online' | 'witnesses-player-online';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [witnessRoles, setWitnessRoles] = useState<(string | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');

    if (game === 'spyfall' && params.get('seed')) {
      setPage('spyfall-player');
    } else if (game === 'witnesses' && params.get('seed')) {
      setPage('witnesses-game'); // 오프라인 QR
    } else if (game === 'witnesses-online' && params.get('room')) {
      setPage('witnesses-player-online'); // 온라인 플레이어
    } else if (params.get('seed')) {
      setPage('spymaster');
    }
  }, []);

  switch (page) {
    case 'spymaster':
      return <SpymasterKeyPage />;
    case 'spyfall-player':
      return <SpyfallPlayerCard />;
    case 'witnesses-player-online':
      return <WitnessesPlayerPage />;
    case 'codenames-game':
      return <CodenamesGame onGoHome={() => setPage('codenames-home')} />;
    case 'codenames-home':
      return <CodenamesHome onStartGame={() => setPage('codenames-game')} onBack={() => setPage('home')} />;
    case 'spyfall-game':
      return <SpyfallGame onGoHome={() => setPage('spyfall-home')} />;
    case 'spyfall-home':
      return <SpyfallHome onStartGame={() => setPage('spyfall-game')} onBack={() => setPage('home')} />;
    case 'witnesses-game':
      return <WitnessesGame onGoHome={() => setPage('witnesses-home')} />;
    case 'witnesses-online':
      return <WitnessesOnlineGame onGoHome={() => setPage('witnesses-home')} enabledRoles={witnessRoles as any} />;
    case 'witnesses-home':
      return (
        <WitnessesHome
          onStartGame={() => setPage('witnesses-game')}
          onStartOnline={(roles) => { setWitnessRoles(roles); setPage('witnesses-online'); }}
          onBack={() => setPage('home')}
        />
      );
    default:
      return (
        <Home onSelectGame={(id) => {
          if (id === 'codenames') setPage('codenames-home');
          if (id === 'spyfall') setPage('spyfall-home');
          if (id === 'witnesses') setPage('witnesses-home');
        }} />
      );
  }
}

export default App;

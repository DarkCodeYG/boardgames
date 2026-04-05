import { useState, useEffect } from 'react';
import Home from './pages/Home';
import CodenamesHome from './games/codenames/pages/HomePage';
import CodenamesGame from './games/codenames/pages/GamePage';
import SpymasterKeyPage from './games/codenames/components/SpymasterKeyPage';
import SpyfallHome from './games/spyfall/pages/HomePage';
import SpyfallGame from './games/spyfall/pages/GamePage';
import SpyfallPlayerPage from './games/spyfall/pages/PlayerPage';
import WitnessesHome from './games/witnesses/pages/HomePage';
import WitnessesOnlineGame from './games/witnesses/pages/OnlineGamePage';
import WitnessesPlayerPage from './games/witnesses/pages/PlayerPage';
import type { SpecialRole } from './games/witnesses/lib/types';
import FakeartHome from './games/fakeart/pages/HomePage';
import FakeartGame from './games/fakeart/pages/GamePage';
import FakeartPlayer from './games/fakeart/pages/PlayerPage';
import SetHome from './games/set/pages/HomePage';
import SetGame from './games/set/pages/GamePage';
import SetPlayer from './games/set/pages/PlayerPage';

type Page =
  | 'home'
  | 'codenames-home' | 'codenames-game' | 'spymaster'
  | 'spyfall-home' | 'spyfall-game' | 'spyfall-player'
  | 'witnesses-home' | 'witnesses-game' | 'witnesses-player'
  | 'fakeart-home' | 'fakeart-game' | 'fakeart-player'
  | 'set-home' | 'set-game' | 'set-player';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [witnessRoles, setWitnessRoles] = useState<SpecialRole[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');

    if (game === 'spyfall' && params.get('room')) {
      setPage('spyfall-player');
    } else if (game === 'witnesses-online' && params.get('room')) {
      setPage('witnesses-player');
    } else if (game === 'fakeart' && params.get('room')) {
      setPage('fakeart-player');
    } else if (game === 'set' && params.get('room')) {
      setPage('set-player');
    } else if (params.get('seed')) {
      setPage('spymaster');
    }
  }, []);

  switch (page) {
    case 'spymaster':
      return <SpymasterKeyPage />;
    case 'spyfall-player':
      return <SpyfallPlayerPage />;
    case 'witnesses-player':
      return <WitnessesPlayerPage />;
    case 'fakeart-player':
      return <FakeartPlayer />;
    case 'codenames-game':
      return <CodenamesGame onGoHome={() => setPage('home')} />;
    case 'codenames-home':
      return <CodenamesHome onStartGame={() => setPage('codenames-game')} onBack={() => setPage('home')} />;
    case 'spyfall-game':
      return <SpyfallGame onGoHome={() => setPage('home')} />;
    case 'spyfall-home':
      return <SpyfallHome onStartGame={() => setPage('spyfall-game')} onBack={() => setPage('home')} />;
    case 'witnesses-game':
      return <WitnessesOnlineGame onGoHome={() => setPage('home')} enabledRoles={witnessRoles} />;
    case 'witnesses-home':
      return (
        <WitnessesHome
          onStart={(roles) => { setWitnessRoles(roles); setPage('witnesses-game'); }}
          onBack={() => setPage('home')}
        />
      );
    case 'fakeart-game':
      return <FakeartGame onGoHome={() => setPage('home')} />;
    case 'fakeart-home':
      return <FakeartHome onStartGame={() => setPage('fakeart-game')} onBack={() => setPage('home')} />;
    case 'set-player':
      return <SetPlayer />;
    case 'set-game':
      return <SetGame onGoHome={() => setPage('home')} />;
    case 'set-home':
      return <SetHome onStartGame={() => setPage('set-game')} onBack={() => setPage('home')} />;
    default:
      return (
        <Home onSelectGame={(id) => {
          if (id === 'codenames') setPage('codenames-home');
          if (id === 'spyfall') setPage('spyfall-home');
          if (id === 'witnesses') setPage('witnesses-home');
          if (id === 'fakeart') setPage('fakeart-home');
          if (id === 'set') setPage('set-home');
        }} />
      );
  }
}

export default App;

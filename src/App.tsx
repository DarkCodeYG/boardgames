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
import GomokuHome from './games/gomoku/pages/HomePage';
import GomokuGame from './games/gomoku/pages/GamePage';
import GoHome from './games/go/pages/HomePage';
import GoGame from './games/go/pages/GamePage';
import DavinciHome from './games/davinci/pages/HomePage';
import DavinciGame from './games/davinci/pages/GamePage';
import DavinciPlayer from './games/davinci/pages/PlayerPage';
import AgricolaHome from './games/agricola/pages/HomePage';
import AgricolaGame from './games/agricola/pages/GamePage';
import { createGameState, startRound, replenishActionSpaces } from './games/agricola/lib/game-engine';
import { useAgricolaStore } from './games/agricola/store/game-store';

type Page =
  | 'home'
  | 'codenames-home' | 'codenames-game' | 'spymaster'
  | 'spyfall-home' | 'spyfall-game' | 'spyfall-player'
  | 'witnesses-home' | 'witnesses-game' | 'witnesses-player'
  | 'fakeart-home' | 'fakeart-game' | 'fakeart-player'
  | 'set-home' | 'set-game' | 'set-player'
  | 'gomoku-home' | 'gomoku-game'
  | 'go-home' | 'go-game'
  | 'davinci-home' | 'davinci-game' | 'davinci-player'
  | 'agricola-home' | 'agricola-game';

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
    } else if (game === 'davinci' && params.get('room')) {
      setPage('davinci-player');
    } else if (game === 'agricola') {
      setPage('agricola-home');
    } else if (game === 'agricola-game') {
      // 테스트용: 1라운드 work 상태로 바로 진입
      let s = createGameState({ playerCount: 2, playerNames: ['플레이어 1', '플레이어 2'], deck: 'AB' });
      s = startRound(s);
      s = replenishActionSpaces(s);
      s = { ...s, phase: 'playing' };
      useAgricolaStore.getState().setGameState(s);
      setPage('agricola-game');
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
    case 'gomoku-game':
      return <GomokuGame onGoHome={() => setPage('home')} />;
    case 'gomoku-home':
      return <GomokuHome onStartGame={() => setPage('gomoku-game')} onBack={() => setPage('home')} />;
    case 'go-game':
      return <GoGame onGoHome={() => setPage('home')} />;
    case 'go-home':
      return <GoHome onStartGame={() => setPage('go-game')} onBack={() => setPage('home')} />;
    case 'davinci-player':
      return <DavinciPlayer />;
    case 'davinci-game':
      return <DavinciGame onGoHome={() => setPage('home')} />;
    case 'davinci-home':
      return <DavinciHome onStartGame={() => setPage('davinci-game')} onBack={() => setPage('home')} />;
    case 'agricola-game':
      return <AgricolaGame onExit={() => setPage('home')} />;
    case 'agricola-home':
      return <AgricolaHome onStartGame={() => setPage('agricola-game')} />;
    default:
      return (
        <Home onSelectGame={(id) => {
          if (id === 'codenames') setPage('codenames-home');
          if (id === 'spyfall') setPage('spyfall-home');
          if (id === 'witnesses') setPage('witnesses-home');
          if (id === 'fakeart') setPage('fakeart-home');
          if (id === 'set') setPage('set-home');
          if (id === 'gomoku') setPage('gomoku-home');
          if (id === 'go') setPage('go-home');
          if (id === 'davinci') setPage('davinci-home');
          if (id === 'agricola') setPage('agricola-home');
        }} />
      );
  }
}

export default App;

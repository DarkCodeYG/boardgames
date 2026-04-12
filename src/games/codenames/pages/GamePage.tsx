import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import Board from '../components/Board';
import GameHeader from '../components/GameHeader';
import GameOverModal from '../components/GameOverModal';
import LangToggle from '../../../components/LangToggle';
import Modal from '../../../components/Modal';
import { useGameStore } from '../store/game-store';
import { t } from '../lib/i18n';
import { sfxToggle, sfxModalOpen, sfxModalClose, sfxClick } from '../../../lib/sound';

interface GamePageProps {
  onGoHome: () => void;
}

export default function GamePage({ onGoHome }: GamePageProps) {
  const { game, lang, pack, newGame, start, selectCard, passTurn, setLang } = useGameStore();
  const [showQR, setShowQR] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showGoHomeConfirm, setShowGoHomeConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showGoHomeConfirm) { sfxModalClose(); setShowGoHomeConfirm(false); }
      else if (showRestartConfirm) { sfxModalClose(); setShowRestartConfirm(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGoHomeConfirm, showRestartConfirm]);

  if (!game) return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-100">
      <p className="text-stone-400 font-bold">{t(lang, 'loading')}</p>
    </div>
  );

  const spymasterUrl = `${window.location.origin}${window.location.pathname}?seed=${game.seed}&lang=${lang}&pack=${pack}`;
  const teamColor = game.currentTeam === 'red' ? 'bg-red-500' : 'bg-blue-500';

  const handleRestart = () => {
    newGame();
    setShowRestartConfirm(false);
    setShowQR(false);
  };

  return (
    <div className="h-dvh bg-stone-100 flex flex-col overflow-hidden">
      {/* QR 확인 후 게임 시작 */}
      {game.phase === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 shadow-md text-center max-w-sm w-full">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => { sfxModalOpen(); setShowGoHomeConfirm(true); }} className="text-stone-500 hover:text-stone-700 font-bold text-sm">← {t(lang, 'goHome')}</button>
              <LangToggle lang={lang} onChange={setLang} />
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">{t(lang, 'qrTitle')}</h2>
            <p className="text-stone-500 text-sm mb-4">{t(lang, 'qrDesc')}</p>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={spymasterUrl} size={200} />
            </div>
            <p className="text-xs text-stone-400 break-all mb-4">
              {t(lang, 'seed')}: <span className="font-mono font-bold">{game.seed}</span>
            </p>
            <p className="text-stone-500 text-sm mb-3">
              {t(lang, 'firstTeam')}: {game.startingTeam === 'red'
                ? t(lang, 'redCards', { n: 9 })
                : t(lang, 'blueCards', { n: 9 })}
            </p>
            <button
              onClick={start}
              className="w-full bg-stone-800 text-white text-lg font-bold
                         py-3 rounded-xl hover:bg-stone-700 active:scale-95 transition-all"
            >
              {t(lang, 'startGame')}
            </button>
          </div>
        </div>
      )}

      {/* 게임 진행 중 */}
      {game.phase === 'playing' && (
        <>
          <GameHeader game={game} lang={lang} />

          <Board
            game={game}
            isSpymasterView={false}
            onSelectCard={selectCard}
            lang={lang}
          />

          <div className="border-t border-stone-200 bg-white">
            <div className="flex items-center justify-center gap-2 p-3">
              <LangToggle lang={lang} onChange={setLang} />
              <button
                onClick={() => { sfxToggle(); setShowQR(!showQR); }}
                className="bg-stone-200 text-stone-700 px-3 py-2 rounded-lg font-bold
                           hover:bg-stone-300 transition-colors text-sm"
              >
                {showQR ? t(lang, 'hideQR') : t(lang, 'showQR')}
              </button>
              <button
                onClick={passTurn}
                className={`${teamColor} text-white px-6 py-2 rounded-lg font-bold
                           hover:opacity-90 transition-opacity`}
              >
                {t(lang, 'endTurn')}
              </button>
              <button
                onClick={() => { sfxModalOpen(); setShowRestartConfirm(true); }}
                className="bg-stone-200 text-stone-700 px-3 py-2 rounded-lg font-bold
                           hover:bg-stone-300 transition-colors text-sm"
              >
                {t(lang, 'newGameBtn')}
              </button>
              <button
                onClick={() => { sfxModalOpen(); setShowGoHomeConfirm(true); }}
                aria-label={t(lang, 'goHome')}
                className="bg-stone-200 text-stone-700 px-3 py-2 rounded-lg font-bold
                           hover:bg-stone-300 transition-colors text-sm"
              >
                <span aria-hidden="true">🏠</span>
              </button>
            </div>

            {showQR && (
              <div className="flex justify-center pb-3">
                <QRCodeSVG value={spymasterUrl} size={120} />
              </div>
            )}
          </div>
        </>
      )}

      {/* 게임 종료 */}
      {game.phase === 'finished' && (
        <>
          <GameHeader game={game} lang={lang} />
          <Board
            game={game}
            isSpymasterView={true}
            onSelectCard={() => {}}
            lang={lang}
          />
          <GameOverModal game={game} lang={lang} onNewGame={handleRestart} onGoHome={onGoHome} />
        </>
      )}

      {/* 홈 이동 확인 다이얼로그 */}
      {showGoHomeConfirm && (
        <Modal titleId="go-home-title" onClose={() => { sfxModalClose(); setShowGoHomeConfirm(false); }}>
          <h3 id="go-home-title" className="text-xl font-bold text-stone-800 mb-2">{t(lang, 'goHomeTitle')}</h3>
          <p className="text-stone-500 mb-5">{t(lang, 'goHomeMsg')}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { sfxModalClose(); setShowGoHomeConfirm(false); }}
              className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300 transition-colors"
            >
              {t(lang, 'cancel')}
            </button>
            <button
              onClick={() => { sfxClick(); setShowGoHomeConfirm(false); onGoHome(); }}
              className="bg-stone-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-700 transition-colors"
            >
              {t(lang, 'goHome')}
            </button>
          </div>
        </Modal>
      )}

      {/* 재시작 확인 다이얼로그 */}
      {showRestartConfirm && (
        <Modal titleId="restart-title" onClose={() => { sfxModalClose(); setShowRestartConfirm(false); }}>
          <h3 id="restart-title" className="text-xl font-bold text-stone-800 mb-2">{t(lang, 'restartTitle')}</h3>
          <p className="text-stone-500 mb-5">{t(lang, 'restartMsg')}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { sfxModalClose(); setShowRestartConfirm(false); }}
              className="bg-stone-200 text-stone-700 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-300 transition-colors"
            >
              {t(lang, 'cancel')}
            </button>
            <button
              onClick={() => { sfxClick(); handleRestart(); }}
              className="bg-stone-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-stone-700 transition-colors"
            >
              {t(lang, 'restartConfirm')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

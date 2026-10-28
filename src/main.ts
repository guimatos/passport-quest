import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import './styles.css';
import { Game } from './game';

const game = new Game();
game.reset();

// Exposed for manual testing in the console (restart from any state).
(window as unknown as { passportQuest: Game }).passportQuest = game;

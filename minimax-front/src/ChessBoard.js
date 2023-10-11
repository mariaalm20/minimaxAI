import React, { useState, useEffect } from 'react';
import Board from 'chessboardjsx';
import { Chess } from 'chess.js'; // Importe a biblioteca chess.js se ainda não o fez
import './ChessBoard.css';
import {
  makeComputerMove,
  exaustiveTests,
  automaticMode,
  isPlayerWin,
  makeBestMove,
} from './IA';

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [useMinMax, setUseMinMax] = useState(true);
  const [blackWin, setBlackWin] = useState(0);
  const [whiteWin, setWhiteWin] = useState(0);

  const [isAutomaticPlayer, setIsAutomaticPlayer] = useState(false);
  const [isHumanPlayer, setIsHumanPlayer] = useState(false);

  const onSquareClick = (square) => {
    if (!game.isGameOver()) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length > 0) {
        const move =
          moves[0].from +
          moves[0].to +
          (moves[0].promotion ? moves[0].promotion : '');
        game.move(move);
        console.log('MOVE', move);
        setGame(new Chess(game.fen()));
      }
    }
  };

  const onMouseoverSquare = (square, piece) => {
    if (!game.isGameOver()) {
      const moves = game.moves({ square, verbose: true });
      if (moves.length > 0) {
        for (let move of moves) {
          console.log('MOVE', move);
          highlightSquare(move.to);
        }
      }
    }
  };

  const onMouseoutSquare = () => {
    removeHighlightSquares();
  };

  const highlightSquare = (square) => {
    const squareEl = document.querySelector(`.square-${square}`);
    console.log('MOVE', squareEl);

    if (squareEl) {
      squareEl.classList.add('highlight');
    }
  };

  const removeHighlightSquares = () => {
    const highlightedSquares = document.querySelectorAll('.highlight');
    highlightedSquares.forEach((square) =>
      square.classList.remove('highlight')
    );
  };

  useEffect(() => {
    if (isAutomaticPlayer) {
      if (!game.isGameOver()) {
        makeComputerMove(game, useMinMax, setUseMinMax, setGame);
      } else {
        const win = game.turn() === 'w' ? 'PRETO' : 'BRANCO';

        isPlayerWin(game, whiteWin, blackWin, setWhiteWin, setBlackWin);
        console.log(`JOGADOR ${win} VENCEU}`);
        game.clear();
        setGame(new Chess());
        setUseMinMax(true);
        setIsAutomaticPlayer(false);
      }
    }
  }, [game, isAutomaticPlayer]);

  const humanPlayer = () => {
    setGame(new Chess());
    setIsAutomaticPlayer(false);
    setIsHumanPlayer(true);
  };

  useEffect(() => {
    if (isHumanPlayer && !game.isGameOver()) {
      if (useMinMax) {
        makeBestMove(game, game.turn(), setGame);
      }
      setUseMinMax(!useMinMax);
    }
  }, [game, isHumanPlayer]);

  return (
    <div>
      <div id="board" className="board">
        <Board
          width={800}
          position={game.fen()}
          onDrop={(move) => {
            const fromSquare = move.sourceSquare;
            const toSquare = move.targetSquare;

            const result = game.move({
              from: fromSquare,
              to: toSquare,
            });

            if (result !== null) {
              setGame(new Chess(game.fen()));
            }
          }}
          transitionDuration={300}
          onMouseOverSquare={onMouseoverSquare}
          onMouseOutSquare={onMouseoutSquare}
          draggable={true}
          onSquareClick={onSquareClick}
        />

        {isAutomaticPlayer && (
          <div className="game-info">
            <span className="game-info-text">
              Jogo atual: MINIMAX x STOCKFISH
            </span>
          </div>
        )}
        {isHumanPlayer && (
          <div className="game-info">
            <span className="game-info-text">Jogo atual: HUMANO x MINIMAX</span>
          </div>
        )}
      </div>

      <div className="buttonsContainer">
        <button
          className="button"
          onClick={() => exaustiveTests(game, setGame)}
        >
          IA X IA =Testes exaustivos
        </button>
        <button
          className="button"
          onClick={() =>
            automaticMode(setIsAutomaticPlayer, setGame, setIsHumanPlayer)
          }
        >
          IA X IA
        </button>
        <button className="button" onClick={humanPlayer}>
          HUMANO X IA
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;

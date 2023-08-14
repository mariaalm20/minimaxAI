import axios from 'axios';
import { Chess } from 'chess.js';

var pieceValues = {
  p: 100,
  n: 350,
  b: 350,
  r: 525,
  q: 1000,
  k: 10000,
};

function findKingPosition(board, color) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === 'k' && piece.color === color) {
        return [i, j];
      }
    }
  }
  return null;
}

export const evaluatePlays = (game) => {
  var board = game.board();
  var kingPosition = findKingPosition(board, game.turn());

  var value = 0;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        value += pieceValues[piece.type] * (piece.color === 'b' ? -1 : 1);

        if (piece.type !== 'k' && kingPosition) {
          const distanceToKing = Math.max(
            Math.abs(i - kingPosition[0]),
            Math.abs(j - kingPosition[1])
          );

          if (distanceToKing <= 1) {
            value += 10;
          }
        }
      }
    }
  }

  return value;
};

const randomMoves = (movesArray) => {
  return movesArray.sort(function () {
    return 0.5 - Math.random();
  });
};

export const calculateBestMove = (maxDepth, game, maximizingPlayer) => {
  var newGameMoves = game.moves();
  const randomnewGameMoves = randomMoves(newGameMoves);

  var bestMove = null;
  var bestMoveValue = -Infinity;

  for (var i = 0; i < randomnewGameMoves.length; i++) {
    var move = randomnewGameMoves[i];
    game.move(move);
    var moveValue = minimax(
      maxDepth - 1,
      -Infinity,
      Infinity,
      !maximizingPlayer,
      game
    );

    if (moveValue > bestMoveValue) {
      bestMoveValue = moveValue;
      bestMove = move;
    }
    game.undo();
  }
  return bestMove;
};

export const minimax = (depth, alpha, beta, maximizingPlayer, game) => {
  if (
    depth === 0 ||
    game.isDraw() ||
    game.isCheckmate() ||
    game.isStalemate() ||
    game.isThreefoldRepetition()
  ) {
    return evaluatePlays(game);
  }

  const possibleMoves = game.moves();
  const randomPossibleMoves = randomMoves(possibleMoves);

  let bestValue = maximizingPlayer ? -Infinity : Infinity;

  for (const possibleMove of randomPossibleMoves) {
    game.move(possibleMove); //simula jogada
    const value = minimax(depth - 1, alpha, beta, !maximizingPlayer, game); //calcula jogada em níveis menores
    game.undo(); //desfaz jogada

    if (maximizingPlayer) {
      bestValue = Math.max(bestValue, value);
      alpha = Math.max(alpha, value);
    } else {
      bestValue = Math.min(bestValue, value);
      beta = Math.min(beta, value);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return bestValue;
};

const makeMoveWithStockfish = async (fen) => {
  try {
    const response = await axios.post('http://localhost:8080/', {
      fen,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer o movimento com o Stockfish:', error);
    return null;
  }
};

export const makeBestMoveStockfish = async (game, setGame) => {
  const fen = game.fen();
  const response = await makeMoveWithStockfish(fen);
  if (
    response &&
    typeof response === 'string' &&
    response.includes('bestmove')
  ) {
    const bestMove = response.split(' ')[1];
    const gameTurn = game.turn() === 'w' ? 'BRANCO' : 'PRETO';

    console.log('Melhor movimento STOCKFISH:===>', bestMove, gameTurn);
    game.move(bestMove);

    setGame(new Chess(game.fen()));
  }
};

export const makeComputerMove = (game, useMinMax, setUseMinMax, setGame) => {
  game.undo();
  const gameTurn = game.turn() === 'w' ? 'BRANCO' : 'PRETO';

  if (useMinMax) {
    console.log(`############### MINMAX ############# ====> ${gameTurn}`);
    makeBestMove(game, gameTurn, setGame);
  } else {
    console.log(`############### STOCKFISH ############# ====> ${gameTurn}`);

    makeBestMoveStockfish(game, setGame);
  }
  setUseMinMax(!useMinMax);
};

export const makeBestMove = (gameCopy, gameTurn, setGame) => {
  const bestMove = calculateBestMove(3, gameCopy, true);
  gameCopy.move(bestMove);

  console.log('Melhor movimento MINIMAX:===>', bestMove, gameTurn);

  setGame(new Chess(gameCopy.fen()));
};

export const automaticMode = (
  setIsAutomaticPlayer,
  setGame,
  setIsHumanPlayer
) => {
  setGame(new Chess());
  setIsHumanPlayer(false);
  setIsAutomaticPlayer(true);
};

export const exaustiveTests = async (game, setGame) => {
  const depths = [1, 2, 3];
  const numGamesPerDepth = 3;
  const depthWins = { BRANCO: 0, PRETO: 0 };

  for (const depth of depths) {
    console.log(`Starting tests for depth ${depth}`);

    const gamesResults = await runDepthTests(
      depth,
      numGamesPerDepth,
      game,
      setGame
    );
    updateWinsCount(depthWins, gamesResults);
  }

  console.log(depthWins);
};

const runDepthTests = async (depth, numGames, game, setGame) => {
  const results = [];

  for (let i = 0; i < numGames; i++) {
    const gameCopy = new Chess(game.fen());
    const gameResults = await runGameTests(gameCopy, depth, setGame);
    results.push(gameResults);
  }

  return results;
};

const runGameTests = async (gameCopy, depth, setGame) => {
  let gameTurn = gameCopy.turn();
  const gameResults = { winner: null };

  while (!gameCopy.isGameOver()) {
    if (gameTurn === 'w') {
      makeBestMove(gameCopy, gameTurn, setGame);
    } else {
      await makeBestMoveStockfish(gameCopy, setGame);
    }

    gameTurn = gameCopy.turn();
  }

  gameResults.winner = gameTurn === 'w' ? 'PRETO' : 'BRANCO';
  return gameResults;
};

const updateWinsCount = (depthWins, gamesResults) => {
  for (const result of gamesResults) {
    depthWins[result.winner] += 1;
  }
};

export const isPlayerWin = (
  game,
  whiteWin,
  blackWin,
  setWhiteWin,
  setBlackWin
) => {
  const win = game.turn() === 'w' ? 'PRETO' : 'BRANCO';
  if (win === 'BRANCO') {
    setWhiteWin(whiteWin + 1);
  } else {
    setBlackWin(blackWin + 1);
  }
};

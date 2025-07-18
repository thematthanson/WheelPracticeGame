#!/usr/bin/env node

/**
 * Test Script: Computer Turn Issue Investigation
 * 
 * This script simulates the exact scenario where the game stalls after the computer's second turn.
 * It will help identify the root cause of the infinite computer turn loop.
 */

console.log('🔍 COMPUTER TURN ISSUE INVESTIGATION');
console.log('=====================================\n');

// Simulate the game state after computer's second turn
const simulateGameState = () => {
  console.log('📊 SIMULATING GAME STATE AFTER COMPUTER SECOND TURN');
  
  const gameState = {
    currentPlayer: 'computer-2',
    players: {
      'computer-2': { id: 'computer-2', name: 'Computer 2', isHuman: false },
      'p1': { id: 'p1', name: 'p1', isHuman: true },
      'p2': { id: 'p2', name: 'p2', isHuman: true }
    },
    puzzle: {
      text: 'BLUE MOON WALK',
      category: 'BEFORE & AFTER',
      revealed: ['B', 'L', 'U', 'E', 'M', 'O', 'O', 'N', 'W', 'A', 'L', 'K']
    },
    usedLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    wheelValue: null,
    isSpinning: false,
    turnInProgress: false
  };
  
  console.log('Game State:', JSON.stringify(gameState, null, 2));
  return gameState;
};

// Test computer turn logic
const testComputerTurnLogic = (gameState) => {
  console.log('\n🤖 TESTING COMPUTER TURN LOGIC');
  
  const allPlayers = Object.values(gameState.players);
  const humanPlayers = allPlayers.filter(p => p.isHuman);
  const computerPlayers = allPlayers.filter(p => !p.isHuman);
  
  console.log('All Players:', allPlayers.map(p => ({ id: p.id, name: p.name, isHuman: p.isHuman })));
  console.log('Human Players:', humanPlayers.map(p => ({ id: p.id, name: p.name })));
  console.log('Computer Players:', computerPlayers.map(p => ({ id: p.id, name: p.name })));
  
  // Test the conditions that trigger computer turns
  const currentPlayer = gameState.players[gameState.currentPlayer];
  console.log('Current Player:', currentPlayer);
  
  // Condition 1: Computer turns allowed if humans < 3
  const computerTurnsAllowed = humanPlayers.length < 3;
  console.log('Computer turns allowed (humans < 3):', computerTurnsAllowed);
  
  // Condition 2: Current player is computer
  const isCurrentPlayerComputer = currentPlayer && !currentPlayer.isHuman;
  console.log('Current player is computer:', isCurrentPlayerComputer);
  
  // Condition 3: Game is not in final round
  const notFinalRound = !gameState.isFinalRound;
  console.log('Not final round:', notFinalRound);
  
  // Condition 4: No turn in progress
  const noTurnInProgress = !gameState.turnInProgress;
  console.log('No turn in progress:', noTurnInProgress);
  
  // Condition 5: Not spinning
  const notSpinning = !gameState.isSpinning;
  console.log('Not spinning:', notSpinning);
  
  // Combined condition
  const shouldTriggerComputerTurn = computerTurnsAllowed && isCurrentPlayerComputer && notFinalRound && noTurnInProgress && notSpinning;
  console.log('Should trigger computer turn:', shouldTriggerComputerTurn);
  
  return shouldTriggerComputerTurn;
};

// Test turn advancement logic
const testTurnAdvancement = (gameState) => {
  console.log('\n🔄 TESTING TURN ADVANCEMENT LOGIC');
  
  const allPlayers = Object.values(gameState.players);
  const currentPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayer);
  
  console.log('Current player index:', currentPlayerIndex);
  console.log('All players:', allPlayers.map(p => p.id));
  
  // Test next player calculation
  const nextIndex = (currentPlayerIndex + 1) % allPlayers.length;
  const nextPlayer = allPlayers[nextIndex];
  
  console.log('Next player index:', nextIndex);
  console.log('Next player:', nextPlayer);
  
  // Test if next player is different
  const isNextPlayerDifferent = nextPlayer.id !== gameState.currentPlayer;
  console.log('Next player is different:', isNextPlayerDifferent);
  
  return {
    nextPlayer,
    isNextPlayerDifferent,
    nextIndex
  };
};

// Test the specific issue scenario
const testSpecificIssue = () => {
  console.log('\n🎯 TESTING SPECIFIC ISSUE SCENARIO');
  
  // Simulate the state right after computer's second turn
  const gameState = simulateGameState();
  
  // Test computer turn logic
  const shouldTriggerComputer = testComputerTurnLogic(gameState);
  
  // Test turn advancement
  const turnAdvancement = testTurnAdvancement(gameState);
  
  console.log('\n📋 ANALYSIS:');
  console.log('1. Computer turn should trigger:', shouldTriggerComputer);
  console.log('2. Next player should be:', turnAdvancement.nextPlayer.name);
  console.log('3. Next player is different:', turnAdvancement.isNextPlayerDifferent);
  
  // Identify the problem
  if (shouldTriggerComputer && gameState.currentPlayer === 'computer-2') {
    console.log('\n❌ PROBLEM IDENTIFIED:');
    console.log('- Computer turn is being triggered when it should not be');
    console.log('- This creates an infinite loop');
    console.log('- The computer should have already completed its turn');
  }
  
  return {
    shouldTriggerComputer,
    turnAdvancement,
    gameState
  };
};

// Test the computer turn completion logic
const testComputerTurnCompletion = () => {
  console.log('\n✅ TESTING COMPUTER TURN COMPLETION');
  
  // Simulate computer turn completion
  const gameState = {
    currentPlayer: 'p1', // Should be p1 after computer turn
    players: {
      'computer-2': { id: 'computer-2', name: 'Computer 2', isHuman: false },
      'p1': { id: 'p1', name: 'p1', isHuman: true },
      'p2': { id: 'p2', name: 'p2', isHuman: true }
    },
    puzzle: {
      text: 'BLUE MOON WALK',
      category: 'BEFORE & AFTER',
      revealed: ['B', 'L', 'U', 'E', 'M', 'O', 'O', 'N', 'W', 'A', 'L', 'K']
    },
    usedLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    wheelValue: null,
    isSpinning: false,
    turnInProgress: false
  };
  
  console.log('After computer turn completion:');
  console.log('Current player should be p1:', gameState.currentPlayer === 'p1');
  
  // Test that computer turn should NOT trigger
  const shouldTriggerComputer = testComputerTurnLogic(gameState);
  console.log('Computer turn should NOT trigger:', !shouldTriggerComputer);
  
  return {
    shouldTriggerComputer,
    gameState
  };
};

// Run all tests
console.log('🚀 RUNNING COMPREHENSIVE TESTS\n');

const test1 = testSpecificIssue();
const test2 = testComputerTurnCompletion();

console.log('\n📊 TEST RESULTS SUMMARY:');
console.log('Test 1 - Issue Scenario:', test1.shouldTriggerComputer ? '❌ FAILED' : '✅ PASSED');
console.log('Test 2 - Completion Scenario:', !test2.shouldTriggerComputer ? '✅ PASSED' : '❌ FAILED');

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('1. Add a flag to track if computer turn is already in progress');
console.log('2. Ensure computer turn completion properly advances to next player');
console.log('3. Add validation to prevent multiple simultaneous computer turns');
console.log('4. Add timeout mechanism to prevent infinite loops');

console.log('\n✅ TEST COMPLETE'); 
#!/usr/bin/env node

/**
 * Test Script: Turn Progression System Validation
 * 
 * This script systematically tests the turn progression system to identify
 * why we never advance to player 2 despite having a functioning setup.
 */

console.log('🔍 TURN PROGRESSION SYSTEM VALIDATION');
console.log('=====================================\n');

// Simulate the game state and players
const createTestGameState = () => {
  return {
    currentPlayer: 'p1',
    players: {
      'p1': { id: 'p1', name: 'p1', isHuman: true, roundMoney: 1000, totalMoney: 5000 },
      'p2': { id: 'p2', name: 'p2', isHuman: true, roundMoney: 500, totalMoney: 3000 },
      'computer-1': { id: 'computer-1', name: 'Computer 1', isHuman: false, roundMoney: 0, totalMoney: 0 }
    },
    isSpinning: false,
    turnInProgress: false,
    wheelValue: null,
    message: '',
    puzzle: {
      text: 'TEST PUZZLE',
      category: 'TEST',
      revealed: []
    },
    usedLetters: []
  };
};

// Test 1: Basic turn advancement logic
const testBasicTurnAdvancement = () => {
  console.log('📋 TEST 1: Basic Turn Advancement Logic');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  
  console.log('👥 All players:', allPlayers.map(p => ({ id: p.id, name: p.name, isHuman: p.isHuman })));
  console.log('🎯 Current player:', gameState.currentPlayer);
  
  // Test cycling through all players
  for (let i = 0; i < 6; i++) {
    const currentPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayer);
    const nextIndex = (currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextIndex];
    
    console.log(`🔄 Turn ${i + 1}: ${gameState.currentPlayer} → ${nextPlayer.id} (${nextPlayer.name})`);
    
    // Update current player
    gameState.currentPlayer = nextPlayer.id;
  }
  
  console.log('✅ Basic turn advancement test completed\n');
};

// Test 2: Firebase turn advancement logic simulation
const testFirebaseTurnAdvancement = () => {
  console.log('📋 TEST 2: Firebase Turn Advancement Logic Simulation');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  
  console.log('🎯 Starting with player:', gameState.currentPlayer);
  
  // Simulate incorrect letter guess (should advance turn)
  const simulateIncorrectGuess = () => {
    const currentPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayer);
    const nextIndex = (currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextIndex];
    
    console.log(`❌ Incorrect guess by ${gameState.currentPlayer} → advancing to ${nextPlayer.id}`);
    gameState.currentPlayer = nextPlayer.id;
    return nextPlayer;
  };
  
  // Simulate correct letter guess (should continue turn)
  const simulateCorrectGuess = () => {
    console.log(`✅ Correct guess by ${gameState.currentPlayer} → continuing turn`);
    return gameState.players[gameState.currentPlayer];
  };
  
  // Test sequence: p1 incorrect → p2 incorrect → computer incorrect → p1 correct → p1 incorrect → p2
  const testSequence = [
    { action: 'incorrect', expected: 'p2' },
    { action: 'incorrect', expected: 'computer-1' },
    { action: 'incorrect', expected: 'p1' },
    { action: 'correct', expected: 'p1' },
    { action: 'incorrect', expected: 'p2' }
  ];
  
  testSequence.forEach((test, index) => {
    console.log(`\n🔄 Test ${index + 1}: ${test.action} guess`);
    const result = test.action === 'incorrect' ? simulateIncorrectGuess() : simulateCorrectGuess();
    console.log(`   Expected: ${test.expected}, Got: ${result.id}`);
    console.log(`   ✅ ${result.id === test.expected ? 'PASS' : 'FAIL'}`);
  });
  
  console.log('\n✅ Firebase turn advancement test completed\n');
};

// Test 3: Wheel spin turn advancement logic
const testWheelSpinTurnAdvancement = () => {
  console.log('📋 TEST 3: Wheel Spin Turn Advancement Logic');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  
  // Test LOSE A TURN logic
  console.log('🎯 Testing LOSE A TURN logic:');
  const currentPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayer);
  const nextIndex = (currentPlayerIndex + 1) % allPlayers.length;
  const nextPlayer = allPlayers[nextIndex];
  
  console.log(`   Current: ${gameState.currentPlayer} (${gameState.players[gameState.currentPlayer].name})`);
  console.log(`   Next: ${nextPlayer.id} (${nextPlayer.name})`);
  console.log(`   Is Human: ${nextPlayer.isHuman}`);
  
  // Test BANKRUPT logic
  console.log('\n🎯 Testing BANKRUPT logic:');
  const bankruptNextIndex = (nextIndex + 1) % allPlayers.length;
  const bankruptNextPlayer = allPlayers[bankruptNextIndex];
  
  console.log(`   After BANKRUPT: ${bankruptNextPlayer.id} (${bankruptNextPlayer.name})`);
  console.log(`   Is Human: ${bankruptNextPlayer.isHuman}`);
  
  console.log('\n✅ Wheel spin turn advancement test completed\n');
};

// Test 4: Computer turn scheduling logic
const testComputerTurnScheduling = () => {
  console.log('📋 TEST 4: Computer Turn Scheduling Logic');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  const humanPlayers = allPlayers.filter(p => p.isHuman);
  const computerPlayers = allPlayers.filter(p => !p.isHuman);
  
  console.log('👥 Human players:', humanPlayers.map(p => p.name));
  console.log('🤖 Computer players:', computerPlayers.map(p => p.name));
  
  // Test computer turn conditions
  const testComputerTurnConditions = (currentPlayerId) => {
    const currentPlayer = gameState.players[currentPlayerId];
    const isComputerTurn = currentPlayer && 
                          !currentPlayer.isHuman && 
                          !gameState.isFinalRound &&
                          !gameState.turnInProgress && 
                          !gameState.isSpinning;
    
    console.log(`🎯 Testing computer turn for ${currentPlayerId}:`);
    console.log(`   Is Computer: ${!currentPlayer.isHuman}`);
    console.log(`   Is Final Round: ${gameState.isFinalRound}`);
    console.log(`   Turn In Progress: ${gameState.turnInProgress}`);
    console.log(`   Is Spinning: ${gameState.isSpinning}`);
    console.log(`   Should Trigger: ${isComputerTurn}`);
    
    return isComputerTurn;
  };
  
  // Test with computer as current player
  gameState.currentPlayer = 'computer-1';
  testComputerTurnConditions('computer-1');
  
  // Test with human as current player
  gameState.currentPlayer = 'p1';
  testComputerTurnConditions('p1');
  
  console.log('\n✅ Computer turn scheduling test completed\n');
};

// Test 5: Turn validation logic
const testTurnValidation = () => {
  console.log('📋 TEST 5: Turn Validation Logic');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  
  // Test getCurrentPlayer function logic
  const getCurrentPlayer = (currentPlayerId) => {
    if (typeof currentPlayerId === 'string') {
      return gameState.players[currentPlayerId];
    } else if (typeof currentPlayerId === 'number') {
      return allPlayers[currentPlayerId];
    }
    return null;
  };
  
  // Test getCurrentPlayerIndex function logic
  const getCurrentPlayerIndex = (currentPlayerId) => {
    return allPlayers.findIndex(p => p.id === currentPlayerId);
  };
  
  console.log('🎯 Testing player lookup functions:');
  
  // Test string ID lookup
  const p1Player = getCurrentPlayer('p1');
  console.log(`   getCurrentPlayer('p1'): ${p1Player ? p1Player.name : 'null'}`);
  
  // Test numeric index lookup
  const p1PlayerByIndex = getCurrentPlayer(0);
  console.log(`   getCurrentPlayer(0): ${p1PlayerByIndex ? p1PlayerByIndex.name : 'null'}`);
  
  // Test index finding
  const p1Index = getCurrentPlayerIndex('p1');
  console.log(`   getCurrentPlayerIndex('p1'): ${p1Index}`);
  
  const p2Index = getCurrentPlayerIndex('p2');
  console.log(`   getCurrentPlayerIndex('p2'): ${p2Index}`);
  
  console.log('\n✅ Turn validation test completed\n');
};

// Test 6: Firebase sync impact on turn progression
const testFirebaseSyncImpact = () => {
  console.log('📋 TEST 6: Firebase Sync Impact on Turn Progression');
  
  const localGameState = createTestGameState();
  const firebaseGameState = {
    ...localGameState,
    currentPlayer: 'p2' // Firebase has different current player
  };
  
  console.log('🎯 Testing Firebase sync conflict:');
  console.log(`   Local current player: ${localGameState.currentPlayer}`);
  console.log(`   Firebase current player: ${firebaseGameState.currentPlayer}`);
  console.log(`   Conflict: ${localGameState.currentPlayer !== firebaseGameState.currentPlayer}`);
  
  // Simulate Firebase sync overriding local state
  const syncedGameState = {
    ...localGameState,
    currentPlayer: firebaseGameState.currentPlayer
  };
  
  console.log(`   After sync: ${syncedGameState.currentPlayer}`);
  
  console.log('\n✅ Firebase sync impact test completed\n');
};

// Test 7: Turn advancement edge cases
const testTurnAdvancementEdgeCases = () => {
  console.log('📋 TEST 7: Turn Advancement Edge Cases');
  
  const gameState = createTestGameState();
  const allPlayers = Object.values(gameState.players);
  
  console.log('🎯 Testing edge cases:');
  
  // Test with invalid current player
  gameState.currentPlayer = 'invalid-player';
  const invalidPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayer);
  console.log(`   Invalid player index: ${invalidPlayerIndex}`);
  
  // Test with empty players array
  const emptyPlayers = [];
  const emptyNextIndex = (0 + 1) % Math.max(emptyPlayers.length, 1);
  console.log(`   Empty players next index: ${emptyNextIndex}`);
  
  // Test with single player
  const singlePlayer = [allPlayers[0]];
  const singleNextIndex = (0 + 1) % singlePlayer.length;
  console.log(`   Single player next index: ${singleNextIndex}`);
  
  console.log('\n✅ Turn advancement edge cases test completed\n');
};

// Run all tests
const runAllTests = () => {
  console.log('🧪 RUNNING COMPREHENSIVE TURN PROGRESSION TESTS\n');
  
  testBasicTurnAdvancement();
  testFirebaseTurnAdvancement();
  testWheelSpinTurnAdvancement();
  testComputerTurnScheduling();
  testTurnValidation();
  testFirebaseSyncImpact();
  testTurnAdvancementEdgeCases();
  
  console.log('🎯 SUMMARY OF POTENTIAL ISSUES:');
  console.log('   1. Firebase sync conflicts overriding local turn state');
  console.log('   2. Turn advancement logic not cycling through all players');
  console.log('   3. Computer turn scheduling blocking human turns');
  console.log('   4. Invalid player ID handling in turn advancement');
  console.log('   5. Turn validation logic preventing proper advancement');
  console.log('   6. Wheel spin logic not properly advancing turns');
  console.log('   7. Letter guess handlers not updating turn state correctly');
  
  console.log('\n🔍 NEXT STEPS:');
  console.log('   1. Check Firebase sync logic for turn state conflicts');
  console.log('   2. Verify turn advancement cycles through ALL players');
  console.log('   3. Test letter guess handlers in actual game');
  console.log('   4. Validate wheel spin turn advancement logic');
  console.log('   5. Check for race conditions in turn state updates');
};

runAllTests(); 
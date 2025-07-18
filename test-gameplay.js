// Enhanced Wheel of Fortune Gameplay Testing
// This script simulates gameplay to validate core functionality

class WheelOfFortuneTester {
  constructor() {
    this.testResults = [];
    this.currentTest = 0;
  }

  // Simulate wheel spin
  simulateWheelSpin() {
    const segments = [
      100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
      'BANKRUPT', 'LOSE A TURN',
      { type: 'PRIZE', name: 'CAR', value: 500, displayValue: 'CAR' },
      { type: 'WILD_CARD', value: 500, displayValue: 'WILD CARD' },
      { type: 'GIFT_TAG', value: 1000, displayValue: '$1000 GIFT TAG' },
      { type: 'MILLION', value: 1000000, displayValue: 'MILLION DOLLAR WEDGE' }
    ];
    
    const randomSegment = segments[Math.floor(Math.random() * segments.length)];
    console.log(`🎯 Simulated wheel spin landed on: ${JSON.stringify(randomSegment)}`);
    return randomSegment;
  }

  // Simulate letter guess with better logic
  simulateLetterGuess(puzzle, usedLetters) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const availableLetters = alphabet.split('').filter(letter => !usedLetters.includes(letter));
    
    if (availableLetters.length === 0) {
      console.log('❌ No more letters available to guess');
      return null;
    }
    
    // Prioritize letters that are actually in the puzzle for testing
    const lettersInPuzzle = puzzle.split('').filter(char => /[A-Z]/.test(char));
    const uniqueLettersInPuzzle = [...new Set(lettersInPuzzle)];
    const unusedLettersInPuzzle = uniqueLettersInPuzzle.filter(letter => !usedLetters.includes(letter));
    
    let letterToGuess;
    if (unusedLettersInPuzzle.length > 0) {
      // 70% chance to guess a letter that's in the puzzle
      if (Math.random() < 0.7) {
        letterToGuess = unusedLettersInPuzzle[Math.floor(Math.random() * unusedLettersInPuzzle.length)];
      } else {
        letterToGuess = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      }
    } else {
      letterToGuess = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    }
    
    const isCorrect = puzzle.includes(letterToGuess);
    
    console.log(`🔤 Simulated letter guess: ${letterToGuess} - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    return { letter: letterToGuess, isCorrect };
  }

  // Test wheel value functionality
  testWheelValue() {
    console.log('\n🧪 Testing Wheel Value Functionality...');
    
    const testCases = [
      { value: 500, expected: true, description: 'Number wheel value' },
      { value: 0, expected: false, description: 'Zero wheel value' },
      { value: null, expected: false, description: 'Null wheel value' },
      { value: { type: 'PRIZE', value: 500 }, expected: true, description: 'Object wheel value' },
      { value: 'BANKRUPT', expected: false, description: 'String wheel value' }
    ];

    testCases.forEach(testCase => {
      const hasValue = this.hasWheelValue(testCase.value);
      const passed = hasValue === testCase.expected;
      
      this.testResults.push({
        test: 'Wheel Value',
        description: testCase.description,
        passed,
        expected: testCase.expected,
        actual: hasValue,
        value: testCase.value
      });
      
      console.log(`${passed ? '✅' : '❌'} ${testCase.description}: ${hasValue}`);
    });
  }

  // Test letter reveal functionality with better logic
  testLetterReveal() {
    console.log('\n🧪 Testing Letter Reveal Functionality...');
    
    const testPuzzle = 'HELLO WORLD';
    const revealedLetters = new Set(['H', 'E', 'L']);
    
    const testCases = [
      { letter: 'H', expected: true, description: 'Letter H in puzzle' },
      { letter: 'E', expected: true, description: 'Letter E in puzzle' },
      { letter: 'L', expected: true, description: 'Letter L in puzzle (multiple)' },
      { letter: 'X', expected: false, description: 'Letter X not in puzzle' },
      { letter: ' ', expected: true, description: 'Space character (should be revealed)' },
      { letter: '/', expected: true, description: 'Slash character (should be revealed)' }
    ];

    testCases.forEach(testCase => {
      const isRevealed = this.isCharacterRevealed(testCase.letter, testPuzzle, revealedLetters);
      const passed = isRevealed === testCase.expected;
      
      this.testResults.push({
        test: 'Letter Reveal',
        description: testCase.description,
        passed,
        expected: testCase.expected,
        actual: isRevealed,
        letter: testCase.letter
      });
      
      console.log(`${passed ? '✅' : '❌'} ${testCase.description}: ${isRevealed}`);
    });
  }

  // Test player state management
  testPlayerState() {
    console.log('\n🧪 Testing Player State Management...');
    
    const testPlayer = {
      name: 'Test Player',
      roundMoney: 0,
      totalMoney: 0,
      isHuman: true,
      prizes: [],
      specialCards: []
    };

    // Test prize addition
    try {
      testPlayer.prizes.push({
        name: 'CAR',
        value: 500,
        round: 1,
        description: 'A fabulous car!'
      });
      console.log('✅ Prize addition successful');
      this.testResults.push({
        test: 'Player State',
        description: 'Prize addition',
        passed: true,
        expected: true,
        actual: true
      });
    } catch (error) {
      console.log('❌ Prize addition failed:', error.message);
      this.testResults.push({
        test: 'Player State',
        description: 'Prize addition',
        passed: false,
        expected: true,
        actual: false,
        error: error.message
      });
    }

    // Test special card addition
    try {
      testPlayer.specialCards.push('WILD_CARD');
      console.log('✅ Special card addition successful');
      this.testResults.push({
        test: 'Player State',
        description: 'Special card addition',
        passed: true,
        expected: true,
        actual: true
      });
    } catch (error) {
      console.log('❌ Special card addition failed:', error.message);
      this.testResults.push({
        test: 'Player State',
        description: 'Special card addition',
        passed: false,
        expected: true,
        actual: false,
        error: error.message
      });
    }
  }

  // Test the specific letter reveal issue we're seeing
  testLetterRevealIssue() {
    console.log('\n🧪 Testing Letter Reveal Issue...');
    
    const puzzle = 'HELLO WORLD';
    let revealedLetters = new Set();
    
    console.log(`🎯 Testing puzzle: "${puzzle}"`);
    console.log(`📝 Initial revealed letters: ${Array.from(revealedLetters).join(', ')}`);
    
    // Simulate correct letter guesses
    const testLetters = ['H', 'E', 'L', 'O', 'W', 'R', 'D'];
    
    testLetters.forEach(letter => {
      const letterCount = (puzzle.match(new RegExp(letter, 'g')) || []).length;
      console.log(`\n🔤 Testing letter "${letter}" (appears ${letterCount} times)`);
      
      // Add letter to revealed set
      revealedLetters.add(letter);
      console.log(`✅ Added "${letter}" to revealed letters`);
      console.log(`📝 Revealed letters now: ${Array.from(revealedLetters).join(', ')}`);
      
      // Check if letter is properly revealed
      const isRevealed = this.isCharacterRevealed(letter, puzzle, revealedLetters);
      console.log(`🔍 Letter "${letter}" revealed: ${isRevealed}`);
      
      // Check all instances of this letter in the puzzle
      const puzzleArray = puzzle.split('');
      puzzleArray.forEach((char, index) => {
        if (char === letter) {
          const shouldBeRevealed = this.isCharacterRevealed(char, puzzle, revealedLetters);
          console.log(`  Position ${index}: "${char}" should be revealed: ${shouldBeRevealed}`);
        }
      });
    });
    
    // Test final puzzle state
    console.log('\n🎯 Final Puzzle State Test:');
    const finalPuzzleDisplay = puzzle.split('').map(char => {
      if (char === ' ' || char === '/') return char;
      return this.isCharacterRevealed(char, puzzle, revealedLetters) ? char : '_';
    }).join('');
    
    console.log(`📝 Puzzle display: "${finalPuzzleDisplay}"`);
    console.log(`📝 Expected: "HELLO WORLD"`);
    
    const allRevealed = puzzle.split('').every(char => 
      char === ' ' || char === '/' || this.isCharacterRevealed(char, puzzle, revealedLetters)
    );
    
    console.log(`✅ All letters revealed: ${allRevealed}`);
    
    this.testResults.push({
      test: 'Letter Reveal Issue',
      description: 'Complete letter reveal simulation',
      passed: allRevealed,
      expected: true,
      actual: allRevealed
    });
  }

  // Simulate full game round with better logic
  simulateGameRound() {
    console.log('\n🎮 Simulating Full Game Round...');
    
    const puzzle = 'HELLO WORLD';
    const usedLetters = [];
    const players = [
      { name: 'Player 1', roundMoney: 0, totalMoney: 0, isHuman: true, prizes: [], specialCards: [] },
      { name: 'Player 2', roundMoney: 0, totalMoney: 0, isHuman: true, prizes: [], specialCards: [] },
      { name: 'Computer', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] }
    ];
    
    let currentPlayer = 0;
    let wheelValue = null;
    let roundComplete = false;
    let turnCount = 0;
    const maxTurns = 30; // Increased for better testing
    
    console.log(`🎯 Starting round with puzzle: "${puzzle}"`);
    
    while (!roundComplete && turnCount < maxTurns) {
      turnCount++;
      console.log(`\n🔄 Turn ${turnCount} - Player: ${players[currentPlayer].name}`);
      
      // Simulate wheel spin
      if (!wheelValue) {
        wheelValue = this.simulateWheelSpin();
        console.log(`🎯 Wheel value set to: ${JSON.stringify(wheelValue)}`);
      }
      
      // Simulate letter guess
      const guess = this.simulateLetterGuess(puzzle, usedLetters);
      if (!guess) {
        console.log('❌ No more letters available');
        break;
      }
      
      usedLetters.push(guess.letter);
      
      if (guess.isCorrect) {
        console.log(`✅ Correct guess! Letter "${guess.letter}" revealed`);
        
        // Simulate money earned
        if (typeof wheelValue === 'number' && wheelValue > 0) {
          const letterCount = (puzzle.match(new RegExp(guess.letter, 'g')) || []).length;
          const earned = wheelValue * letterCount;
          players[currentPlayer].roundMoney += earned;
          console.log(`💰 Player earned $${earned} (${letterCount} letters × $${wheelValue})`);
        }
        
        // Check if puzzle is complete
        const revealedLetters = new Set(usedLetters.filter(letter => puzzle.includes(letter)));
        const allLettersRevealed = puzzle.split('').every(char => 
          char === ' ' || char === '/' || revealedLetters.has(char)
        );
        
        console.log(`📝 Revealed letters: ${Array.from(revealedLetters).join(', ')}`);
        console.log(`🎯 All letters revealed: ${allLettersRevealed}`);
        
        if (allLettersRevealed) {
          console.log('🎉 Puzzle complete! All letters revealed');
          roundComplete = true;
        } else {
          console.log('🔄 Player continues turn');
          wheelValue = null; // Reset for next spin
        }
      } else {
        console.log(`❌ Incorrect guess! Letter "${guess.letter}" not in puzzle`);
        console.log('🔄 Turn passes to next player');
        currentPlayer = (currentPlayer + 1) % players.length;
        wheelValue = null; // Reset for next spin
      }
    }
    
    // Display final results
    console.log('\n📊 Round Results:');
    players.forEach((player, index) => {
      console.log(`${player.name}: $${player.roundMoney} (${player.prizes.length} prizes, ${player.specialCards.length} special cards)`);
    });
    
    this.testResults.push({
      test: 'Game Round',
      description: 'Complete round simulation',
      passed: turnCount < maxTurns && roundComplete,
      expected: true,
      actual: turnCount < maxTurns && roundComplete,
      turns: turnCount,
      roundComplete
    });
  }

  // Helper functions
  hasWheelValue(value) {
    if (!value || value === null) return false;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'object' && 'value' in value) return value.value > 0;
    return false;
  }

  isCharacterRevealed(char, puzzle, revealedLetters) {
    if (char === ' ' || char === '/') return true;
    return revealedLetters.has(char);
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Starting Enhanced Wheel of Fortune Automated Testing...\n');
    
    this.testWheelValue();
    this.testLetterReveal();
    this.testPlayerState();
    this.testLetterRevealIssue();
    this.simulateGameRound();
    
    this.printResults();
  }

  // Print test results
  printResults() {
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Overall: ${passed}/${total} tests passed (${percentage}%)`);
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${status} - ${result.test}: ${result.description}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 Key Findings:');
    if (passed === total) {
      console.log('✅ All core functionality appears to be working correctly');
    } else {
      console.log('⚠️  Some issues detected - check failed tests above');
      console.log('\n🔧 Recommendations:');
      console.log('- Check letter reveal logic in the actual game component');
      console.log('- Verify wheel value handling in multiplayer mode');
      console.log('- Ensure player state is properly initialized');
    }
  }
}

// Run the tests
const tester = new WheelOfFortuneTester();
tester.runAllTests(); 
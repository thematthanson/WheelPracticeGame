import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Play, Pause, Award, Clock, DollarSign } from 'lucide-react';

// Type definitions
interface BeforeAfterTemplate {
  before: string;
  shared: string;
  after: string;
  full: string;
}

interface ThenNowTemplate {
  then: string;
  now: string;
}

interface PuzzleTemplates {
  [key: string]: (string | BeforeAfterTemplate | ThenNowTemplate)[];
}

interface WheelSegment {
  type: string;
  name?: string;
  value: number;
  displayValue: string;
}

interface SpecialFormat {
  type: string;
  before?: string;
  shared?: string;
  after?: string;
  then?: string;
  now?: string;
  letter?: string;
  question?: string;
}

interface Puzzle {
  text: string;
  category: string;
  revealed: Set<string>;
  specialFormat: SpecialFormat | null;
}

interface Prize {
  name: string;
  value: number;
  round: number;
  description: string;
}

interface Player {
  name: string;
  roundMoney: number;
  totalMoney: number;
  isHuman: boolean;
  prizes: Prize[];
  specialCards: string[];
}

interface GameStats {
  totalPuzzles: number;
  solvedPuzzles: number;
  totalLettersGuessed: number;
  correctLetters: number;
  letterStats: { [letter: string]: { correct: number; incorrect: number; } };
  categoryStats: { [category: string]: { attempted: number; solved: number; } };
  averageLettersPerPuzzle: number;
  bestCategory: string;
  worstCategory: string;
  mostSuccessfulLetter: string;
  leastSuccessfulLetter: string;
}

interface GameState {
  currentRound: number;
  puzzle: Puzzle;
  usedLetters: Set<string>;
  wheelValue: number | string | WheelSegment;
  isSpinning: boolean;
  wheelRotation: number;
  players: Player[];
  currentPlayer: number;
  turnInProgress: boolean;
  lastSpinResult: number | string | WheelSegment | null;
  landedSegmentIndex: number;
  message: string;
  isFinalRound: boolean;
  finalRoundLettersRemaining: number;
  finalRoundVowelsRemaining: number;
}

// Authentic Wheel of Fortune wheel segments
const WHEEL_SEGMENTS = [
  // Regular money values (most common)
  500, 550, 600, 650, 700, 750, 800, 850, 900, 500, 550, 600,
  
  // Special segments
  "BANKRUPT", 
  "LOSE A TURN",
  
  // Prize wedges
  { type: "PRIZE", name: "TRIP TO HAWAII", value: 7500, displayValue: "HAWAII" },
  { type: "PRIZE", name: "NEW CAR", value: 25000, displayValue: "CAR" },
  { type: "PRIZE", name: "TRIP TO EUROPE", value: 12000, displayValue: "EUROPE" },
  
  // Special wedges
  { type: "WILD_CARD", value: 500, displayValue: "WILD CARD" },
  { type: "GIFT_TAG", value: 1000, displayValue: "$1000 GIFT TAG" },
  { type: "MILLION", value: 900, displayValue: "MILLION" },
  
  // More money values
  650, 700, 750, 800
];

// Prize descriptions for realistic show feel
const PRIZE_DESCRIPTIONS: Record<string, string> = {
  "TRIP TO HAWAII": "A 7-day trip for two to Maui, Hawaii including airfare and hotel",
  "NEW CAR": "A brand new sedan courtesy of our sponsors",
  "TRIP TO EUROPE": "A 10-day European vacation for two including airfare",
  "WILD CARD": "Use this to call an extra consonant in any round",
  "$1000 GIFT TAG": "A $1000 shopping spree gift certificate",
  "MILLION": "Keep this wedge to play for a million dollars in the bonus round"
};

  // Comprehensive puzzle database with 500+ unique puzzles
const PUZZLE_TEMPLATES: PuzzleTemplates = {
  PHRASE: [
    "GREAT IDEA", "HAPPY BIRTHDAY", "GOOD LUCK", "SWEET DREAMS", "BEST WISHES",
    "TRUE LOVE", "BRIGHT FUTURE", "PERFECT TIMING", "FRESH START", "GOLDEN OPPORTUNITY",
    "SECOND CHANCE", "WILD GUESS", "LAST RESORT", "COMMON SENSE", "PIECE OF CAKE",
    "BREAK A LEG", "BITE THE BULLET", "SPILL THE BEANS", "BREAK THE ICE", "CALL IT A DAY",
    "CROSS YOUR FINGERS", "EASY AS PIE", "ONCE IN A LIFETIME", "BETTER LATE THAN NEVER",
    "ACTIONS SPEAK LOUDER THAN WORDS", "PRACTICE MAKES PERFECT", "TIME IS MONEY",
    "KNOWLEDGE IS POWER", "LAUGHTER IS THE BEST MEDICINE", "HONESTY IS THE BEST POLICY",
    "WELCOME TO THE CLUB", "AGAINST ALL ODDS", "BLESS YOUR HEART", "CHANGE OF HEART",
    "DREAM COME TRUE", "EYES WIDE OPEN", "FIRST IMPRESSION", "GOOD MORNING SUNSHINE",
    "HAPPY AS A CLAM", "IN THE NICK OF TIME", "JUMP FOR JOY", "KEEP YOUR CHIN UP",
    "LIFE IS BEAUTIFUL", "MAKING MEMORIES", "NEVER GIVE UP", "ON TOP OF THE WORLD",
    "PICTURE PERFECT", "QUALITY TIME", "RISE AND SHINE", "SHOOTING STAR",
    "TAKE IT EASY", "UNDER THE WEATHER", "VERY IMPORTANT PERSON", "WALKING ON SUNSHINE",
    "EXTRA MILE", "YOUNG AT HEART", "ZERO TO HERO", "AMAZING GRACE", "BEAUTIFUL SUNSET",
    "COUNTING STARS", "DANCING IN THE RAIN", "EVERY CLOUD HAS A SILVER LINING"
  ],
  "BEFORE & AFTER": [
    { before: "BLUE", shared: "MOON", after: "WALK", full: "BLUE MOON WALK" },
    { before: "BIRTHDAY", shared: "PARTY", after: "ANIMAL", full: "BIRTHDAY PARTY ANIMAL" },
    { before: "COFFEE", shared: "BREAK", after: "DANCING", full: "COFFEE BREAK DANCING" },
    { before: "BOOK", shared: "CLUB", after: "SANDWICH", full: "BOOK CLUB SANDWICH" },
    { before: "FIRE", shared: "TRUCK", after: "STOP", full: "FIRE TRUCK STOP" },
    { before: "SCHOOL", shared: "BUS", after: "DRIVER", full: "SCHOOL BUS DRIVER" },
    { before: "APPLE", shared: "PIE", after: "CHART", full: "APPLE PIE CHART" },
    { before: "TOOTH", shared: "BRUSH", after: "FIRE", full: "TOOTH BRUSH FIRE" },
    { before: "DANCE", shared: "FLOOR", after: "LAMP", full: "DANCE FLOOR LAMP" },
    { before: "PAPER", shared: "TRAIL", after: "MIX", full: "PAPER TRAIL MIX" },
    { before: "THUNDER", shared: "STORM", after: "TROOPER", full: "THUNDER STORM TROOPER" },
    { before: "BABY", shared: "SHOWER", after: "CURTAIN", full: "BABY SHOWER CURTAIN" },
    { before: "CHICKEN", shared: "WING", after: "SPAN", full: "CHICKEN WING SPAN" },
    { before: "FRENCH", shared: "TOAST", after: "MASTER", full: "FRENCH TOAST MASTER" },
    { before: "HONEY", shared: "BEE", after: "HIVE", full: "HONEY BEE HIVE" },
    { before: "MAGIC", shared: "CARPET", after: "CLEANER", full: "MAGIC CARPET CLEANER" },
    { before: "MOVIE", shared: "STAR", after: "FISH", full: "MOVIE STAR FISH" },
    { before: "RADIO", shared: "WAVE", after: "GOODBYE", full: "RADIO WAVE GOODBYE" },
    { before: "SILVER", shared: "SCREEN", after: "DOOR", full: "SILVER SCREEN DOOR" },
    { before: "TENNIS", shared: "BALL", after: "ROOM", full: "TENNIS BALL ROOM" }
  ],
  "RHYME TIME": [
    "MAKE A BREAK", "TIME TO RHYME", "BEST TEST", "QUICK TRICK",
    "BRIGHT LIGHT", "SWEET TREAT", "FAIR SHARE", "TRUE BLUE",
    "SNAIL MAIL", "BRAIN DRAIN", "FLOWER POWER", "HAPPY NAPPY",
    "LEGAL EAGLE", "SUPER TROOPER", "FANCY NANCY", "HANDY ANDY",
    "LEAN MEAN", "NEAT FEET", "PRIME TIME", "ROUGH STUFF",
    "SHOCK JOCK", "SILLY BILLY", "SPACE RACE", "STELLAR CELLAR",
    "TRAIN BRAIN", "WHALE TALE", "DOUBLE TROUBLE", "FUNNY MONEY",
    "HIGHER FIRE", "MELLOW YELLOW", "MOTOR VOTER", "PAPER CAPER",
    "READY FREDDY", "SLEEPY PEEPY", "SUPER DUPER", "TEENY WEENY",
    "WACKY TACKY", "WINNER DINNER", "BIGGER TRIGGER", "CLEVER NEVER",
    "FASTER MASTER", "GREATER GATOR", "HAPPY SNAPPY", "ITTY BITTY",
    "LUCKY DUCKY", "MIGHTYIGHTY", "NUTTY PUTTY", "PARTY HEARTY",
    "REALLY SILLY", "SUPER DUPER", "TEENY BEANY", "WITTY KITTY"
  ],
  "SAME LETTER": [
    "PERFECT PIZZA PARTY", "SUPER SUNNY SATURDAY", "BUSY BEAUTIFUL BUTTERFLY",
    "HAPPY HEALTHY HOLIDAYS", "WILD WONDERFUL WEEKEND", "FRESH FANTASTIC FRIDAY",
    "AWESOME AMAZING ADVENTURE", "BRILLIANT BRIGHT BLUE", "COOL CRISP CUCUMBER",
    "DANCING DELIGHTFUL DAISIES", "ENERGETIC ELEGANT ELEPHANT", "FABULOUS FUNNY FRIENDS",
    "GIGGLING GORGEOUS GIRLS", "HANDSOME HAPPY HIPPOS", "INCREDIBLE INTELLIGENT IDEAS",
    "JOLLY JUMPING JACKRABBITS", "KIND KISSING KANGAROOS", "LOVELY LAUGHING LADIES",
    "MARVELOUS MAGNIFICENT MOUNTAINS", "NATURAL NUTRITIOUS NUTS", "OUTSTANDING ORANGE OCTOPUS",
    "PRETTY PINK PEONIES", "QUIET QUACKING QUAILS", "REALLY ROUND RAINBOWS",
    "SPECTACULAR SPARKLING STARS", "TERRIFIC TINY TURTLES", "UNIQUE UNUSUAL UMBRELLAS",
    "VERY VALUABLE VIOLETS", "WONDERFUL WADDLING WALRUSES", "EXTRA EXCITING EXPERIENCES",
    "YUMMY YELLOW YAMS", "ZANY ZIGZAGGING ZEBRAS", "AMAZING ARTISTIC ANIMALS",
    "BRAVE BOUNCING BUNNIES", "CREATIVE COLORFUL CATS", "DARING DANCING DOGS",
    "FANTASTIC FLYING FISH", "GREAT GREEN GRAPES", "HILARIOUS HOPPING HORSES",
    "JUMPING JOYFUL JAGUARS", "LOVELY LITTLE LAMBS", "MAGNIFICENT MIGHTY MICE"
  ],
  "THEN AND NOW": [
    { then: "RECORD PLAYER", now: "SPOTIFY" },
    { then: "TYPEWRITER", now: "LAPTOP" },
    { then: "PHONE BOOTH", now: "CELL PHONE" },
    { then: "VHS TAPE", now: "NETFLIX" },
    { then: "ENCYCLOPEDIA", now: "WIKIPEDIA" },
    { then: "FILM CAMERA", now: "DIGITAL CAMERA" },
    { then: "CASSETTE TAPE", now: "MUSIC STREAMING" },
    { then: "PAPER MAP", now: "GPS NAVIGATION" },
    { then: "TRAVEL AGENT", now: "ONLINE BOOKING" },
    { then: "YELLOW PAGES", now: "GOOGLE SEARCH" },
    { then: "PHYSICAL BOOKS", now: "E-READERS" },
    { then: "NEWSPAPER", now: "ONLINE NEWS" },
    { then: "HANDWRITTEN LETTERS", now: "EMAIL" },
    { then: "CALCULATOR", now: "SMARTPHONE" },
    { then: "ALARM CLOCK", now: "PHONE ALARM" },
    { then: "DICTIONARY", now: "SPELL CHECK" },
    { then: "PHYSICAL SHOPPING", now: "ONLINE SHOPPING" },
    { then: "FILM DEVELOPING", now: "INSTANT PHOTOS" },
    { then: "LIBRARY RESEARCH", now: "INTERNET SEARCH" },
    { then: "APPOINTMENT BOOK", now: "DIGITAL CALENDAR" }
  ],
  "WHAT ARE YOU DOING?": [
    "WALKING THE DOG", "MAKING DINNER", "READING A BOOK", "WATCHING TV",
    "PLAYING GAMES", "DOING HOMEWORK", "LISTENING TO MUSIC", "CLEANING HOUSE",
    "WASHING DISHES", "FOLDING LAUNDRY", "GARDENING OUTSIDE", "COOKING BREAKFAST",
    "WRITING LETTERS", "PAINTING PICTURES", "PLAYING PIANO", "SINGING SONGS",
    "DANCING AROUND", "EXERCISING DAILY", "STUDYING HARD", "WORKING LATE",
    "SHOPPING ONLINE", "CALLING FRIENDS", "TEXTING FAMILY", "BROWSING INTERNET",
    "WATCHING MOVIES", "PLAYING SPORTS", "RIDING BIKES", "SWIMMING LAPS",
    "JOGGING OUTSIDE", "LIFTING WEIGHTS", "DOING YOGA", "STRETCHING MUSCLES",
    "MEDITATING QUIETLY", "PRAYING SILENTLY", "THINKING DEEPLY", "DREAMING BIG",
    "PLANNING AHEAD", "ORGANIZING CLOSETS", "DECORATING ROOMS", "BUILDING THINGS",
    "FIXING PROBLEMS", "SOLVING PUZZLES", "CREATING ART", "LEARNING LANGUAGES",
    "TEACHING OTHERS", "HELPING NEIGHBORS", "VOLUNTEERING TIME", "DONATING MONEY",
    "SPREADING KINDNESS", "SHARING LOVE", "GIVING HUGS", "MAKING FRIENDS"
  ],
  THING: [
    "COMPUTER", "TELEPHONE", "BICYCLE", "CAMERA", "KEYBOARD", "BACKPACK",
    "WASHING MACHINE", "COFFEE MAKER", "CELL PHONE", "TELEVISION",
    "REFRIGERATOR", "MICROWAVE", "DISHWASHER", "VACUUM CLEANER", "HAIR DRYER",
    "TOOTHBRUSH", "TOOTHPASTE", "SHAMPOO", "SOAP", "TOWEL", "PILLOW",
    "BLANKET", "MATTRESS", "DRESSER", "MIRROR", "LAMP", "CHAIR", "TABLE",
    "COUCH", "BOOKSHELF", "PICTURE FRAME", "CLOCK", "CALENDAR", "NOTEBOOK",
    "PENCIL", "PEN", "ERASER", "RULER", "SCISSORS", "STAPLER", "CALCULATOR",
    "UMBRELLA", "SUNGLASSES", "WALLET", "PURSE", "KEYS", "REMOTE CONTROL",
    "BATTERIES", "FLASHLIGHT", "CANDLE", "MATCHES", "FIRE EXTINGUISHER",
    "FIRST AID KIT", "THERMOMETER", "SCALE", "IRON", "IRONING BOARD",
    "SEWING MACHINE", "THREAD", "NEEDLE", "BUTTON", "ZIPPER", "VELCRO",
    "DUCT TAPE", "SUPER GLUE", "HAMMER", "SCREWDRIVER", "WRENCH", "PLIERS",
    "DRILL", "SAW", "MEASURING TAPE", "LEVEL", "LADDER", "TOOLBOX"
  ],
  PERSON: [
    "TEACHER", "DOCTOR", "ARTIST", "MUSICIAN", "CHEF", "ENGINEER",
    "FAMOUS ACTOR", "TALENTED SINGER", "SKILLED ATHLETE", "MOVIE STAR",
    "POLICE OFFICER", "FIREFIGHTER", "NURSE", "DENTIST", "VETERINARIAN",
    "LAWYER", "JUDGE", "POLITICIAN", "SCIENTIST", "RESEARCHER", "PROFESSOR",
    "STUDENT", "LIBRARIAN", "ACCOUNTANT", "BANKER", "REAL ESTATE AGENT",
    "INSURANCE AGENT", "TRAVEL AGENT", "FLIGHT ATTENDANT", "PILOT", "CAPTAIN",
    "SAILOR", "SOLDIER", "MARINE", "ASTRONAUT", "EXPLORER", "ADVENTURER",
    "PHOTOGRAPHER", "JOURNALIST", "REPORTER", "ANCHOR", "RADIO HOST",
    "COMEDIAN", "MAGICIAN", "DANCER", "CHOREOGRAPHER", "DIRECTOR", "PRODUCER",
    "WRITER", "AUTHOR", "POET", "BLOGGER", "ARCHITECT", "CONTRACTOR",
    "CARPENTER", "PLUMBER", "ELECTRICIAN", "MECHANIC", "TECHNICIAN",
    "PROGRAMMER", "DESIGNER", "CONSULTANT", "MANAGER", "SUPERVISOR",
    "SECRETARY", "RECEPTIONIST", "CASHIER", "SALESPERSON", "CUSTOMER SERVICE",
    "BARISTA", "WAITER", "WAITRESS", "BARTENDER", "JANITOR", "GARDENER"
  ],
  PLACE: [
    "LIBRARY", "RESTAURANT", "MUSEUM", "HOSPITAL", "SCHOOL", "THEATER",
    "BEAUTIFUL GARDEN", "HISTORIC BUILDING", "MODERN OFFICE", "BUSY AIRPORT",
    "SHOPPING MALL", "GROCERY STORE", "COFFEE SHOP", "BOOK STORE", "MOVIE THEATER",
    "CONCERT HALL", "SPORTS STADIUM", "AMUSEMENT PARK", "ZOO", "AQUARIUM",
    "BEACH", "MOUNTAIN", "FOREST", "DESERT", "LAKE", "RIVER", "OCEAN",
    "ISLAND", "VALLEY", "CANYON", "WATERFALL", "CAVE", "VOLCANO", "GLACIER",
    "NATIONAL PARK", "STATE PARK", "PLAYGROUND", "PICNIC AREA", "CAMPGROUND",
    "HOTEL", "MOTEL", "BED AND BREAKFAST", "VACATION RENTAL", "CRUISE SHIP",
    "TRAIN STATION", "BUS STATION", "SUBWAY STATION", "PARKING LOT", "GAS STATION",
    "CAR WASH", "REPAIR SHOP", "DEALERSHIP", "BANK", "POST OFFICE", "CITY HALL",
    "COURTHOUSE", "POLICE STATION", "FIRE STATION", "EMBASSY", "CONSULATE",
    "CHURCH", "TEMPLE", "MOSQUE", "SYNAGOGUE", "MONASTERY", "CATHEDRAL",
    "CEMETERY", "FUNERAL HOME", "WEDDING VENUE", "CONFERENCE CENTER",
    "CONVENTION CENTER", "TRADE SHOW", "FARMERS MARKET", "FLEA MARKET",
    "ANTIQUE SHOP", "JEWELRY STORE", "FLOWER SHOP", "BAKERY", "BUTCHER SHOP"
  ],
  "ON THE MAP": [
    "NEW YORK CITY", "LOS ANGELES", "CHICAGO", "HOUSTON", "PHOENIX",
    "PHILADELPHIA", "SAN ANTONIO", "SAN DIEGO", "DALLAS", "SAN JOSE",
    "AUSTIN", "JACKSONVILLE", "FORT WORTH", "COLUMBUS", "CHARLOTTE",
    "SEATTLE", "DENVER", "BOSTON", "DETROIT", "NASHVILLE", "BALTIMORE",
    "OKLAHOMA CITY", "PORTLAND", "LAS VEGAS", "MILWAUKEE", "ALBUQUERQUE",
    "TUCSON", "FRESNO", "SACRAMENTO", "KANSAS CITY", "MESA", "ATLANTA",
    "OMAHA", "COLORADO SPRINGS", "RALEIGH", "LONG BEACH", "VIRGINIA BEACH",
    "MIAMI", "OAKLAND", "MINNEAPOLIS", "TULSA", "CLEVELAND", "WICHITA",
    "ARLINGTON", "TAMPA", "NEW ORLEANS", "HONOLULU", "ANAHEIM", "LEXINGTON",
    "STOCKTON", "CORPUS CHRISTI", "HENDERSON", "RIVERSIDE", "SAINT PAUL",
    "SANTA ANA", "CINCINNATI", "PITTSBURGH", "GREENSBORO", "ANCHORAGE",
    "PLANO", "LINCOLN", "ORLANDO", "IRVINE", "NEWARK", "TOLEDO", "DURHAM",
    "CHULA VISTA", "FORT WAYNE", "JERSEY CITY", "ST PETERSBURG", "LAREDO",
    "MADISON", "CHANDLER", "BUFFALO", "LUBBOCK", "SCOTTSDALE", "RENO",
    "GLENDALE", "GILBERT", "WINSTON SALEM", "NORTH LAS VEGAS", "NORFOLK",
    "CHESAPEAKE", "GARLAND", "IRVING", "HIALEAH", "FREMONT", "BOISE",
    "RICHMOND", "BATON ROUGE", "SPOKANE", "DES MOINES", "TACOMA", "SAN BERNARDINO"
  ],
  "FOOD & DRINK": [
    "CHOCOLATE CHIP COOKIES", "VANILLA ICE CREAM", "STRAWBERRY SHORTCAKE",
    "APPLE PIE", "BANANA SPLIT", "CHERRY CHEESECAKE", "LEMON MERINGUE PIE",
    "PEACH COBBLER", "BLUEBERRY MUFFINS", "CINNAMON ROLLS", "FRENCH TOAST",
    "PANCAKES AND SYRUP", "WAFFLES WITH BERRIES", "SCRAMBLED EGGS", "BACON AND EGGS",
    "SAUSAGE AND PEPPERS", "GRILLED CHEESE", "PEANUT BUTTER AND JELLY",
    "TUNA FISH SANDWICH", "CHICKEN SALAD", "CAESAR SALAD", "GARDEN SALAD",
    "TOMATO SOUP", "CHICKEN NOODLE SOUP", "CLAM CHOWDER", "MINESTRONE SOUP",
    "VEGETABLE STIR FRY", "BEEF STEW", "CHICKEN POT PIE", "MEATLOAF AND MASHED POTATOES",
    "SPAGHETTI AND MEATBALLS", "LASAGNA", "PIZZA MARGHERITA", "PEPPERONI PIZZA",
    "HAMBURGER AND FRIES", "HOT DOG", "FISH AND CHIPS", "CHICKEN WINGS",
    "BARBECUE RIBS", "FRIED CHICKEN", "ROAST BEEF", "TURKEY DINNER",
    "MASHED POTATOES", "BAKED POTATO", "FRENCH FRIES", "ONION RINGS",
    "COLESLAW", "POTATO SALAD", "CORN ON THE COB", "GREEN BEANS", "CARROTS",
    "BROCCOLI", "SPINACH", "ASPARAGUS", "BRUSSELS SPROUTS", "CAULIFLOWER"
  ]
};

// Function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array: any[]): any[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create randomized wheel segments
const getRandomizedWheelSegments = () => {
  return shuffleArray(WHEEL_SEGMENTS);
};

function WheelOfFortune() {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 1,
    puzzle: { text: '', category: '', revealed: new Set<string>(), specialFormat: null },
    usedLetters: new Set<string>(),
    wheelValue: 0,
    isSpinning: false,
    wheelRotation: 0,
    players: [
      { name: 'You', roundMoney: 0, totalMoney: 0, isHuman: true, prizes: [], specialCards: [] },
      { name: 'Sarah', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] },
      { name: 'Mike', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] }
    ],
    currentPlayer: 0,
    turnInProgress: false,
    lastSpinResult: null,
    landedSegmentIndex: -1,
    message: 'Welcome to Wheel of Fortune!',
    isFinalRound: false,
    finalRoundLettersRemaining: 0,
    finalRoundVowelsRemaining: 0
  });

  const [inputLetter, setInputLetter] = useState('');
  const [solveAttempt, setSolveAttempt] = useState('');
  const [usedPuzzles, setUsedPuzzles] = useState<Set<string>>(new Set());
  const [availablePuzzles, setAvailablePuzzles] = useState<string[]>([]);
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [wildCardActive, setWildCardActive] = useState(false);
  const [computerAction, setComputerAction] = useState('');
  const [computerSolveAttempt, setComputerSolveAttempt] = useState('');
  const [currentWheelSegments, setCurrentWheelSegments] = useState(getRandomizedWheelSegments());
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPuzzles: 0,
    solvedPuzzles: 0,
    totalLettersGuessed: 0,
    correctLetters: 0,
    letterStats: {},
    categoryStats: {},
    averageLettersPerPuzzle: 0,
    bestCategory: '',
    worstCategory: '',
    mostSuccessfulLetter: '',
    leastSuccessfulLetter: ''
  });
  const [showStats, setShowStats] = useState(false);
  const [computerTurnInProgress, setComputerTurnInProgress] = useState(false);
  const computerTurnRef = useRef(false);

  // Load used puzzles and stats from localStorage
  useEffect(() => {
    const savedUsedPuzzles = localStorage.getItem('jenswheelpractice-used-puzzles');
    if (savedUsedPuzzles) {
      setUsedPuzzles(new Set(JSON.parse(savedUsedPuzzles)));
    }
    
    const savedStats = localStorage.getItem('jenswheelpractice-stats');
    if (savedStats) {
      setGameStats(JSON.parse(savedStats));
    }
  }, []);

  // Save used puzzles and stats to localStorage
  useEffect(() => {
    if (usedPuzzles.size > 0) {
      localStorage.setItem('jenswheelpractice-used-puzzles', JSON.stringify([...usedPuzzles]));
    }
  }, [usedPuzzles]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('jenswheelpractice-stats', JSON.stringify(gameStats));
  }, [gameStats]);

  // Trigger computer turn when it's their turn
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const isComputerTurn = currentPlayer && !currentPlayer.isHuman && !gameState.isSpinning && !gameState.turnInProgress && !computerTurnInProgress && !computerTurnRef.current;
    
    console.log('🔄 Turn check:', {
      currentPlayer: gameState.currentPlayer,
      playerName: currentPlayer?.name,
      isHuman: currentPlayer?.isHuman,
      isSpinning: gameState.isSpinning,
      turnInProgress: gameState.turnInProgress,
      computerTurnInProgress,
      shouldTrigger: isComputerTurn
    });
    
    if (isComputerTurn) {
      console.log('🤖 Triggering computer turn for:', currentPlayer.name);
      computerTurnRef.current = true;
      setComputerTurnInProgress(true);
      setTimeout(() => {
        computerTurn();
      }, 1000); // 1 second delay before computer starts
    }
  }, [gameState.currentPlayer, gameState.isSpinning, gameState.turnInProgress, computerTurnInProgress]);

  // Function to update statistics
  const updateStats = (letter: string, wasCorrect: boolean, puzzleSolved: boolean = false) => {
    setGameStats(prev => {
      const newStats = { ...prev };
      
      // Update letter statistics
      if (!newStats.letterStats[letter]) {
        newStats.letterStats[letter] = { correct: 0, incorrect: 0 };
      }
      if (wasCorrect) {
        newStats.letterStats[letter].correct++;
        newStats.correctLetters++;
      } else {
        newStats.letterStats[letter].incorrect++;
      }
      newStats.totalLettersGuessed++;
      
      // Update puzzle statistics
      if (puzzleSolved) {
        newStats.solvedPuzzles++;
        newStats.totalPuzzles++;
        
        // Update category statistics
        const category = gameState.puzzle.category;
        if (!newStats.categoryStats[category]) {
          newStats.categoryStats[category] = { attempted: 0, solved: 0 };
        }
        newStats.categoryStats[category].attempted++;
        newStats.categoryStats[category].solved++;
      }
      
      // Calculate derived statistics
      newStats.averageLettersPerPuzzle = newStats.totalPuzzles > 0 
        ? Math.round((newStats.totalLettersGuessed / newStats.totalPuzzles) * 10) / 10 
        : 0;
      
      // Find best/worst categories
      const categories = Object.entries(newStats.categoryStats);
      if (categories.length > 0) {
        const sortedCategories = categories.sort((a, b) => {
          const aRate = a[1].attempted > 0 ? a[1].solved / a[1].attempted : 0;
          const bRate = b[1].attempted > 0 ? b[1].solved / b[1].attempted : 0;
          return bRate - aRate;
        });
        newStats.bestCategory = sortedCategories[0][0];
        newStats.worstCategory = sortedCategories[sortedCategories.length - 1][0];
      }
      
      // Find most/least successful letters
      const letters = Object.entries(newStats.letterStats);
      if (letters.length > 0) {
        const sortedLetters = letters.sort((a, b) => {
          const aTotal = a[1].correct + a[1].incorrect;
          const bTotal = b[1].correct + b[1].incorrect;
          const aRate = aTotal > 0 ? a[1].correct / aTotal : 0;
          const bRate = bTotal > 0 ? b[1].correct / bTotal : 0;
          return bRate - aRate;
        });
        newStats.mostSuccessfulLetter = sortedLetters[0][0];
        newStats.leastSuccessfulLetter = sortedLetters[sortedLetters.length - 1][0];
      }
      
      return newStats;
    });
  };

  // Generate available puzzles list
  useEffect(() => {
    const allPuzzles: string[] = [];
    Object.entries(PUZZLE_TEMPLATES).forEach(([category, templates]) => {
      templates.forEach((template: any) => {
        let puzzleText = '';
        if (category === "BEFORE & AFTER") {
          puzzleText = template.full;
        } else if (category === "THEN AND NOW") {
          puzzleText = `${template.then} / ${template.now}`;
        } else if (typeof template === 'string') {
          puzzleText = template;
        }
        if (puzzleText && !usedPuzzles.has(puzzleText)) {
          allPuzzles.push(puzzleText);
        }
      });
    });
    setAvailablePuzzles(allPuzzles);
  }, [usedPuzzles]);

  // Generate puzzle function with guaranteed no duplicates
  const generatePuzzle = (): Puzzle => {
    try {
      // If we've used most puzzles, show reset panel instead of alert
      if (availablePuzzles.length < 10 && availablePuzzles.length > 0) {
        setShowResetPanel(true);
        // Return current puzzle while user decides
        return gameState.puzzle;
      }

      // If no available puzzles, reset automatically
      if (availablePuzzles.length === 0) {
        console.log('No available puzzles, resetting...');
        setUsedPuzzles(new Set());
        localStorage.removeItem('jenswheelpractice-used-puzzles');
        // Return a default puzzle instead of recursive call to avoid infinite loop
        return {
          text: 'WHEEL OF FORTUNE',
          category: 'PHRASE',
          revealed: new Set<string>(),
          specialFormat: null
        };
      }

      // Pick a random available puzzle
      const randomPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
      
      // Find the category and special format
      let category = '';
      let specialFormat = null;
      
      for (const [cat, templates] of Object.entries(PUZZLE_TEMPLATES)) {
        const found = templates.find((template: any) => {
          if (cat === "BEFORE & AFTER") {
            return template.full === randomPuzzle;
          } else if (cat === "THEN AND NOW") {
            return `${template.then} / ${template.now}` === randomPuzzle;
          } else {
            return template === randomPuzzle;
          }
        });
        
        if (found) {
          category = cat;
          if (cat === "BEFORE & AFTER" && typeof found === 'object' && 'before' in found) {
            const beforeAfterFound = found as BeforeAfterTemplate;
            specialFormat = {
              type: 'BEFORE_AFTER',
              before: beforeAfterFound.before,
              shared: beforeAfterFound.shared,
              after: beforeAfterFound.after
            };
          } else if (cat === "THEN AND NOW" && typeof found === 'object' && 'then' in found) {
            const thenNowFound = found as ThenNowTemplate;
            specialFormat = {
              type: 'THEN_AND_NOW',
              then: thenNowFound.then,
              now: thenNowFound.now
            };
          } else if (cat === "RHYME TIME") {
            specialFormat = { type: 'RHYME_TIME' };
          } else if (cat === "SAME LETTER") {
            specialFormat = { type: 'SAME_LETTER', letter: randomPuzzle.charAt(0) };
          } else if (cat === "WHAT ARE YOU DOING?") {
            specialFormat = { type: 'QUESTION', question: cat };
          }
          break;
        }
      }
      
      // Mark puzzle as used
      setUsedPuzzles(prev => new Set([...prev, randomPuzzle]));
      
      console.log(`Generated puzzle #${usedPuzzles.size + 1}: "${randomPuzzle}" (${category})`);
      console.log(`${availablePuzzles.length - 1} fresh puzzles remaining`);
      
      return {
        text: randomPuzzle.toUpperCase(),
        category: category,
        revealed: new Set<string>(),
        specialFormat
      };
    } catch (error) {
      console.error('Error generating puzzle:', error);
      return {
        text: 'WHEEL OF FORTUNE',
        category: 'PHRASE',
        revealed: new Set<string>(),
        specialFormat: null
      };
    }
  };

  // Initialize puzzle on mount (only once)
  useEffect(() => {
    try {
      // Wait for availablePuzzles to be populated before generating first puzzle
      if (availablePuzzles.length > 0) {
        const newPuzzle = generatePuzzle();
        setGameState(prev => ({ ...prev, puzzle: newPuzzle }));
      }
    } catch (error) {
      console.error('Error initializing puzzle:', error);
    }
  }, [availablePuzzles]); // Depend on availablePuzzles to ensure it's populated

  // Authentic wheel renderer with visible segments
  const renderWheel = () => {
    const segmentAngle = 360 / currentWheelSegments.length;
    
    return (
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto mb-4 sm:mb-8">
        {/* Main wheel container */}
        <div className="absolute inset-0 rounded-full border-4 border-yellow-600 shadow-2xl bg-gray-800 overflow-hidden">
          
          {/* Individual wheel segments */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 200"
            style={{ 
              transform: `rotate(${gameState.wheelRotation}deg)`, 
              transition: gameState.isSpinning ? 'transform 3s ease-out' : 'none',
              transformOrigin: 'center'
            }}
          >
            {currentWheelSegments.map((segment, index) => {
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
              const isLanded = gameState.landedSegmentIndex === index && !gameState.isSpinning;
              
              // Calculate path for segment
              const radius = 90; // Radius in viewBox coordinates
              const centerX = 100;
              const centerY = 100;
              const x1 = centerX + radius * Math.cos(startAngle);
              const y1 = centerY + radius * Math.sin(startAngle);
              const x2 = centerX + radius * Math.cos(endAngle);
              const y2 = centerY + radius * Math.sin(endAngle);
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              
              // Determine segment color
              let fillColor = '#4ECDC4';
              if (segment === 'BANKRUPT') fillColor = '#E74C3C';
              else if (segment === 'LOSE A TURN') fillColor = '#34495E';
              else if (typeof segment === 'object') {
                if (segment.type === 'PRIZE') fillColor = '#9B59B6';
                else if (segment.type === 'WILD_CARD') fillColor = '#1ABC9C';
                else if (segment.type === 'GIFT_TAG') fillColor = '#E67E22';
                else if (segment.type === 'MILLION') fillColor = '#F39C12';
              } else if (typeof segment === 'number') {
                if (segment >= 800) fillColor = '#27AE60';
                else if (segment >= 650) fillColor = '#3498DB';
                else fillColor = '#F39C12';
              }
              
              // Text position (middle of segment)
              const textAngle = (startAngle + endAngle) / 2;
              const textRadius = 60; // Distance from center for text
              const textX = centerX + textRadius * Math.cos(textAngle);
              const textY = centerY + textRadius * Math.sin(textAngle);
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={fillColor}
                    stroke={isLanded ? "#FFD700" : "#FFFFFF"}
                    strokeWidth={isLanded ? "3" : "1"}
                    className={isLanded ? "animate-pulse" : ""}
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${(textAngle * 180 / Math.PI)}, ${textX}, ${textY})`}
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {typeof segment === 'number' 
                      ? `${segment}`
                      : segment === 'BANKRUPT' 
                        ? 'BANK'
                        : segment === 'LOSE A TURN'
                          ? 'LOSE'
                          : typeof segment === 'object' && 'displayValue' in segment
                            ? (segment as WheelSegment).displayValue?.split(' ')[0] || String(segment)
                            : String(segment)}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center hub */}
          <button
            onClick={spinWheel}
            disabled={gameState.isSpinning || gameState.currentPlayer !== 0 || gameState.isFinalRound}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 border-4 border-yellow-500 flex items-center justify-center z-20 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <div className="text-white text-xs sm:text-lg font-bold text-center">
              {gameState.isSpinning ? (
                <RotateCcw className="w-4 h-4 sm:w-8 sm:h-8 animate-spin" />
              ) : gameState.isFinalRound ? (
                <div>
                  <div className="text-xs sm:text-base">FINAL</div>
                  <div className="text-xs">ROUND</div>
                </div>
              ) : (
                <div>
                  <div className="text-xs sm:text-base">WHEEL</div>
                  <div className="text-xs">OF</div>
                  <div className="text-xs sm:text-base">FORTUNE</div>
                </div>
              )}
            </div>
          </button>
        </div>
        
        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 rotate-180 z-30"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '16px solid #DC143C',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
        

      </div>
    );
  };

  // Authentic wheel spinner with realistic physics
  // Computer player logic
  const computerTurn = () => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (!currentPlayer || currentPlayer.isHuman) return;
    
    // Computers cannot play in the final round - only human can reach final round
    if (gameState.isFinalRound) {
      console.log('❌ Computer cannot play in final round');
      return;
    }
    
    // Prevent multiple simultaneous computer turns
    if (gameState.turnInProgress || gameState.isSpinning || computerTurnInProgress) {
      console.log('🔄 Computer turn already in progress, skipping...');
      return;
    }
    
    console.log(`🤖 Starting computer turn for: ${currentPlayer.name}`);
    
    // Computer spins the wheel
    setGameState(prev => ({ ...prev, isSpinning: true, message: `${prev.players[prev.currentPlayer].name} is spinning...`, turnInProgress: true }));
    
    // Generate realistic spin
    const baseRotations = 2 + Math.random() * 3; // 2-5 full rotations for computer
    const segmentAngle = 360 / currentWheelSegments.length;
    const randomSegmentIndex = Math.floor(Math.random() * currentWheelSegments.length);
    const finalAngle = randomSegmentIndex * segmentAngle + (Math.random() * segmentAngle);
    const totalRotation = (baseRotations * 360) + finalAngle;
    
    const newRotation = gameState.wheelRotation + totalRotation;
    setGameState(prev => ({ ...prev, wheelRotation: newRotation }));
    
    setTimeout(() => {
      const landedIndex = getLandedSegmentIndex(newRotation);
      const segment = currentWheelSegments[landedIndex];
      let newMessage = '';
      let newPlayers = [...gameState.players];
      let nextPlayer = gameState.currentPlayer; // Default to same player
      
      if (typeof segment === 'number') {
        newMessage = `${gameState.players[gameState.currentPlayer].name} spun $${segment}!`;
        // Update game state first, then computer makes a guess
        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          wheelValue: segment,
          lastSpinResult: segment,
          landedSegmentIndex: landedIndex,
          message: newMessage,
          players: newPlayers,
          currentPlayer: nextPlayer,
          turnInProgress: false
        }));
        
        // Computer makes a guess after state is updated
        setTimeout(() => {
          computerGuess(segment);
        }, 1000);
      } else if (segment === 'BANKRUPT') {
        newMessage = `${gameState.players[gameState.currentPlayer].name} went BANKRUPT! `;
        newPlayers[gameState.currentPlayer].roundMoney = 0;
        // Determine next player (cycle through all 3 players)
        nextPlayer = getNextPlayer(gameState.currentPlayer);
        newMessage += `${gameState.players[nextPlayer].name}'s turn!`;
        
        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          wheelValue: segment,
          lastSpinResult: segment,
          landedSegmentIndex: landedIndex,
          message: newMessage,
          players: newPlayers,
          currentPlayer: nextPlayer,
          turnInProgress: false
        }));
        
        // Start next player's turn if it's a computer
        setTimeout(() => {
          const nextPlayerObj = gameState.players[nextPlayer];
          if (nextPlayerObj && !nextPlayerObj.isHuman) {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
            computerTurn();
          } else {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
          }
        }, 2000);
      } else if (segment === 'LOSE A TURN') {
        newMessage = `${gameState.players[gameState.currentPlayer].name} lost their turn! `;
        // Determine next player (cycle through all 3 players)
        nextPlayer = getNextPlayer(gameState.currentPlayer);
        newMessage += `${gameState.players[nextPlayer].name}'s turn!`;
        
        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          wheelValue: segment,
          lastSpinResult: segment,
          landedSegmentIndex: landedIndex,
          message: newMessage,
          players: newPlayers,
          currentPlayer: nextPlayer,
          turnInProgress: false
        }));
        
        // Start next player's turn if it's a computer
        setTimeout(() => {
          const nextPlayerObj = gameState.players[nextPlayer];
          if (nextPlayerObj && !nextPlayerObj.isHuman) {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
            computerTurn();
          } else {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
          }
        }, 2000);
      } else if (typeof segment === 'object' && segment && 'type' in segment) {
        if (segment.type === 'PRIZE') {
          newMessage = `${gameState.players[gameState.currentPlayer].name} landed on ${(segment as WheelSegment).displayValue}!`;
        } else if (segment.type === 'WILD_CARD') {
          newMessage = `${gameState.players[gameState.currentPlayer].name} got the WILD CARD!`;
        } else if (segment.type === 'GIFT_TAG') {
          newMessage = `${gameState.players[gameState.currentPlayer].name} got the $1000 GIFT TAG!`;
        } else if (segment.type === 'MILLION') {
          newMessage = `${gameState.players[gameState.currentPlayer].name} got the MILLION DOLLAR WEDGE!`;
        }
        // Update game state first, then computer makes a guess
        setGameState(prev => ({
          ...prev,
          isSpinning: false,
          wheelValue: segment,
          lastSpinResult: segment,
          landedSegmentIndex: landedIndex,
          message: newMessage,
          players: newPlayers,
          currentPlayer: nextPlayer,
          turnInProgress: false
        }));
        
        // Computer makes a guess after state is updated
        setTimeout(() => {
          computerGuess(segment);
        }, 1000);
      }
    }, 1000);
  };

  const computerGuess = (wheelValue: number | string | WheelSegment) => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (!currentPlayer || currentPlayer.isHuman) return;
    
    // Computers cannot play in the final round - only human can reach final round
    if (gameState.isFinalRound) {
      console.log('❌ Computer cannot play in final round');
      return;
    }
    
    // Prevent multiple simultaneous computer guesses
    if (gameState.turnInProgress) {
      console.log('🔄 Computer guess already in progress, skipping...');
      return;
    }
    
    console.log(`🤖 Computer ${currentPlayer.name} making guess...`);
    
    // Common letters in English (E, T, A, O, I, N, S, H, R, D, L, C, U, M, W, F, G, Y, P, B, V, K, J, X, Q, Z)
    const commonLetters = ['E', 'T', 'A', 'O', 'I', 'N', 'S', 'H', 'R', 'D', 'L', 'C', 'U', 'M', 'W', 'F', 'G', 'Y', 'P', 'B', 'V', 'K', 'J', 'X', 'Q', 'Z'];
    
    // Find unused letters
    const unusedLetters = commonLetters.filter(letter => !gameState.usedLetters.has(letter));
    
    // --- New: Randomly try to solve puzzle if enough letters are revealed ---
    const puzzleText = gameState.puzzle.text;
    const revealedLetters = Array.from(gameState.puzzle.revealed);
    const revealedCount = revealedLetters.length;
    const totalLetters = puzzleText.replace(/[^A-Z]/g, '').length;
    const revealedPercentage = (revealedCount / totalLetters) * 100;
    // If at least 30% of the letters are revealed, 30% chance to try to solve
    if (revealedPercentage > 30 && Math.random() < 0.3) {
      console.log(`🤖 Computer ${currentPlayer.name} attempting to solve (${revealedPercentage.toFixed(1)}% revealed)`);
      setTimeout(() => {
        computerSolve(0.7); // 70% success rate
      }, 1000);
      return;
    }
    // --- End new logic ---
    
    if (unusedLetters.length === 0) {
      // No letters left, computer tries to solve
      console.log(`🤖 Computer ${currentPlayer.name} attempting to solve (no letters left)`);
      setTimeout(() => {
        computerSolve(0.7); // 70% success rate
      }, 1000);
      return;
    }
    
    // Computer picks a letter (with some randomness)
    const randomIndex = Math.floor(Math.random() * Math.min(unusedLetters.length, 5)); // Pick from top 5 unused
    const letter = unusedLetters[randomIndex];
    
    // Show computer's action in the input box
    setComputerAction(letter);
    setGameState(prev => ({ ...prev, message: `${prev.players[prev.currentPlayer].name} calls ${letter}!` }));
    
    setTimeout(() => {
      const letterInPuzzle = gameState.puzzle.text.includes(letter);
      const letterCount = (gameState.puzzle.text.match(new RegExp(letter, 'g')) || []).length;
      
      let newPlayers = [...gameState.players];
      let nextPlayer = gameState.currentPlayer; // Default to same player
      let message = '';
      
      if (letterInPuzzle) {
        // Update statistics for computer's correct guess
        updateStats(letter, true);
        
        if (typeof wheelValue === 'number') {
          const earned = wheelValue * letterCount;
          newPlayers[gameState.currentPlayer].roundMoney += earned;
          message = `Yes! ${letterCount} ${letter}'s. ${gameState.players[gameState.currentPlayer].name} earned $${earned}.`;
        } else {
          message = `Yes! ${letterCount} ${letter}'s. ${gameState.players[gameState.currentPlayer].name} continues!`;
        }
        // Computer continues their turn - keep same player
        nextPlayer = gameState.currentPlayer;
      } else {
        // Update statistics for computer's incorrect guess
        updateStats(letter, false);
        
        // Determine next player (cycle through all 3 players)
        nextPlayer = getNextPlayer(gameState.currentPlayer);
        message = `No ${letter}'s. ${gameState.players[nextPlayer].name}'s turn!`;
      }
      
      setGameState(prev => ({
        ...prev,
        usedLetters: new Set([...prev.usedLetters, letter]),
        puzzle: { ...prev.puzzle, revealed: new Set([...prev.puzzle.revealed, letter]) },
        players: newPlayers,
        currentPlayer: nextPlayer,
        message,
        turnInProgress: false
      }));
      
      // Clear computer action
      setComputerAction('');
      
      // If computer continues their turn, they spin again after 2 seconds
      if (nextPlayer === gameState.currentPlayer) {
        // Computer got a correct letter and continues
        setTimeout(() => {
          computerTurn();
        }, 2000);
      } else {
        // Computer got an incorrect letter, next player's turn
        const nextPlayerObj = gameState.players[nextPlayer];
        if (nextPlayerObj && !nextPlayerObj.isHuman) {
          setTimeout(() => {
            setComputerTurnInProgress(false); // Reset flag before next computer turn
            computerTurnRef.current = false;
            computerTurn();
          }, 2000);
        } else {
          setComputerTurnInProgress(false); // Reset flag when turn passes to human
          computerTurnRef.current = false;
        }
      }
    }, 1000);
  };

  // Update computerSolve to accept a successRate argument
  const computerSolve = (successRate = 0.3) => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (!currentPlayer || currentPlayer.isHuman) return;
    
    // Computers cannot play in the final round - only human can reach final round
    if (gameState.isFinalRound) {
      console.log('❌ Computer cannot play in final round');
      return;
    }
    
    // Prevent multiple simultaneous computer solve attempts
    if (gameState.turnInProgress) {
      console.log('🔄 Computer solve already in progress, skipping...');
      return;
    }
    
    console.log(`🤖 Computer ${currentPlayer.name} attempting to solve...`);
    
    // Computer tries to solve the puzzle (with some randomness)
    const puzzleText = gameState.puzzle.text;
    const revealedText = Array.from(gameState.puzzle.revealed).join('');
    
    // 70% chance to solve if called with 0.7
    const willSolve = Math.random() < successRate;
    
    console.log('🤖 Computer solve attempt:', {
      player: gameState.players[gameState.currentPlayer].name,
      willSolve: willSolve,
      revealedLetters: Array.from(gameState.puzzle.revealed),
      puzzleText: puzzleText,
      timestamp: new Date().toISOString()
    });
    
    // Show computer's solve attempt
    setComputerSolveAttempt(willSolve ? puzzleText : 'Incorrect guess');
    setGameState(prev => ({ ...prev, message: `${prev.players[prev.currentPlayer].name} is thinking...` }));
    
    setTimeout(() => {
      if (willSolve) {
        // Computer solves correctly
        console.log('✅ Computer solved correctly:', {
          player: gameState.players[gameState.currentPlayer].name,
          puzzleText: puzzleText,
          timestamp: new Date().toISOString()
        });
        
        const newPlayers = [...gameState.players];
        newPlayers[gameState.currentPlayer].totalMoney += newPlayers[gameState.currentPlayer].roundMoney;
        
        // Check if this is a regular round (1-3) and computer won
        if (gameState.currentRound <= 3) {
          // Computer won a regular round - game over, start new game
          setGameState(prev => ({
            ...prev,
            players: newPlayers,
            puzzle: { ...prev.puzzle, revealed: new Set(prev.puzzle.text) },
            message: `${prev.players[prev.currentPlayer].name} solved "${prev.puzzle.text}" and earned $${newPlayers[gameState.currentPlayer].roundMoney}!`
          }));
          
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              message: `${prev.players[prev.currentPlayer].name} wins the round! Game over - starting new game...`
            }));
          }, 3000);
          
          // Start a completely new game after 4 seconds
          setTimeout(() => {
            const newPuzzle = generatePuzzle();
            setGameState(prev => ({
              ...prev,
              currentRound: 1,
              puzzle: newPuzzle,
              usedLetters: new Set(),
              players: [
                { name: 'You', roundMoney: 0, totalMoney: 0, isHuman: true, prizes: [], specialCards: [] },
                { name: 'Sarah', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] },
                { name: 'Mike', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] }
              ],
              currentPlayer: 0,
              wheelValue: 0,
              lastSpinResult: null,
              landedSegmentIndex: -1,
              turnInProgress: false,
              isFinalRound: false,
              finalRoundLettersRemaining: 0,
              finalRoundVowelsRemaining: 0,
              message: 'New game started!'
            }));
            setCurrentWheelSegments(getRandomizedWheelSegments());
          }, 4000);
        } else {
          // This shouldn't happen since only human can reach final round
          setGameState(prev => ({
            ...prev,
            players: newPlayers,
            puzzle: { ...prev.puzzle, revealed: new Set(prev.puzzle.text) },
            message: `${prev.players[prev.currentPlayer].name} solved "${prev.puzzle.text}" and earned $${newPlayers[gameState.currentPlayer].roundMoney}!`
          }));
          
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              message: `${prev.players[prev.currentPlayer].name} wins the round! Click "NEW PUZZLE" to continue.`
            }));
          }, 3000);
        }
      } else {
        // Computer fails to solve
        console.log('❌ Computer failed to solve:', {
          player: gameState.players[gameState.currentPlayer].name,
          puzzleText: puzzleText,
          timestamp: new Date().toISOString()
        });
        
        // Determine next player (cycle through all 3 players)
        let nextPlayer = getNextPlayer(gameState.currentPlayer);
        
        setGameState(prev => ({
          ...prev,
          currentPlayer: nextPlayer,
          message: `Incorrect! ${prev.players[nextPlayer].name}'s turn.`
        }));
        
        // Start next player's turn if it's a computer
        setTimeout(() => {
          const nextPlayerObj = gameState.players[nextPlayer];
          if (nextPlayerObj && !nextPlayerObj.isHuman) {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
            computerTurn();
          } else {
            setComputerTurnInProgress(false);
            computerTurnRef.current = false;
          }
        }, 2000);
      }
      
      // Clear computer solve attempt
      setComputerSolveAttempt('');
      
      // Reset computer turn flag
      setComputerTurnInProgress(false);
      computerTurnRef.current = false;
    }, 1000);
  };

  const getLandedSegmentIndex = (rotation: number) => {
    // The pointer is at 12 o'clock (top center)
    // The wheel segments start at -90 degrees (top center) and go clockwise
    // We need to find which segment is at the top after the wheel rotates
    
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const segmentAngle = 360 / currentWheelSegments.length;
    
    // The wheel rotates clockwise, so we need to find which segment is at the top
    // Since segments start at -90 degrees (top), we need to calculate which segment
    // is now at the top after the rotation
    // We need to invert the calculation because the wheel rotates clockwise
    let index = currentWheelSegments.length - 1 - Math.floor(normalizedRotation / segmentAngle);
    
    // Ensure index is within bounds
    if (index < 0) index += currentWheelSegments.length;
    if (index >= currentWheelSegments.length) index -= currentWheelSegments.length;
    
    return index;
  };

  const spinWheel = () => {
    if (gameState.isSpinning || gameState.currentPlayer !== 0) return;
    setGameState(prev => ({ ...prev, isSpinning: true, message: 'Spinning...', turnInProgress: true }));
    const baseRotations = 3 + Math.random() * 4;
    const segmentAngle = 360 / currentWheelSegments.length;
    const randomOffset = Math.random() * segmentAngle;
    const totalRotation = (baseRotations * 360) + randomOffset;
    const newRotation = gameState.wheelRotation + totalRotation;
    setGameState(prev => ({ ...prev, wheelRotation: newRotation }));
    setTimeout(() => {
      const landedIndex = getLandedSegmentIndex(newRotation);
      const segment = currentWheelSegments[landedIndex];
      let newMessage = '';
      let newPlayers = [...gameState.players];
      let nextPlayer = gameState.currentPlayer;
      if (typeof segment === 'number') {
        newMessage = `You spun $${segment}! Call a consonant.`;
      } else if (segment === 'BANKRUPT') {
        newMessage = 'BANKRUPT! You lose your round money and any prizes from this round. ';
        newPlayers[0].roundMoney = 0;
        newPlayers[0].prizes = newPlayers[0].prizes.filter(p => p.round !== gameState.currentRound);
        nextPlayer = 1; // You -> Sarah
        newMessage += `${gameState.players[1].name}'s turn!`;
      } else if (segment === 'LOSE A TURN') {
        newMessage = 'LOSE A TURN! ';
        nextPlayer = 1; // You -> Sarah
        newMessage += `${gameState.players[1].name}'s turn!`;
      } else if (typeof segment === 'object' && segment && 'type' in segment) {
        if (segment.type === 'PRIZE') {
          newMessage = `You landed on ${(segment as WheelSegment).displayValue}! Call a consonant to claim it.`;
        } else if (segment.type === 'WILD_CARD') {
          newMessage = `You got the WILD CARD! Call a consonant.`;
        } else if (segment.type === 'GIFT_TAG') {
          newMessage = `You got the $1000 GIFT TAG! Call a consonant.`;
        } else if (segment.type === 'MILLION') {
          newMessage = `You got the MILLION DOLLAR WEDGE! Call a consonant and keep this for the bonus round!`;
        }
      }
      setGameState(prev => ({
        ...prev,
        isSpinning: false,
        wheelValue: segment,
        lastSpinResult: segment,
        landedSegmentIndex: landedIndex,
        message: newMessage,
        players: newPlayers,
        currentPlayer: nextPlayer,
        turnInProgress: false
      }));
    }, 1000);
  };

  const callLetter = () => {
    if (gameState.currentPlayer !== 0) return;
    
    const letter = inputLetter.toUpperCase().trim();
    if (!letter || gameState.usedLetters.has(letter) || !/[A-Z]/.test(letter)) {
      setGameState(prev => ({ ...prev, message: 'Invalid or already used letter!' }));
      return;
    }

    const isVowel = 'AEIOU'.includes(letter);
    const isConsonant = 'BCDFGHJKLMNPQRSTVWXYZ'.includes(letter);
    
    // Final round restrictions
    if (gameState.isFinalRound) {
      if (isVowel && gameState.finalRoundVowelsRemaining <= 0) {
        setGameState(prev => ({ ...prev, message: 'No vowels remaining in final round!' }));
        return;
      }
      if (isConsonant && gameState.finalRoundLettersRemaining <= 0) {
        setGameState(prev => ({ ...prev, message: 'No consonants remaining in final round!' }));
        return;
      }
    }
    
    if (isVowel && (gameState.players[0].roundMoney < 250 || gameState.players[0].roundMoney === 0) && !gameState.isFinalRound) {
      setGameState(prev => ({ ...prev, message: 'Not enough money to buy a vowel! ($250 required)' }));
      return;
    }

    // Only allow consonant guess if wheelValue is set (not 0), unless using Wild Card or in final round
    if (isConsonant && !gameState.wheelValue && !wildCardActive && !gameState.isFinalRound) {
      setGameState(prev => ({ ...prev, message: 'Spin the wheel first!' }));
      return;
    }

    const letterInPuzzle = gameState.puzzle.text.includes(letter);
    const letterCount = (gameState.puzzle.text.match(new RegExp(letter, 'g')) || []).length;
    
    setGameState(prev => {
      const newUsedLetters = new Set([...prev.usedLetters, letter]);
      const newRevealed = new Set([...prev.puzzle.revealed, letter]);
      
      let newPlayers = [...prev.players];
      let message = '';
      let nextPlayer = prev.currentPlayer;
      
      // Update final round letter counts
      let newFinalRoundLettersRemaining = prev.finalRoundLettersRemaining;
      let newFinalRoundVowelsRemaining = prev.finalRoundVowelsRemaining;
      
      if (prev.isFinalRound) {
        if (isConsonant) {
          newFinalRoundLettersRemaining--;
        } else if (isVowel) {
          newFinalRoundVowelsRemaining--;
        }
      }
      
      if (letterInPuzzle) {
        // Update statistics for correct letter
        updateStats(letter, true);
        
        if (isVowel) {
          if (!prev.isFinalRound) {
            newPlayers[0].roundMoney -= 250;
          }
          message = `Yes! ${letterCount} ${letter}'s. ${prev.isFinalRound ? 'Vowel revealed!' : 'You bought a vowel.'}`;
          // Player can continue turn (buy another vowel or spin again)
          return {
            ...prev,
            usedLetters: newUsedLetters,
            puzzle: { ...prev.puzzle, revealed: newRevealed },
            players: newPlayers,
            currentPlayer: nextPlayer,
            message,
            wheelValue: prev.wheelValue, // Do not reset wheelValue for vowels
            landedSegmentIndex: prev.landedSegmentIndex,
            finalRoundLettersRemaining: newFinalRoundLettersRemaining,
            finalRoundVowelsRemaining: newFinalRoundVowelsRemaining
          };
        } else {
          // Handle different wheel segment types (not applicable in final round)
          if (!prev.isFinalRound) {
            const wheelValue = prev.wheelValue;
            
            if (typeof wheelValue === 'number') {
              const earned = wheelValue * letterCount;
              newPlayers[0].roundMoney += earned;
              message = `Yes! ${letterCount} ${letter}'s. You earned $${earned}. Spin again or buy a vowel.`;
            } else if (typeof wheelValue === 'object' && wheelValue && 'type' in wheelValue) {
              const wheelSegment = wheelValue as WheelSegment;
              if (wheelSegment.type === 'PRIZE') {
                newPlayers[0].roundMoney += 500 * letterCount; // Base value for consonants
                newPlayers[0].prizes.push({
                  name: wheelSegment.name || 'Unknown Prize',
                  value: wheelSegment.value,
                  round: prev.currentRound,
                  description: (wheelSegment.name && PRIZE_DESCRIPTIONS[wheelSegment.name as keyof typeof PRIZE_DESCRIPTIONS]) || 'A fabulous prize!'
                });
                message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and won ${wheelSegment.name}! Spin again or buy a vowel.`;
              } else if (wheelSegment.type === 'WILD_CARD') {
                newPlayers[0].roundMoney += 500 * letterCount;
                newPlayers[0].specialCards.push('WILD_CARD');
                message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and got the WILD CARD! Spin again or buy a vowel.`;
              } else if (wheelSegment.type === 'GIFT_TAG') {
                newPlayers[0].roundMoney += 500 * letterCount;
                newPlayers[0].prizes.push({
                  name: '$1000 GIFT TAG',
                  value: 1000,
                  round: prev.currentRound,
                  description: PRIZE_DESCRIPTIONS['$1000 GIFT TAG']
                });
                message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and the $1000 GIFT TAG! Spin again or buy a vowel.`;
              } else if (wheelSegment.type === 'MILLION') {
                newPlayers[0].roundMoney += 900 * letterCount;
                newPlayers[0].specialCards.push('MILLION_DOLLAR_WEDGE');
                message = `Yes! ${letterCount} ${letter}'s. You earned $${900 * letterCount} and kept the MILLION DOLLAR WEDGE! Spin again or buy a vowel.`;
              }
            } else if (wildCardActive) {
              // Wild Card usage - give base value for consonant
              const earned = 500 * letterCount;
              newPlayers[0].roundMoney += earned;
              message = `Yes! ${letterCount} ${letter}'s. Wild Card used! You earned $${earned}. Spin again or buy a vowel.`;
              // Deactivate Wild Card after use
              setWildCardActive(false);
            }
          } else {
            // Final round consonant
            message = `Yes! ${letterCount} ${letter}'s. Consonant revealed!`;
          }
          // After a correct consonant, require spin again (reset wheelValue)
          return {
            ...prev,
            usedLetters: newUsedLetters,
            puzzle: { ...prev.puzzle, revealed: newRevealed },
            players: newPlayers,
            currentPlayer: nextPlayer,
            message,
            wheelValue: 0, // Force spin again for next consonant
            landedSegmentIndex: prev.landedSegmentIndex,
            finalRoundLettersRemaining: newFinalRoundLettersRemaining,
            finalRoundVowelsRemaining: newFinalRoundVowelsRemaining
          };
        }
      } else {
        // Update statistics for incorrect letter
        updateStats(letter, false);
        
        if (isVowel && !prev.isFinalRound) {
          newPlayers[0].roundMoney -= 250;
        }
        message = `Sorry, no ${letter}'s. `;
        // Determine next player (cycle through all 3 players)
        nextPlayer = getNextPlayer(gameState.currentPlayer);
        message += `${gameState.players[nextPlayer].name}'s turn!`;
        
        // Deactivate Wild Card if used and letter was wrong
        if (wildCardActive) {
          setWildCardActive(false);
        }
      }
      
      return {
        ...prev,
        usedLetters: newUsedLetters,
        puzzle: { ...prev.puzzle, revealed: newRevealed },
        players: newPlayers,
        currentPlayer: nextPlayer,
        message,
        wheelValue: 0,
        landedSegmentIndex: -1,
        finalRoundLettersRemaining: newFinalRoundLettersRemaining,
        finalRoundVowelsRemaining: newFinalRoundVowelsRemaining
      };
    });
    
    setInputLetter('');
  };

  const solvePuzzle = () => {
    if (gameState.currentPlayer !== 0) return;
    
    const attempt = solveAttempt.toUpperCase().trim();
    const correct = attempt === gameState.puzzle.text;
    
    console.log('Solve attempt:', {
      attempt: attempt,
      puzzleText: gameState.puzzle.text,
      correct: correct,
      currentPlayer: gameState.currentPlayer
    });
    
    if (correct) {
      // Update statistics for solved puzzle
      updateStats('', false, true);
      
      const newPlayers = [...gameState.players];
      newPlayers[0].totalMoney += newPlayers[0].roundMoney;
      
      setGameState(prev => ({
        ...prev,
        players: newPlayers,
        puzzle: { ...prev.puzzle, revealed: new Set(prev.puzzle.text) },
        message: `Correct! You solved "${prev.puzzle.text}" and earned $${newPlayers[0].roundMoney}!`
      }));
      
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          message: `You win the round! Click "NEW PUZZLE" to continue.`
        }));
      }, 3000);
    } else {
      // Log wrong solve attempt
      console.log('❌ Wrong solve attempt:', {
        player: gameState.players[gameState.currentPlayer].name,
        attempt: attempt,
        correctAnswer: gameState.puzzle.text,
        puzzleCategory: gameState.puzzle.category,
        timestamp: new Date().toISOString()
      });
      
      // Determine next player (cycle through all 3 players)
      const nextPlayer = getNextPlayer(gameState.currentPlayer);
      
      setGameState(prev => {
        return {
          ...prev,
          currentPlayer: nextPlayer,
          message: `Incorrect! ${prev.players[nextPlayer].name}'s turn.`
        };
      });
    }
    
    setSolveAttempt('');
  };

  // Add new puzzle function for manual control
  const startNewPuzzle = () => {
    const newPuzzle = generatePuzzle();
    const isFinalRound = gameState.currentRound >= 3; // Final round starts at round 4
    
    // Only human player can advance to final round
    if (isFinalRound) {
      // Check if the human player won the previous round
      const humanPlayer = gameState.players[0];
      if (humanPlayer.roundMoney === 0) {
        // Human didn't win the round - game over, start new game
        setGameState(prev => ({
          ...prev,
          message: 'You didn\'t win the round! Game over - starting new game...'
        }));
        
        setTimeout(() => {
          const newPuzzle = generatePuzzle();
          setGameState(prev => ({
            ...prev,
            currentRound: 1,
            puzzle: newPuzzle,
            usedLetters: new Set(),
            players: [
              { name: 'You', roundMoney: 0, totalMoney: 0, isHuman: true, prizes: [], specialCards: [] },
              { name: 'Sarah', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] },
              { name: 'Mike', roundMoney: 0, totalMoney: 0, isHuman: false, prizes: [], specialCards: [] }
            ],
            currentPlayer: 0,
            wheelValue: 0,
            lastSpinResult: null,
            landedSegmentIndex: -1,
            turnInProgress: false,
            isFinalRound: false,
            finalRoundLettersRemaining: 0,
            finalRoundVowelsRemaining: 0,
            message: 'New game started!'
          }));
          setCurrentWheelSegments(getRandomizedWheelSegments());
        }, 2000);
        return;
      }
    }
    
    // Randomize wheel segments for the new round (except final round)
    if (!isFinalRound) {
      setCurrentWheelSegments(getRandomizedWheelSegments());
    }
    
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      puzzle: newPuzzle,
      usedLetters: new Set(),
      players: prev.players.map(p => ({ 
        ...p, 
        roundMoney: 0,
        // Keep prizes and special cards across rounds
        prizes: p.prizes,
        specialCards: p.specialCards
      })),
      currentPlayer: 0,
      wheelValue: 0,
      lastSpinResult: null,
      landedSegmentIndex: -1,
      turnInProgress: false,
      isFinalRound: isFinalRound,
      finalRoundLettersRemaining: isFinalRound ? 3 : 0, // 3 consonants in final round
      finalRoundVowelsRemaining: isFinalRound ? 1 : 0, // 1 vowel in final round
      message: isFinalRound ? 'FINAL ROUND! R, S, T, L, N, E are revealed. You get 3 consonants + 1 vowel.' : 'New round!'
    }));
    
    // If it's the final round, automatically reveal R, S, T, L, N, E
    if (isFinalRound) {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          puzzle: {
            ...prev.puzzle,
            revealed: new Set(['R', 'S', 'T', 'L', 'N', 'E'])
          }
        }));
      }, 1000);
    }
  };

  const handleResetProgress = () => {
    setUsedPuzzles(new Set());
    setGameStats({
      totalPuzzles: 0,
      solvedPuzzles: 0,
      totalLettersGuessed: 0,
      correctLetters: 0,
      letterStats: {},
      categoryStats: {},
      averageLettersPerPuzzle: 0,
      bestCategory: '',
      worstCategory: '',
      mostSuccessfulLetter: '',
      leastSuccessfulLetter: ''
    });
    localStorage.removeItem('jenswheelpractice-used-puzzles');
    localStorage.removeItem('jenswheelpractice-stats');
    setShowResetPanel(false);
    // Generate a fresh puzzle after reset
    const newPuzzle = generatePuzzle();
    setGameState(prev => ({ 
      ...prev, 
      puzzle: newPuzzle,
      usedLetters: new Set<string>(),
      wheelValue: 0,
      message: 'Progress reset! Fresh puzzles available!',
      currentPlayer: 0,
      turnInProgress: false,
      lastSpinResult: null,
      landedSegmentIndex: -1
    }));
  };

  const renderPuzzle = () => {
    try {
      const { specialFormat } = gameState.puzzle;
      
      // THEN AND NOW format
      if (specialFormat?.type === 'THEN_AND_NOW') {
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-300 mb-2">THEN:</div>
              <div className="flex flex-wrap justify-center">
                {specialFormat.then?.split('').map((char, index) => {
                  if (char === ' ') return <span key={`then-${index}`} className="w-2"></span>;
                  const isRevealed = gameState.puzzle.revealed.has(char) || !/[A-Z]/.test(char);
                  return (
                    <span
                      key={`then-char-${index}`}
                      className={`inline-block w-5 sm:w-8 h-8 sm:h-12 mx-0.5 sm:mx-1 rounded-md text-center align-middle font-extrabold text-lg sm:text-2xl ${isRevealed ? 'bg-yellow-200 text-black' : 'bg-gray-700 text-yellow-200'}`}
                    >
                      {isRevealed ? char : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center text-xl text-yellow-400">↓</div>
            
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-300 mb-2">NOW:</div>
              <div className="flex flex-wrap justify-center">
                {specialFormat.now?.split('').map((char, index) => {
                  if (char === ' ') return <span key={`now-${index}`} className="w-2"></span>;
                  const isRevealed = gameState.puzzle.revealed.has(char) || !/[A-Z]/.test(char);
                  return (
                    <span
                      key={`now-char-${index}`}
                      className={`inline-block w-5 sm:w-8 h-8 sm:h-12 mx-0.5 sm:mx-1 rounded-md text-center align-middle font-extrabold text-lg sm:text-2xl ${isRevealed ? 'bg-yellow-200 text-black' : 'bg-gray-700 text-yellow-200'}`}
                    >
                      {isRevealed ? char : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      
      // Standard puzzle display
      return (
        <div className="flex flex-wrap justify-center">
          {gameState.puzzle.text.split('').map((char, index) => {
            if (char === ' ') return <span key={index} className="w-2 sm:w-4"></span>;
            if (char === '/') return <span key={index} className="mx-2 text-2xl text-yellow-400">/</span>;
            
            const isRevealed = gameState.puzzle.revealed.has(char) || !/[A-Z]/.test(char);
            let borderColor = 'border-blue-400';
            let bgColor = 'bg-white';
            let textColor = isRevealed ? 'text-blue-800' : 'text-transparent';
            
            // Special format styling
            if (specialFormat?.type === 'BEFORE_AFTER' && specialFormat.shared?.includes(char)) {
              borderColor = 'border-yellow-400';
              bgColor = 'bg-yellow-100';
              textColor = isRevealed ? 'text-yellow-800' : 'text-transparent';
            } else if (specialFormat?.type === 'RHYME_TIME') {
              borderColor = 'border-pink-400';
              bgColor = 'bg-pink-50';
              textColor = isRevealed ? 'text-pink-800' : 'text-transparent';
            } else if (specialFormat?.type === 'SAME_LETTER' && char === specialFormat.letter) {
              borderColor = 'border-green-400';
              bgColor = 'bg-green-100';
              textColor = isRevealed ? 'text-green-800' : 'text-transparent';
            }
            
            return (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 border-2 ${borderColor} ${bgColor} text-xs sm:text-sm md:text-lg lg:text-xl font-bold m-0.5 sm:m-1 ${textColor}`}
              >
                {isRevealed ? char : ''}
              </span>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error rendering puzzle:', error);
      return <div className="text-red-400">Error loading puzzle</div>;
    }
  };

  // Helper function to get next player in rotation
  const getNextPlayer = (currentPlayerIndex: number): number => {
    return (currentPlayerIndex + 1) % gameState.players.length;
  };

  // Helper function to check if current player is human
  const isCurrentPlayerHuman = (): boolean => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    return currentPlayer ? currentPlayer.isHuman : false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            WHEEL OF FORTUNE - Training Edition v11
          </h1>
        </div>

        {/* Consolidated Status Bar */}
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 sm:p-4 text-center mb-4">
          <div className="text-sm sm:text-lg font-semibold text-yellow-100">
            {/* Show turn, round, and result/spin messages in one line */}
            {(() => {
              if (gameState.isSpinning) {
                return '🔄 Spinning...';
              }
              if (gameState.currentPlayer === 0) {
                if (gameState.message && gameState.message.includes('spun')) {
                  const [pre, spinMsg] = gameState.message.split(/(You spun.*Call a consonant\.?)/);
                  return <span>🎯 Your Turn! Spin the Wheel (Round {gameState.currentRound}) — <span className="text-white font-bold">{spinMsg || gameState.message}</span></span>;
                }
                if (gameState.isFinalRound) {
                  return `🏆 FINAL ROUND! (Round ${gameState.currentRound}) — ${gameState.finalRoundLettersRemaining} consonants, ${gameState.finalRoundVowelsRemaining} vowel remaining`;
                }
                return `🎯 Your Turn! Spin the Wheel (Round ${gameState.currentRound})`;
              } else {
                if (gameState.message && gameState.message.includes('spun')) {
                  const [pre, spinMsg] = gameState.message.split(/(spun.*!)/);
                  return <span>{gameState.players[gameState.currentPlayer].name}'s Turn (Round {gameState.currentRound}) — <span className="text-white font-bold">{spinMsg ? 'spun' + spinMsg : gameState.message}</span></span>;
                }
                if (gameState.message) {
                  return `${gameState.players[gameState.currentPlayer].name}'s Turn (Round ${gameState.currentRound}) — ${gameState.message}`;
                }
                return `${gameState.players[gameState.currentPlayer].name}'s Turn (Round ${gameState.currentRound})`;
              }
            })()}
          </div>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-2 sm:mb-4 text-xs sm:text-base">
          {gameState.players.map((player, index) => (
            <div key={index} className={`rounded-lg p-2 sm:p-4 ${
              gameState.currentPlayer === index 
                ? 'bg-yellow-600 bg-opacity-70 border-2 border-yellow-400' 
                : 'bg-blue-800 bg-opacity-50'
            }`}>
              <div className="flex items-center mb-1 sm:mb-2">
                <span className={`font-semibold ${gameState.currentPlayer === index ? 'text-yellow-100' : 'text-white'}`}>
                  {player.name}
                </span>
                {gameState.currentPlayer === index && (
                  <span className="ml-1 text-yellow-200">★</span>
                )}
              </div>
              <div className="text-xs sm:text-sm">Round: ${player.roundMoney}</div>
              <div className="text-xs sm:text-sm font-bold">Total: ${player.totalMoney}</div>
              
              {/* Show prizes and special cards */}
              {player.prizes.length > 0 && (
                <div className="text-xs mt-1">
                  <div className="text-green-300 font-semibold">
                    🏆 Prizes ({player.prizes.length}):
                  </div>
                  {player.prizes.map((prize, prizeIndex) => (
                    <div key={prizeIndex} className="text-green-200 ml-2 text-xs">
                      • {prize.name} (${prize.value.toLocaleString()})
                    </div>
                  ))}
                </div>
              )}
              {player.specialCards.length > 0 && (
                <div className="text-xs mt-1">
                  <div className="text-purple-300 font-semibold">
                    ⭐ Special Cards:
                  </div>
                  {player.specialCards.map((card, cardIndex) => (
                    <div key={cardIndex} className="text-purple-200 ml-2 text-xs">
                      • {card === 'WILD_CARD' ? 'Wild Card' : 
                         card === 'MILLION_DOLLAR_WEDGE' ? 'Million Dollar Wedge' : card}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Puzzle Board */}
        <div className="bg-blue-800 bg-opacity-30 rounded-lg p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="text-center mb-4">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400 mb-2">
              {gameState.puzzle.specialFormat?.type === 'QUESTION' 
                ? gameState.puzzle.specialFormat.question?.replace(/_/g, ' ') + '?'
                : gameState.puzzle.category}
            </div>
            
            {gameState.puzzle.specialFormat && (
              <div className="text-xs sm:text-sm text-blue-200 mb-2">
                {gameState.puzzle.specialFormat.type === 'BEFORE_AFTER' && "The middle word connects both phrases!"}
                {gameState.puzzle.specialFormat.type === 'RHYME_TIME' && "All words rhyme!"}
                {gameState.puzzle.specialFormat.type === 'SAME_LETTER' && `All words start with ${gameState.puzzle.specialFormat.letter}!`}
                {gameState.puzzle.specialFormat.type === 'THEN_AND_NOW' && "Two items from different times!"}
                {gameState.puzzle.specialFormat.type === 'QUESTION' && "Answer the question!"}
              </div>
            )}
            
            <div className="min-h-16">
              {gameState.puzzle.specialFormat?.question && (
                <div className="text-center text-yellow-200 text-lg font-bold mb-2">
                  {gameState.puzzle.specialFormat.question}
                </div>
              )}
              {renderPuzzle()}
            </div>
          </div>
        </div>

        {/* Wheel and Controls Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Wheel Section */}
          <div className="flex flex-col items-center">
            {renderWheel()}
          </div>

          {/* Game Controls Section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Call Letter */}
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-bold mb-2 sm:mb-3">Call Letter</h3>
              {wildCardActive && (
                <div className="mb-2 p-2 bg-purple-600 bg-opacity-30 rounded border border-purple-400">
                  <span className="text-purple-200 text-xs">🃏 Wild Card Active - You can call a consonant!</span>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={gameState.currentPlayer === 0 ? inputLetter : computerAction}
                  onChange={(e) => setInputLetter(e.target.value)}
                  disabled={gameState.currentPlayer !== 0}
                  className="flex-1 px-3 py-3 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded text-white text-base sm:text-sm disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder={gameState.currentPlayer === 0 ? 
                    (gameState.isFinalRound ? 
                      `Call letter (${gameState.finalRoundLettersRemaining} consonants, ${gameState.finalRoundVowelsRemaining} vowel left)` : 
                      "Enter letter...") : 
                    "Computer is thinking..."}
                  maxLength={1}
                />
                <button
                  onClick={callLetter}
                  disabled={gameState.currentPlayer !== 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-3 sm:px-3 sm:py-2 rounded font-semibold transition-colors text-base sm:text-sm min-w-[60px]"
                >
                  Call
                </button>
              </div>
              <div className="text-xs">
                <div className="mb-1">Used: {Array.from(gameState.usedLetters).join(', ')}</div>
                <div className="text-gray-400">Vowels cost $250</div>
              </div>
            </div>

            {/* Solve Puzzle */}
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-bold mb-2 sm:mb-3">Solve Puzzle</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={gameState.currentPlayer === 0 ? solveAttempt : computerSolveAttempt}
                  onChange={(e) => setSolveAttempt(e.target.value)}
                  disabled={gameState.currentPlayer !== 0}
                  className="flex-1 px-3 py-3 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded text-white text-base sm:text-sm disabled:bg-gray-800 disabled:text-gray-500"
                  placeholder={gameState.currentPlayer === 0 ? "Your answer..." : "Computer is solving..."}
                />
                <button
                  onClick={solvePuzzle}
                  disabled={gameState.currentPlayer !== 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 sm:px-3 sm:py-2 rounded font-semibold transition-colors text-base sm:text-sm min-w-[60px]"
                >
                  Solve
                </button>
              </div>
              <button
                onClick={startNewPuzzle}
                className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-3 sm:px-3 sm:py-2 rounded font-semibold transition-colors text-base sm:text-sm"
              >
                NEW PUZZLE
              </button>
            </div>

            {/* Special Cards */}
            {gameState.players[0].specialCards.length > 0 && (
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-lg font-bold mb-2 sm:mb-3 text-purple-300">⭐ Special Cards</h3>
                <div className="space-y-2">
                  {gameState.players[0].specialCards.map((card, index) => (
                    <div key={index} className="flex items-center justify-between bg-purple-700 bg-opacity-30 rounded p-2">
                      <span className="text-purple-200 text-sm">
                        {card === 'WILD_CARD' ? '🃏 Wild Card' : 
                         card === 'MILLION_DOLLAR_WEDGE' ? '💎 Million Dollar Wedge' : card}
                      </span>
                      {card === 'WILD_CARD' && (
                        <button
                          onClick={() => {
                            // Activate Wild Card for extra consonant call
                            setWildCardActive(true);
                            setGameState(prev => ({
                              ...prev,
                              message: 'Wild Card activated! You can call an extra consonant.',
                              players: prev.players.map((p, i) => 
                                i === 0 ? { ...p, specialCards: p.specialCards.filter(c => c !== 'WILD_CARD') } : p
                              )
                            }));
                          }}
                          disabled={gameState.currentPlayer !== 0 || wildCardActive}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Use
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Game Info */}
        <div className="text-center text-xs sm:text-sm text-gray-400">
          <p>Puzzles completed: {usedPuzzles.size} • Fresh puzzles remaining: {availablePuzzles.length}</p>
          <p className="mt-1">
            <strong>🎯 Always Fresh Content:</strong> 500+ unique puzzles • No repeats • Auto-reset when needed
          </p>
          <p className="mt-1 sm:mt-2">
            <strong>Version 13:</strong> Comprehensive statistics • Letter tracking • Category analysis
          </p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              📊 {showStats ? 'Hide' : 'Show'} Statistics
            </button>
            {usedPuzzles.size > 0 && (
              <button
                onClick={() => setShowResetPanel(true)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                Reset Progress
              </button>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="bg-gray-800 bg-opacity-80 rounded-lg p-4 sm:p-6 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 text-center">📊 Your Statistics</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-800 bg-opacity-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-300">{gameStats.solvedPuzzles}</div>
                <div className="text-xs text-blue-200">Puzzles Solved</div>
              </div>
              <div className="bg-green-800 bg-opacity-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-300">
                  {gameStats.totalLettersGuessed > 0 
                    ? Math.round((gameStats.correctLetters / gameStats.totalLettersGuessed) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-green-200">Letter Accuracy</div>
              </div>
              <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-300">{gameStats.averageLettersPerPuzzle}</div>
                <div className="text-xs text-purple-200">Avg Letters/Puzzle</div>
              </div>
              <div className="bg-orange-800 bg-opacity-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-orange-300">{gameStats.totalLettersGuessed}</div>
                <div className="text-xs text-orange-200">Total Letters</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Letter Statistics */}
              <div>
                <h4 className="text-sm sm:text-md font-bold text-yellow-300 mb-2 sm:mb-3">Letter Performance</h4>
                <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                  {Object.entries(gameStats.letterStats)
                    .sort((a, b) => (b[1].correct + b[1].incorrect) - (a[1].correct + a[1].incorrect))
                    .slice(0, 8)
                    .map(([letter, stats]) => {
                      const total = stats.correct + stats.incorrect;
                      const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
                      return (
                        <div key={letter} className="flex justify-between items-center bg-gray-700 bg-opacity-50 rounded px-2 sm:px-3 py-1">
                          <span className="font-bold text-base sm:text-lg">{letter}</span>
                          <div className="text-right">
                            <div className="text-xs sm:text-sm">{stats.correct}/{total} ({accuracy}%)</div>
                            <div className="text-xs text-gray-400">{stats.correct} correct, {stats.incorrect} wrong</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {gameStats.mostSuccessfulLetter && (
                  <div className="mt-2 sm:mt-3 text-xs sm:text-sm">
                    <span className="text-green-400">Best: {gameStats.mostSuccessfulLetter}</span>
                    {gameStats.leastSuccessfulLetter && gameStats.leastSuccessfulLetter !== gameStats.mostSuccessfulLetter && (
                      <span className="ml-2 sm:ml-3 text-red-400">Needs work: {gameStats.leastSuccessfulLetter}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Category Statistics */}
              <div>
                <h4 className="text-sm sm:text-md font-bold text-yellow-300 mb-2 sm:mb-3">Category Performance</h4>
                <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                  {Object.entries(gameStats.categoryStats)
                    .sort((a, b) => b[1].solved - a[1].solved)
                    .map(([category, stats]) => {
                      const successRate = stats.attempted > 0 ? Math.round((stats.solved / stats.attempted) * 100) : 0;
                      return (
                        <div key={category} className="flex justify-between items-center bg-gray-700 bg-opacity-50 rounded px-2 sm:px-3 py-1">
                          <span className="font-semibold text-xs sm:text-sm">{category}</span>
                          <div className="text-right">
                            <div className="text-xs sm:text-sm">{stats.solved}/{stats.attempted} ({successRate}%)</div>
                            <div className="text-xs text-gray-400">{stats.solved} solved</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {gameStats.bestCategory && (
                  <div className="mt-2 sm:mt-3 text-xs sm:text-sm">
                    <span className="text-green-400">Best: {gameStats.bestCategory}</span>
                    {gameStats.worstCategory && gameStats.worstCategory !== gameStats.bestCategory && (
                      <span className="ml-2 sm:ml-3 text-red-400">Practice: {gameStats.worstCategory}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset Progress Panel */}
        {showResetPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Reset Progress?</h3>
              <p className="text-white mb-4">
                You've completed <span className="text-yellow-400 font-bold">{usedPuzzles.size}</span> puzzles! 
                Only <span className="text-red-400 font-bold">{availablePuzzles.length}</span> fresh puzzles remain.
              </p>
              <p className="text-gray-300 mb-6">
                Would you like to reset and start over with all puzzles available again?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleResetProgress}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowResetPanel(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Continue Playing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WheelOfFortune; 
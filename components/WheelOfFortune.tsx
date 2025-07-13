import React, { useState, useEffect, useCallback } from 'react';
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
    message: 'Your turn! Spin the wheel to begin!'
  });

  const [inputLetter, setInputLetter] = useState('');
  const [solveAttempt, setSolveAttempt] = useState('');
  const [usedPuzzles, setUsedPuzzles] = useState<Set<string>>(new Set());
  const [availablePuzzles, setAvailablePuzzles] = useState<string[]>([]);

  // Load used puzzles from localStorage
  useEffect(() => {
    const savedUsedPuzzles = localStorage.getItem('jenswheelpractice-used-puzzles');
    if (savedUsedPuzzles) {
      setUsedPuzzles(new Set(JSON.parse(savedUsedPuzzles)));
    }
  }, []);

  // Save used puzzles to localStorage
  useEffect(() => {
    if (usedPuzzles.size > 0) {
      localStorage.setItem('jenswheelpractice-used-puzzles', JSON.stringify([...usedPuzzles]));
    }
  }, [usedPuzzles]);

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
      // If we've used most puzzles, offer to reset
      if (availablePuzzles.length < 10) {
        const shouldReset = confirm(`You've completed ${usedPuzzles.size} puzzles! Only ${availablePuzzles.length} fresh puzzles remain. Would you like to reset and start over with all puzzles available again?`);
        if (shouldReset) {
          setUsedPuzzles(new Set());
          localStorage.removeItem('jenswheelpractice-used-puzzles');
          // Recursively call to generate from fresh pool
          return generatePuzzle();
        }
      }

      // If no available puzzles, reset automatically
      if (availablePuzzles.length === 0) {
        setUsedPuzzles(new Set());
        localStorage.removeItem('jenswheelpractice-used-puzzles');
        return generatePuzzle();
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
      const newPuzzle = generatePuzzle();
      setGameState(prev => ({ ...prev, puzzle: newPuzzle }));
    } catch (error) {
      console.error('Error initializing puzzle:', error);
    }
  }, []); // Remove generatePuzzle dependency to prevent re-rendering

  // Authentic wheel renderer with visible segments
  const renderWheel = () => {
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    
    return (
      <div className="relative w-48 h-48 sm:w-80 sm:h-80 mx-auto mb-8">
        {/* Main wheel container */}
        <div className="absolute inset-0 rounded-full border-4 border-yellow-600 shadow-2xl bg-gray-800 overflow-hidden">
          
          {/* Individual wheel segments */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 200 200"
            style={{ 
              transform: `rotate(${gameState.wheelRotation}deg)`, 
              transition: gameState.isSpinning ? 'transform 3s ease-out' : 'none',
              transformOrigin: '100px 100px'
            }}
          >
            {WHEEL_SEGMENTS.map((segment, index) => {
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
          <div className="absolute inset-12 sm:inset-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 border-4 border-yellow-500 flex items-center justify-center z-20">
            <div className="text-white text-xs sm:text-lg font-bold text-center">
              {gameState.isSpinning ? (
                <RotateCcw className="w-4 h-4 sm:w-8 sm:h-8 animate-spin" />
              ) : (
                <div>
                  <div className="text-xs sm:text-base">WHEEL</div>
                  <div className="text-xs">OF</div>
                  <div className="text-xs sm:text-base">FORTUNE</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-30"
          style={{
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '20px solid #DC143C',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
          }}
        />
        
        {/* Result display */}
        {gameState.lastSpinResult && !gameState.isSpinning && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-lg border-2 border-yellow-600 z-10">
            {typeof gameState.lastSpinResult === 'number' 
              ? `${gameState.lastSpinResult}`
              : gameState.lastSpinResult === 'BANKRUPT'
                ? '💥 BANKRUPT'
                : gameState.lastSpinResult === 'LOSE A TURN'
                  ? '❌ LOSE TURN'
                  : typeof gameState.lastSpinResult === 'object' && gameState.lastSpinResult && 'type' in gameState.lastSpinResult
                    ? gameState.lastSpinResult.type === 'PRIZE'
                      ? `🏆 ${(gameState.lastSpinResult as WheelSegment).displayValue}`
                      : `⭐ ${(gameState.lastSpinResult as WheelSegment).displayValue}`
                    : String(gameState.lastSpinResult)}
          </div>
        )}
      </div>
    );
  };

  // Authentic wheel spinner with realistic physics
  const spinWheel = () => {
    if (gameState.isSpinning || gameState.currentPlayer !== 0) return;
    
    setGameState(prev => ({ ...prev, isSpinning: true, message: 'Spinning...', turnInProgress: true }));
    
    // Generate realistic spin with multiple full rotations plus final position
    const baseRotations = 3 + Math.random() * 4; // 3-7 full rotations
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const randomSegmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const finalAngle = randomSegmentIndex * segmentAngle + (Math.random() * segmentAngle);
    const totalRotation = (baseRotations * 360) + finalAngle;
    
    // Update wheel rotation with CSS animation
    const newRotation = gameState.wheelRotation + totalRotation;
    setGameState(prev => ({ ...prev, wheelRotation: newRotation }));
    
    setTimeout(() => {
      const segment = WHEEL_SEGMENTS[randomSegmentIndex];
      let newMessage = '';
      let newPlayers = [...gameState.players];
      let nextPlayer = gameState.currentPlayer;
      
      if (typeof segment === 'number') {
        newMessage = `You spun $${segment}! Call a consonant.`;
      } else if (segment === 'BANKRUPT') {
        newMessage = 'BANKRUPT! You lose your round money and any prizes from this round. ';
        newPlayers[0].roundMoney = 0;
        newPlayers[0].prizes = newPlayers[0].prizes.filter(p => p.round !== gameState.currentRound);
        nextPlayer = 1;
        newMessage += `${gameState.players[1].name}'s turn!`;
      } else if (segment === 'LOSE A TURN') {
        newMessage = 'LOSE A TURN! ';
        nextPlayer = 1;
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
        landedSegmentIndex: randomSegmentIndex,
        message: newMessage,
        players: newPlayers,
        currentPlayer: nextPlayer,
        turnInProgress: false
      }));
    }, 3000); // Longer spin time for realism
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
    
    if (isVowel && gameState.players[0].roundMoney < 250) {
      setGameState(prev => ({ ...prev, message: 'Not enough money to buy a vowel! ($250 required)' }));
      return;
    }

    if (isConsonant && !gameState.wheelValue) {
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
      
      if (letterInPuzzle) {
        if (isVowel) {
          newPlayers[0].roundMoney -= 250;
          message = `Yes! ${letterCount} ${letter}'s. You bought a vowel.`;
        } else {
          // Handle different wheel segment types
          const wheelValue = prev.wheelValue;
          
          if (typeof wheelValue === 'number') {
            const earned = wheelValue * letterCount;
            newPlayers[0].roundMoney += earned;
            message = `Yes! ${letterCount} ${letter}'s. You earned $${earned}.`;
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
              message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and won ${wheelSegment.name}!`;
            } else if (wheelSegment.type === 'WILD_CARD') {
              newPlayers[0].roundMoney += 500 * letterCount;
              newPlayers[0].specialCards.push('WILD_CARD');
              message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and got the WILD CARD!`;
            } else if (wheelSegment.type === 'GIFT_TAG') {
              newPlayers[0].roundMoney += 500 * letterCount;
              newPlayers[0].prizes.push({
                name: '$1000 GIFT TAG',
                value: 1000,
                round: prev.currentRound,
                description: PRIZE_DESCRIPTIONS['$1000 GIFT TAG']
              });
              message = `Yes! ${letterCount} ${letter}'s. You earned $${500 * letterCount} and the $1000 GIFT TAG!`;
            } else if (wheelSegment.type === 'MILLION') {
              newPlayers[0].roundMoney += 900 * letterCount;
              newPlayers[0].specialCards.push('MILLION_DOLLAR_WEDGE');
              message = `Yes! ${letterCount} ${letter}'s. You earned $${900 * letterCount} and kept the MILLION DOLLAR WEDGE!`;
            }
          }
        }
        // Player continues turn
      } else {
        if (isVowel) {
          newPlayers[0].roundMoney -= 250;
        }
        message = `Sorry, no ${letter}'s. `;
        nextPlayer = 1;
        message += `${prev.players[1].name}'s turn!`;
      }
      
      return {
        ...prev,
        usedLetters: newUsedLetters,
        puzzle: { ...prev.puzzle, revealed: newRevealed },
        players: newPlayers,
        currentPlayer: nextPlayer,
        message,
        wheelValue: (isVowel || !letterInPuzzle) ? 0 : prev.wheelValue,
        landedSegmentIndex: (isVowel || !letterInPuzzle) ? -1 : prev.landedSegmentIndex
      };
    });
    
    setInputLetter('');
  };

  const solvePuzzle = () => {
    if (gameState.currentPlayer !== 0) return;
    
    const attempt = solveAttempt.toUpperCase().trim();
    const correct = attempt === gameState.puzzle.text;
    
    if (correct) {
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
      setGameState(prev => {
        const nextPlayer = 1;
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
      message: 'New round! Your turn - spin the wheel to begin!'
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
                className={`inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 border-2 ${borderColor} ${bgColor} text-sm sm:text-xl font-bold m-0.5 sm:m-1 ${textColor}`}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            WHEEL OF FORTUNE
          </h1>
          <p className="text-lg sm:text-xl text-blue-200">Training Edition v11</p>
        </div>

        {/* Game Status */}
        <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-4 sm:mb-8 text-xs sm:text-base">
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
                <div className="text-xs mt-1 text-green-300">
                  🏆 {player.prizes.length} prize{player.prizes.length > 1 ? 's' : ''}
                </div>
              )}
              {player.specialCards.length > 0 && (
                <div className="text-xs mt-1 text-purple-300">
                  ⭐ {player.specialCards.includes('WILD_CARD') ? 'Wild Card ' : ''}
                  {player.specialCards.includes('MILLION_DOLLAR_WEDGE') ? 'Million $' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Round Info */}
        <div className="text-center mb-4">
          <div className="bg-purple-800 bg-opacity-50 rounded-lg p-2 sm:p-3 inline-block">
            <div className="flex items-center justify-center">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="font-semibold text-sm sm:text-base">Round {gameState.currentRound}</span>
            </div>
          </div>
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

        {/* Wheel */}
        <div className="mb-4 sm:mb-8">
          {renderWheel()}
          <div className="text-center">
            <button
              onClick={spinWheel}
              disabled={gameState.isSpinning || gameState.currentPlayer !== 0}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-black font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-sm sm:text-xl transition-colors"
            >
              {gameState.isSpinning ? 'Spinning...' : 
               gameState.currentPlayer === 0 ? 'SPIN WHEEL' : 'Wait Your Turn'}
            </button>
          </div>
        </div>

        {/* Game Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-xl font-bold mb-2 sm:mb-4">Call a Letter</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputLetter}
                onChange={(e) => setInputLetter(e.target.value.slice(0, 1))}
                disabled={gameState.currentPlayer !== 0}
                className="flex-1 px-2 py-2 sm:px-4 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base disabled:bg-gray-800 disabled:text-gray-500"
                placeholder={gameState.currentPlayer === 0 ? "Letter..." : "Wait..."}
                maxLength={1}
              />
              <button
                onClick={callLetter}
                disabled={gameState.currentPlayer !== 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 sm:px-6 rounded font-semibold transition-colors text-sm sm:text-base"
              >
                Call
              </button>
            </div>
            <div className="mt-2 sm:mt-4 text-xs sm:text-sm">
              <div className="mb-1 sm:mb-2">Used: {Array.from(gameState.usedLetters).join(', ')}</div>
              <div className="text-gray-400">Vowels cost $250</div>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 sm:p-6">
            <h3 className="text-sm sm:text-xl font-bold mb-2 sm:mb-4">Solve Puzzle</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={solveAttempt}
                onChange={(e) => setSolveAttempt(e.target.value)}
                disabled={gameState.currentPlayer !== 0}
                className="flex-1 px-2 py-2 sm:px-4 bg-gray-700 border border-gray-600 rounded text-white text-sm sm:text-base disabled:bg-gray-800 disabled:text-gray-500"
                placeholder={gameState.currentPlayer === 0 ? "Your answer..." : "Wait..."}
              />
              <button
                onClick={solvePuzzle}
                disabled={gameState.currentPlayer !== 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-2 sm:px-6 rounded font-semibold transition-colors text-sm sm:text-base"
              >
                Solve
              </button>
            </div>
            <button
              onClick={startNewPuzzle}
              className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded font-semibold transition-colors text-sm sm:text-base"
            >
              NEW PUZZLE
            </button>
          </div>
        </div>

        {/* Message Display */}
        <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 sm:p-4 text-center mb-4">
          <div className="text-sm sm:text-lg font-semibold text-yellow-100">
            {gameState.message}
          </div>
          {gameState.wheelValue && (
            <div className="text-xs sm:text-sm text-yellow-200 mt-2">
              {typeof gameState.wheelValue === 'number' 
                ? `Current wheel value: $${gameState.wheelValue}`
                : typeof gameState.wheelValue === 'object' && 'displayValue' in gameState.wheelValue
                  ? `Special: ${(gameState.wheelValue as WheelSegment).displayValue}`
                  : `Special: ${String(gameState.wheelValue)}`}
            </div>
          )}
          
          {/* Show your current prizes */}
          {gameState.players[0].prizes.length > 0 && (
            <div className="mt-2 text-xs sm:text-sm text-green-200">
              <div className="font-semibold mb-1">Your Prizes:</div>
              {gameState.players[0].prizes.slice(-2).map((prize, index) => (
                <div key={index} className="truncate">
                  🏆 {prize.name} (${prize.value.toLocaleString()})
                </div>
              ))}
              {gameState.players[0].prizes.length > 2 && (
                <div>...and {gameState.players[0].prizes.length - 2} more!</div>
              )}
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="text-center text-xs sm:text-sm text-gray-400">
          <p>Puzzles completed: {usedPuzzles.size} • Fresh puzzles remaining: {availablePuzzles.length}</p>
          <p className="mt-1">
            <strong>🎯 Always Fresh Content:</strong> 500+ unique puzzles • No repeats • Auto-reset when needed
          </p>
          <p className="mt-1 sm:mt-2">
            <strong>Version 12:</strong> Persistent progress • Expanded puzzle database • Always fresh content
          </p>
          {usedPuzzles.size > 0 && (
            <button
              onClick={() => {
                if (confirm('Reset all progress and start fresh? This will clear all completed puzzles.')) {
                  setUsedPuzzles(new Set());
                  localStorage.removeItem('jenswheelpractice-used-puzzles');
                }
              }}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              Reset Progress
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WheelOfFortune; 
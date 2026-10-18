// 1. A simple, fast seeded pseudo-random number generator (Mulberry32)
const createRandom = (seedString: string) => {
  // Turn the string seed into a 32-bit integer hash
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }

  // Return a function that behaves like Math.random(), but uses the seed
  return () => {
    let t = hash += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// 2. The Playful Key Generator
export const generateSeededKey = (seedInput: string | number, prefix = "buddy") => {
  const quirks = ["happy", "bouncy", "cozy", "funky", "chilly", "zippy", "silly"];
  const animals = ["panda", "koala", "penguin", "otter", "sloth", "corgi", "fox"];

  // Initialize our seeded random function using the unique input (e.g., item ID or index)
  const seededRandom = createRandom(String(seedInput));

  const randomQuirk = quirks[Math.floor(seededRandom() * quirks.length)];
  const randomAnimal = animals[Math.floor(seededRandom() * animals.length)];
  
  // A short base-36 suffix (up to 4 characters) derived from the seed
  const predictableId = Math.floor(seededRandom() * 100000).toString(36).padStart(4, '0');
  return `${prefix}-${randomQuirk}-${randomAnimal}-${predictableId}`;
};

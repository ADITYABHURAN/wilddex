export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Species = {
  id: string;
  commonName: string;
  scientificName: string;
  rarity: Rarity;
  baseXp: number;
  biome: string;
};

export const RARITY_BASE_XP: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 400,
};

export const SPECIES: Species[] = [
  { id: 'house-sparrow', commonName: 'House Sparrow', scientificName: 'Passer domesticus', rarity: 'common', baseXp: RARITY_BASE_XP.common, biome: 'urban' },
  { id: 'rock-pigeon', commonName: 'Rock Pigeon', scientificName: 'Columba livia', rarity: 'common', baseXp: RARITY_BASE_XP.common, biome: 'urban' },
  { id: 'gray-squirrel', commonName: 'Eastern Gray Squirrel', scientificName: 'Sciurus carolinensis', rarity: 'common', baseXp: RARITY_BASE_XP.common, biome: 'forest' },
  { id: 'mallard-duck', commonName: 'Mallard Duck', scientificName: 'Anas platyrhynchos', rarity: 'common', baseXp: RARITY_BASE_XP.common, biome: 'freshwater' },
  { id: 'american-robin', commonName: 'American Robin', scientificName: 'Turdus migratorius', rarity: 'common', baseXp: RARITY_BASE_XP.common, biome: 'forest' },
  { id: 'raccoon', commonName: 'Raccoon', scientificName: 'Procyon lotor', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'urban' },
  { id: 'red-fox', commonName: 'Red Fox', scientificName: 'Vulpes vulpes', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'forest' },
  { id: 'painted-turtle', commonName: 'Painted Turtle', scientificName: 'Chrysemys picta', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'freshwater' },
  { id: 'monarch-butterfly', commonName: 'Monarch Butterfly', scientificName: 'Danaus plexippus', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'grassland' },
  { id: 'great-blue-heron', commonName: 'Great Blue Heron', scientificName: 'Ardea herodias', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'freshwater' },
  { id: 'eastern-cottontail', commonName: 'Eastern Cottontail', scientificName: 'Sylvilagus floridanus', rarity: 'uncommon', baseXp: RARITY_BASE_XP.uncommon, biome: 'grassland' },
  { id: 'red-tailed-hawk', commonName: 'Red-tailed Hawk', scientificName: 'Buteo jamaicensis', rarity: 'rare', baseXp: RARITY_BASE_XP.rare, biome: 'grassland' },
  { id: 'river-otter', commonName: 'North American River Otter', scientificName: 'Lontra canadensis', rarity: 'rare', baseXp: RARITY_BASE_XP.rare, biome: 'freshwater' },
  { id: 'coyote', commonName: 'Coyote', scientificName: 'Canis latrans', rarity: 'rare', baseXp: RARITY_BASE_XP.rare, biome: 'grassland' },
  { id: 'snowy-owl', commonName: 'Snowy Owl', scientificName: 'Bubo scandiacus', rarity: 'epic', baseXp: RARITY_BASE_XP.epic, biome: 'tundra' },
  { id: 'bobcat', commonName: 'Bobcat', scientificName: 'Lynx rufus', rarity: 'epic', baseXp: RARITY_BASE_XP.epic, biome: 'forest' },
  { id: 'bald-eagle', commonName: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus', rarity: 'legendary', baseXp: RARITY_BASE_XP.legendary, biome: 'freshwater' },
  { id: 'gray-wolf', commonName: 'Gray Wolf', scientificName: 'Canis lupus', rarity: 'legendary', baseXp: RARITY_BASE_XP.legendary, biome: 'forest' },
];

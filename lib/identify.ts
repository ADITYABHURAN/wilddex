import { SPECIES, Species } from '../data/species';

export type CatchResult = {
  species: Species;
  confidence: number;
  xpEarned: number;
};

// MOCK IMPLEMENTATION — replace with real vision API call.
// Input/output shape must stay identical when swapped for a real provider.
export async function identifyAnimal(photoUri: string): Promise<CatchResult> {
  const delayMs = 1000 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
  const confidence = 0.7 + Math.random() * 0.29;

  return {
    species,
    confidence,
    xpEarned: species.baseXp,
  };
}

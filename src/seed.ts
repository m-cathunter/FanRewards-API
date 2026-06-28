import 'reflect-metadata';
import { dataSource } from './plugins/db';
import { Challenge, ChallengeDifficulty } from './entities/Challenge';
import { Reward } from './entities/Reward';

const SEED_CHALLENGES: Array<{
  title: string;
  artist: string;
  description: string;
  points: number;
  durationSeconds: number;
  difficulty: ChallengeDifficulty;
}> = [
  {
    title: 'All Night',
    artist: 'Camo & Krooked',
    description: 'Listen to this drum & bass classic to earn points',
    points: 150,
    durationSeconds: 219,
    difficulty: 'easy',
  },
  {
    title: 'New Forms',
    artist: 'Roni Size',
    description: 'Complete this legendary track for bonus points',
    points: 300,
    durationSeconds: 464,
    difficulty: 'medium',
  },
  {
    title: 'Extended Session',
    artist: 'Camo & Krooked',
    description: 'A longer listening challenge for dedicated fans',
    points: 500,
    durationSeconds: 600,
    difficulty: 'hard',
  },
];

const SEED_REWARDS: Array<{ name: string; description: string; pointsCost: number }> = [
  {
    name: 'Early Access Pass',
    description: 'Get early access to new features',
    pointsCost: 200,
  },
  {
    name: 'Exclusive Playlist',
    description: 'Unlock a curated artist playlist',
    pointsCost: 500,
  },
  {
    name: 'VIP Fan Badge',
    description: 'Show off your dedication with a VIP badge',
    pointsCost: 1000,
  },
  {
    name: 'Concert Ticket Raffle',
    description: 'Enter a raffle for concert tickets',
    pointsCost: 2500,
  },
];

/**
 * Seed reference data. Idempotent: each row is keyed by a natural identifier
 * (challenge title+artist, reward name) and skipped if it already exists, so
 * running the script repeatedly never creates duplicates.
 */
async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    const challenges = dataSource.getRepository(Challenge);
    let challengesAdded = 0;
    for (const data of SEED_CHALLENGES) {
      const exists = await challenges.countBy({ title: data.title, artist: data.artist });
      if (exists === 0) {
        await challenges.save(challenges.create(data));
        challengesAdded += 1;
      }
    }

    const rewards = dataSource.getRepository(Reward);
    let rewardsAdded = 0;
    for (const data of SEED_REWARDS) {
      const exists = await rewards.countBy({ name: data.name });
      if (exists === 0) {
        await rewards.save(rewards.create(data));
        rewardsAdded += 1;
      }
    }

    console.log(
      `Seed complete: added ${challengesAdded} challenge(s) and ${rewardsAdded} reward(s).`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

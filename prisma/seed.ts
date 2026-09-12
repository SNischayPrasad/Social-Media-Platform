/**
 * Seeds a small but realistic square: eight people, a few dozen posts spread
 * over the past fortnight, plus the likes, replies and follows between them.
 *
 * Safe to re-run — it clears the tables it owns first.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "commons123";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** `hoursAgo(30)` → a Date 30 hours before now. */
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR);

const people = [
  {
    username: "ada",
    email: "ada@commons.dev",
    displayName: "Ada Okafor",
    bio: "Compiler engineer. Collects typefaces and broken keyboards.",
    avatarUrl: "https://picsum.photos/seed/ada-commons/200/200",
  },
  {
    username: "mira",
    email: "mira@commons.dev",
    displayName: "Mira Lindqvist",
    bio: "Field recordist. Currently mapping the sound of every bridge in the city.",
    avatarUrl: "https://picsum.photos/seed/mira-commons/200/200",
  },
  {
    username: "tomasz",
    email: "tomasz@commons.dev",
    displayName: "Tomasz Bąk",
    bio: "Bread, mostly. Sourdough starter named Geoff, est. 2019.",
    avatarUrl: null,
  },
  {
    username: "rey",
    email: "rey@commons.dev",
    displayName: "Rey Villanueva",
    bio: "Bike mechanic by day. Astrophotographer whenever the sky cooperates.",
    avatarUrl: "https://picsum.photos/seed/rey-commons/200/200",
  },
  {
    username: "nadia",
    email: "nadia@commons.dev",
    displayName: "Nadia Haddad",
    bio: "Archivist. I find things people meant to throw away.",
    avatarUrl: null,
  },
  {
    username: "juno",
    email: "juno@commons.dev",
    displayName: "Juno Park",
    bio: "Ceramics, badly. Improving slowly, publicly.",
    avatarUrl: "https://picsum.photos/seed/juno-commons/200/200",
  },
  {
    username: "felix",
    email: "felix@commons.dev",
    displayName: "Felix Moreau",
    bio: "Runs a two-table bookshop. Recommends things nobody asked about.",
    avatarUrl: null,
  },
  {
    username: "sana",
    email: "sana@commons.dev",
    displayName: "Sana Iqbal",
    bio: "Urban ecologist. Yes, that weed on your balcony is interesting.",
    avatarUrl: "https://picsum.photos/seed/sana-commons/200/200",
  },
];

type SeedPost = {
  author: string;
  content: string;
  hoursAgo: number;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
};

const posts: SeedPost[] = [
  {
    author: "sana",
    content:
      "Counted eleven species of moss on one retaining wall this morning. The city is doing a lot of ecology it never agreed to.",
    hoursAgo: 1,
    mediaUrl: "https://picsum.photos/seed/moss-wall/1000/650",
  },
  {
    author: "tomasz",
    content:
      "Geoff doubled in four hours today. Four! I have never been so proud of a jar.",
    hoursAgo: 2,
  },
  {
    author: "rey",
    content:
      "Clear sky at 2am, so: Andromeda, 40 stacked exposures, shot from a car park behind a supermarket. Astronomy is deeply unglamorous.",
    hoursAgo: 4,
    mediaUrl: "https://picsum.photos/seed/andromeda-night/1000/700",
  },
  {
    author: "ada",
    content:
      "Spent the day deleting a feature I wrote in March. Best commit of the quarter.",
    hoursAgo: 6,
  },
  {
    author: "nadia",
    content:
      "Found a 1974 staff newsletter in a box labelled MISC. Someone had drawn the entire office as birds. No names, no explanation.",
    hoursAgo: 9,
    mediaUrl: "https://picsum.photos/seed/archive-box/1000/620",
  },
  {
    author: "mira",
    content:
      "Bridge #14. Recorded at 5:40am, before traffic. You can hear the expansion joints tick as the metal warms up.",
    hoursAgo: 12,
  },
  {
    author: "felix",
    content:
      "A customer asked for \"something like the last one but less sad.\" I have never had a clearer brief in my life.",
    hoursAgo: 16,
  },
  {
    author: "juno",
    content:
      "Fourth attempt at a straight-sided cup. It leans. I am choosing to call it a design language.",
    hoursAgo: 20,
    mediaUrl: "https://picsum.photos/seed/leaning-cup/900/900",
  },
  {
    author: "ada",
    content:
      "Unpopular opinion: most performance work is just deleting things you added last year.",
    hoursAgo: 26,
  },
  {
    author: "sana",
    content:
      "Reminder that the strip of grass between the pavement and the road is a whole habitat and mowing it in May undoes nine months of work.",
    hoursAgo: 30,
  },
  {
    author: "rey",
    content:
      "Fixed 22 punctures this week. Twenty of them were the same brand of tyre. I'm not naming it. You know the one.",
    hoursAgo: 34,
  },
  {
    author: "nadia",
    content:
      "The best-preserved documents I handle are always the ones nobody thought were important. Receipts outlive manifestos.",
    hoursAgo: 40,
  },
  {
    author: "mira",
    content:
      "Someone asked what I do with all these recordings. Honestly? Mostly listen to them on the bus and feel calm about infrastructure.",
    hoursAgo: 46,
    mediaUrl: "https://picsum.photos/seed/river-bridge/1000/640",
  },
  {
    author: "tomasz",
    content:
      "Hydration above 80% and I stop being a baker and start being a person holding soup.",
    hoursAgo: 52,
  },
  {
    author: "felix",
    content:
      "Two tables, four hundred books, one chair. If you sit in the chair you have to talk to me. That's the whole business model.",
    hoursAgo: 58,
    mediaUrl: "https://picsum.photos/seed/tiny-bookshop/1000/660",
  },
  {
    author: "juno",
    content:
      "Glaze notes, week 6: the kiln is a liar and I love it.",
    hoursAgo: 64,
  },
  {
    author: "ada",
    content:
      "Reading old code you wrote is the only honest performance review.",
    hoursAgo: 71,
  },
  {
    author: "sana",
    content:
      "Peregrine on the telecoms mast again. Third morning running. Pigeons have noticed and rerouted the entire square.",
    hoursAgo: 80,
    mediaUrl: "https://picsum.photos/seed/mast-falcon/1000/700",
  },
  {
    author: "nadia",
    content:
      "Digitised 300 photographs today and only one had a caption. It said \"do not use.\" So obviously that's the one I want to know about.",
    hoursAgo: 92,
  },
  {
    author: "rey",
    content:
      "Bike advice nobody asks for: your chain isn't worn, your chain is dry. Ten seconds of oil beats a new drivetrain.",
    hoursAgo: 104,
  },
  {
    author: "mira",
    content:
      "Fourteen bridges in, and the one that sounds best is a footbridge over a dual carriageway that nobody would call beautiful.",
    hoursAgo: 120,
  },
  {
    author: "felix",
    content:
      "Shelved the poetry next to the cookbooks by accident. Sold four books of poetry that afternoon. Considering making it permanent.",
    hoursAgo: 140,
  },
  {
    author: "juno",
    content:
      "The wobble is gone. Seven attempts. I would like this entered into the public record.",
    hoursAgo: 160,
    mediaUrl: "https://picsum.photos/seed/straight-cup/900/880",
  },
  {
    author: "tomasz",
    content:
      "Started this account to post about bread and have posted exclusively about a jar. No regrets.",
    hoursAgo: 190,
  },
];

/** Replies, keyed by the post's position in the list above. */
const replies: { postIndex: number; author: string; body: string; minutesAfter: number }[] = [
  { postIndex: 0, author: "nadia", body: "Eleven! Do you key them out in the field or photograph and check later?", minutesAfter: 25 },
  { postIndex: 0, author: "juno", body: "This is the exact green I've been failing to glaze for a month.", minutesAfter: 70 },
  { postIndex: 1, author: "ada", body: "Geoff is outperforming most of my services.", minutesAfter: 15 },
  { postIndex: 1, author: "felix", body: "Put Geoff on the payroll.", minutesAfter: 44 },
  { postIndex: 2, author: "mira", body: "A supermarket car park is a surprisingly good acoustic space too. Flat, empty, no trees.", minutesAfter: 55 },
  { postIndex: 2, author: "sana", body: "Forty exposures for this is absurd and I respect it enormously.", minutesAfter: 130 },
  { postIndex: 3, author: "tomasz", body: "The bread equivalent is throwing out a starter you've been guilty about for six months.", minutesAfter: 38 },
  { postIndex: 4, author: "felix", body: "Someone in that office was having the time of their life.", minutesAfter: 90 },
  { postIndex: 4, author: "juno", body: "Please tell me the birds are captioned.", minutesAfter: 150 },
  { postIndex: 5, author: "rey", body: "5:40am is the only honest hour for recording anything.", minutesAfter: 60 },
  { postIndex: 7, author: "ada", body: "Shipping the lean is a legitimate strategy.", minutesAfter: 35 },
  { postIndex: 7, author: "nadia", body: "Archive it before you fix it. Version four is the interesting one.", minutesAfter: 110 },
  { postIndex: 9, author: "rey", body: "Our council mows it three times in May specifically. I've written letters.", minutesAfter: 95 },
  { postIndex: 11, author: "ada", body: "This is the most true thing on here.", minutesAfter: 200 },
  { postIndex: 14, author: "sana", body: "I would like to sit in the chair.", minutesAfter: 120 },
  { postIndex: 14, author: "mira", body: "Does the chair come with a recommendation or is that extra", minutesAfter: 240 },
  { postIndex: 17, author: "mira", body: "You can hear it too, if you stand under the mast. The pigeons go completely silent.", minutesAfter: 180 },
  { postIndex: 22, author: "tomasz", body: "Entered. Witnessed. Congratulations.", minutesAfter: 75 },
];

/** Who follows whom. */
const follows: [string, string][] = [
  ["ada", "mira"], ["ada", "nadia"], ["ada", "tomasz"],
  ["mira", "ada"], ["mira", "rey"], ["mira", "sana"], ["mira", "felix"],
  ["tomasz", "ada"], ["tomasz", "juno"], ["tomasz", "felix"],
  ["rey", "sana"], ["rey", "mira"], ["rey", "ada"],
  ["nadia", "felix"], ["nadia", "ada"], ["nadia", "juno"], ["nadia", "sana"],
  ["juno", "tomasz"], ["juno", "nadia"], ["juno", "sana"],
  ["felix", "nadia"], ["felix", "mira"], ["felix", "juno"],
  ["sana", "rey"], ["sana", "mira"], ["sana", "nadia"], ["sana", "ada"],
];

/** Deterministic pseudo-random so re-seeding produces the same square. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log(`Creating ${people.length} users…`);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIds = new Map<string, string>();

  for (const person of people) {
    const user = await prisma.user.create({
      data: { ...person, passwordHash },
      select: { id: true, username: true },
    });
    userIds.set(user.username, user.id);
  }

  console.log(`Creating ${posts.length} posts…`);
  const postIds: string[] = [];

  for (const post of posts) {
    const createdAt = hoursAgo(post.hoursAgo);
    const created = await prisma.post.create({
      data: {
        content: post.content,
        mediaUrl: post.mediaUrl ?? null,
        mediaType: post.mediaUrl ? (post.mediaType ?? "IMAGE") : null,
        authorId: userIds.get(post.author)!,
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });
    postIds.push(created.id);
  }

  console.log(`Creating ${replies.length} comments…`);
  for (const reply of replies) {
    await prisma.comment.create({
      data: {
        body: reply.body,
        postId: postIds[reply.postIndex],
        userId: userIds.get(reply.author)!,
        createdAt: new Date(
          hoursAgo(posts[reply.postIndex].hoursAgo).getTime() + reply.minutesAfter * MINUTE,
        ),
      },
    });
  }

  console.log("Creating likes…");
  const random = makeRandom(20260912);
  const usernames = people.map((p) => p.username);
  let likeCount = 0;

  for (const [index, postId] of postIds.entries()) {
    const author = posts[index].author;
    for (const username of usernames) {
      // Nobody likes their own post; newer posts attract slightly fewer likes
      // because they've had less time to be seen.
      if (username === author) continue;
      const reach = 0.35 + 0.35 * (index / postIds.length);
      if (random() > reach) continue;

      await prisma.like.create({
        data: { postId, userId: userIds.get(username)! },
      });
      likeCount++;
    }
  }

  console.log(`Creating ${follows.length} follows…`);
  for (const [follower, following] of follows) {
    await prisma.follow.create({
      data: {
        followerId: userIds.get(follower)!,
        followingId: userIds.get(following)!,
      },
    });
  }

  console.log("\nDone.");
  console.log(`  ${people.length} users, ${posts.length} posts, ${replies.length} comments, ${likeCount} likes, ${follows.length} follows`);
  console.log(`\n  Sign in with any username above and the password: ${DEMO_PASSWORD}`);
  console.log("  e.g. ada / commons123\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories
  const categories = [
    {
      name: 'Actors & Actresses',
      description: 'Famous actors and actresses from movies and TV shows',
      imageUrl: 'https://example.com/actors.jpg',
    },
    {
      name: 'Sports Players',
      description: 'Professional athletes from various sports',
      imageUrl: 'https://example.com/sports.jpg',
    },
    {
      name: 'Singers & Musicians',
      description: 'Famous singers, musicians, and music artists',
      imageUrl: 'https://example.com/music.jpg',
    },
    {
      name: 'Celebrities & Stars',
      description: 'Famous celebrities and public figures',
      imageUrl: 'https://example.com/celebrities.jpg',
    },
    {
      name: 'Entrepreneurs',
      description: 'Successful business leaders and entrepreneurs',
      imageUrl: 'https://example.com/business.jpg',
    },
    {
      name: 'YouTubers & Influencers',
      description: 'Famous YouTubers and social media influencers',
      imageUrl: 'https://example.com/youtube.jpg',
    },
  ];

  console.log('📂 Creating categories...');
  const createdCategories: Prisma.CategoryCreateInput[] = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    createdCategories.push(created);
    console.log(`✅ Created category: ${created.name}`);
  }

  // Create sample cards for each category
  const sampleCards = [
    // Actors & Actresses
    {
      name: 'Leonardo DiCaprio',
      description: 'Academy Award-winning American actor',
      hints: [
        'Born in 1974',
        'Starred in Titanic',
        'Won Oscar for The Revenant',
        'Environmental activist',
        'Worked with Christopher Nolan',
      ],
      difficulty: 2,
      categoryName: 'Actors & Actresses',
    },
    {
      name: 'Meryl Streep',
      description: 'Legendary American actress with multiple Academy Awards',
      hints: [
        'Has won 3 Academy Awards',
        'Known for The Devil Wears Prada',
        'Born in 1949',
        'Considered one of the greatest actresses',
        'Has 21 Oscar nominations',
      ],
      difficulty: 3,
      categoryName: 'Actors & Actresses',
    },
    // Sports Players
    {
      name: 'Cristiano Ronaldo',
      description: 'Portuguese professional footballer',
      hints: [
        'Portuguese footballer',
        'Plays for Al Nassr',
        'Has won 5 Ballon d\'Or awards',
        'Known as CR7',
        'One of the greatest footballers ever',
      ],
      difficulty: 1,
      categoryName: 'Sports Players',
    },
    {
      name: 'Serena Williams',
      description: 'American professional tennis player',
      hints: [
        'American tennis player',
        'Won 23 Grand Slam singles titles',
        'Sister of Venus Williams',
        'Dominated women\'s tennis',
        'Known for powerful serves',
      ],
      difficulty: 2,
      categoryName: 'Sports Players',
    },
    // Singers & Musicians
    {
      name: 'Taylor Swift',
      description: 'American singer-songwriter',
      hints: [
        'American pop/country singer',
        'Born in 1989',
        'Known for Shake It Off',
        'Has won multiple Grammy Awards',
        'Famous for writing songs about relationships',
      ],
      difficulty: 1,
      categoryName: 'Singers & Musicians',
    },
    {
      name: 'Michael Jackson',
      description: 'King of Pop',
      hints: [
        'Known as the King of Pop',
        'Famous for Thriller album',
        'Known for moonwalk dance',
        'Died in 2009',
        'Started career with Jackson 5',
      ],
      difficulty: 1,
      categoryName: 'Singers & Musicians',
    },
    // Celebrities & Stars
    {
      name: 'Oprah Winfrey',
      description: 'American media executive and talk show host',
      hints: [
        'Famous talk show host',
        'Media mogul and philanthropist',
        'Had a show called "The Oprah Winfrey Show"',
        'Known for book club',
        'One of the most influential women',
      ],
      difficulty: 2,
      categoryName: 'Celebrities & Stars',
    },
    // Entrepreneurs
    {
      name: 'Elon Musk',
      description: 'Entrepreneur and business magnate',
      hints: [
        'CEO of Tesla',
        'Founder of SpaceX',
        'Owns Twitter (X)',
        'Born in South Africa',
        'Richest person in the world',
      ],
      difficulty: 1,
      categoryName: 'Entrepreneurs',
    },
    {
      name: 'Bill Gates',
      description: 'Co-founder of Microsoft',
      hints: [
        'Co-founder of Microsoft',
        'Philanthropist',
        'Was the richest person for many years',
        'Created Windows operating system',
        'Born in 1955',
      ],
      difficulty: 2,
      categoryName: 'Entrepreneurs',
    },
    // YouTubers & Influencers
    {
      name: 'MrBeast',
      description: 'Popular YouTuber known for expensive stunts',
      hints: [
        'Popular YouTuber',
        'Known for expensive giveaways',
        'Real name is Jimmy Donaldson',
        'Has over 100 million subscribers',
        'Known for philanthropy videos',
      ],
      difficulty: 2,
      categoryName: 'YouTubers & Influencers',
    },
  ];

  console.log('🃏 Creating sample cards...');
  for (const cardData of sampleCards) {
    const category = createdCategories.find(c => c.name === cardData.categoryName);
    if (category && category.id) {
      const { categoryName, ...card } = cardData;
      const existingCard = await prisma.card.findFirst({
        where: { name: card.name },
      });
      
      if (!existingCard) {
        await prisma.card.create({
          data: {
            name: card.name,
            description: card.description,
            hints: card.hints,
            difficulty: card.difficulty,
            categoryId: category.id,
          },
        });
      }
      console.log(`✅ Created card: ${card.name}`);
    }
  }

  // Create a demo user
  console.log('👤 Creating demo user...');
  const hashedPassword = await bcrypt.hash('demo123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@whoami.com' },
    update: {},
    create: {
      email: 'demo@whoami.com',
      username: 'demo_player',
      password: hashedPassword,
      avatar: 'https://example.com/demo-avatar.jpg',
    },
  });
  console.log('✅ Created demo user: demo@whoami.com (password: demo123)');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

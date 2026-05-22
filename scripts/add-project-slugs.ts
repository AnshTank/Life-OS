import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-');     // Replace multiple - with single -
}

async function main() {
  const projects = await prisma.project.findMany({
    where: { slug: null }
  });

  console.log(`Found ${projects.length} projects without slugs.`);

  for (const project of projects) {
    let slug = slugify(project.title);
    
    // Check if slug already exists
    const existing = await prisma.project.findFirst({
      where: { slug, id: { not: project.id } }
    });

    if (existing) {
      // Append random string to ensure uniqueness
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { slug }
    });
    console.log(`Updated project "${project.title}" with slug "${slug}"`);
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

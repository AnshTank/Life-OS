import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slugify = (text: string) => {
  return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};

async function main() {
  console.log('Starting slug migration for existing projects...');

  const projects = await prisma.project.findMany();

  const projectsWithoutSlugs = projects.filter(p => !p.slug);
  console.log(`Found ${projectsWithoutSlugs.length} projects without slugs.`);

  for (const project of projectsWithoutSlugs) {
    const slug = slugify(project.title) + '-' + Math.random().toString(36).substring(2, 7);
    await prisma.project.update({
      where: { id: project.id },
      data: { slug }
    });
    console.log(`Updated project: "${project.title}" -> ${slug}`);
  }

  console.log('Slug migration completed.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

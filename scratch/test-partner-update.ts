import { prisma } from '../lib/prisma';

async function testUpdate() {
  try {
    console.log("Searching for a partner to test...");
    const partner = await prisma.partner.findFirst();
    if (!partner) {
      console.log("No partners found in the database. Please add one first.");
      return;
    }
    console.log("Found partner:", partner.id, partner.name);
    
    console.log("Attempting to update partner...");
    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: {
        name: partner.name + " (Updated)",
        description: "Test update description",
      }
    });
    console.log("Update successful! New name:", updated.name);
  } catch (error) {
    console.error("Update failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();

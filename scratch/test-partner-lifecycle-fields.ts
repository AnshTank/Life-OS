import { prisma } from '../lib/prisma';

async function testFields() {
  try {
    console.log("Creating a partner...");
    const partner = await prisma.partner.create({
      data: {
        userId: "user-1",
        name: "Field Test Partner",
      }
    });
    console.log("Partner created ID:", partner.id);

    // The fields from newPartner state
    const updates = {
      name: 'Updated Field Test Partner',
      email: 'test@email.com',
      phone: '+123456789',
      website: 'https://example.com',
      company: 'Test Company',
      role: 'CEO',
      address: '123 Test St',
      description: 'Test Description',
      partnerType: 'strategic',
      status: 'active',
      priority: 'medium',
      tags: ['tag1', 'tag2']
    };

    console.log("Updating partner with all fields...");
    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: updates
    });
    console.log("Partner updated successfully! ID:", updated.id);

    console.log("Deleting partner...");
    await prisma.partner.delete({
      where: { id: partner.id }
    });
    console.log("Lifecycle test with all fields succeeded!");
  } catch (error) {
    console.error("Lifecycle test with fields FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFields();

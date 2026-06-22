import { prisma } from '../lib/prisma';

async function testLifecycle() {
  try {
    console.log("1. Creating a new test partner...");
    const partner = await prisma.partner.create({
      data: {
        userId: "user-1",
        name: "Test Partner Lifecycle",
        email: "test@partner.com",
        partnerType: "strategic",
        status: "active",
        priority: "medium",
        tags: ["test", "lifecycle"]
      }
    });
    console.log("Partner created successfully. ID:", partner.id);

    console.log("2. Updating the partner...");
    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: {
        name: "Test Partner Lifecycle Updated",
        description: "Successfully updated",
        tags: ["test", "lifecycle", "updated"]
      }
    });
    console.log("Partner updated successfully. New name:", updated.name);

    console.log("3. Deleting the partner...");
    await prisma.partner.delete({
      where: { id: partner.id }
    });
    console.log("Partner deleted successfully.");
    console.log("Lifecycle test completed with SUCCESS!");
  } catch (error) {
    console.error("Lifecycle test FAILED with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLifecycle();

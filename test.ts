import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const url = "mongodb+srv://jiyavisariya9:1234%402005@cluster0.1aynwxo.mongodb.net/life-os?appName=Cluster0";
console.log("Connecting to:", url);

async function main() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log("Connected successfully!");
    const db = client.db('life-os');
    const userCollection = db.collection('User');
    
    // Clear any existing (should be empty anyway)
    await userCollection.deleteMany({});
    
    const usersToInsert = [
      {
        name: "Jiya Visariya",
        email: "jiyavisariya@gmail.com",
        password: "abc@123",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Ansh Tank",
        email: "anshtank9@gmail.com",
        password: "abc@123",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await userCollection.insertMany(usersToInsert);
    console.log("USERS INSERTED SUCCESSFULLY:", result);
    
    const users = await userCollection.find({}).toArray();
    console.log("VERIFIED USERS IN DB:", users);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await client.close();
  }
}

main();

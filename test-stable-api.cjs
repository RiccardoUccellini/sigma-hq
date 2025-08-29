const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔄 Connecting with Stable API...');
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Test with sigma-hq database
    const db = client.db("sigma-hq");
    const collections = await db.listCollections().toArray();
    console.log('📄 Collections found:', collections.map(c => c.name));
    
    // Count users
    try {
      const userCount = await db.collection('users').countDocuments();
      console.log('👥 Users in database:', userCount);
    } catch (e) {
      console.log('ℹ️  Users collection not found or empty');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);

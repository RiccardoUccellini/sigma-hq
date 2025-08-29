const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.jwdseqd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with Stable API
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function testNewCluster() {
  try {
    console.log('🔄 Testing NEW MongoDB cluster...');
    
    // Connect to the server
    await client.connect();
    
    // Send a ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ NEW CLUSTER: Successfully connected to MongoDB!");
    
    // Test sigma-hq database
    const db = client.db("sigma-hq");
    
    // Create a test collection and document
    console.log('📝 Creating test data...');
    await db.collection('users').insertOne({
      email: 'admin@sigma-hq.com',
      password: 'admin123',
      createdAt: new Date()
    });
    
    await db.collection('users').insertOne({
      email: 'riccardo.uccellini@sigmadigitalagency.it',
      password: 'RiccardoSigma123',
      createdAt: new Date()
    });
    
    // Test query
    const users = await db.collection('users').find({}).toArray();
    console.log('👥 Users created:', users.length);
    
    console.log('🎉 NEW CLUSTER IS WORKING PERFECTLY!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testNewCluster();

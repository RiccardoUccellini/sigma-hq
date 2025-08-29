import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/sigma-hq?retryWrites=true&w=majority&tlsInsecure=true';

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const client = await MongoClient.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      tlsInsecure: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('sigma-hq');
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log('📄 Users found:', users.length);
    
    const clients = await db.collection('clients').find({}).limit(5).toArray();
    console.log('🏢 Clients found:', clients.length);
    
    const recordings = await db.collection('recordingDays').find({}).limit(5).toArray();
    console.log('📹 Recordings found:', recordings.length);
    
    await client.close();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();

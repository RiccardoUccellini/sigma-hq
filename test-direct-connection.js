import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/sigma-hq?retryWrites=true&w=majority';

async function testDirectConnection() {
  console.log('🔄 Testing direct MongoDB connection...');
  console.log('URI:', uri.replace(/:[^@]*@/, ':***@'));
  
  try {
    console.log('Attempting connection...');
    const client = await MongoClient.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ Connected! Testing database...');
    
    const db = client.db('sigma-hq');
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📄 Collections found:', collections.map(c => c.name));
    
    // Count documents in users collection
    const userCount = await db.collection('users').countDocuments();
    console.log('👥 Users in database:', userCount);
    
    await client.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Direct connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testDirectConnection();

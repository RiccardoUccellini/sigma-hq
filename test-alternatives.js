import { MongoClient } from 'mongodb';

const alternativeUris = [
  // Versione 1: Con SSL disabilitato (solo per test locale)
  'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/sigma-hq?ssl=false',
  
  // Versione 2: Con parametri SSL alternativi  
  'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/sigma-hq?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true',
  
  // Versione 3: Solo parametri base
  'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/?retryWrites=true&w=majority'
];

async function testAlternativeConnections() {
  for (let i = 0; i < alternativeUris.length; i++) {
    const uri = alternativeUris[i];
    console.log(`\n🔄 Testing alternative URI ${i + 1}...`);
    
    try {
      const client = await MongoClient.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
      });
      
      console.log(`✅ Alternative ${i + 1} SUCCESS!`);
      
      const db = client.db('sigma-hq');
      const collections = await db.listCollections().toArray();
      console.log('📄 Collections:', collections.map(c => c.name));
      
      await client.close();
      
      console.log(`🎉 WORKING URI: ${uri.replace(/:[^@]*@/, ':***@')}`);
      break;
      
    } catch (error) {
      console.log(`❌ Alternative ${i + 1} failed:`, error.message.substring(0, 100));
    }
  }
}

testAlternativeConnections();

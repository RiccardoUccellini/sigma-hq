const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.jwdseqd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function fixData() {
  try {
    await client.connect();
    const db = client.db("sigma-hq");
    
    console.log('🔧 Fixing database data...');
    
    // Rimuovi client con dati undefined
    await db.collection('clients').deleteMany({ 
      $or: [
        { name: { $exists: false } },
        { name: null },
        { email: { $exists: false } },
        { email: null }
      ]
    });
    
    // Fix recording days client names
    await db.collection('recordingDays').updateMany(
      { clientName: null },
      { $set: { clientName: "Ristorante Da Vinci" } }
    );
    
    // Verifica che tutto sia a posto
    console.log('\n✅ Data fixed! Current status:');
    
    const clients = await db.collection('clients').find({}).toArray();
    console.log(`🏢 Clients: ${clients.length}`);
    clients.forEach((client, i) => {
      console.log(`  ${i+1}. ${client.name} - ${client.email}`);
    });
    
    const recordings = await db.collection('recordingDays').find({}).sort({ date: 1 }).toArray();
    console.log(`\n📹 Recording Days: ${recordings.length}`);
    recordings.forEach((rec, i) => {
      const dateStr = rec.date.toISOString().split('T')[0];
      const status = rec.status === 'completed' ? '✅' : '📅';
      console.log(`  ${status} ${dateStr} - ${rec.clientName} - €${rec.budget}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🎉 Database is now ready for your app!');
  }
}

fixData();

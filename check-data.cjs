const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.jwdseqd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function checkData() {
  try {
    await client.connect();
    const db = client.db("sigma-hq");
    
    console.log('📊 Current database content:');
    
    // Conta documenti
    const userCount = await db.collection('users').countDocuments();
    const clientCount = await db.collection('clients').countDocuments();
    const recordingCount = await db.collection('recordingDays').countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Clients: ${clientCount}`);
    console.log(`📹 Recording Days: ${recordingCount}`);
    
    // Mostra clienti
    console.log('\n🏢 Clients:');
    const clients = await db.collection('clients').find({}).toArray();
    clients.forEach((client, i) => {
      console.log(`${i+1}. ${client.name} - ${client.email} - Budget: €${client.monthlyBudget}`);
    });
    
    // Mostra registrazioni
    console.log('\n📹 Recording Days:');
    const recordings = await db.collection('recordingDays').find({}).sort({ date: 1 }).toArray();
    recordings.forEach((rec, i) => {
      const dateStr = rec.date.toISOString().split('T')[0];
      console.log(`${i+1}. ${dateStr} - ${rec.clientName} - ${rec.status} - €${rec.budget}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkData();

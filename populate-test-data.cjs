const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.jwdseqd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function populateTestData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    const db = client.db("sigma-hq");
    
    console.log('🏢 Creating test clients...');
    
    // Clienti di test
    const clients = [
      {
        name: "Tech Solutions SRL",
        email: "info@techsolutions.it",
        phone: "+39 02 1234567",
        address: "Via Milano 15, 20100 Milano",
        contactPerson: "Marco Rossi",
        services: ["Video Marketing", "Social Media Management"],
        status: "active",
        monthlyBudget: 2500,
        startDate: new Date("2024-01-15"),
        createdAt: new Date()
      },
      {
        name: "Fashion Boutique Roma",
        email: "marketing@fashionroma.com",
        phone: "+39 06 9876543",
        address: "Via del Corso 45, 00186 Roma",
        contactPerson: "Giulia Bianchi",
        services: ["Content Creation", "Video Production"],
        status: "active",
        monthlyBudget: 1800,
        startDate: new Date("2024-03-20"),
        createdAt: new Date()
      },
      {
        name: "Ristorante Da Vinci",
        email: "chef@davinci-restaurant.it",
        phone: "+39 055 1122334",
        address: "Piazza Duomo 8, 50122 Firenze",
        contactPerson: "Antonio Da Vinci",
        services: ["Food Photography", "Social Media"],
        status: "active",
        monthlyBudget: 1200,
        startDate: new Date("2024-02-10"),
        createdAt: new Date()
      }
    ];
    
    const clientResult = await db.collection('clients').insertMany(clients);
    console.log(`✅ Created ${clientResult.insertedCount} clients`);
    
    // Recupera gli ID dei clienti per le registrazioni
    const insertedClients = await db.collection('clients').find({}).toArray();
    
    console.log('📹 Creating recording days...');
    
    // Registrazioni passate e future
    const recordingDays = [
      // PASSATE
      {
        date: new Date("2024-07-15"),
        startTime: "09:00",
        endTime: "17:00",
        clientId: insertedClients[0]._id.toString(),
        clientName: insertedClients[0].name,
        location: "Studio Milano - Via Brera 12",
        description: "Shooting prodotti tech e interviste CEO",
        type: "Commercial",
        crew: ["Camera Operator", "Audio Technician", "Director"],
        equipment: ["Sony FX6", "Wireless Mics", "LED Lights"],
        status: "completed",
        notes: "Ottima giornata, cliente molto soddisfatto",
        budget: 3500,
        createdAt: new Date("2024-07-10")
      },
      {
        date: new Date("2024-08-20"),
        startTime: "14:00",
        endTime: "19:00",
        clientId: insertedClients[1]._id.toString(),
        clientName: insertedClients[1].name,
        location: "Fashion Boutique Roma",
        description: "Shooting collezione autunno/inverno",
        type: "Fashion",
        crew: ["Photographer", "Stylist", "Makeup Artist"],
        equipment: ["Canon R5", "Studio Lights", "Reflectors"],
        status: "completed",
        notes: "Bellissime foto per la campagna social",
        budget: 2200,
        createdAt: new Date("2024-08-15")
      },
      {
        date: new Date("2024-08-25"),
        startTime: "11:00",
        endTime: "15:00",
        clientId: insertedClients[2]._id.toString(),
        clientName: insertedClients[2].name,
        location: "Ristorante Da Vinci, Firenze",
        description: "Food photography menu degustazione",
        type: "Food",
        crew: ["Food Photographer", "Food Stylist"],
        equipment: ["Nikon Z9", "Macro Lens", "Portable Lights"],
        status: "completed",
        notes: "Piatti fotografati magnificamente, chef entusiasta",
        budget: 1500,
        createdAt: new Date("2024-08-20")
      },
      
      // FUTURE
      {
        date: new Date("2024-09-15"),
        startTime: "10:00",
        endTime: "18:00",
        clientId: insertedClients[0]._id.toString(),
        clientName: insertedClients[0].name,
        location: "Tech Solutions Office + Esterno Milano",
        description: "Corporate video e testimonials dipendenti",
        type: "Corporate",
        crew: ["Director", "Camera Operator", "Audio Technician"],
        equipment: ["Sony FX6", "Gimbal", "Wireless Audio"],
        status: "scheduled",
        notes: "Preparare interviste e riprese b-roll",
        budget: 4200,
        createdAt: new Date()
      },
      {
        date: new Date("2024-09-28"),
        startTime: "09:00",
        endTime: "14:00",
        clientId: insertedClients[1]._id.toString(),
        clientName: insertedClients[1].name,
        location: "Location esterna Roma - Villa Borghese",
        description: "Shooting primavera 2025 preview",
        type: "Fashion",
        crew: ["Photographer", "Assistant", "Model"],
        equipment: ["Canon R5", "85mm f/1.4", "Reflectors"],
        status: "scheduled",
        notes: "Verificare permessi location e meteo",
        budget: 2800,
        createdAt: new Date()
      },
      {
        date: new Date("2024-10-10"),
        startTime: "16:00",
        endTime: "21:00",
        clientId: insertedClients[2]._id.toString(),
        clientName: insertedClients[2].name,
        location: "Ristorante Da Vinci",
        description: "Video promozionale cena degustazione",
        type: "Food",
        crew: ["Video Producer", "Chef Consultant"],
        equipment: ["Sony A7S III", "Slider", "Chef Cam"],
        status: "scheduled",
        notes: "Riprendere preparazione piatti e reazioni clienti",
        budget: 2000,
        createdAt: new Date()
      },
      {
        date: new Date("2024-10-25"),
        startTime: "08:00",
        endTime: "17:00",
        clientId: insertedClients[0]._id.toString(),
        clientName: insertedClients[0].name,
        location: "Fiera Milano - Stand Tech Solutions",
        description: "Copertura evento fieristico e interviste",
        type: "Event",
        crew: ["Camera Operator", "Interviewer", "Audio Tech"],
        equipment: ["Sony FX6", "Wireless Mics", "Steady Cam"],
        status: "scheduled",
        notes: "Evento importante, massima qualità richiesta",
        budget: 3800,
        createdAt: new Date()
      }
    ];
    
    const recordingResult = await db.collection('recordingDays').insertMany(recordingDays);
    console.log(`✅ Created ${recordingResult.insertedCount} recording days`);
    
    // Riepilogo
    console.log('\n🎉 DATABASE POPULATED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${await db.collection('users').countDocuments()}`);
    console.log(`🏢 Clients: ${await db.collection('clients').countDocuments()}`);
    console.log(`📹 Recording Days: ${await db.collection('recordingDays').countDocuments()}`);
    
    // Mostra prossime registrazioni
    console.log('\n📅 Next 3 upcoming recordings:');
    const upcoming = await db.collection('recordingDays')
      .find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(3)
      .toArray();
      
    upcoming.forEach((recording, i) => {
      console.log(`${i+1}. ${recording.date.toDateString()} - ${recording.clientName} - ${recording.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

populateTestData();

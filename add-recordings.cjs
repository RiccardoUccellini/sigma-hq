const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://Riccardo:ru2023.CP@cluster0.jwdseqd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function addRecordings() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    const db = client.db("sigma-hq");
    
    console.log('📹 Creating recording days...');
    
    // Solo registrazioni - passate e future
    const recordingDays = [
      // REGISTRAZIONI PASSATE
      {
        date: new Date("2024-07-15"),
        startTime: "09:00",
        endTime: "17:00",
        clientName: "Tech Solutions SRL",
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
        date: new Date("2024-08-05"),
        startTime: "14:00",
        endTime: "19:00",
        clientName: "Fashion Boutique Roma",
        location: "Location esterna Roma",
        description: "Shooting collezione estate",
        type: "Fashion",
        crew: ["Photographer", "Stylist", "Makeup Artist"],
        equipment: ["Canon R5", "Studio Lights", "Reflectors"],
        status: "completed",
        notes: "Bellissime foto per la campagna social",
        budget: 2200,
        createdAt: new Date("2024-08-01")
      },
      {
        date: new Date("2024-08-20"),
        startTime: "11:00",
        endTime: "15:00",
        clientName: "Ristorante Da Vinci",
        location: "Ristorante Da Vinci, Firenze",
        description: "Food photography menu degustazione",
        type: "Food",
        crew: ["Food Photographer", "Food Stylist"],
        equipment: ["Nikon Z9", "Macro Lens", "Portable Lights"],
        status: "completed",
        notes: "Piatti fotografati magnificamente, chef entusiasta",
        budget: 1500,
        createdAt: new Date("2024-08-15")
      },
      
      // REGISTRAZIONI FUTURE
      {
        date: new Date("2024-09-15"),
        startTime: "10:00",
        endTime: "18:00",
        clientName: "Tech Solutions SRL",
        location: "Tech Solutions Office Milano",
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
        clientName: "Fashion Boutique Roma",
        location: "Villa Borghese, Roma",
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
        clientName: "Ristorante Da Vinci",
        location: "Ristorante Da Vinci, Firenze",
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
        date: new Date("2024-11-05"),
        startTime: "08:00",
        endTime: "17:00",
        clientName: "StartUp Innovation",
        location: "Fiera Milano - Stand 42",
        description: "Copertura evento fieristico e interviste",
        type: "Event",
        crew: ["Camera Operator", "Interviewer", "Audio Tech"],
        equipment: ["Sony FX6", "Wireless Mics", "Steady Cam"],
        status: "scheduled",
        notes: "Evento importante, massima qualità richiesta",
        budget: 3800,
        createdAt: new Date()
      },
      {
        date: new Date("2024-12-15"),
        startTime: "10:00",
        endTime: "16:00",
        clientName: "Hotel Luxury Resort",
        location: "Hotel Luxury Resort, Portofino",
        description: "Video promozionale struttura e servizi",
        type: "Tourism",
        crew: ["Director", "Drone Operator", "Camera Op"],
        equipment: ["Sony FX6", "DJI Mini 4 Pro", "Gimbal"],
        status: "scheduled",
        notes: "Location stupenda, sfruttare la luce naturale",
        budget: 4500,
        createdAt: new Date()
      }
    ];
    
    // Prima pulisci eventuali registrazioni esistenti per evitare duplicati
    await db.collection('recordingDays').deleteMany({});
    
    const result = await db.collection('recordingDays').insertMany(recordingDays);
    console.log(`✅ Created ${result.insertedCount} recording days`);
    
    // Riepilogo
    console.log('\n🎉 RECORDINGS ADDED SUCCESSFULLY!');
    
    const totalRecordings = await db.collection('recordingDays').countDocuments();
    const completedCount = await db.collection('recordingDays').countDocuments({ status: 'completed' });
    const scheduledCount = await db.collection('recordingDays').countDocuments({ status: 'scheduled' });
    
    console.log(`\n📊 Summary:`);
    console.log(`📹 Total Recording Days: ${totalRecordings}`);
    console.log(`✅ Completed: ${completedCount}`);
    console.log(`📅 Scheduled: ${scheduledCount}`);
    
    // Mostra prossime 3 registrazioni
    console.log('\n📅 Next upcoming recordings:');
    const upcoming = await db.collection('recordingDays')
      .find({ 
        status: 'scheduled',
        date: { $gte: new Date() }
      })
      .sort({ date: 1 })
      .limit(3)
      .toArray();
      
    upcoming.forEach((recording, i) => {
      const dateStr = recording.date.toISOString().split('T')[0];
      console.log(`${i+1}. ${dateStr} - ${recording.clientName} - ${recording.type} - €${recording.budget}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

addRecordings();

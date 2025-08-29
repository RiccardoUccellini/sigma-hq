const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://localhost:3000', 
    'https://hq.sigmadigitalagency.it',
    'http://hq.sigmadigitalagency.it'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const uri = 'mongodb+srv://Riccardo:ru2023.CP@cluster0.xwxu3a1.mongodb.net/';
const dbName = 'sigma-hq';

let db;

// Connect to MongoDB
MongoClient.connect(uri)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => console.error('❌ MongoDB connection error:', error));

// CRUD endpoints per ogni collezione

// CLIENTS
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await db.collection('clients').find({}).toArray();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const result = await db.collection('clients').insertOne(req.body);
    res.json({ id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    await db.collection('clients').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    await db.collection('clients').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RECORDING DAYS
app.get('/api/recording-days', async (req, res) => {
  try {
    const recordingDays = await db.collection('recordingDays').find({}).toArray();
    console.log(`📊 Found ${recordingDays.length} recording days in DB`);
    recordingDays.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} - Date: ${doc.date} (Type: ${typeof doc.date}) - Status: ${doc.status}`);
    });
    res.json(recordingDays);
  } catch (error) {
    console.error('❌ Error fetching recording days:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recording-days', async (req, res) => {
  try {
    // Converti la data da stringa a Date object se necessario
    const data = { ...req.body };
    if (typeof data.date === 'string') {
      data.date = new Date(data.date);
    }
    if (typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    console.log(`📝 Adding recording day: ${data.title}`);
    console.log(`📅 Date: ${data.date} (Type: ${typeof data.date})`);
    console.log(`🎯 Status: ${data.status}`);
    
    const result = await db.collection('recordingDays').insertOne(data);
    console.log(`✅ Recording day inserted with ID: ${result.insertedId}`);
    res.json({ id: result.insertedId, ...data });
  } catch (error) {
    console.error('❌ Error adding recording day:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/recording-days/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    await db.collection('recordingDays').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/recording-days/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    await db.collection('recordingDays').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PED ENTRIES
app.get('/api/ped-entries', async (req, res) => {
  try {
    const pedEntries = await db.collection('pedEntries').find({}).toArray();
    res.json(pedEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ped-entries', async (req, res) => {
  try {
    const result = await db.collection('pedEntries').insertOne(req.body);
    res.json({ id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SCRIPTS
app.get('/api/scripts', async (req, res) => {
  try {
    const scripts = await db.collection('scripts').find({}).toArray();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scripts', async (req, res) => {
  try {
    const result = await db.collection('scripts').insertOne(req.body);
    res.json({ id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SOCIAL MEDIA FOLLOWERS
app.get('/api/social-media-followers', async (req, res) => {
  try {
    const followers = await db.collection('socialMediaFollowers').find({}).toArray();
    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/social-media-followers', async (req, res) => {
  try {
    const result = await db.collection('socialMediaFollowers').insertOne(req.body);
    res.json({ id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BRAIN DUMP NOTES
app.get('/api/brain-dump-notes', async (req, res) => {
  try {
    const notes = await db.collection('brainDumpNotes').find({}).toArray();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/brain-dump-notes', async (req, res) => {
  try {
    const result = await db.collection('brainDumpNotes').insertOne(req.body);
    res.json({ id: result.insertedId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// USERS (for authentication management)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Found ${users.length} users in DB`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // Add timestamp
    const userData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('users').insertOne(userData);
    res.json({ id: result.insertedId, ...userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint per ottenere solo clienti attivi (per il bot)
app.get('/api/clients/active', async (req, res) => {
  try {
    const activeClients = await db.collection('clients').find({ isActive: true }).toArray();
    console.log(`🎯 Found ${activeClients.length} active clients`);
    res.json(activeClients);
  } catch (error) {
    console.error('❌ Error fetching active clients:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});



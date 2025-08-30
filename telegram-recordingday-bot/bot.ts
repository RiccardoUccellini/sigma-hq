import TelegramBot from 'node-telegram-bot-api';
import * as cron from 'node-cron';
import express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Telegram Bot - POLLING MODE per stabilità
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: true,  // Polling sempre attivo - funziona perfettamente!
  filepath: false
});

let chatId: number | null = null;

// Interfaces
interface RecordingDay {
  id: string;
  title: string;
  client: string;
  clientId?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  location: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  script?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewRecordingForm {
  title?: string;
  clientId?: string;
  clientName?: string;
  date?: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  assignedUsers?: string[];
  videomakerEquipment?: string;
  additionalNotes?: string;
  script?: boolean;
}

interface UserSession {
  step: string;
  formData: NewRecordingForm;
}

// Session storage for form conversations
const userSessions: { [chatId: string]: UserSession } = {};

// Available clients and users (loaded from API)
let availableClients: any[] = [];
let availableUsers: any[] = [];

// Load clients and users from backend
async function loadClientsAndUsers() {
  try {
    const API_URL = process.env.API_URL || 'https://sigma-hq.onrender.com/api';
    console.log(`🔄 Loading data from: ${API_URL}`);
    
    // Load active clients con timeout e retry
    try {
      const clientsResponse = await fetch(`${API_URL}/clients/active`, {
        headers: { 'User-Agent': 'SIGMA-Bot/1.0' },
        signal: AbortSignal.timeout(10000) // 10 secondi timeout
      });
      if (clientsResponse.ok) {
        availableClients = await clientsResponse.json() as any[];
        console.log(`📊 Loaded ${availableClients.length} active clients`);
      } else {
        console.log(`⚠️  Clients API returned: ${clientsResponse.status}`);
      }
    } catch (clientError) {
      console.log('⚠️  Could not load clients:', (clientError as Error).message);
      availableClients = [];
    }

    // Load users  
    try {
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: { 'User-Agent': 'SIGMA-Bot/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      if (usersResponse.ok) {
        availableUsers = await usersResponse.json() as any[];
        console.log(`👥 Loaded ${availableUsers.length} users`);
      } else {
        console.log(`⚠️  Users API returned: ${usersResponse.status}`);
      }
    } catch (userError) {
      console.log('⚠️  Could not load users:', (userError as Error).message);
      availableUsers = [];
    }
  } catch (error) {
    console.error('❌ Error loading clients and users:', error);
  }
}

// Get next N recording days from API
async function getNextRecordingDays(limit: number = 3): Promise<RecordingDay[]> {
  try {
    const API_URL = process.env.API_URL || 'https://sigma-hq.onrender.com/api';
    const response = await fetch(`${API_URL}/recording-days`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const allRecordings = await response.json() as any[];
    const now = new Date();
    
    // Filter future recordings and sort by date
    const futureRecordings = allRecordings
      .filter(rec => {
        const recDate = new Date(rec.date);
        return recDate > now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
    
    return futureRecordings.map((doc: any) => ({
      ...doc,
      id: doc._id?.toString() || doc.id,
    })) as RecordingDay[];
    
  } catch (error) {
    console.error('❌ Error fetching recording days:', error);
    return [];
  }
}

// Get tomorrow's recordings (for scheduled notifications)
async function getTomorrowsRecordings(): Promise<RecordingDay[]> {
  try {
    const API_URL = process.env.API_URL || 'https://sigma-hq.onrender.com/api';
    const response = await fetch(`${API_URL}/recording-days`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const allRecordings = await response.json() as any[];
    const tomorrow = getTomorrow();
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const tomorrowRecordings = allRecordings.filter(rec => {
      const recDate = new Date(rec.date);
      return recDate >= tomorrow && recDate < dayAfter;
    });

    return tomorrowRecordings.map((doc: any) => ({
      ...doc,
      id: doc._id?.toString() || doc.id,
    })) as RecordingDay[];
    
  } catch (error) {
    console.error('❌ Error fetching tomorrow recordings:', error);
    return [];
  }
}

// Get tomorrow's date
function getTomorrow(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// Format date for display
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Bot Commands

// /start command
bot.onText(/\/start/, (msg: any) => {
  chatId = msg.chat.id;
  console.log(`📱 User registered with chat ID: ${chatId}`);
  if (chatId) {
    bot.sendMessage(chatId, `🎬 *Welcome to SIGMA HQ Recording Day Bot!*

You are now registered for recording day notifications! 🔔

*📋 Available Commands:*
/start - Register for notifications
/next3 - Get next 3 recording days
/add - Add new recording day (full form)
/cancel - Cancel current operation
/help - Show detailed help

*🎯 What I can do:*
• 📅 Send daily notifications at 8:00 AM
• 📊 Show upcoming recording schedules
• ➕ Create new recordings with all website fields
• 🔄 Real-time database synchronization

*🚀 Quick Start:*
Try /next3 to see upcoming recordings or /add to create a new one!

*💡 Pro Tip:* The /add command guides you through creating recordings with client selection, dates, times, locations, user assignments, and more - just like the website!`, { parse_mode: 'Markdown' });
  }
});

// /next3 command - Get next 3 recording days
bot.onText(/\/next3/, async (msg: any) => {
  const currentChatId = msg.chat.id;
  console.log(`📱 User ${currentChatId} requested next 3 recording days`);
  
  try {
    const recordings = await getNextRecordingDays(3);
    
    if (recordings.length === 0) {
      bot.sendMessage(currentChatId, '📅 No upcoming recording days found in the database.');
      return;
    }

    bot.sendMessage(currentChatId, `📅 *Next ${recordings.length} Recording Days:*`, { parse_mode: 'Markdown' });
    
    for (let i = 0; i < recordings.length; i++) {
      const rec = recordings[i];
      const date = rec.date ? formatDate(rec.date) : 'Data non specificata';
      const timeRange = rec.startTime && rec.endTime ? ` (${rec.startTime} - ${rec.endTime})` : '';
      
      const msg = `🎬 *${rec.title || 'Registrazione'} ${i + 1}*

*Cliente:* ${rec.client || 'N/A'}
*Data:* ${date}${timeRange}
*Luogo:* ${rec.location || 'TBD'}
*Note:* ${rec.notes || 'Nessuna nota'}
*Status:* ${rec.status || 'scheduled'}`;
      
      bot.sendMessage(currentChatId, msg, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error fetching recording days:', error);
    bot.sendMessage(currentChatId, '❌ Error fetching recording days from database. Please try again later.');
  }
});

// /help command
bot.onText(/\/help/, (msg: any) => {
  const currentChatId = msg.chat.id;
  bot.sendMessage(currentChatId, `🎬 *SIGMA HQ Recording Day Bot*

*📋 Available Commands:*
/start - Register for notifications
/next3 - Get next 3 recording days
/add - Add new recording day (full form)
/cancel - Cancel current operation
/help - Show detailed help

*🎯 What I can do:*
• 📅 Send daily notifications at 8:00 AM
• 📊 Show upcoming recording schedules
• ➕ Create new recordings with all website fields
• 🔄 Real-time database synchronization

This bot will send you notifications about upcoming recording days every morning at 8:00 AM.`, { parse_mode: 'Markdown' });
});

// Initialize bot and start server
console.log('🤖 SIGMA HQ Recording Day Bot is starting...');

// Load initial data
loadClientsAndUsers().then(() => {
  console.log('🤖 SIGMA HQ Recording Day Bot is ready!');
  console.log('📱 Send /start to register for notifications');
  console.log('📅 Send /next3 to get the next 3 recording days');
  console.log('➕ Send /add to create a new recording day');
});

// Express server for Render Web Service (keeps bot alive)
const app = express();

// Middleware per gestire JSON dal webhook
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

// Webhook endpoint for Telegram - DISABILITATO (usiamo polling)
app.post('/webhook', (req, res) => {
  // Webhook non più utilizzato - risponde solo OK
  console.log('⚠️  Webhook call ignored - using polling mode');
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'Bot is running!', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    availableClients: availableClients.length,
    availableUsers: availableUsers.length
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    bot: bot ? 'connected' : 'disconnected',
    clients: availableClients.length,
    users: availableUsers.length
  });
});

// Start server - POLLING MODE (no webhook setup)
app.listen(PORT, async () => {
  console.log(`🌐 Bot web service running on port ${PORT}`);
  console.log(`🤖 Bot using POLLING mode - stable and reliable!`);
  
  // Nessun webhook - polling è già attivo dalla configurazione del bot
  console.log(`✅ Bot ready and listening for messages via polling`);
});

// Scheduled notifications - Every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  if (!chatId) {
    console.log('⚠️ No chat ID registered for notifications');
    return;
  }

  console.log('📅 Running daily notification check...');
  
  try {
    const recordings = await getTomorrowsRecordings();
    
    if (recordings.length === 0) {
      bot.sendMessage(chatId, '📅 No recording days scheduled for tomorrow.');
      return;
    }

    bot.sendMessage(chatId, '🌅 *Good morning! Here are tomorrow\'s recording days:*', { parse_mode: 'Markdown' });
    
    for (const rec of recordings) {
      const date = rec.date ? formatDate(rec.date) : 'Data non specificata';
      const timeRange = rec.startTime && rec.endTime ? ` (${rec.startTime} - ${rec.endTime})` : '';
      
      const msg = `🎬 *${rec.title || 'Registrazione'} Alert!*

*Cliente:* ${rec.client || 'N/A'}
*Data:* ${date}${timeRange}
*Luogo:* ${rec.location || 'TBD'}
*Note:* ${rec.notes || 'Nessuna nota'}
*Status:* ${rec.status || 'scheduled'}`;
      
      bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in scheduled notification:', error);
    bot.sendMessage(chatId, '❌ Error fetching tomorrow\'s recording days.');
  }
});

// Error handling
bot.on('error', (error: Error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error: Error) => {
  console.error('Polling error:', error);
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const cron = __importStar(require("node-cron"));
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Initialize Telegram Bot
const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false, // Webhook per produzione, polling per locale
    filepath: false
});
let chatId = null;
// Session storage for form conversations
const userSessions = {};
// Available clients and users (loaded from API)
let availableClients = [];
let availableUsers = [];
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
                availableClients = await clientsResponse.json();
                console.log(`📊 Loaded ${availableClients.length} active clients`);
            }
            else {
                console.log(`⚠️  Clients API returned: ${clientsResponse.status}`);
            }
        }
        catch (clientError) {
            console.log('⚠️  Could not load clients:', clientError.message);
            availableClients = [];
        }
        // Load users  
        try {
            const usersResponse = await fetch(`${API_URL}/users`, {
                headers: { 'User-Agent': 'SIGMA-Bot/1.0' },
                signal: AbortSignal.timeout(10000)
            });
            if (usersResponse.ok) {
                availableUsers = await usersResponse.json();
                console.log(`👥 Loaded ${availableUsers.length} users`);
            }
            else {
                console.log(`⚠️  Users API returned: ${usersResponse.status}`);
            }
        }
        catch (userError) {
            console.log('⚠️  Could not load users:', userError.message);
            availableUsers = [];
        }
    }
    catch (error) {
        console.error('❌ Error loading clients and users:', error);
    }
}
// Get next N recording days from API
async function getNextRecordingDays(limit = 3) {
    try {
        const API_URL = process.env.API_URL || 'https://sigma-hq.onrender.com/api';
        const response = await fetch(`${API_URL}/recording-days`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allRecordings = await response.json();
        const now = new Date();
        // Filter future recordings and sort by date
        const futureRecordings = allRecordings
            .filter(rec => {
            const recDate = new Date(rec.date);
            return recDate > now;
        })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, limit);
        return futureRecordings.map((doc) => ({
            ...doc,
            id: doc._id?.toString() || doc.id,
        }));
    }
    catch (error) {
        console.error('❌ Error fetching recording days:', error);
        return [];
    }
}
// Get tomorrow's recordings (for scheduled notifications)
async function getTomorrowsRecordings() {
    try {
        const API_URL = process.env.API_URL || 'https://sigma-hq.onrender.com/api';
        const response = await fetch(`${API_URL}/recording-days`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allRecordings = await response.json();
        const tomorrow = getTomorrow();
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const tomorrowRecordings = allRecordings.filter(rec => {
            const recDate = new Date(rec.date);
            return recDate >= tomorrow && recDate < dayAfter;
        });
        return tomorrowRecordings.map((doc) => ({
            ...doc,
            id: doc._id?.toString() || doc.id,
        }));
    }
    catch (error) {
        console.error('❌ Error fetching tomorrow recordings:', error);
        return [];
    }
}
// Get tomorrow's date
function getTomorrow() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}
// Format date for display
function formatDate(date) {
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
bot.onText(/\/start/, (msg) => {
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
bot.onText(/\/next3/, async (msg) => {
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
    }
    catch (error) {
        console.error('Error fetching recording days:', error);
        bot.sendMessage(currentChatId, '❌ Error fetching recording days from database. Please try again later.');
    }
});
// /help command
bot.onText(/\/help/, (msg) => {
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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 10000;
// Webhook endpoint for Telegram
app.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
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
// Set webhook on startup
app.listen(PORT, async () => {
    console.log(`🌐 Bot web service running on port ${PORT}`);
    try {
        const webhookUrl = `https://sigma-hq-bot.onrender.com/webhook`;
        await bot.setWebHook(webhookUrl);
        console.log(`🔗 Webhook set to: ${webhookUrl}`);
    }
    catch (error) {
        console.error('❌ Error setting webhook:', error);
        // Fallback to polling if webhook fails
        console.log('🔄 Falling back to polling...');
        bot.startPolling();
    }
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
    }
    catch (error) {
        console.error('Error in scheduled notification:', error);
        bot.sendMessage(chatId, '❌ Error fetching tomorrow\'s recording days.');
    }
});
// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

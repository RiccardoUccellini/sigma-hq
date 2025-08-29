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
const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
let chatId = null;
// Initialize MongoDB connection and start bot
connectToMongoDB().then(() => {
    console.log('🤖 SIGMA HQ Recording Day Bot is ready!');
    console.log('📱 Send /start to register for notifications');
    console.log('📅 Send /next3 to get the next 3 recording days');
});
// User session storage for form data
const userSessions = {};
// Available clients and users cache
let availableClients = [];
let availableUsers = [];
// Load clients and users from backend
async function loadClientsAndUsers() {
    try {
        const API_URL = process.env.API_URL || 'http://localhost:3001/api';
        // Load active clients
        const clientsResponse = await fetch(`${API_URL}/clients/active`);
        if (clientsResponse.ok) {
            availableClients = await clientsResponse.json();
            console.log(`📊 Loaded ${availableClients.length} active clients`);
        }
        // Load users  
        const usersResponse = await fetch(`${API_URL}/users`);
        if (usersResponse.ok) {
            availableUsers = await usersResponse.json();
            console.log(`👥 Loaded ${availableUsers.length} users`);
        }
    }
    catch (error) {
        console.error('❌ Error loading clients and users:', error);
    }
}
// Utility function to get tomorrow's date
function getTomorrow() {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(0, 0, 0, 0);
    return now;
}
// Get tomorrow's recordings (for scheduled notifications)
async function getTomorrowsRecordings() {
    try {
        const tomorrow = getTomorrow();
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const recordingsCollection = db.collection('recordingDays');
        const recordings = await recordingsCollection.find({
            date: {
                $gte: tomorrow,
                $lt: dayAfter
            }
        }).toArray();
        return recordings.map((doc) => ({
            ...doc,
            id: doc._id?.toString() || doc.id,
            date: doc.date ? new Date(doc.date) : null
        }));
    }
    catch (error) {
        console.error('Error fetching tomorrow\'s recordings:', error);
        return [];
    }
}
// Get next N recording days
async function getNextRecordingDays(count = 3) {
    try {
        if (!db) {
            console.error('❌ Database not connected yet!');
            return [];
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        console.log(`🔍 Looking for recordings after: ${now.toISOString()}`);
        const recordingsCollection = db.collection('recordingDays');
        // Prima vediamo tutti i documenti
        const allRecordings = await recordingsCollection.find({}).toArray();
        console.log(`📊 Total recordings in DB: ${allRecordings.length}`);
        allRecordings.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.title} - Date: ${doc.date} (Type: ${typeof doc.date}) - Status: ${doc.status}`);
        });
        const recordings = await recordingsCollection.find({
            date: { $gte: now }
        }).sort({ date: 1 }).limit(count).toArray();
        console.log(`🎯 Found ${recordings.length} upcoming recordings`);
        recordings.forEach((doc, index) => {
            console.log(`${index + 1}. ${doc.title} - Date: ${doc.date} - Status: ${doc.status}`);
        });
        return recordings.map((doc) => ({
            ...doc,
            id: doc._id?.toString() || doc.id,
            date: doc.date ? new Date(doc.date) : null
        }));
    }
    catch (error) {
        console.error('Error fetching next recording days:', error);
        return [];
    }
}
// Format date for display
function formatDate(date) {
    return date.toLocaleDateString('it-IT', {
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

*Available Commands:*
/start - Register for notifications
/next3 - Get next 3 recording days
/add - Add new recording day
/cancel - Cancel current operation
/help - Show this help message

This bot will send you notifications about upcoming recording days every morning at 8:00 AM.`, { parse_mode: 'Markdown' });
});
// /add command - Start new recording creation process
bot.onText(/\/add/, async (msg) => {
    const currentChatId = msg.chat.id;
    // Load latest clients and users
    await loadClientsAndUsers();
    if (availableClients.length === 0) {
        bot.sendMessage(currentChatId, '❌ No active clients found. Please add clients first through the web interface.');
        return;
    }
    // Initialize form session
    userSessions[currentChatId] = {
        step: 'client_selection',
        formData: {}
    };
    // Create client selection message
    let clientsMsg = '🎬 *Creating New Recording Day*\n\n';
    clientsMsg += '👥 *Select Client:*\n';
    availableClients.forEach((client, index) => {
        clientsMsg += `${index + 1}. ${client.nameCompany}\n`;
    });
    clientsMsg += '\n📝 Reply with the *number* of the client you want to select.';
    bot.sendMessage(currentChatId, clientsMsg, { parse_mode: 'Markdown' });
});
// /cancel command
bot.onText(/\/cancel/, (msg) => {
    const currentChatId = msg.chat.id;
    if (userSessions[currentChatId]) {
        delete userSessions[currentChatId];
        bot.sendMessage(currentChatId, '❌ Operation cancelled. Use /add to start over.');
    }
    else {
        bot.sendMessage(currentChatId, 'ℹ️ No operation to cancel.');
    }
});
// Handle all text messages for form completion
bot.on('message', async (msg) => {
    const currentChatId = msg.chat.id;
    const text = msg.text;
    // Skip if it's a command
    if (text && text.startsWith('/')) {
        return;
    }
    // Skip if no active session
    if (!userSessions[currentChatId]) {
        return;
    }
    const session = userSessions[currentChatId];
    const step = session.step;
    try {
        switch (step) {
            case 'client_selection':
                await handleClientSelection(currentChatId, text, session);
                break;
            case 'title_input':
                await handleTitleInput(currentChatId, text, session);
                break;
            case 'date_input':
                await handleDateInput(currentChatId, text, session);
                break;
            case 'time_type_input':
                await handleTimeTypeInput(currentChatId, text, session);
                break;
            case 'start_time_input':
                await handleStartTimeInput(currentChatId, text, session);
                break;
            case 'end_time_input':
                await handleEndTimeInput(currentChatId, text, session);
                break;
            case 'location_input':
                await handleLocationInput(currentChatId, text, session);
                break;
            case 'users_selection':
                await handleUsersSelection(currentChatId, text, session);
                break;
            case 'equipment_input':
                await handleEquipmentInput(currentChatId, text, session);
                break;
            case 'notes_input':
                await handleNotesInput(currentChatId, text, session);
                break;
            case 'script_input':
                await handleScriptInput(currentChatId, text, session);
                break;
            default:
                break;
        }
    }
    catch (error) {
        console.error('Error handling form step:', error);
        bot.sendMessage(currentChatId, '❌ An error occurred. Please try again or use /cancel to start over.');
    }
});
// Form step handlers
async function handleClientSelection(chatId, text, session) {
    const clientIndex = parseInt(text) - 1;
    if (isNaN(clientIndex) || clientIndex < 0 || clientIndex >= availableClients.length) {
        bot.sendMessage(chatId, '❌ Invalid selection. Please enter a valid number.');
        return;
    }
    const selectedClient = availableClients[clientIndex];
    session.formData.clientId = selectedClient._id;
    session.formData.clientName = selectedClient.nameCompany;
    session.step = 'title_input';
    bot.sendMessage(chatId, `✅ Selected: *${selectedClient.nameCompany}*\n\n📝 Enter the recording title:`, { parse_mode: 'Markdown' });
}
async function handleTitleInput(chatId, text, session) {
    session.formData.title = text;
    session.step = 'date_input';
    bot.sendMessage(chatId, '📅 Enter the date (format: YYYY-MM-DD or DD/MM/YYYY):\n\nExample: 2025-09-15 or 15/09/2025');
}
async function handleDateInput(chatId, text, session) {
    let date;
    try {
        // Try different date formats
        if (text.includes('/')) {
            const parts = text.split('/');
            if (parts.length === 3) {
                // DD/MM/YYYY format
                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            else {
                throw new Error('Invalid format');
            }
        }
        else {
            // YYYY-MM-DD format
            date = new Date(text);
        }
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        session.formData.date = date.toISOString();
        session.step = 'time_type_input';
        bot.sendMessage(chatId, `✅ Date set: *${formatDate(date)}*\n\n⏰ Is this an all-day event?\n\n1. Yes (all day)\n2. No (specific times)\n\nReply with 1 or 2:`, { parse_mode: 'Markdown' });
    }
    catch (error) {
        bot.sendMessage(chatId, '❌ Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY format.\n\nExample: 2025-09-15 or 15/09/2025');
    }
}
async function handleTimeTypeInput(chatId, text, session) {
    const choice = parseInt(text);
    if (choice === 1) {
        // All day event
        session.formData.allDay = true;
        session.formData.startTime = '';
        session.formData.endTime = '';
        session.step = 'location_input';
        bot.sendMessage(chatId, '✅ Set as all-day event\n\n📍 Enter the location:');
    }
    else if (choice === 2) {
        // Specific times
        session.formData.allDay = false;
        session.step = 'start_time_input';
        bot.sendMessage(chatId, '🕐 Enter start time (format: HH:MM):\n\nExample: 09:30');
    }
    else {
        bot.sendMessage(chatId, '❌ Please reply with 1 for all-day or 2 for specific times.');
    }
}
async function handleStartTimeInput(chatId, text, session) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(text)) {
        bot.sendMessage(chatId, '❌ Invalid time format. Please use HH:MM format.\n\nExample: 09:30');
        return;
    }
    session.formData.startTime = text;
    session.step = 'end_time_input';
    bot.sendMessage(chatId, `✅ Start time: *${text}*\n\n🕐 Enter end time (format: HH:MM):`, { parse_mode: 'Markdown' });
}
async function handleEndTimeInput(chatId, text, session) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(text)) {
        bot.sendMessage(chatId, '❌ Invalid time format. Please use HH:MM format.\n\nExample: 17:00');
        return;
    }
    session.formData.endTime = text;
    session.step = 'location_input';
    bot.sendMessage(chatId, `✅ End time: *${text}*\n\n📍 Enter the location:`, { parse_mode: 'Markdown' });
}
async function handleLocationInput(chatId, text, session) {
    session.formData.location = text;
    session.step = 'users_selection';
    // Show available users
    let usersMsg = `✅ Location: *${text}*\n\n👥 *Assign Users:*\n`;
    if (availableUsers.length === 0) {
        usersMsg += 'No users available. Skipping user assignment.\n\n';
        session.formData.assignedUsers = [];
        session.step = 'equipment_input';
        bot.sendMessage(chatId, usersMsg + '🎥 Enter videomaker equipment details (or type "none"):');
        return;
    }
    availableUsers.forEach((user, index) => {
        const name = user.name || user.email || `User ${index + 1}`;
        usersMsg += `${index + 1}. ${name}\n`;
    });
    usersMsg += '\n📝 Reply with user numbers separated by commas (e.g., "1,3,5") or "none" to skip:';
    bot.sendMessage(chatId, usersMsg, { parse_mode: 'Markdown' });
}
async function handleUsersSelection(chatId, text, session) {
    if (text.toLowerCase() === 'none') {
        session.formData.assignedUsers = [];
    }
    else {
        try {
            const userIndices = text.split(',').map(n => parseInt(n.trim()) - 1);
            const selectedUsers = [];
            for (const index of userIndices) {
                if (index >= 0 && index < availableUsers.length) {
                    selectedUsers.push(availableUsers[index]._id);
                }
            }
            session.formData.assignedUsers = selectedUsers;
        }
        catch (error) {
            bot.sendMessage(chatId, '❌ Invalid format. Please enter numbers separated by commas (e.g., "1,3,5") or "none".');
            return;
        }
    }
    session.step = 'equipment_input';
    bot.sendMessage(chatId, `✅ Users assigned\n\n🎥 Enter videomaker equipment details (or type "none"):`, { parse_mode: 'Markdown' });
}
async function handleEquipmentInput(chatId, text, session) {
    session.formData.videomakerEquipment = text === 'none' ? '' : text;
    session.step = 'notes_input';
    bot.sendMessage(chatId, `✅ Equipment noted\n\n📝 Enter additional notes (or type "none"):`, { parse_mode: 'Markdown' });
}
async function handleNotesInput(chatId, text, session) {
    session.formData.additionalNotes = text === 'none' ? '' : text;
    session.step = 'script_input';
    bot.sendMessage(chatId, `✅ Notes added\n\n📄 Is script prepared?\n\n1. Yes\n2. No\n\nReply with 1 or 2:`, { parse_mode: 'Markdown' });
}
async function handleScriptInput(chatId, text, session) {
    const choice = parseInt(text);
    if (choice === 1) {
        session.formData.script = true;
    }
    else if (choice === 2) {
        session.formData.script = false;
    }
    else {
        bot.sendMessage(chatId, '❌ Please reply with 1 for Yes or 2 for No.');
        return;
    }
    // Create the recording
    await createNewRecording(chatId, session.formData);
    // Clear session
    delete userSessions[chatId];
}
// Create new recording in database
async function createNewRecording(chatId, formData) {
    try {
        const recordingData = {
            title: formData.title,
            client: formData.clientName,
            clientId: formData.clientId,
            date: new Date(formData.date),
            startTime: formData.startTime || '',
            endTime: formData.endTime || '',
            location: formData.location,
            notes: `${formData.additionalNotes || ''}\n\nEquipment: ${formData.videomakerEquipment || 'None'}\nUsers: ${(formData.assignedUsers || []).length} assigned`,
            status: 'scheduled',
            script: formData.script || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        console.log('📝 Creating new recording via bot:', recordingData.title);
        const API_URL = process.env.API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/recording-days`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordingData)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('✅ Recording created with ID:', result.id);
        // Send confirmation message
        const confirmMsg = `🎉 *Recording Day Created Successfully!*

🎬 *${recordingData.title}*
👥 *Client:* ${recordingData.client}
📅 *Date:* ${formatDate(recordingData.date)}
${recordingData.startTime && recordingData.endTime ? `⏰ *Time:* ${recordingData.startTime} - ${recordingData.endTime}` : '⏰ *All day event*'}
📍 *Location:* ${recordingData.location}
📄 *Script:* ${recordingData.script ? 'Prepared ✅' : 'Not prepared ❌'}
🎯 *Status:* Scheduled

Use /next3 to see your upcoming recordings!`;
        bot.sendMessage(chatId, confirmMsg, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('❌ Error creating recording:', error);
        bot.sendMessage(chatId, '❌ Failed to create recording. Please try again later or use the web interface.');
    }
}
// Initialize MongoDB connection and start bot
connectToMongoDB().then(async () => {
    console.log('🤖 SIGMA HQ Recording Day Bot is ready!');
    console.log('📱 Send /start to register for notifications');
    console.log('📅 Send /next3 to get the next 3 recording days');
    console.log('➕ Send /add to create a new recording day');
    // Load initial data
    await loadClientsAndUsers();
});
// Express server for Render Web Service (keeps bot alive)
const app = (0, express_1.default)();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => {
    res.json({
        status: 'Bot is running!',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        bot: bot ? 'connected' : 'disconnected',
        database: db ? 'connected' : 'disconnected'
    });
});
app.listen(PORT, () => {
    console.log(`🌐 Bot web service running on port ${PORT}`);
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

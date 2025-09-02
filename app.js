// WhatsApp Packaging Business Bot using Twilio
const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

// Your Packaging Business Info - UPDATE THIS WITH YOUR DETAILS!
const BUSINESS_INFO = {
    name: "Customized_Box Packaging",
    hours: "Monday-Friday 9AM-6PM",
    services: "Custom packaging paper boxes, branding design, empty wine bottles, glass jars, corrugated boxes, paper bags",
    moq: "Paper boxes: 500pcs, Wine bottles: 100pcs, Jars: 200pcs, Corrugated: 300pcs, Paper bags: 1000pcs",
    email: "orders@customizedbox.com",
    phone: "+1-234-567-8900",
    whatsapp: "WhatsApp orders & quotes available 24/7"
};

// Product catalog
const PRODUCTS = {
    paperBoxes: {
        name: "Custom Paper Boxes",
        moq: "500 pieces",
        features: "Custom sizes, full color printing, logo branding, food-safe options",
        leadTime: "7-14 days"
    },
    wineBottles: {
        name: "Empty Wine Bottles", 
        moq: "100 pieces",
        features: "Various colors (clear, green, amber), different shapes",
        leadTime: "5-10 days"
    },
    jars: {
        name: "Glass Jars",
        moq: "200 pieces", 
        features: "Mason jars, honey jars, custom labels, metal/plastic lids",
        leadTime: "5-10 days"
    },
    corrugatedBoxes: {
        name: "Corrugated Boxes",
        moq: "300 pieces",
        features: "Single/double wall, custom printing, shipping boxes", 
        leadTime: "5-12 days"
    },
    paperBags: {
        name: "Custom Paper Bags",
        moq: "1000 pieces",
        features: "Shopping bags, gift bags, handles, custom printing",
        leadTime: "7-10 days"
    }
};

// Webhook for Twilio WhatsApp messages
app.post('/webhook', async (req, res) => {
    try {
        const incomingMessage = req.body.Body || '';
        const from = req.body.From || '';
        const customerNumber = from.replace('whatsapp:', '');

        console.log(`📨 Message from ${customerNumber}: ${incomingMessage}`);

        if (incomingMessage.trim()) {
            const response = await handlePackagingMessage(incomingMessage, customerNumber);
            await sendWhatsAppMessage(customerNumber, response);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.sendStatus(500);
    }
});

// Handle packaging business messages
async function handlePackagingMessage(message, customerPhone) {
    const msg = message.toLowerCase();

    // Greeting
    if (msg.includes('hello') || msg.includes('hi ') || msg === 'hi') {
        return `Hello! 👋 Welcome to ${BUSINESS_INFO.name}!\n\nI can help you with:\n📦 Custom paper boxes & branding\n🍷 Empty wine bottles\n🫙 Glass jars\n📋 Corrugated boxes\n🛍️ Paper bags\n\nWhat packaging do you need?`;
    }

    // Business hours
    if (msg.includes('hours') || msg.includes('open')) {
        return `🕒 Business Hours: ${BUSINESS_INFO.hours}\n📱 WhatsApp: 24/7 (I'm always here!)\n\nWhat can I help you with?`;
    }

    // MOQ inquiries
    if (msg.includes('moq') || msg.includes('minimum')) {
        return `📊 **Minimum Order Quantities:**\n\n📦 Paper Boxes: 500 pcs\n🍷 Wine Bottles: 100 pcs\n🫙 Glass Jars: 200 pcs\n📋 Corrugated Boxes: 300 pcs\n🛍️ Paper Bags: 1000 pcs\n\nWhich product interests you?`;
    }

    // Paper boxes
    if (msg.includes('paper box') || msg.includes('custom box')) {
        return `📦 **Custom Paper Boxes**\n• MOQ: 500 pieces\n• Custom sizes & full color printing\n• Logo branding available\n• Lead time: 7-14 days\n\nTell me:\n- Box size needed?\n- Quantity?\n- Branding requirements?`;
    }

    // Wine bottles  
    if (msg.includes('wine bottle') || msg.includes('empty bottle')) {
        return `🍷 **Empty Wine Bottles**\n• MOQ: 100 pieces\n• Sizes: 375ml, 750ml, 1L\n• Colors: Clear, green, amber\n• Lead time: 5-10 days\n\nWhat size and color do you need?`;
    }

    // Jars
    if (msg.includes('jar') || msg.includes('glass jar')) {
        return `🫙 **Glass Jars**\n• MOQ: 200 pieces\n• Sizes: 4oz, 8oz, 16oz, 32oz\n• Mason, honey, spice jars available\n• Lead time: 5-10 days\n\nWhich size and type?`;
    }

    // Pricing
    if (msg.includes('price') || msg.includes('cost') || msg.includes('quote')) {
        return `💰 **Custom Pricing**\n\nFor accurate quotes, I need:\n• Product type\n• Quantity needed\n• Size/specifications\n• Custom requirements\n\n⚡ Quick quote in 2 hours!\n\nWhat product are you interested in?`;
    }

    // Contact info
    if (msg.includes('contact') || msg.includes('phone')) {
        return `📞 **Contact Info:**\n• WhatsApp: 24/7 (right here!)\n• Email: ${BUSINESS_INFO.email}\n• Phone: ${BUSINESS_INFO.phone}\n• Hours: ${BUSINESS_INFO.hours}\n\nHow can I help you today?`;
    }

    // Use AI for complex queries
    return await generateAIResponse(message);
}

// Generate AI response using Claude
async function generateAIResponse(customerMessage) {
    try {
        const prompt = `You are a helpful customer service rep for ${BUSINESS_INFO.name}, a packaging company.

Our products: Custom paper boxes, wine bottles, glass jars, corrugated boxes, paper bags
Business hours: ${BUSINESS_INFO.hours}
Specialties: Custom branding, bulk orders, eco-friendly packaging

Customer message: "${customerMessage}"

Respond as a packaging expert:
- Be friendly and professional
- Keep under 200 characters
- Ask specific questions to help with quotes
- Use appropriate emojis
- Always try to be helpful

Response:`;

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey
            }
        });

        return response.data.content[0].text.trim();
    } catch (error) {
        console.error('❌ AI error:', error);
        return `I'd love to help with your packaging needs! Please contact us at ${BUSINESS_INFO.phone} for detailed quotes. What type of packaging are you looking for? 📦`;
    }
}

// Send WhatsApp message via Twilio
async function sendWhatsAppMessage(to, message) {
    try {
        const response = await client.messages.create({
            body: message,
            from: 'whatsapp:+14155238886', // Twilio sandbox number
            to: `whatsapp:${to}`
        });
        
        console.log('✅ Message sent:', response.sid);
    } catch (error) {
        console.error('❌ Send error:', error);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: '✅ Bot running!',
        business: BUSINESS_INFO.name,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ${BUSINESS_INFO.name} WhatsApp Bot running on port ${PORT}`);
    console.log('📱 Ready to handle packaging inquiries!');
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    process.exit(0);
});

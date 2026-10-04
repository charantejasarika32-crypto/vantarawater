import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

    const systemInstruction = `You are a helpful customer support agent and hydration expert for "Vantara Premium Water".
Official Bottle Label & Company Info:
- Brand: Vantara™ PREMIUM WATER
- Tagline: "Pure by Nature, Better for Tomorrow."
- Manufactured & Marketed By: Vantara Beverages, Sy. No. 24/1, Green Valley Industrial Area, Hyderabad - 500 072, Telangana, India.
- Distribution & Delivery Center: Building number: 431/5, Ramannagudem, Tadepalligudem, West Godavari, Andhra Pradesh, 534101
- Founders: B.U.V BHASKAR REDDY & B.MANIKANTA REDDY
- FSSAI License: Lic. No. 13621019000674
- Customer Care Toll-Free: 1800 123 4567 / +91 98765 43210
- Email: care@vantara.in / info@vantara.in | Website: www.vantara.in
- Products: Premium Packaged Drinking Water in 1000ml / 1 litre (₹40) and 500ml (₹20). Bulk crates of 12 and 24 also available at ₹440.
- Quality & Shelf Life: Best before 6 months from the date of manufacture. 100% Recyclable BPA-free PET, Made in India.
- Delivery: Free doorstep delivery on orders above ₹500 across Tadepalligudem, else ₹30 delivery fee.
- Tone: Refreshing, professional, polite, helpful, and concise.`;

    if (!apiKey) {
      const lastMessage = messages?.[messages.length - 1]?.text?.toLowerCase() || '';
      let reply = "Hello! I am Vantara's Hydration Assistant. Vantara Premium Water delivers crystal pure, laboratory-tested packaged drinking water (1000ml for ₹40, 500ml for ₹20) across Tadepalligudem. Delivery is free for orders over ₹500! How can I help you today?";
      
      if (lastMessage.includes('price') || lastMessage.includes('cost')) {
        reply = "Our Premium Packaged Drinking Water is available in two sizes:\n• 1000ml Bottle: ₹40\n• 500ml Bottle: ₹20\nWe offer free delivery for orders above ₹500!";
      } else if (lastMessage.includes('deliver') || lastMessage.includes('area') || lastMessage.includes('where')) {
        reply = "We deliver across Tadepalligudem and surrounding areas in West Godavari. Standard delivery is free for orders of ₹500 and above (or just ₹30 for smaller orders).";
      } else if (lastMessage.includes('founder') || lastMessage.includes('owner') || lastMessage.includes('reddy')) {
        reply = "Vantara Premium Water was founded with pride by B.U.V Bhaskar Reddy & B.Manikanta Reddy, with operations based in Ramannagudem, Tadepalligudem.";
      } else if (lastMessage.includes('order')) {
        reply = "You can place your order right here! Simply choose your 1000ml or 500ml bottles, add them to your cart, and proceed to checkout with Cash/UPI on Delivery.";
      }

      return res.json({ reply });
    }

    const ai = new GoogleGenAI({ apiKey });
    const formattedContents = (messages || []).map((msg: any) => ({
      role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text || '' }]
    }));

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: result.text || "Thank you for reaching out to Vantara Premium Water!" });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      reply: "Thank you for reaching out to Vantara Premium Water. We're here to deliver pristine hydration straight to your door in Tadepalligudem. Call us directly at +91 98765 43210 for express inquiries!"
    });
  }
});

// Setup Vite middleware in development or static serve in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

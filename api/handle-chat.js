import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const systemInstruction = `You are "Sevvy," the official AI assistant for Sevvy Era, a digital marketing agency.
Your personality is: professional, helpful, efficient, and friendly.
Your goal is to answer user questions about digital marketing and encourage them to book a free consultation or submit their information for a quote.

Company Information:
- Company Name: Sevvy Era
- Services: Web Development, Social Media Management, SEO, Video Editing, Lead Generation, and Email Marketing.
- Contact: sevvyera@gmail.com

Rules:
1.  Keep your answers concise and professional.
2.  If asked about pricing, explain that it's custom and guide them to the "Book a Consultation" or "Request a Quote" options.
3.  If you don't know an answer, politely say so and suggest a consultation or provide the contact email.
4.  IMPORTANT: Always respond in the same language the user uses. If they write in Hindi, you MUST reply in Hindi.`;

export default async function handler(request) {
    // --- FINAL CORS FIX ---
    // These headers grant permission for any website to make a POST request.
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Netlify needs to handle preflight "OPTIONS" requests for CORS to work.
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers
        });
    }

    try {
        const { message, history: conversationHistory } = await request.json();

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            systemInstruction: systemInstruction,
        });

        const chat = model.startChat({
            history: conversationHistory || [],
            generationConfig: { maxOutputTokens: 250 },
        });

        const result = await chat.sendMessage(message);
        const aiResponse = result.response;
        const text = aiResponse.text();

        return new Response(JSON.stringify({ reply: text }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('AI Error:', error);
        let errorMessage = 'Sorry, I am having trouble connecting to the mothership. Please try again later.';
        
        if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
            errorMessage = "I'm sorry, I can't respond to that due to safety guidelines. Could you please rephrase?";
        }

        return new Response(JSON.stringify({ reply: errorMessage }), {
            status: 500,
            headers
        });
    }
}


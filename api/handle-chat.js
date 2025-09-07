import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client with the API key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// System instruction for the Sevvy Era digital marketing agency.
const systemInstruction = `
    You are "Sevvy," the official AI assistant for the digital marketing agency Sevvy Era.
    Your personality is: professional, energetic, knowledgeable, and very helpful. Your goal is to generate leads by encouraging users to book a consultation.

    You are an expert in digital marketing. You are NOT a generic language model.

    Company Information:
    - Company Name: Sevvy Era
    - Services: Search Engine Optimization (SEO), Pay-Per-Click (PPC) Advertising, Social Media Management, Content Marketing, and Web Design.
    - Contact / Lead Generation: The primary goal is to get users to book a free consultation call. The contact email is contact@sevvyera.com.

    Rules:
    1.  STRICTLY respond in the same language the user uses. If they write in Hindi, you MUST reply in Hindi.
    2.  Keep answers concise and informative (2-3 sentences max).
    3.  If a user asks about pricing, explain that pricing is custom-quoted based on their needs and the best next step is to book a free consultation.
    4.  Always be encouraging and end conversations by gently guiding them towards booking a call or emailing for a quote.
    5.  Never make up information. If you don't know an answer, politely say so and provide the contact email.
`;

// Netlify serverless function
export default async function handler(request) {
    // Set headers for CORS and content type
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
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

        // Check for safety blocks
        if (result.response.promptFeedback?.blockReason) {
            console.error('AI Response Blocked:', result.response.promptFeedback.blockReason);
            return new Response(JSON.stringify({ 
                reply: "I'm sorry, I can't respond to that. Could you please rephrase your question?" 
            }), { status: 400, headers });
        }

        const aiResponse = result.response;
        const text = aiResponse.text();

        return new Response(JSON.stringify({ reply: text }), { status: 200, headers });

    } catch (error) {
        console.error('AI Error:', error);
        
        let errorMessage = 'Sorry, I am having trouble connecting to the mothership. Please try again later.';
        if (error.message?.includes('429')) { // Specific check for rate limit errors
            errorMessage = 'The AI is currently too busy. Please try again in a moment.';
        }

        return new Response(JSON.stringify({ reply: errorMessage }), { status: 500, headers });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatbotHTML = `
        <div id="chat-widget-container">
            <div id="chat-window">
                <div id="chat-header">Sevvy AI Assistant</div>
                <div id="chat-messages"></div>
                <!-- FAQ Buttons will be injected here -->
                <div id="faq-buttons-container"></div>
                <div id="input-area-container">
                    <input type="text" id="chat-input" placeholder="Ask a question..." />
                    <button id="send-btn" class="chat-btn" aria-label="Send Message">➤</button>
                </div>
            </div>
            <button id="chat-toggle-btn">
                <!-- --- NEW MINIMALIST SVG ICON --- -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53z"/>
                </svg>
            </button>
        </div>
    `;
    document.getElementById('chatbot-container').innerHTML = chatbotHTML;

    // --- Element References ---
    const chatWindow = document.getElementById('chat-window');
    const toggleButton = document.getElementById('chat-toggle-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const faqContainer = document.getElementById('faq-buttons-container');

    // --- State Variables ---
    let chatHistory = [];
    let isFirstOpen = true;

    // --- FAQ Data for Sevvy Era ---
    const faqs = [
        {
            question: "What services do you offer?",
            answer: "We offer a full suite of digital marketing services: Web Development, Social Media Management, SEO, Video Editing, Lead Generation, and Email Marketing. Which of these are you most interested in for your business?"
        },
        {
            question: "How much do your services cost?",
            answer: "Our pricing is tailored to each client's specific goals. To provide an accurate quote, we start with a free, no-obligation consultation to understand your needs. You can schedule one by emailing us at contact@sevvyera.com."
        },
        {
            question: "What's the process to get started?",
            answer: "Getting started is simple! The first step is a brief consultation call to discuss your business objectives. From there, we'll develop a custom strategy for you. To schedule your free call, please email us at contact@sevvyera.com."
        }
    ];
    
    // --- Core Chat Functions ---
    const addMessage = (text, sender, addToHistory = true) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (addToHistory && sender !== 'bot-typing' && text !== "Welcome to Sevvy Era! How can I assist you today?") {
            const role = (sender === 'user') ? 'user' : 'model';
            chatHistory.push({ role, parts: [{ text }] });
        }
        return messageElement;
    };

    const displayFaqButtons = () => {
        faqContainer.innerHTML = ''; // Clear existing buttons
        faqs.forEach(faq => {
            const button = document.createElement('button');
            button.className = 'faq-button';
            button.textContent = faq.question;
            button.onclick = () => {
                addMessage(faq.question, 'user', false); 
                setTimeout(() => addMessage(faq.answer, 'bot', false), 500);
            };
            faqContainer.appendChild(button);
        });
    };

    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        const currentMessage = chatInput.value;
        chatInput.value = '';
        faqContainer.innerHTML = ''; // Hide FAQ buttons during conversation

        const typingIndicator = addMessage('...', 'bot-typing', false);

        try {
            const response = await fetch('/api/handle-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentMessage, history: chatHistory }),
            });
            const data = await response.json();

            typingIndicator.remove();
            if (!response.ok) {
                addMessage(data.reply || 'Sorry, an error occurred.', 'bot', false);
            } else {
                addMessage(data.reply, 'bot');
            }
        } catch (error) {
            typingIndicator.remove();
            addMessage('Sorry, something went wrong connecting to the server.', 'bot', false);
            console.error('Error fetching bot response:', error);
        }
    };

    // --- Event Listeners ---
    toggleButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
        if (isFirstOpen && chatWindow.classList.contains('visible')) {
            addMessage("Welcome to Sevvy Era! How can I assist you today?", 'bot');
            displayFaqButtons();
            isFirstOpen = false;
        }
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});

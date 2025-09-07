document.addEventListener('DOMContentLoaded', () => {
    // This HTML is injected into the body of your client's website.
    const chatbotHTML = `
        <div id="chat-widget-container">
            <div id="chat-window">
                <div id="chat-header">Sevvy AI Assistant</div>
                <div id="chat-messages"></div>
                <div id="chat-input-area">
                    <div id="faq-buttons-container"></div>
                    <div id="lead-capture-form" style="display: none;">
                         <button class="faq-btn back-btn" id="back-from-lead-btn">« Go Back</button>
                        <input type="text" id="lead-name" placeholder="Your Full Name">
                        <input type="email" id="lead-email" placeholder="Your Email Address">
                        <button id="submit-lead-btn">Send Information</button>
                    </div>
                    <div id="calendly-container" style="display: none;">
                        <button class="faq-btn back-btn" id="back-from-calendly-btn">« Go Back</button>
                        <iframe id="calendly-iframe" src="" frameborder="0"></iframe>
                    </div>
                    <div id="text-input-container">
                        <input type="text" id="chat-input" placeholder="Ask a question...">
                        <button id="send-btn" aria-label="Send Message">
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <button id="chat-toggle-btn">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4C19.3137 4 22 6.68629 22 10C22 13.3137 19.3137 16 16 16H8C4.68629 16 2 13.3137 2 10C2 6.68629 4.68629 4 8 4" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="17" cy="9" r="1.5" fill="white"/>
                    <circle cx="7" cy="11" r="1.5" fill="white"/>
                    <path d="M12 4V8" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <path d="M12 16V12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // --- Element References ---
    const chatWidgetContainer = document.getElementById('chat-widget-container');
    const chatWindow = document.getElementById('chat-window');
    const toggleButton = document.getElementById('chat-toggle-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const faqButtonsContainer = document.getElementById('faq-buttons-container');
    const leadCaptureForm = document.getElementById('lead-capture-form');
    const calendlyContainer = document.getElementById('calendly-container');
    const submitLeadBtn = document.getElementById('submit-lead-btn');
    const textInputContainer = document.getElementById('text-input-container');
    const chatInputArea = document.getElementById('chat-input-area');
    const backFromLeadBtn = document.getElementById('back-from-lead-btn');
    const backFromCalendlyBtn = document.getElementById('back-from-calendly-btn');

    // --- State Variables ---
    let chatHistory = [];
    let isFirstOpen = true;
    
    // --- IMPORTANT: Use your specific Calendly EVENT link, not your main profile link ---
    const calendlyUrl = "https://calendly.com/rehanshamal368/15min"; 

    // --- FAQ Data ---
    const faqs = [
        { q: "What are your services?", a: "Sevvy Era offers a full suite of digital marketing services, including Web Development, Social Media Management, SEO, Video Editing, Lead Generation, and advanced Email Marketing campaigns." },
        { q: "How is pricing determined?", a: "All our strategies are custom-built. Pricing depends on the services you need and the scale of your project. The best first step is a free consultation to discuss your specific goals." },
        { q: "Can you show me results?", a: "Absolutely. We focus on data-driven results. In our initial consultation, we can share case studies relevant to your industry and business goals." },
        { q: "Submit My Info for a Quote", type: "lead-capture" },
        { q: "Book a Free Consultation", type: "calendly" }
    ];

    // --- Core Functions ---
    const addMessage = (text, sender, addToHistory = true) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        if (addToHistory && sender !== 'bot-typing') {
            const role = sender === 'user' ? 'user' : 'model';
            chatHistory.push({ role, parts: [{ text }] });
        }
        return messageElement;
    };
    
    const showFaqButtons = () => {
        faqButtonsContainer.innerHTML = '';
        faqs.forEach(faq => {
            const button = document.createElement('button');
            button.className = 'faq-btn';
            button.textContent = faq.q;
            button.onclick = () => handleFaqClick(faq);
            faqButtonsContainer.appendChild(button);
        });
        faqButtonsContainer.style.display = 'flex';
        leadCaptureForm.style.display = 'none';
        calendlyContainer.style.display = 'none';
        textInputContainer.style.display = 'flex';
    };

    const promptForFaqs = () => {
        const promptContainer = document.createElement('div');
        promptContainer.className = 'faq-prompt-container';
        const promptButton = document.createElement('button');
        promptButton.textContent = 'Show Main Questions';
        promptButton.className = 'faq-btn';
        promptButton.onclick = () => {
            addMessage('Show Main Questions', 'user', false);
            showFaqButtons();
            promptContainer.remove();
        };
        promptContainer.appendChild(promptButton);
        messagesContainer.appendChild(promptContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const handleFaqClick = (faq) => {
        addMessage(faq.q, 'user', false);
        faqButtonsContainer.style.display = 'none';
        
        if (faq.a) {
            addMessage(faq.a, 'bot', false);
            promptForFaqs();
        }
        if (faq.type === 'lead-capture') {
            textInputContainer.style.display = 'none';
            leadCaptureForm.style.display = 'flex';
        }
        if (faq.type === 'calendly') {
            textInputContainer.style.display = 'none';
            const iframe = document.getElementById('calendly-iframe');
            if (iframe.src !== calendlyUrl) {
                iframe.src = calendlyUrl;
            }
            calendlyContainer.style.display = 'block';
        }
    };
    
    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        chatInput.value = '';
        faqButtonsContainer.style.display = 'none';
        
        const typingIndicator = addMessage('...', 'bot-typing', false);

        try {
            const response = await fetch('/api/handle-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, history: chatHistory }),
            });
            const data = await response.json();
            typingIndicator.remove();

            if (!response.ok) {
                addMessage(data.reply || 'Sorry, an error occurred.', 'bot-error', false);
            } else {
                addMessage(data.reply, 'bot');
            }
        } catch (error) {
            typingIndicator.remove();
            addMessage('Sorry, something went wrong connecting to the server.', 'bot-error', false);
        }
        
        const lowerCaseMessage = userMessage.toLowerCase();
        if (lowerCaseMessage === 'ok' || lowerCaseMessage === 'okay' || lowerCaseMessage === 'thanks') {
             addMessage("You're welcome! How else can I assist you?", 'bot', false);
             showFaqButtons();
        } else {
             promptForFaqs();
        }
    };
    
    const submitLead = async () => {
        const name = document.getElementById('lead-name').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        if (!name || !email) {
            addMessage("Please fill out both your name and email.", 'bot-error', false);
            return;
        }

        addMessage("Thank you! Our team will be in touch shortly.", 'bot', false);
        showFaqButtons();

        try {
            await fetch('/api/handle-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
        } catch (error) {
            console.error("Failed to submit lead:", error);
        }
    };

    // --- Event Listeners ---
    toggleButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
        if (isFirstOpen && chatWindow.classList.contains('visible')) {
            addMessage('Welcome to Sevvy Era! How can I assist you today?', 'bot', false);
            showFaqButtons();
            isFirstOpen = false;
        }
        const proactiveMessage = document.getElementById('proactive-message');
        if (proactiveMessage) proactiveMessage.remove();
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    submitLeadBtn.addEventListener('click', submitLead);
    backFromLeadBtn.addEventListener('click', showFaqButtons);
    backFromCalendlyBtn.addEventListener('click', showFaqButtons);
    
    // --- NEW: Proactive Message Logic ---
    const showProactiveMessage = () => {
        if (chatWindow.classList.contains('visible')) return;

        const messageBubble = document.createElement('div');
        messageBubble.id = 'proactive-message';
        messageBubble.textContent = 'How may I assist you?';
        chatWidgetContainer.appendChild(messageBubble);

        setTimeout(() => {
            messageBubble.classList.add('visible');
        }, 100);

        setTimeout(() => {
            messageBubble.classList.remove('visible');
            setTimeout(() => messageBubble.remove(), 500);
        }, 10000);
    };
    
    setTimeout(showProactiveMessage, 4000);
});


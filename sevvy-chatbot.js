document.addEventListener('DOMContentLoaded', () => {
    // This HTML is injected into the #chatbot-container div in your client's HTML file.
    const chatbotHTML = `
        <div id="chat-widget-container">
            <div id="chat-window">
                <div id="chat-header">Sevvy AI Assistant</div>
                <div id="chat-messages"></div>
                <div id="chat-input-area">
                    <div id="faq-buttons-container"></div>
                    <div id="lead-capture-form" style="display: none;">
                        <input type="text" id="lead-name" placeholder="Your Full Name">
                        <input type="email" id="lead-email" placeholder="Your Email Address">
                        <button id="submit-lead-btn">Send Information</button>
                    </div>
                    <div id="calendly-container" style="display: none;">
                        <iframe id="calendly-iframe" src="" frameborder="0"></iframe>
                    </div>
                    <div id="text-input-container">
                        <input type="text" id="chat-input" placeholder="Ask a question...">
                        <button id="send-btn" aria-label="Send Message">➤</button>
                    </div>
                </div>
            </div>
            <button id="chat-toggle-btn">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="black"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            </button>
        </div>
    `;
    // Use insertAdjacentHTML on the body to avoid replacing existing content
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // --- Element References ---
    const chatWindow = document.getElementById('chat-window');
    const toggleButton = document.getElementById('chat-toggle-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const faqButtonsContainer = document.getElementById('faq-buttons-container');
    const leadCaptureForm = document.getElementById('lead-capture-form');
    const calendlyContainer = document.getElementById('calendly-container');
    const submitLeadBtn = document.getElementById('submit-lead-btn');

    // --- State Variables ---
    let chatHistory = [];
    let isFirstOpen = true;
    let proactiveTimeout;
    const calendlyUrl = "https://calendly.com/bobscar964/30min";

    // --- FAQ Data ---
    const faqs = [
        { q: "What services do you offer?", a: "Sevvy Era is a full-service digital marketing agency. We specialize in Web Development, Social Media Management, SEO, Video Editing, Lead Generation, and Email Marketing." },
        { q: "How does your pricing work?", a: "Our pricing is customized for each client based on their specific needs. To get a detailed quote, the best step is to book a free 15-minute consultation with our team." },
        { q: "What's the process to start?", a: "The first step is a free consultation to discuss your goals. From there, we'll create a custom strategy and proposal for your review. Are you ready to book a call?" },
        { q: "Capture my information", type: "lead-capture" },
        { q: "Book a free consultation", type: "calendly" }
    ];

    // --- Core Functions ---
    const addMessage = (text, sender, addToHistory = true) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = text; // Use innerHTML to render links
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
    };

    const handleFaqClick = (faq) => {
        addMessage(faq.q, 'user', false);
        if (faq.a) {
            addMessage(faq.a, 'bot', false);
        }
        if (faq.type === 'lead-capture') {
            leadCaptureForm.style.display = 'flex';
            faqButtonsContainer.style.display = 'none';
        }
        if (faq.type === 'calendly') {
            const iframe = document.getElementById('calendly-iframe');
            if(iframe.src !== calendlyUrl) {
                iframe.src = calendlyUrl;
            }
            calendlyContainer.style.display = 'block';
            faqButtonsContainer.style.display = 'none';
        }
    };
    
    const sendMessage = async () => {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        chatInput.value = '';
        faqButtonsContainer.style.display = 'none'; // Hide FAQs on custom message
        
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
                addMessage(data.reply || 'Sorry, an error occurred.', 'bot', false);
            } else {
                addMessage(data.reply, 'bot');
            }
        } catch (error) {
            typingIndicator.remove();
            addMessage('Sorry, something went wrong connecting to the server.', 'bot', false);
        }
        
        // Show the "Bring back FAQs" button
        faqButtonsContainer.innerHTML = '<button id="show-faqs-again" class="faq-btn">Show Main Questions</button>';
        document.getElementById('show-faqs-again').onclick = showFaqButtons;
        faqButtonsContainer.style.display = 'flex';
    };
    
    const submitLead = async () => {
        const name = document.getElementById('lead-name').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        if(!name || !email) {
            addMessage("Please fill out both your name and email.", 'bot-error', false);
            return;
        }

        addMessage("Thank you! Our team will be in touch shortly.", 'bot', false);
        leadCaptureForm.style.display = 'none';
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
        // Clear proactive timeout if user opens manually
        clearTimeout(proactiveTimeout);
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    submitLeadBtn.addEventListener('click', submitLead);
    
    // --- Proactive Engagement ---
    const startProactiveTimer = () => {
        proactiveTimeout = setTimeout(() => {
            if (!chatWindow.classList.contains('visible')) {
                addMessage("Hi there! It looks like you're interested in our services. Do you have any questions I can answer?", 'bot', false);
                chatWindow.classList.add('visible');
                showFaqButtons();
                isFirstOpen = false;
            }
        }, 20000); // 20 seconds
    };
    
    startProactiveTimer();
    document.addEventListener('click', () => {
        clearTimeout(proactiveTimeout);
        startProactiveTimer();
    });
});

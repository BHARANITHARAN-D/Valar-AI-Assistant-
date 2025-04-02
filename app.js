// Select elements
const btn = document.querySelector('.talk');
const contentArea = document.querySelector('.content-area');
const textInput = document.querySelector('.text-input');
const sendBtn = document.querySelector('.send-btn');

// Example contact list as an array of objects with email IDs
const contacts = [
    { name: "amma", phone: "9360303500", email: "amma@example.com" },
    { name: "appa", phone: "9443054109", email: "appa@example.com" },
    { name: "anna 70", phone: "7010930808", email: "anna70@example.com" },
    { name: "anna 87", phone: "+918760772518", email: "anna87@example.com" },
];

// Your Gemini AI API key and endpoint
const geminiApiKey = 'YOUR_API_KEY'; // Replace with your actual API key
const geminiApiEndpoint = 'https://api.gemini.ai/v1/your-endpoint'; // Replace with the actual endpoint

// Cache for storing questions and answers
const answerCache = {};

// Function to add message to content area
function addMessage(message, isUser  = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isUser  ? 'user-message' : 'bot-message');
    messageDiv.textContent = message;
    contentArea.appendChild(messageDiv);
    contentArea.scrollTop = contentArea.scrollHeight;
}

// Function to speak text
function speak(text, language) {
    addMessage(text);
    const textSpeak = new SpeechSynthesisUtterance(text);
    textSpeak.rate = 1;
    textSpeak.volume = 1;
    textSpeak.pitch = 1;
    textSpeak.lang = language;
    window.speechSynthesis.speak(textSpeak);
}

// Function to wish based on the time of day
function wishMe() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) {
        greeting = "Good Morning Boss...";
    } else if (hour < 17) {
        greeting = "Good Afternoon Master...";
    } else {
        greeting = "Good Evening Sir...";
    }
    addMessage(greeting);
    speak(greeting, 'en-US');
}

// Initialize the assistant on page load
window.addEventListener('load', () => {
    speak("Initializing VALARMATHI...", 'en-US');
    wishMe();
});

// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

// Event listener for speech recognition results
recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    addMessage(transcript, true);
    takeCommand(transcript.toLowerCase());
};

// Event listener for button click to start listening
btn.addEventListener('click', () => {
    textInput.value = '';
    addMessage("Listening...", true);
    recognition.start();
});

// Event listener for send button
sendBtn.addEventListener('click', () => {
    const command = textInput.value.trim();
    if (command) {
        addMessage(command, true);
        takeCommand(command.toLowerCase());
        textInput.value = '';
    }
});

// Event listener for Enter key
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// Function to handle commands
async function takeCommand(message) {
    addMessage("Processing...");
    if (message.includes('search')) {
        const question = message.replace(/valar\s*/, '').trim();
        if (answerCache[question]) {
            const cachedAnswer = answerCache[question];
            speak(cachedAnswer, 'en-US');
            addMessage(cachedAnswer);
        } else {
            await handleGeminiQuery(question);
        }
    } else if (message.includes('email')) {
        handleEmailCommand(message);
    } else if (message.includes('call')) {
        handleCallCommand(message);
    } else if (message.includes('whatsapp') || message.includes('message')) {
        handleWhatsAppCommand(message);
    } else if (message.includes('time')) {
        const currentTime = new Date().toLocaleTimeString();
        speak(`The current time is ${currentTime}`, 'en-US');
    } else if (message.includes('date')) {
        const currentDate = new Date().toLocaleDateString();
        speak(`Today's date is ${currentDate}`, 'en-US');
    } else if (message.includes('calculate') || message.includes('what is')) {
        const calculation = message.replace(/calculate|what is/, '').trim();
        const result = calculate(calculation);
        speak(result, 'en-US');
    } else {
        speak("Sorry, I didn't understand that.", 'en-US');
    }
}

// Function to handle Gemini AI queries
async function handleGeminiQuery(question) {
    const geminiResponse = await callGeminiAPI(question);
    if (geminiResponse) {
        answerCache[question] = geminiResponse;
        speak(geminiResponse, 'en-US');
        addMessage(geminiResponse);
    } else {
        speak("Sorry, I couldn't get a response from Gemini AI.", 'en-US');
    }
}

// Function to call the Gemini AI API
async function callGeminiAPI(inputText) {
    try {
        const response = await fetch(geminiApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${geminiApiKey}`
            },
            body: JSON.stringify({ text: inputText })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) {
            if (result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.warn("Gemini API: No text content found in the response.");
                return "Gemini API: No text content found in the response.";
            }
        } else {
            console.warn("Gemini API: No candidates found in the response.");
            return "Gemini API: No candidates found in the response.";
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return "Sorry, I couldn't get a response from Gemini AI.";
    }
}

// Function to handle email command
function handleEmailCommand(message) {
    const parts = message.split(/email /);
    if (parts.length > 1) {
        const contactName = parts[1].split(' ')[0];
        const emailMessage = parts[1].substring(contactName.length).trim();
        sendEmail(contactName, emailMessage);
    } else {
        speak("Please specify the contact name and message.", 'en-US');
    }
}

// Function to send an email
function sendEmail(contactName, emailMessage) {
    const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
    if (contact) {
        const emailAddress = contact.email;
        const subject = "Message from VALARMATHI";
        const body = encodeURIComponent(emailMessage);
        window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`);
        speak(`Opening email to ${contactName} with your message.`, 'en-US');
    } else {
        speak(`Sorry, I could not find the contact named ${contactName}.`, 'en-US');
    }
}

// Function to handle call command
function handleCallCommand(message) {
    const parts = message.split('call ');
    if (parts.length > 1) {
        const contactName = parts[1].trim();
        callContact(contactName);
    } else {
        speak("Please specify the contact name to call.", 'en-US');
    }
}

// Function to call a contact
function callContact(contactName) {
    const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
    if (contact) {
        window.open(`tel:${contact.phone}`);
        speak(`Calling ${contactName}.`, 'en-US');
    } else {
        speak(`Sorry, I could not find the contact named ${contactName}.`, 'en-US');
    }
}

// Function to handle WhatsApp command
function handleWhatsAppCommand(message) {
    const parts = message.split(/whatsapp |message /);
    if (parts.length > 1) {
        const contactName = parts[1].split(' ')[0];
        const whatsappMessage = parts[1].substring(contactName.length).trim();
        sendMessageViaWhatsApp(contactName, whatsappMessage);
    } else {
        speak("Please specify the contact name and message.", 'en-US');
    }
}

// Function to send a message via WhatsApp
function sendMessageViaWhatsApp(contactName, message) {
    const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
    if (contact) {
        const phoneNumber = contact.phone.replace(/\D+/g, '');
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
        speak(`Opening WhatsApp to message ${contactName} with "${message}".`, 'en-US');
    } else {
        speak(`Sorry, I could not find the contact named ${contactName}.`, 'en-US');
    }
}

// Function to perform calculations
function calculate(expression) {
    expression = expression
        .replace(/plus/g, '+')
        .replace(/add/g, '+')
        .replace(/minus/g, '-')
        .replace(/subtract/g, '-')
        .replace(/times/g, '×')
        .replace(/multiply/g, '×')
        .replace(/divided by/g, '/')
        .replace(/divide/g, '/')
        .replace(/floor divide/g, '//')
        .replace(/percentage/g, '%');

    const numbers = expression.match(/(\d+|\+|\-|\×|\/|\/\/|%)/g);
    if (!numbers || numbers.length < 3) {
        return "Please provide a valid calculation.";
    }

    const num1 = parseFloat(numbers[0]);
    const operator = numbers[1];
    const num2 = parseFloat(numbers[2]);
    let result;

    switch (operator) {
        case '+':
        case 'plus':
            result = num1 + num2;
            return `The result of addition is ${result}.`;
        case '-':
        case 'minus':
            result = num1 - num2;
            return `The result of subtraction is ${result}.`;
        case '×':
        case '*':
        case 'times':
        case 'mul':
            result = num1 * num2;
            return `The result of multiplication is ${result}.`;
        case '/':
        case 'divide':
            result = num1 / num2;
            return `The result of division is ${result}.`;
        case '//':
        case 'floor divide':
            result = Math.floor(num1 / num2);
            return `The result of floor division is ${result}.`;
        case '%':
        case 'percentage':
            result = num1 / 100;
            return `The percentage of ${num1} is ${result}.`;
        default:
            return "Sorry, I couldn't understand the calculation request.";
    }
}

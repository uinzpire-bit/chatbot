/* script.js (Client-Side with CORS fix) */

// ใส่ URL ของ Web App ที่คุณ Deploy (ต้องลงท้ายด้วย /exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzze_VNwlG4kh7L5_NO7KMMD3-ozRPsqgk4waTf131yOasSnPFlbClIoRJSSUJFJQ7e/exec"; 

const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let conversationHistory = [];

function addMessage(text, sender) {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.classList.add("message-wrapper", sender);

  if (sender === "bot") {
    const avatarImg = document.createElement("img");
    avatarImg.src = "https://drive.google.com/thumbnail?id=1bQmQ26RgFhTobPGGukhBkHc2UBzvGCtv";
    avatarImg.classList.add("bot-avatar");
    wrapperDiv.appendChild(avatarImg);
  }

  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("message-bubble");

  if (sender === "bot" && typeof marked !== 'undefined') {
    bubbleDiv.innerHTML = marked.parse(text); 
  } else {
    bubbleDiv.textContent = text;
  }

  wrapperDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(wrapperDiv);
  scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  userInput.style.height = '50px';

  conversationHistory.push({
    role: "user",
    parts: [{ text: text }]
  });

  const loadingId = 'loading-' + Date.now();
  const wrapperDiv = document.createElement("div");
  wrapperDiv.classList.add("message-wrapper", "bot");
  wrapperDiv.id = loadingId;
  wrapperDiv.innerHTML = `
    <img src="https://drive.google.com/thumbnail?id=1bQmQ26RgFhTobPGGukhBkHc2UBzvGCtv" class="bot-avatar">
    <div class="message-bubble">...</div>
  `;
  chatMessages.appendChild(wrapperDiv);
  scrollToBottom();

  try {
    // --- ส่วนที่แก้ CORS ---
    // ใช้ header text/plain เพื่อเลี่ยง Preflight check
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "text/plain;charset=utf-8" 
      },
      body: JSON.stringify({ history: conversationHistory })
    });

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const data = await response.json();
    document.getElementById(loadingId)?.remove();

    if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }

    if (data.candidates && data.candidates.length > 0) {
        const botReply = data.candidates[0].content.parts[0].text;
        addMessage(botReply, "bot");
        conversationHistory.push({
            role: "model",
            parts: [{ text: botReply }]
        });
    } else {
        throw new Error("No candidates returned");
    }

  } catch (error) {
    document.getElementById(loadingId)?.remove();
    addMessage("ระบบขัดข้องชั่วคราว: " + error.message, "bot");
    console.error(error);
  }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener('input', function() {
    this.style.height = '50px';
    const newHeight = Math.min(this.scrollHeight, 150);
    this.style.height = (newHeight > 50 ? newHeight : 50) + 'px';
});
document.addEventListener('DOMContentLoaded', () => {
    const rawPrompt = document.getElementById('raw-prompt').textContent;
    const contentDiv = document.getElementById('prompt-content');
    
    // Strip the very first newline that might be added to textContent, leaving prompt completely intact
    const promptText = rawPrompt.replace(/^\n/, '');
    
    // For rendering: strip out the python string wrapping for clean markdown reading
    let displayContent = promptText;
    displayContent = displayContent.replace(/# direct\s*# System Prompt:[^\n]*\n\nsystem_prompt_template = """/, '');
    displayContent = displayContent.replace(/"""\s*$/, '');
    
    // Render the markdown to the div
    contentDiv.innerHTML = marked.parse(displayContent);
    
    // Highlight syntax inside any markdown code blocks
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    // Copy functionality
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(promptText);
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Copied!</span>
            `;
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });

    // Subtle float-up animation for the UI elements on load
    const wrapper = document.querySelector('.code-wrapper');
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        wrapper.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'translateY(0)';
    }, 100);
    
    const header = document.querySelector('.header');
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        header.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 300);

    // ==========================================
    // Dialogue Viewer Logic
    // ==========================================
    const fileSelect = document.getElementById('fileSelect');
    const convoSelect = document.getElementById('convoSelect');
    const chatContainer = document.getElementById('chat-container');

    let currentDataset = [];

    async function loadDataset(filename) {
        chatContainer.innerHTML = '<div class="chat-loading">Loading dataset...</div>';
        try {
            const response = await fetch(`Dialogues/${filename}`);
            if (!response.ok) throw new Error('Network response was not ok');
            currentDataset = await response.json();
            
            // Populate Convo Select
            convoSelect.innerHTML = '';
            currentDataset.forEach((item, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                const questionPrefix = item.seed_qa.question.substring(0, 50) + (item.seed_qa.question.length > 50 ? '...' : '');
                opt.textContent = `Q${item.seed_qa.index}: ${questionPrefix}`;
                convoSelect.appendChild(opt);
            });

            if (currentDataset.length > 0) {
                renderConversation(0);
            }
        } catch (error) {
            console.error('Error loading dataset:', error);
            chatContainer.innerHTML = `<div class="chat-loading" style="color:#ef4444">Failed to load ${filename}.<br>Make sure serving via local web server.</div>`;
        }
    }

    function renderConversation(index) {
        const convoData = currentDataset[index];
        if (!convoData) return;

        chatContainer.innerHTML = ''; // clear

        const conversation = convoData.conversation || [];
        
        // Add a context header bubble
        const contextBubble = document.createElement('div');
        contextBubble.innerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; border-left:4px solid #8b5cf6; margin-bottom:1rem; font-size:0.9rem;">
                <strong>Objective:</strong> ${convoData.seed_qa.learning_objective}<br>
                <strong>Full Question:</strong> ${convoData.seed_qa.question}
            </div>
        `;
        chatContainer.appendChild(contextBubble);

        conversation.forEach((msg) => {
            const row = document.createElement('div');
            row.className = `message-row ${msg.role === 'tutor' ? 'tutor-row' : 'student-row'}`;
            
            const contentHTML = marked.parse(msg.content);

            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.role === 'tutor' ? 'tutor-bubble' : 'student-bubble'}`;
            
            bubble.innerHTML = `
                <div class="chat-header ${msg.role === 'tutor' ? 'tutor-header' : 'student-header'}">
                    ${msg.role === 'tutor' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path><path d="M12 12 2.1 7.1"></path></svg> Tutor' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 1 0-16 0"></path></svg> Student'}
                </div>
                <div class="chat-content markdown-body" style="padding:0; min-height:auto; font-size:0.95rem;">${contentHTML}</div>
            `;
            
            row.appendChild(bubble);
            chatContainer.appendChild(row);
        });

        // Re-run highlighting for any code blocks inside the chat
        chatContainer.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    fileSelect.addEventListener('change', (e) => {
        loadDataset(e.target.value);
    });

    convoSelect.addEventListener('change', (e) => {
        renderConversation(e.target.value);
    });

    // Load initial dataset
    loadDataset(fileSelect.value);
});

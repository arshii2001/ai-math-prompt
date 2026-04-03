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
});

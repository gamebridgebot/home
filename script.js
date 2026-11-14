const mobileBtn = document.getElementById('mobileMenuBtn');
const navbar = document.getElementById('navbar');

mobileBtn.addEventListener('click', () => {
    navbar.classList.toggle('mobile-active');
});

document.getElementById('currentYear').textContent = new Date().getFullYear();

function copyCode(button) {
    navigator.clipboard.writeText('/verify 902-881');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.borderColor = 'var(--highlight)';
    setTimeout(() => {
        button.textContent = originalText;
    }, 1800);
}

const terminalScreen = document.getElementById('terminalScreen');

function simulateEvent(type) {
    let lines = [];

    if (type === 'kick') {
        lines = [
            { text: 'Discord -> [Mod_Alex] issued command: /kick User_Gamer3', class: 'discord' },
            { text: 'GameBridge -> Verifying linked player ID #1209...', class: 'success' },
            { text: 'GameServer <- Packet Received: Player User_Gamer3 was kicked (Reason: Mod Discretion).', class: 'game' }
        ];
    } else if (type === 'reward') {
        lines = [
            { text: 'GameServer -> Player [Sarah_T] completed Quest: "Dragon Slayer"', class: 'game' },
            { text: 'GameBridge -> Mapping Game ID to Discord Account: @SarahT', class: 'success' },
            { text: 'Discord <- Role "@Quest Champion" assigned & private message sent.', class: 'discord' }
        ];
    } else if (type === 'broadcast') {
        lines = [
            { text: 'Discord -> [Admin] executed: /broadcast "Restarting in 10 mins"', class: 'discord' },
            { text: 'GameBridge -> Relaying to all active game clusters...', class: 'success' },
            { text: 'GameServer <- Broadcast rendered in server HUD across 3 realms.', class: 'game' }
        ];
    }

    lines.forEach((item, index) => {
        setTimeout(() => {
            const div = document.createElement('div');
            div.className = `terminal-line ${item.class}`;
            div.textContent = item.text;
            terminalScreen.appendChild(div);
            terminalScreen.scrollTop = terminalScreen.scrollHeight;
        }, index * 400);
    });
}

function clearTerminal() {
    terminalScreen.innerHTML = '<div class="terminal-line">[System] Screen cleared. Ready for next test...</div>';
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        navbar.style.borderBottomColor = 'rgba(95, 191, 249, 0.3)';
    } else {
        navbar.style.borderBottomColor = 'var(--surface-border)';
    }
});
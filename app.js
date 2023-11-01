let messages = [];
let response = []
let actualLine = 0;
let opened = false;
let openedOnce = false;
let time;
let userIp;
let userLocation;
let awayTimer;
let firstContact;
let lastContact;
var audio = new Audio('./media/pop.mp3');
audio.volume = .8




// --------------------------------
// Bot Configuration

const BOT_NAME = 'Tizify Bot'
const COLOR_THEME = '#8335fd';
const ICON = './media/tizify.svg'

const RESPONSE_VALIDATIONS = Object.freeze({
    TEXT: /^[a-zA-Z0-9 ]*$/,
    EMAIL: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    PHONE_NUMBER: /^[0-0]+$/,
    NAME: /^(?=.{1,40}$)[a-zA-ZáéíóúüñÁÉÍÓÚÑ]+(?:[\s][a-zA-ZáéíóúüñÁÉÍÓÚÑ]+)*$/,
});

let DIALOGUE_VARIABLES = {
    'NAME': null,
    'EMAIL': null,
}

let DIALOGUE = function(){
    return [
        {
            message: `  <p>¡Saludos! Soy <strong>${BOT_NAME}</strong>, tu asistente virtual. Estoy aquí para brindarte ayuda y resolver tus consultas.
                        <br><br>
                        ¿En qué puedo asistirte hoy? 👋 </p>`,
            required: true,
        },
        {
            message: `  <p>Sera un placer ayudarte. 😊 ¿Cuál es tu nombre?</p>`,
            validation: "NAME",
            variable: "NAME",
            required: true,
        },
        {
            message: `  <p>Un gusto ${DIALOGUE_VARIABLES['NAME']}. 🤝 ¿Cuál es tu correo electrónico?</p>`,
            validation: "EMAIL",
            variable: "EMAIL",
            required: true,
        },
        {
            message: `  <p>🤲 Excelente, en breve un miembro del equipo estará atendiendo tu consulta a través del correo electrónico. <br><br> ¿Deseás añadir algo más? 📧</p>`,
            send: true,
            required: false,
        },
        {
            message: `  <p>Perfecto, en momentos nos estaremos comunicando con usted.</p>`,
            required: false,
        },
        {
            message: `  <p>Muchas gracias por comunicarte! 🤲</p>`,
            required: false,
        }
    ]
}

const DIALOGUE_ERRORS = {
    TEXT: `<p>Oops... no entendimos tu respuesta, intenta reescribirlo nuevamente.</p>`,
    NAME: `<p>Parece que tu nombre no es valido, intenta reescribirlo nuevamente.</p>`,
    EMAIL: `<p>Oops, no parece un email valido. Intenta nuevamente.</p>`,
}

const AWAY_DIALOGUE = `¿Aún sigues ahí?`

// --------------------------------





let stage = 0;

window.addEventListener('load', () => {
    const quibiChat = document.getElementById('quibi-chat');
    const quibiOpenButton = document.getElementById('quibi-button');
    const quibiTypeForm = document.getElementById('quibi-type-form');
    const quibiCloseButton = document.getElementById('quibi-chat--close');
    const quibiInput = document.getElementById('quibi-type-input');
    const quibiName = document.getElementById('quibi-bot--name');
    const quibiButtonIcon = document.getElementById('quibi-button--icon');
    const quibiHeaderIcon = document.getElementById('quibi-header--icon');

    quibiButtonIcon.src = quibiHeaderIcon.src = ICON;

    quibiName.textContent = BOT_NAME;
    document.documentElement.style.setProperty('--main', COLOR_THEME);
    document.documentElement.style.setProperty('--darkmain', COLOR_THEME);


    quibiOpenButton.addEventListener('click', openQuibi);
    quibiCloseButton.addEventListener('click', closeQuibi);
    quibiOpenButton.addEventListener('animationend', ()=>{
        if(!quibiOpenButton.classList.contains('active')){
            quibiOpenButton.style.display = 'none';
        }
    });
    quibiChat.addEventListener('animationend', ()=>{
        if(!quibiChat.classList.contains('opened')){
            quibiChat.style.display = 'none';
        }
    });



    quibiTypeForm.addEventListener('submit', function(e){
        e.preventDefault();
        if(quibiInput.value != ''){
            sendClientMessage(quibiInput.value);
        }
    });


    initUserInformation();

})


const sendBotMessage = (body) => {
    const typeSubmit = document.getElementById('quibi-type-submit');
    const messagesContainer = document.getElementById('quibi-messages');
    let messageBuble = document.createElement('div');

    updateTime();

    typeSubmit.disabled = true;
    messageBuble.classList.add('quibi-messages-bubble', 'typing', 'received');

    if(messages.length == 0 || (messages.length >= 1 && messages[messages.length - 1].sender !== BOT_NAME)){
        messageBuble.innerHTML = `
        <header class="quibi-messages-bubble--header">
            <img src="${ICON}" width="20" height="20" alt="">
            <h4>${BOT_NAME}</h4>
            <p class="time">${time}</p>
        </header>`;
    }

    messageBuble.innerHTML += `
                
                <div class="quibi-messages-bubble--content">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>`;


    setTimeout(() => {                  
        messagesContainer.appendChild(messageBuble);
        messagesContainer.scrollTo(0, messagesContainer.scrollHeight);

        setTimeout(() => {
            if(!opened) showNotification();
            audio.play();
            messagesContainer.removeChild(messageBuble);
            messageBuble = document.createElement('div');
            messageBuble.classList.add('quibi-messages-bubble', 'received');

            if(messages.length == 0 || (messages.length >= 1 && messages[messages.length - 1].sender !== BOT_NAME)){
                messageBuble.innerHTML = `
                    <header class="quibi-messages-bubble--header">
                        <img src="${ICON}" width="20" height="20" alt="">
                        <h4>${BOT_NAME}</h4>
                        <p class="time">${time}</p>
                    </header>`;
            }
            
            messageBuble.innerHTML += `
                <div class="quibi-messages-bubble--content">
                    ${body}
                </div>`;


            messages.push({
                sender: BOT_NAME,
                message: body
            });
    
            messagesContainer.appendChild(messageBuble);
            messagesContainer.scrollTo(0, messagesContainer.scrollHeight);

            typeSubmit.disabled = false;

            if(DIALOGUE()[stage].required && !awayTimer){
                awayTimer = setTimeout(() => {
                    sendBotMessage(AWAY_DIALOGUE)
                }, (120 * 1000));
            }
            
        }, 1500);
    }, 500);

    if(DIALOGUE()[stage].send){
        console.log('------[ SEND MAIL ]-----')
        console.log(updateUserInformation())
        console.log(response)
        console.log('------------------------')
    }

}

const sendClientMessage = (body) => {
    clearTimeout(awayTimer);
    awayTimer = null;
    
    const quibiInput = document.getElementById('quibi-type-input');
    const messagesContainer = document.getElementById('quibi-messages');
    const typeSubmit = document.getElementById('quibi-type-submit');

    body = body.trim();

    let text = document.createTextNode(body);
    let messageBuble = document.createElement('div');
    let messageContent = document.createElement('div');

    updateTime();

    messageBuble.classList.add('quibi-messages-bubble', 'sent');
    messageContent.classList.add('quibi-messages-bubble--content');
    messageContent.appendChild(text);

    messageBuble.innerHTML = `
        <header class="quibi-messages-bubble--header">
            <h4>Tú</h4>
            <p class="time">${time}</p>
        </header>`;

    messages.push({
        sender: 'Client',
        message: text.data,
    });

    messageBuble.appendChild(messageContent);
        
    messagesContainer.appendChild(messageBuble);
    messagesContainer.scrollTo(0, messagesContainer.scrollHeight);

    quibiInput.value = '';

    if(DIALOGUE()[stage].validation && !validateResponse(text.data)){
        sendBotValidationMessage(DIALOGUE()[stage].validation)
    }else{
        if(DIALOGUE()[stage].variable) DIALOGUE_VARIABLES[DIALOGUE()[stage].variable] = text.data;
        response.push(text.data);
        stage++;

        if(DIALOGUE()[stage]) sendBotMessage(DIALOGUE()[stage].message);
    }

    if(response.length == 1){
        console.log(getUserInformation())
        console.log(response)
    }
    else{
        console.log(updateUserInformation());
        console.log(response)
    }


    typeSubmit.disabled = true;
}

const validateResponse = (response) => {
    return RESPONSE_VALIDATIONS[DIALOGUE()[stage].validation].test(response);
}

const sendBotValidationMessage = (VALIDATION) => {
    sendBotMessage(DIALOGUE_ERRORS[VALIDATION]);
}

const updateTime = () => {
    var date = new Date();
    time = date.toLocaleTimeString('en-US', { hourCycle: 'h23' }).slice(0,5);
}


const showNotification = () => {
    const notification = document.getElementById('quibi-bot--notification');
    notification.style.display = 'block'
}

const openQuibi = () => {
    if(!openedOnce){
        sendBotMessage(DIALOGUE()[stage].message);
        openedOnce = true;
    }

    const notification = document.getElementById('quibi-bot--notification');
    notification.style.display = 'none'

    opened = true;
    const quibiChat = document.getElementById('quibi-chat');
    const quibiOpenButton = document.getElementById('quibi-button');
    quibiChat.classList.add('opened');
    quibiChat.style.display = 'flex'
    quibiChat.style.animation = 'moveUp .4s forwards .3s'
    quibiOpenButton.classList.remove('active');
    quibiOpenButton.style.animation = 'moveDown .4s forwards'
    quibiOpenButton.style.transform = 'translateY(150%)'
}

const closeQuibi = () => {
    opened = false;
    const quibiChat = document.getElementById('quibi-chat');
    const quibiOpenButton = document.getElementById('quibi-button');
    quibiChat.classList.remove('opened');
    quibiChat.style.display = 'flex'
    quibiChat.style.animation = 'moveDown .4s forwards'
    quibiOpenButton.classList.add('active');
    quibiOpenButton.style.display = 'flex'
    quibiOpenButton.style.animation = 'moveUp .4s forwards .3s'    
}

const initUserInformation = async() => {
    const quibiOpenButton = document.getElementById('quibi-button');

    userIp = await fetch('https://api.ipify.org/').then(response => response.text());
    userLocation = await fetch('http://ip-api.com/json').then(response => response.json());

    quibiOpenButton.classList.add('active');
    quibiOpenButton.style.display = 'flex'
    quibiOpenButton.style.animation = 'moveUp .4s forwards .3s'
}

const getUserInformation = () => {
    let date = new Date();
    firstContact = lastContact = {
        date: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
        time: date.toLocaleTimeString('en-US', { hourCycle: 'h23' }).slice(0,5)
    }

    let isMobile = checkMobileDevice();

    return {
        firstContact: firstContact,
        lastContact: lastContact,
        ip: userIp,
        country: userLocation.country,
        city: userLocation.city,
        mobile: isMobile,
        site: document.title,
        generated_on: window.location.href,
        browser: navigator.userAgent,
    }
}

const updateUserInformation = () => {
    let date = new Date();
    lastContact = {
        date: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
        time: date.toLocaleTimeString('en-US', { hourCycle: 'h23' }).slice(0,5)
    }

    return {
        lastContact: lastContact,
    }
}


const checkMobileDevice = () => {
    const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
}
async function flashMessage(text) {
    const flashes = document.getElementById('flashes');
    const flash = document.createElement('li');
    flash.textContent = text;
    flashes.appendChild(flash);
    setTimeout(() => {
        flashes.children[0].remove();
    }, 5000);
}


function calculateUptime() {
    const launchDate = new Date(2025, 7, 21, 13, 37, 11);
    const now = new Date();
    const diff = now - launchDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('run-day').textContent = days;
    document.getElementById('run-hour').textContent = hours;
    document.getElementById('run-min').textContent = minutes;
    document.getElementById('run-sec').textContent = seconds;
}


document.addEventListener('DOMContentLoaded', () => {
    calculateUptime();
    setInterval(calculateUptime, 1000);
});

document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', () => {
        const messageId = button.dataset.id;
        fetch(`/like/${messageId}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                button.textContent = `👍 ${data.likes}`;
            });
    });
});

function hideLoadingIndicator() {
    document.getElementById('loading').style.display = 'none';
}

function handleFormSubmit() {
    const form = document.getElementById('input-form');
    const formData = new FormData(form);
    const submitButton = document.getElementById('submit-button');

    if (formData.get('text').trim() === '') {
        flashMessage('请输入内容');
        return false;
    }

    const newFormData = new FormData();
    newFormData.append('text', formData.get('text'));

    submitButton.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/wall/submit');


    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    form.reset();
                    window.location.href = '/wall'; 
                } else {
                    flashMessage(data.error);
                    submitButton.disabled = false;
                }
            } else {
                flashMessage('上传失败，请重试');
                submitButton.disabled = false;
            }
        }
    };
    xhr.send(newFormData);
}

function createHotMessageElement(message) {
    // 创建外层容器
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-6';
    colDiv.setAttribute('data-aos', 'fade-up');

    // 创建消息卡片
    const messageCard = document.createElement('div');
    messageCard.className = 'message-card p-4';
    messageCard.onclick = () => {
        window.location.href = `/wall/message/${message.id}`;
    };

    // 创建时间戳徽章容器
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'd-flex justify-content-between align-items-center mb-3';

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.backgroundColor = '#6A0DAD';
    badge.textContent = message.timestamp;

    badgeContainer.appendChild(badge);

    // 创建消息内容区域
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const lines = message.text.split('\n');
    lines.forEach((line, index) => {
        messageContent.appendChild(document.createTextNode(line));

        if (index < lines.length - 1) {
            messageContent.appendChild(document.createElement('br'));
        }
    });

    if (messageContent.innerHTML.length > 150) {
        messageContent.innerHTML = messageContent.innerHTML.substring(0, 150) + '<br>...<a href="/wall/message/' + message.id + '">查看全文</a>';
    }


    if (message.files && message.files.length > 0) {
        const attachmentsDiv = document.createElement('div');
        attachmentsDiv.className = 'message-attachments';

        message.files.forEach(file => {
            let attachmentElement;

            if (/\.(png|jpe?g|gif)$/i.test(file)) {

                const picture = document.createElement('picture');
                const source = document.createElement('source');
                source.loading = 'lazy';
                source.srcset = `/static/tiny_files/${file}`;
                source.type = file.endsWith('.jpg') ? 'image/jpeg' : 'image/png';

                const img = document.createElement('img');
                img.loading = 'lazy';
                img.src = `/static/tiny_files/${file}`;
                img.alt = 'Image';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';

                picture.appendChild(source);
                picture.appendChild(img);
                attachmentElement = picture;
            } else if (/\.(mp3|wav|aac|flac|m4a)$/i.test(file)) {

                const audio = document.createElement('audio');
                audio.controls = true;

                const source = document.createElement('source');
                source.loading = 'lazy';
                source.src = `/uploads/${file}`;
                source.type = 'audio/mpeg';

                audio.appendChild(source);
                attachmentElement = audio;
            } else if (/\.(mp4|avi|mov|webm)$/i.test(file)) {

                const a = document.createElement('a');
                a.href = `/wall/message/${message.id}?back_url=/`;

                const video = document.createElement('video');
                video.loading = 'lazy';
                video.loop = true;
                video.autoplay = true;
                video.muted = true;
                video.width = 100;

                const source = document.createElement('source');
                source.src = `/static/tiny_files/${file}`;
                source.type = 'video/mp4';

                video.appendChild(source);
                a.appendChild(video);
                attachmentElement = a;
            } else {
                const a = document.createElement('a');
                a.href = `/static/tiny_files/${file}`;
                a.target = '_blank';
                a.textContent = '查看附件';
                attachmentElement = a;
            }

            attachmentsDiv.appendChild(attachmentElement);
        });

        messageContent.appendChild(attachmentsDiv);
    }

    const likeContainer = document.createElement('div');
    likeContainer.className = 'd-flex justify-content-end mt-3';

    const likeButton = document.createElement('button');
    likeButton.className = `like-button ${message.liked === 1 ? 'liked' : ''}`;
    likeButton.id = `like-${message.id}`;
    likeButton.setAttribute('aria-label', '点赞');
    likeButton.textContent = `${message.likes} 👍`;
    likeButton.onclick = () => likeMessage(message.id);

    likeContainer.appendChild(likeButton);

    messageCard.appendChild(badgeContainer);
    messageCard.appendChild(messageContent);
    messageCard.appendChild(likeContainer);

    colDiv.appendChild(messageCard);

    return colDiv;
}
function loadHotMessage() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/get_hot_messages');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const loading = document.getElementById('loading-hot-messages');
                if (loading) {
                    loading.style.display = 'none';
                }

                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    const hotMessagesContainer = document.getElementById('hot-messages-container');
                    hotMessagesContainer.innerHTML = '';
                    data.messages.forEach(message => {
                        const messageElement = createHotMessageElement(message);
                        hotMessagesContainer.appendChild(messageElement);
                    });
                }
            }
        }
    };
    xhr.send();
}






window.loadHotMessage = loadHotMessage;


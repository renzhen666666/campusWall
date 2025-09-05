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

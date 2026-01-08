const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');

let noticeCache = null;
let noticeCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;


// 检查本地存储中的主题设置
const currentTheme = localStorage.getItem('theme') || 'dark';

// 应用保存的主题
if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (themeIcon) themeIcon.textContent = '🌙';
} else {

    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeIcon) themeIcon.textContent = '☀️';
}

// 切换主题的函数
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let newTheme;
    
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        newTheme = 'dark';
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        newTheme = 'light';
        if (themeIcon) themeIcon.textContent = '🌙';
    }
    
    // 保存用户选择到本地存储
    localStorage.setItem('theme', newTheme);
}

// 绑定点击事件
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

//

async function loadNoticeContent() {
    const now = Date.now();
    
    if (noticeCache && (now - noticeCacheTime) < CACHE_DURATION) {
        document.getElementById('notice-content').innerHTML = noticeCache;
        return;
    }
    
    try {
        const response = await fetch('/api/notice', {'method': 'POST'});
        const data = await response.json();
        
        const noticeContent = document.getElementById('notice-content');

        const noticeList = document.createElement('ul');


        if (data.success && data.content.length > 0) {
            data.content.slice().reverse().forEach(item => {
                const listItem = document.createElement('li');
                const content = item.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

                const card = document.createElement('div');
                card.className = 'card';

                const cardHead = document.createElement('div');
                cardHead.className = 'card-header';

                const timestamp = document.createElement('small');
                timestamp.className = 'text-muted';
                timestamp.innerHTML = item.timestamp;

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                cardBody.innerHTML = content;

                cardHead.appendChild(timestamp);
                card.appendChild(cardHead);
                card.appendChild(cardBody);

                listItem.appendChild(card);
                noticeList.appendChild(listItem);
            });

            noticeContent.innerHTML = '';
            noticeContent.appendChild(noticeList);

            noticeCache = noticeContent.innerHTML;
            noticeCacheTime = now;
        } else {
            noticeContent.innerHTML = '<div class="alert alert-info">暂无公告内容</div>';
            noticeCache = '<div class="alert alert-info">暂无公告内容</div>';
            noticeCacheTime = now;
        }
    } catch (error) {
        console.error('加载公告失败:', error);
        document.getElementById('notice-content').innerHTML = 
            '<div class="alert alert-danger">加载公告失败，请稍后再试</div>';
    }
}


function likeMessage(messageId) {
    const likeButton = document.getElementById(`like-${messageId}`);
    let currentLikes = parseInt(likeButton.textContent.split(' ')[0]);
    likeButton.disabled = true;

    fetch(`/wall/like/${messageId}`, {
        method:'POST'
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert('点赞失败');
        }
    }).then(data => {
        if (data.success) {
            if (data.action == 'cancel') {
                likeButton.classList.remove('liked');
                likeButton.style.backgroundColor = 'transparent';
                likeButton.style.color = 'black';
            }
            else {
                likeButton.classList.add('liked');
                likeButton.style.backgroundColor = '#ff0000';
                likeButton.style.color = 'white';
            }
            likeButton.textContent = `${data.likes} 👍`;
        } else {
            likeButton.textContent = `${currentLikes} 👍`;
            console.log(data.error);
        }
    }).finally(() => {
        likeButton.disabled = false;
    });
}

function dislikeMessage(messageId) {
    const dislikeButton = document.getElementById(`dislike-${messageId}`);
    dislikeButton.disabled = true;

    fetch(`/wall/dislike/${messageId}`, {
        method:'POST'
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert('点踩失败');
        }
    }).then(data => {
        if (data.success) {
            if (data.action == 'cancel') {
                dislikeButton.classList.remove('disliked');
                dislikeButton.style.backgroundColor = 'transparent';
                dislikeButton.style.color = 'black';
            } else{
                dislikeButton.classList.add('disliked');
                dislikeButton.style.backgroundColor = '#bd841a';
                dislikeButton.style.color = 'white';
            }
        } else {
            console.log(data.error);
        }
    }).finally(() => {
        dislikeButton.disabled = false;
    });
}


function validateFileType(files) {
    const allowedExtensions = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'avi', 'mp4', 'mov', 'm4a', 'webm', 'aac', 'flac', 'mid', 'apk'];
    for (let i = 0; i < files.length; i++) {
        const fileExtension = files[i].name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            flashMessage(`文件 "${files[i].name}" 类型不支持`);
            return false;
        }
    }
    return true;
  }

function showModal(imageSrc) {
    const modal = document.getElementById('Modal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.style.display = 'flex';
}



// 打开文件查看模态框
function openFileViewer(files, startIndex) {
  currentFiles = files;
  currentFileIndex = startIndex;
  updateModalContent();
  fileModal.show();
  
  // 显示/隐藏导航按钮
  document.querySelector('.btn-prev').style.display = files.length > 1 ? 'block' : 'none';
  document.querySelector('.btn-next').style.display = files.length > 1 ? 'block' : 'none';
}


function updateModalContent() {
    const content = document.getElementById('modalContent');
    
    // 移除现有媒体元素
    const existingMedia = content.querySelector('video,audio,img');
    if (existingMedia) {
        existingMedia.pause?.(); // 暂停播放
        existingMedia.remove();
    }

    const file = currentFiles[currentFileIndex];
    const ext = file.split('.').pop().toLowerCase();
    const filePath = `/static/uploads/${file}`;

    // 创建文件预览元素
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
        const img = document.createElement('img');
        img.src = filePath;
        img.alt = file;
        img.style.width = '100vw';
        img.style.height = '100vh';
        img.style.objectFit = 'contain';
        content.appendChild(img);
    } 
    else if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) {
        const video = document.createElement('video');
        video.src = filePath;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = '100vw';
        video.style.height = '100vh';
        video.innerHTML = `<source src="${filePath}" type="video/mp4">您的浏览器不支持视频播放`;
        content.appendChild(video);
    }
    else if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) {
        const audio = document.createElement('audio');
        audio.src = filePath;
        audio.controls = true;
        audio.autoplay = true;
        audio.style.width = '100%';
        content.appendChild(audio);
    }
    else {
        const link = document.createElement('a');
        link.href = filePath;
        link.target = "_blank";
        link.className = "text-white";
        link.textContent = `下载文件: ${file}`;
        content.appendChild(link);
    }
}

// 上一个文件
function prevFile() {
  if (currentFileIndex > 0) {
    currentFileIndex--;
    updateModalContent();
  }
}

// 下一个文件
function nextFile() {
  if (currentFileIndex < currentFiles.length - 1) {
    currentFileIndex++;
    updateModalContent();
  }
}


window.likeMessage = likeMessage;
window.dislikeMessage = dislikeMessage;
window.validateFileType = validateFileType;
window.showModal = showModal;
window.openFileViewer = openFileViewer;
window.updateModalContent = updateModalContent;
window.prevFile = prevFile;
window.nextFile = nextFile;
window.loadNoticeContent = loadNoticeContent;
//



document.addEventListener('DOMContentLoaded', function() {
    const noticeModal = document.getElementById('notice');
    if (noticeModal) {
        noticeModal.addEventListener('show.bs.modal', function () {
            loadNoticeContent();
        });
    }
});


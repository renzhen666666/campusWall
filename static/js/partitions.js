const partition = document.getElementById('partitionName').textContent;
const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));



console.log(partition);

document.addEventListener('DOMContentLoaded', function() {
    loadMessages();
});

let displayMessages = new Set();
let isLoading = false;

window.addEventListener('scroll', function() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        loadMessages();
    }
});


async function loadMessages() {
    if (isLoading) return;
    isLoading = true;

    const messageBox = document.getElementById('message-box');



    let messageIds = await fetch(`/api/get_partition_messages`,
        {
            method: 'POST',
            body: JSON.stringify({
                partition: partition
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }
    ).then(response => response.json()
    ).then(data => {
        console.log(data);
        if (data.success) {
            return data.data;
        } else {
            showToast(data.error || '加载失败，请稍后再试');
            return [];
        }

    }).catch(error => {
        console.error('Error:', error);
        showToast('加载失败，请稍后再试');
        return [];
    });

    const messageNum = document.getElementById('message-num');
    messageNum.textContent = `共 ${messageIds.length} 条消息`;

    messageIds = messageIds.filter(id => !displayMessages.has(id));

    let messages = [];

    if (displayMessages.size === 0) messageBox.innerHTML = '';

    
    messageIds.slice(0, 15)

    for (const id of messageIds) {
        const message = await fetch(`/api/get_message_details/${id}`, {
            method: 'POST'
        }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    return data.message;
                } else {
                    console.error(`id:${id}:Error:`, data.error);
                    return null;
                }
            }).catch(error => {
                console.error(`id:${id}:Error:`, error);
                showToast('加载失败，请稍后再试');
                return null;
            });
        messages.push(message);

        if (message) {
            const messageElement = createMessageElement(message);
            messageBox.appendChild(messageElement);
            displayMessages.add(message.id);
        }
    }


   isLoading = false;
}


function createMessageElement(message) {
    const li = document.createElement('li');
    li.className = 'message-item';
    li.id = `message-${message.id}`;
    
    // 创建消息头部
    const messageHeader = document.createElement('div');
    messageHeader.className = 'col-12 message-header';
    
    const messageHeaderContent = document.createElement('div');
    messageHeaderContent.className = 'message-header-content';

    const messageTimestamp = document.createElement('div');
    messageTimestamp.className = 'message-timestamp';
    messageTimestamp.textContent = message.timestamp;
    
    messageHeaderContent.appendChild(messageTimestamp);

    if (message.tags) {
        const tags = document.createElement('div');
        tags.className = 'message-tags';
        message.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = `#${tag}`;
            tagElement.setAttribute('onclick', `window.location.href = '/p/${tag}';`);
            tags.appendChild(tagElement);
        });
        messageHeaderContent.appendChild(tags);
    }

    messageHeader.appendChild(messageHeaderContent);
    // 创建消息内容
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    const lines = message.text.split('\n');
    lines.forEach((line, index) => {
        messageContent.appendChild(document.createTextNode(line));
        if (index < lines.length - 1) {
            messageContent.appendChild(document.createElement('br'));
        }
    });

    // 创建操作按钮区域
    const actionsCol = document.createElement('div');
    actionsCol.className = 'col d-flex justify-content-end';
    
    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    
    const likeButton = document.createElement('button');
    likeButton.setAttribute('onclick', `event.stopPropagation();likeMessage(${message.id});`);
    likeButton.id = `like-${message.id}`;
    likeButton.className = message.liked ? 'like-button liked' : 'like-button';
    likeButton.setAttribute('aria-label', '点赞');
    likeButton.textContent = `${message.likes} 👍`;
    
    const dislikeButton = document.createElement('button');
    dislikeButton.setAttribute('onclick', `event.stopPropagation();dislikeMessage(${message.id});`);
    dislikeButton.id = `dislike-${message.id}`;
    dislikeButton.className = message.disliked ? 'dislike-button disliked' : 'dislike-button';
    dislikeButton.textContent = '👎';
    
    const commentButton = document.createElement('button');
    commentButton.id = `btn-comment-${message.id}`;
    commentButton.setAttribute('onclick', `event.stopPropagation(); addCommentForm(${message.id});`);
    commentButton.className = 'comment-button';
    commentButton.textContent = '💬 评论';


    const dropdownDiv = document.createElement('div');
    dropdownDiv.className = 'dropdown';

    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'dropdown-toggle';
    dropdownButton.type = 'button';
    dropdownButton.id = `dropdownMenuButton-${message.id}`;
    dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
    dropdownButton.setAttribute('aria-expanded', 'false');
    dropdownButton.textContent = '⋮';

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.setAttribute('aria-labelledby', `dropdownMenuButton-${message.id}`);

    const reportItem = document.createElement('li');
    const reportLink = document.createElement('button');
    reportLink.className = 'dropdown-item';
    reportLink.setAttribute('onclick', `window.location.href = '/help/report/${message.id}';`);
        
    reportLink.textContent = '举报';
    reportItem.appendChild(reportLink);

    const refreshItem = document.createElement('li');
    const refreshLink = document.createElement('button');
    refreshLink.className = 'dropdown-item';
    refreshLink.setAttribute('onclick', `refreshMessage(${message.id});`);

    refreshLink.textContent = '刷新';
    refreshItem.appendChild(refreshLink);

    const shareItem = document.createElement('li');
    const shareLink = document.createElement('button');
    shareLink.className = 'dropdown-item';
    shareLink.setAttribute('onclick', `shareMessage(${message.id});`)
    shareLink.textContent = '分享';
    shareItem.appendChild(shareLink);

    dropdownMenu.appendChild(reportItem);
    dropdownMenu.appendChild(refreshItem);
    dropdownMenu.appendChild(shareItem);

    dropdownDiv.appendChild(dropdownButton);
    dropdownDiv.appendChild(dropdownMenu);

    messageActions.appendChild(likeButton);
    messageActions.appendChild(dislikeButton);
    messageActions.appendChild(commentButton);
    messageActions.appendChild(dropdownDiv);

    actionsCol.appendChild(messageActions);
    

    const commentFormContainer = document.createElement('div');
    commentFormContainer.id = `comment-form-container-${message.id}`;
    commentFormContainer.className = 'col-12 comment-form-container';
    
    const contentCol = document.createElement('div');
    contentCol.className = 'col-auto';

    contentCol.appendChild(messageContent);
    


    if (message.files?.length > 0) {
        const attachmentsContainer = document.createElement('div');
        attachmentsContainer.className = 'message-attachments justify-content-start';
        
        message.files.forEach((file, index) => {
            const ext = file.split('.').pop().toLowerCase();
            const filePathTiny = `/static/tiny_files/${file}`;
            const filePathFull = `/static/uploads/${file}`;
            
            if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                const img = document.createElement('img');
                img.loading = 'lazy';
                img.className = 'message-image';
                img.src = filePathTiny;
                img.alt = '预览';
                img.style.cursor = 'pointer';
                img.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(message.files, index);
                };
                attachmentsContainer.appendChild(img);
            } else if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) {
                const videoContainer = document.createElement('div');
                videoContainer.className = 'video-container';
                videoContainer.style.cursor = 'pointer';
                videoContainer.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(message.files, index);
                };
                
                const video = document.createElement('video');
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.className = 'video-player';
                
                const source = document.createElement('source');
                source.loading = 'lazy';
                source.src = filePathTiny;
                source.type = 'video/mp4';
                video.appendChild(source);
                
                videoContainer.appendChild(video);
                attachmentsContainer.appendChild(videoContainer);
            } else if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'mid'].includes(ext)) {
                const audio = document.createElement('audio');
                audio.controls = true;
                
                const source = document.createElement('source');
                source.loading = 'lazy';
                source.src = filePathFull;
                source.type = 'audio/mpeg';
                audio.appendChild(source);
                
                attachmentsContainer.appendChild(audio);
            } else {
                const fileLink = document.createElement('span');
                fileLink.style.cursor = 'pointer';
                fileLink.textContent = '📎 附件';
                fileLink.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(message.files, index);
                };
                attachmentsContainer.appendChild(fileLink);
            }
        });
        
        contentCol.appendChild(attachmentsContainer);
    }

    // 组装主结构
    const row = document.createElement('div');
    row.className = 'row g-3';
    row.style.width = '100%';
    
    row.appendChild(messageHeader);
    
    row.appendChild(contentCol);
    row.appendChild(actionsCol);
    row.appendChild(commentFormContainer);
    
    li.appendChild(row);
    

    
    // 处理评论
    if (message.comments?.length > 0) {
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'col-12';
        commentsContainer.id = `comment-box-${message.id}`;
        
        const commentHeader = document.createElement('div');
        commentHeader.className = 'comment-header';
        commentHeader.id = `comment-header-${message.id}`;
        commentHeader.textContent = `评论 | ${message.comments.length}`;
        
        const commentBox = document.createElement('ul');
        commentBox.className = 'comment-box';
        
        message.comments.forEach((comment, index) => {
            const commentElement = createCommentElement(comment, index + 1, message.id);
            commentBox.appendChild(commentElement);
        });
        
        commentsContainer.appendChild(commentHeader);
        commentsContainer.appendChild(commentBox);
        row.appendChild(commentsContainer);
    }
    
    return li;
}


function createCommentElement(comment, num, messageId) {
    const li = document.createElement('li');
    li.className = 'comment-item row g-2';
    li.setAttribute('onclick', `addCommentForm(${messageId}, '${comment.text.slice(0, 5)}...', 'referId=${comment.id}')`);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'col-auto comment-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'comment-text';
    
    // 处理引用文本
    if (comment.refer) {
        const referP = document.createElement('p');
        referP.style.color = '#888888';
        referP.textContent = `回复"${comment.refer}": `;
        textDiv.appendChild(referP);
    }
    // 添加评论正文文本
    textDiv.appendChild(document.createTextNode(comment.text));

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = `${num}楼 ${comment.timestamp}`;
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timestampDiv);
    li.appendChild(contentDiv);
    
    // 处理评论附件
    if (comment.files && comment.files.length > 0) {
        const attachmentsDiv = document.createElement('div');
        attachmentsDiv.className = 'col comment-attachments d-flex justify-content-end';
        
        comment.files.forEach((file, index) => {
            const ext = file.split('.').pop().toLowerCase();
            const filePathTiny = `${staticUrl}tiny_files/${file}`;
            const filePathFull = `${staticUrl}uploads/${file}`;
            
            if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                const img = document.createElement('img');
                img.className = 'message-image';
                img.style.cssText = 'max-width: 50px;max-height: 50px;';
                img.loading = 'lazy';
                img.src = filePathTiny;
                img.alt = '预览';
                img.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(comment.files, index);
                };
                attachmentsDiv.appendChild(img);
            } else if (['mp3', 'wav', 'aac', 'flac', 'm4a', 'mid'].includes(ext)) {
                const audio = document.createElement('audio');
                audio.controls = true;
                
                const source = document.createElement('source');
                source.loading = 'lazy';
                source.src = filePathFull;
                source.type = 'audio/mpeg';
                audio.appendChild(source);
                
                attachmentsDiv.appendChild(audio);
            } else if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) {
                const videoContainer = document.createElement('div');
                videoContainer.className = 'video-container';
                videoContainer.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(comment.files, index);
                };
                
                const video = document.createElement('video');
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.className = 'video-player';
                
                const source = document.createElement('source');
                source.loading = 'lazy';
                source.src = filePathTiny;
                source.type = 'video/mp4';
                video.appendChild(source);
                
                videoContainer.appendChild(video);
                attachmentsDiv.appendChild(videoContainer);
            } else {
                const fileLink = document.createElement('span');
                fileLink.className = 'file-link';
                fileLink.textContent = '点击下载';
                fileLink.onclick = function(e) {
                    e.stopPropagation();
                    openFileViewer(comment.files, index);
                };
                attachmentsDiv.appendChild(fileLink);
            }
        });
        
        li.appendChild(attachmentsDiv);
    }
    
    return li;
}

function addCommentForm(messageId, refer='', referId='') {
    const container = document.getElementById(`comment-form-container-${messageId}`);
    const commentBtn = document.getElementById(`btn-comment-${messageId}`);
    
    // 如果表单已经存在，则不再重复添加
    if (container.querySelector('form')) {
        container.querySelector('form').remove();
        commentBtn.textContent = '💬 评论';
        return;
    }

    commentBtn.textContent = '取消';

    const formRefer = document.createElement('input');
    formRefer.type = 'hidden';
    formRefer.name = 'refer';
    formRefer.value = refer;

    const referText = document.createElement('input');
    referText.type = 'hidden';
    referText.name = 'refer_id';
    referText.value = referId;


    // 创建表单元素
    const form = document.createElement('form');
    form.setAttribute('id', `comment-form-${messageId}`);
    form.setAttribute('onsubmit', `event.preventDefault(); submitComment(${messageId});`);
    form.classList.add('comment-form');

    form.appendChild(referText);
    form.appendChild(formRefer);

    const textArea = document.createElement('textarea');
    textArea.name = 'text';
    textArea.className = 'comment-input form-control shadow-sm border-2';
    if (refer) textArea.placeholder = `回复 "${refer}": `;
    else textArea.placeholder = '写下你的评论...';
    textArea.rows = 2;

    const fileLabel = document.createElement('label');
    fileLabel.setAttribute('for', `file-input-${messageId}`);
    fileLabel.className = 'btn btn-outline-primary';
    fileLabel.innerHTML = `<img src="/static/file_addition.png" alt="文件" class="img-fluid" style="width: 20px; height: 20px;">`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,audio/*,video/*';
    fileInput.id = `file-input-${messageId}`;
    fileInput.className = 'd-none';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.innerHTML = `<img src="/static/send.png" alt="发送" class="img-fluid" style="width: 20px; height: 20px;">`;

    
    // 创建进度条容器
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';
    progressBarContainer.style.display = 'none';
    progressBarContainer.style.padding = '0 1rem 1rem';

    // 创建进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';

    // 创建状态文本
    const statusText = document.createElement('div');
    statusText.style.textAlign = 'center';
    statusText.style.marginTop = '5px';

    // 组装进度条
    progressBarContainer.appendChild(progressBar);
    progressBarContainer.appendChild(statusText);

    // 将元素添加到表单
    form.appendChild(textArea);
    form.appendChild(fileLabel);
    form.appendChild(fileInput);
    form.appendChild(submitButton);
    form.appendChild(progressBarContainer);

    // 插入表单到容器中
    container.appendChild(form);
}

async function submitComment(messageId) {
    const form = document.getElementById(`comment-form-${messageId}`);
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;

    const formData = new FormData(form);

    const commentText = formData.get('text');
    const files = form.querySelector('input[type="file"]').files;

    if (!commentText && !files) {
        flashMessage('评论内容不能为空');
        return;
    }

    
    if (files.length > 0 && !validateFileType(files)) return;


    const progressBarContainer = form.querySelector('.progress-bar-container');
    const progressBar = form.querySelector('.progress-bar');
    progressBarContainer.style.display = 'block';


    progressBar.style.width = `${Math.random() % 100}%`;

    try {
        const response = await fetch(`/wall/comment/${messageId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            form.reset();

            const commentBox = document.getElementById(`comment-box-${messageId}`);

            if (commentBox) {
                const commentNum = commentBox.getElementsByTagName('li').length;
                const newComment = createCommentElement(result.comment, commentNum+1, messageId);
                commentBox.appendChild(newComment);
            } else {
                const newComment = createCommentElement(result.comment, 1, messageId);

                const NewCommentBox = document.createElement('div');
                NewCommentBox.id = `comment-box-${messageId}`;
                NewCommentBox.className = 'col-12';
                const commentHeader = document.createElement('div');
                commentHeader.className = 'comment-header';
                commentHeader.id = `comment-header-${messageId}`;
                commentHeader.textContent = '评论 | 1';
                const commentList = document.createElement('ul');
                commentList.className = 'comment-box';
                commentList.appendChild(newComment);
                NewCommentBox.appendChild(commentHeader);
                NewCommentBox.appendChild(commentList);

                const messageItemRow = document.getElementById(`message-${messageId}`).querySelector('.row')
                messageItemRow.appendChild(NewCommentBox);
            }
        } else {
            flashMessage(result.error || '评论失败，请稍后再试');
        }
    } catch (error) {
        console.error('Error:', error);
        flashMessage('评论失败，请稍后再试');
    } finally {
        progressBarContainer.style.display = 'none';
        submitBtn.disabled = false;
    }
}


function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-primary border-0 position-fixed top-50 start-50 translate-middle m-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';

    const bodyContent = document.createElement('div');
    bodyContent.className = 'toast-body';
    bodyContent.textContent = text;

    toastBody.appendChild(bodyContent);
    toast.appendChild(toastBody);
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 2000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}


async function submitComment(messageId) {
    const form = document.getElementById(`comment-form-${messageId}`);
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;

    const formData = new FormData(form);

    const commentText = formData.get('text');
    const files = form.querySelector('input[type="file"]').files;

    if (!commentText && !files) {
        showToast('评论内容不能为空');
        return;
    }

    
    if (files.length > 0 && !validateFileType(files)) return;


    const progressBarContainer = form.querySelector('.progress-bar-container');
    const progressBar = form.querySelector('.progress-bar');
    progressBarContainer.style.display = 'block';


    progressBar.style.width = `${Math.random() % 100}%`;

    try {
        const response = await fetch(`/wall/comment/${messageId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            form.reset();

            const commentBox = document.getElementById(`comment-box-${messageId}`);

            if (commentBox) {
                const commentNum = commentBox.getElementsByTagName('li').length;
                const newComment = createCommentElement(result.comment, commentNum+1, messageId);
                commentBox.appendChild(newComment);
            } else {
                const newComment = createCommentElement(result.comment, 1, messageId);

                const NewCommentBox = document.createElement('div');
                NewCommentBox.id = `comment-box-${messageId}`;
                NewCommentBox.className = 'col-12';
                const commentHeader = document.createElement('div');
                commentHeader.className = 'comment-header';
                commentHeader.id = `comment-header-${messageId}`;
                commentHeader.textContent = '评论 | 1';
                const commentList = document.createElement('ul');
                commentList.className = 'comment-box';
                commentList.appendChild(newComment);
                NewCommentBox.appendChild(commentHeader);
                NewCommentBox.appendChild(commentList);

                const messageItemRow = document.getElementById(`message-${messageId}`).querySelector('.row')
                messageItemRow.appendChild(NewCommentBox);
            }
        } else {
            showToast(result.error || '评论失败，请稍后再试');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('评论失败，请稍后再试');
    } finally {
        progressBarContainer.style.display = 'none';
        submitBtn.disabled = false;
    }
}

async function shareMessage(id) {
    try {
        await navigator.clipboard.writeText(`https://www.rz101.com/wall/message/${id}`);
        showToast('已复制链接到剪贴板');
    } catch (err) {
        showToast('复制失败，请手动复制');
    }
}

function refreshMessage(id) {
    const messageItem = document.getElementById(`message-${id}`);
    if (!messageItem) return;

    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = '正在刷新...';
    messageItem.appendChild(loading);

    fetch(`/api/get_message_details/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const newMessageItem = createMessageElement(data.message);
                messageItem.innerHTML = newMessageItem.innerHTML;
            } else {
            console.error(data)
            showToast(data.error || '刷新失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('刷新失败，请稍后再试');
        })
        .finally(() => {
            loading.remove();
        });


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

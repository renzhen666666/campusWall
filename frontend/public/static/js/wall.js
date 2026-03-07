
const staticUrl = document.getElementById('staticUrl').textContent;
let allMessages = [];
let currentPage = 1;
let pageSize = 15;
console.log(`pagesize: ${pageSize}`);
let isLoading = false;
let allMessagesLoaded = false;

let uploadProgress = {};

const CHUNK_SIZE = 25 * 1024 * 1024; // 20MB

// 文件查看相关变量
let currentFiles = [];
let currentFileIndex = 0;

const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));


window.addEventListener('scroll', async function () {
    // 检测整个网页是否滚动到底部附近
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 50) {
        await loadMessages();
    }
});

let scrollTimer;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(saveScrollState, 100);
});

// 修改页面加载完成后的处理
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(restoreScrollState, 100);
});


function saveScrollState() {
    const scrollState = {
        position: window.scrollY,
        page: currentPage,
        timestamp: Date.now()
    };
    sessionStorage.setItem('wallScrollState', JSON.stringify(scrollState));
}

async function restoreScrollState() {
    const scrollStateStr = sessionStorage.getItem('wallScrollState');
    if (!scrollStateStr) return;
    
    try {
        const scrollState = JSON.parse(scrollStateStr);
        const { position, page } = scrollState;
        
        // 如果需要加载更多内容以达到之前的位置
        if (page > 1) {
            // 预加载到指定页数
            while (currentPage < page && !allMessagesLoaded) {
                await loadMessages();
                // 短暂延迟避免过于频繁的请求
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // 滚动到指定位置
        window.scrollTo(0, position);
        
        // 清除保存的状态（可选）
        sessionStorage.removeItem('wallScrollState');
    } catch (e) {
        console.error('恢复滚动位置失败:', e);
    }
    showToast('已恢复至上次浏览位置');
}



async function loadMessages() {
    if (isLoading || allMessagesLoaded) return;
    isLoading = true;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';

    const sort = document.getElementById('sort-by').value;
    const filter = document.getElementById('filter').value;
    const searchText = document.getElementById('search-text').value.trim();

    let messageCount = document.getElementsByClassName('message-item').length;
    if (messageCount == 0) messageCount = 3;

    const response = await fetch(`/api/get_messages?s=${sort}&w=${searchText}&f=${filter}&start=${messageCount-3}&end=${messageCount + pageSize}`);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
        allMessagesLoaded = true;
        loading.style.display = 'none';
        isLoading = false;
        return;
    }

    const ul = document.getElementById('message-box');
    data.data.forEach(message => {
        if (!document.getElementById(`message-${message.id}`)) {
            const li = createMessageElement(message);
            ul.appendChild(li);
        }
    });

    currentPage++;
    isLoading = false;
    loading.style.display = 'none';



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

    
    // 创建更多操作按钮区域
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
    
    // 创建评论表单容器
    const commentFormContainer = document.createElement('div');
    commentFormContainer.id = `comment-form-container-${message.id}`;
    commentFormContainer.className = 'col-12 comment-form-container';
    
    const contentCol = document.createElement('div');
    contentCol.className = 'col-auto';

    contentCol.appendChild(messageContent);
    


    // 处理附件
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

async function flashMessage(text) {
    const flashes = document.getElementById('flashes');
    const flash = document.createElement('li');
    flash.textContent = text;
    flashes.appendChild(flash);
    setTimeout(() => {
        flashes.children[0].remove();
    }, 5000);
}




function buildRedirectUrl(searchText, sortBy, filter) {
    const encodedSearch = encodeURIComponent(searchText.trim());
    let url = `/wall`;
    const params = [];

    if (encodedSearch) {
        params.push(`w=${encodedSearch}`);
    }
    if (sortBy) {
        params.push(`s=${sortBy}`);
    }
    if (filter) {
        params.push(`f=${filter}`);
    }

    return params.length > 0 ? `${url}?${params.join('&')}` : url;
}

function refreshMessages() {
    const messageBox = document.getElementById('message-box');
    messageBox.innerHTML = '';

    loadMessages();
}

function clearSearch() {
    document.getElementById('search-text').value = '';
    if (document.getElementById('search-word') === null) return;

    const sortBy = document.getElementById('sort-by').value;
    const filter = document.getElementById('filter').value;
    window.location.href = buildRedirectUrl('', sortBy, filter);
}
function hideLoadingIndicator() {
    document.getElementById('loading').style.display = 'none';
}

async function compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1920;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
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

async function handleFormSubmit() {
    const form = document.getElementById('input-form');
    const formData = new FormData(form);
    const text = formData.get('text').trim();
    const files = form.querySelector('input[type="file"]').files;
    const tags = formData.get('tags').trim();
    
    if (!text && files.length === 0) {
        flashMessage('请输入内容或选择文件');
        return false;
    }

    if (files.length > 0) {
        if (!validateFileType(files)) return;
    
        const closeFileBtns = document.getElementsByClassName('close-file-btn');
        for (let i = 0; i < closeFileBtns.length; i++) {
            closeFileBtns[i].disabled = true;
            closeFileBtns[i].style.display = 'none';
        }
    }

    const sendButton = document.getElementById('submit-button');
    sendButton.disabled = true;
    sendButton.textContent = '正在发送...';

    const filePromises = [...files].map(file => {
        if (file.size <= CHUNK_SIZE) { // 20MB
            return uploadFileDirect(file); // 小文件直接上传
        } else {
            return uploadFileInChunks(file); // 大文件分片上传
        }
    });
    
    try {
        const results = await Promise.all(filePromises);
        const allFilenames = results.flat();
        const finalData = new FormData();
        finalData.append('text', text);
        finalData.append('tags', tags);
        allFilenames.forEach(filename => finalData.append('filenames', filename));

        const response = await fetch(`/wall/submit`, {
            method: 'POST',
            body: finalData
        });
        const result = await response.json();

        
        if (result.success) {
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('publishModal'));
            if (modal) {
                modal.hide();
            }
            // 重置表单
            document.getElementById('input-form').reset();
            document.getElementById('file-list').innerHTML = '';
            // 刷新页面显示新内容
            window.location.reload();
        }
    } catch (error) {
        flashMessage(`上传失败: ${error.message}`);
    }

}

async function uploadFileInChunks(file) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    const uploadedChunks = uploadProgress[fileKey]?.uploadedChunks || new Set();

    if (!uploadProgress[fileKey]) {
        uploadProgress[fileKey] = {
            uploadedChunks,
            totalChunks,
            filename: file.name
        };
    }

    showProgress(0, `正在上传${file.name}`);

    // 创建所有分片上传任务
    const chunkUploadPromises = Array.from({ length: totalChunks }, (_, i) => async () => {
        if (uploadedChunks.has(i)) return;

        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('originalName', file.name);
        formData.append('fileKey', fileKey);

        let retry = 3;
        while (retry--) {
            try {
                const response = await fetch(`/api/chunked_upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network error');

                const result = await response.json();
                if (result.success) {
                    uploadedChunks.add(i);
                    updateProgress(fileKey, i + 1, file.name);
                    break;
                }
                throw new Error('Upload failed');
            } catch (error) {
                if (retry === 0) throw error;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    });

    // 并行上传所有分片
    await Promise.all(chunkUploadPromises.map(fn => fn()));

    showProgress(100, `${file.name}上传完成`);
    // 触发合并请求
    const mergeResponse = await fetch(`/api/merge_chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, originalName: file.name })
    });

    const mergeResult = await mergeResponse.json();
    if (mergeResult.success) {
        delete uploadProgress[fileKey];
        return mergeResult.filenames;
    }
    throw new Error('Merge failed');
}

async function uploadFileDirect(file) {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    showProgress(Math.random(0,100), `正在上传 ${file.name}`);

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('originalName', file.name);
        formData.append('fileKey', fileKey);

        const response = await fetch(`/api/direct_upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            showProgress(100, `上传完成 ${file.name}`);
            return result.filenames;
        }
        throw new Error('Upload failed');
    } catch (error) {
        throw error;
    }
}

function showProgress(progress, text='') {
    const progressBarContainer = document.querySelector('.progress-bar-container');
    const progressBar  = document.getElementById(`uploadProgressBar`);
    progressBarContainer.style.display = 'block';
    progressBar.style.width = progress + '%';

    if (text) {
        const statusText = document.getElementById(`status-text`);
        statusText.textContent = text
    }
    
}


function updateProgress(fileKey, chunksUploaded, filename) {
    const percent = Math.round((chunksUploaded / uploadProgress[fileKey].totalChunks) * 100);
    showProgress(percent, `正在上传 ${filename}...  `);
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



// 键盘导航
document.addEventListener('keydown', function(event) {
  if (!document.getElementById('fileModal').classList.contains('show')) return;
  
  switch(event.key) {
    case 'ArrowLeft':
      prevFile();
      break;
    case 'ArrowRight':
      nextFile();
      break;
  }
});

// 模态框隐藏时暂停媒体
document.getElementById('fileModal').addEventListener('hidden.bs.modal', function () {
    const modalContent = document.getElementById('modalContent');
    if (modalContent) {
        modalContent.innerHTML = ``;
    }
});

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

const BASE64_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

function decimalToBase64(decimal) {
    if (decimal === 0) return '0';
    
    decimal = BigInt(decimal);
    let result = '';
    const base = BigInt(64);
    
    while (decimal > 0) {
        const remainder = Number(decimal % base);
        result = BASE64_CHARS[remainder] + result;
        decimal = decimal / base;
    }
    
    return result;
}

async function shareMessage(id) {
    const newId = decimalToBase64(id);
    console.log(`https://r-z.top/w/${newId}`);
    try {
        await navigator.clipboard.writeText(`https://r-z.top/w/${newId}`);
        showToast('已复制链接到剪贴板');
    } catch (err) {
        showToast('复制失败，请手动复制');
    }
}

let selectedTags = [];
let suggestionTags = [];
let partitions = [
    "猎奇",
    "校园生活",
    "学习交流",
    "表白墙",
    "社团活动",
    "招聘信息",
    "二手交易",
    "失物招领",
    "美食分享",
    "活动通知",
    "扩列",
    "课程讨论",
    "宿舍生活",
    "校园趣事",
    "表白墙",
    "拼团购物",
    "运动健身",
    "技能培训",
    "志愿者活动",
    "神人",
    "柚子社",
    "千恋万花",
    "galgame",
    "程序开发"
];

async function getTags() {
    const response = await fetch('/api/get_tags', {method: 'POST'});
    if (!response.ok) {
        console.log('Error:', response.status);
        return ;
    }
    const data = await response.json();
    partitions = data;
}

function handleTagInput(event) {
    const input = event.target;
    const value = input.value.trim();
    const tagsInput = document.getElementById('tags-input');
    const suggestionsContainer = document.getElementById('tag-suggestions');

    if (value.length > 10) {
        flashMessage('标签长度不能超过10个字符');
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        navigateSuggestions(event.key);
        return;
    }

    if ((event.key === 'Enter' || event.key === ',' || event.key === ' ' || event.key === '，') && value) {
        event.preventDefault();
        const activeItem = document.querySelector('.tag-suggestion-item.active');
        if (activeItem) {
            addTag(activeItem.dataset.tag);
            clearActiveSuggestion();
        } else {
            addTag(value.replace(',', ''));
        }
        input.value = '';
        
    } else if (event.key === 'Backspace' && !value && selectedTags.length > 0) {
        removeTag(selectedTags[selectedTags.length - 1]);
    } else if (event.key === 'Enter' && document.querySelector('.tag-suggestion-item.active')) {
        event.preventDefault();
        const activeItem = document.querySelector('.tag-suggestion-item.active');
        const tag = activeItem.dataset.tag;
        addTag(tag);
        clearActiveSuggestion();
        input.value = '';
        
    } else if (event.key === 'Escape') {
        suggestionsContainer.classList.remove('show');
        clearActiveSuggestion();
    }

    tagsInput.placeholder = `还可以添加 ${10 - selectedTags.length} 个标签`;
}

function navigateSuggestions(direction) {
    const items = document.querySelectorAll('.tag-suggestion-item');
    if (items.length === 0) return;

    let activeIndex = -1;
    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('active')) {
            activeIndex = i;
            break;
        }
    }


    clearActiveSuggestion();

    if (direction === 'ArrowDown') {
        activeIndex = (activeIndex + 1) % items.length;
    } else if (direction === 'ArrowUp') {
        activeIndex = (activeIndex - 1 + items.length) % items.length;
    }

    if (activeIndex >= 0) {
        items[activeIndex].classList.add('active');
        items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
}


function addTag(tagName) {
    if (selectedTags.length >= 10) {
        return;
    }


    tagName = tagName.trim();
    if (!tagName || selectedTags.includes(tagName)) return;
    
    selectedTags.push(tagName);
    updateTagDisplay();
    updateHiddenInput();
}

function removeTag(tagName) {
    selectedTags = selectedTags.filter(tag => tag !== tagName);
    updateTagDisplay();
    updateHiddenInput();
}

function updateTagDisplay() {
    const preWrp = document.getElementById('tag-pre-wrp');
    preWrp.innerHTML = '';
    
    selectedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';

        const span = document.createElement('span');
        span.textContent = tag;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-tag';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = function() {
            removeTag(tag);
        };

        tagElement.appendChild(span);
        tagElement.appendChild(removeBtn);
        preWrp.appendChild(tagElement);
    });
}

function updateHiddenInput() {
    const hiddenInput = document.getElementById('tags-input-hidden');
    hiddenInput.value = selectedTags.join(',');
}


function clearActiveSuggestion() {
    const activeItem = document.querySelector('.tag-suggestion-item.active');
    if (activeItem) {
        activeItem.classList.remove('active');
    }
}



function showSuggestionTags(q='') {
    const container = document.getElementById('tag-suggestions');


    container.innerHTML = '';
    suggestionTags = [];

    if (q) {
        partitions.forEach(tag => {
            if (tag.toLowerCase().includes(q.toLowerCase())) {
                addsuggestionTags(tag);
                suggestionTags.push(tag);
            }
        });
    }


    if (suggestionTags.length < 10) {
        const availableTags = partitions.filter(tag => 
            !suggestionTags.includes(tag) && 
            !selectedTags.includes(tag)
        );
        
        for (let i = 0; i < Math.min(10 - suggestionTags.length, availableTags.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableTags.length);
            const tag = availableTags[randomIndex];
            addsuggestionTags(tag);
            suggestionTags.push(tag);
            availableTags.splice(randomIndex, 1);
        }
    }

    if (suggestionTags.length > 0) {
        container.classList.add('show');
    } else {
        container.classList.remove('show');
    }
}

function addsuggestionTags(text) {
    const container = document.getElementById('tag-suggestions');

    const tagElement = document.createElement('div');
    tagElement.className = 'tag-suggestion-item';
    tagElement.dataset.tag = text;

    const span = document.createElement('span');
    span.textContent = text;
    
    tagElement.appendChild(span);

    tagElement.onclick = function() {
        addTag(text);
        if (selectedTags.length >= 10) {
            container.classList.remove('show');
        }
        this.remove();
    };

    container.appendChild(tagElement);
}


showSuggestionTags('');
getTags();
loadMessages();

window.createMessageElement = createMessageElement;
window.createCommentElement = createCommentElement;

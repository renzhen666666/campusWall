
let currentPage = 1;
let currentSchool = document.getElementById('schoolSelector').value || 'lg';
let currentQuery = '';
let showAll = false;

function showAllMessage() {
    showAll = !showAll;
    currentPage = 1;
    loadMessages();
}

function changeSchool() {
    currentSchool = document.getElementById('schoolSelector').value;
    currentPage = 1;
    loadMessages();
}

function searchMessages() {
    currentQuery = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    loadMessages();
}

function refreshMessages() {
    document.getElementById('searchInput').value = '';
    currentQuery = '';
    currentPage = 1;
    loadMessages();
}

async function loadMessages() {
    const res = await fetch(`/admin/api/messages/${currentSchool}?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&show_all=${showAll}`);
    const approvedIds = await fetch(`/admin/api/approved_ids/${currentSchool}`).then(res=>res.json());
    const data = await res.json();

    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';

    if (data.messages.length === 0) {
        messageList.innerHTML = '<div class="showToast showToast-info">没有找到消息</div>';
        return;
    }

    data.messages.forEach(message => {
        const card = document.createElement('div');
        const isApproved = approvedIds.includes(message.id);
        if (!showAll && isApproved) return;

        // Create badge element
        const badge = document.createElement('span');
        badge.className = isApproved ? 'badge bg-info text-dark ms-2' : 'badge bg-warning ms-2';
        badge.textContent = isApproved ? '已审核' : '未审核';

        // Card container
        card.className = 'card shadow-sm mb-3';
        card.id = `message-${message.id}`;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        // Title
        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = `ID: ${message.id}`;
        cardTitle.appendChild(badge);

        // Text
        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.textContent = message.text.slice(0, 100) + (message.text.length > 100 ? '...' : '');

        // Timestamp
        const small = document.createElement('small');
        small.className = 'text-muted';
        small.textContent = message.timestamp;

        // Files preview
        const filesDiv = document.createElement('div');
        filesDiv.className = 'mt-2';
        message.files.forEach(file => {
            const ext = file.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
            const img = document.createElement('img');
            img.src = `/static/tiny_files/${file}`;
            img.alt = '预览';
            img.className = 'img-thumbnail me-1';
            img.width = 60;
            filesDiv.appendChild(img);
            } else if (['mp4', 'avi'].includes(ext)) {
            const video = document.createElement('video');
            video.className = 'me-1';
            video.width = 60;
            video.muted = true;
            video.controls = true;
            const source = document.createElement('source');
            source.src = `/static/tiny_files/${file}`;
            source.type = 'video/mp4';
            video.appendChild(source);
            video.appendChild(document.createTextNode('浏览器不支持视频'));
            filesDiv.appendChild(video);
            }
        });

        // Button group
        const btnGroup = document.createElement('div');
        btnGroup.className = 'd-flex flex-nowrap g-3 mb-2';

        const approveDiv = document.createElement('div');
        approveDiv.className = 'flex-fill';
        const approveBtn = document.createElement('button');
        approveBtn.className = 'btn btn-success btn-sm';
        approveBtn.textContent = '审核通过';
        approveBtn.onclick = () => approveMessage(currentSchool, message.id);
        approveDiv.appendChild(approveBtn);

        const deleteDiv = document.createElement('div');
        deleteDiv.className = 'flex-fill';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm justify-content-end';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = () => deleteMessage(currentSchool, message.id);
        deleteDiv.appendChild(deleteBtn);

        btnGroup.appendChild(approveDiv);
        btnGroup.appendChild(deleteDiv);

        //评论区
        const commentBox = document.createElement('div');
        commentBox.className = 'mt-3';
        commentBox.style = 'max-height: 300px; overflow: auto';

        message.comments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'card mb-2';

            const commentCardHead = document.createElement('div');
            commentCardHead.className = 'card-header d-flex justify-content-between align-items-center';

            const commentTimeStamp = document.createElement('div');
            commentTimeStamp.className = 'text-muted';
            commentTimeStamp.textContent = comment.timestamp;

            const commentCardBody = document.createElement('div');
            commentCardBody.className = 'card-body';

            const commentText = document.createElement('p');
            commentText.textContent = comment.text;

            const deleteCommentBtn = document.createElement('button');
            deleteCommentBtn.className = 'btn btn-danger btn-sm';
            deleteCommentBtn.textContent = '删除';
            deleteCommentBtn.onclick = () => deleteComment(message.id, comment.id);

            commentCardBody.appendChild(commentText);

            commentCardBody.appendChild(deleteCommentBtn);

            commentCardHead.appendChild(commentTimeStamp);

            commentCard.appendChild(commentCardHead);
            commentCard.appendChild(commentCardBody);
            commentBox.appendChild(commentCard);
        });

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);
        cardBody.appendChild(filesDiv);
        cardBody.appendChild(small);
        

        if (message.comments.length > 0)  cardBody.appendChild(commentBox);

        cardBody.appendChild(btnGroup);

        card.appendChild(cardBody);

        messageList.appendChild(card);
    });

    // 分页渲染
    const paginationList = document.getElementById('paginationList');
    paginationList.innerHTML = '';
    for (let i = 1; i <= data.total_pages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="goToPage(${i})">${i}</a>`;
        paginationList.appendChild(li);
    }
    document.getElementById('paginationNav').style.display = data.total_pages > 1 ? 'block' : 'none';
}

function goToPage(page) {
    currentPage = page;
    loadMessages();
}

async function deleteMessage(school, messageId) {
    if (! await showConfirm("确定要删除这条消息吗？")) return;

    const res = await fetch(`/admin/delete_message/${school}/${messageId}`, { method: 'POST' });
    const result = await res.json();
    if (result.success) {
        showToast("删除成功");
        loadMessages();
    } else {
        showToast("删除失败：" + result.error);
    }
}


async function deleteComment(messageId, commentId) {
    if (!await showConfirm("确定要删除这条评论吗？")) return;

    console.log("114514");

    const res = await fetch(`/admin/api/delete_comment/${messageId}/${commentId}`, { method: 'POST' });
    const result = await res.json();
    if (result.success) {
        showToast("删除成功");
        loadMessages();
    } else {
        showToast("删除失败：" + result.error);
    }
}


async function approveMessage(school, messageId) {
    if (!await showConfirm("确定要审核通过这条消息吗？")) return;

    const res = await fetch(`/admin/approve_message/${school}/${messageId}`, { method: 'POST' });
    const result = await res.json();
    
    if (result.success) {
        showToast("审核成功");
        loadMessages();
    } else {
        showToast("失败：" + result.error);
    }
}

window.onload = () => {
    loadMessages();
};


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
function showConfirm(message) {
    return new Promise(resolve => {
        let isResolved = false;
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.tabIndex = -1;

        const modalDialog = document.createElement('div');
        modalDialog.className = 'modal-dialog modal-dialog-centered';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h5');
        modalTitle.className = 'modal-title';
        modalTitle.textContent = '确认操作';

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.setAttribute('aria-label', '关闭');

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';

        const bodyText = document.createElement('p');
        bodyText.textContent = message;
        modalBody.appendChild(bodyText);

        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = '取消';

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.id = 'confirmBtn';
        confirmBtn.textContent = '确定';

        modalFooter.appendChild(cancelBtn);
        modalFooter.appendChild(confirmBtn);

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);

        modalDialog.appendChild(modalContent);
        modal.appendChild(modalDialog);

        document.body.appendChild(modal);

        modal.addEventListener('shown.bs.modal', () => {
            
            cancelBtn.addEventListener('click', () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(false);
                    bsModal.hide();
                }
            });

            confirmBtn.addEventListener('click', () => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(true);
                    bsModal.hide();
                }
            });
        });

        const bsModal = new bootstrap.Modal(modal);

        modal.addEventListener('hidden.bs.modal', () => {

            if (!isResolved) {
                isResolved = true;
                resolve(false);
            }

            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });

        bsModal.show();
    });
}
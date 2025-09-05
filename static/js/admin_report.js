async function loadMessages(messageInfoId, approvedIds) {
    const message = await fetch(`/admin/api/get_message/${messageInfoId.replace('messageinfo-', '')}`).then(res => res.json());

    const card = document.createElement('div');
    const isApproved = approvedIds.includes(message.id);

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

    const deleteDiv = document.createElement('div');
    deleteDiv.className = 'flex-fill';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm justify-content-end';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => deleteMessage('lg', message.id);
    deleteDiv.appendChild(deleteBtn);

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
    cardBody.appendChild(btnGroup);

    if (message.comments.length > 0)  cardBody.appendChild(commentBox);

    card.appendChild(cardBody);

    const messageInfo = document.getElementById(messageInfoId);
    messageInfo.appendChild(card);
}

async function loadAllMessageInfo() {
    const messageInfoElements = document.querySelectorAll('.messageinfo');
    for (const el of messageInfoElements) {
        const approvedIds = await fetch(`/admin/api/approved_ids/lg`).then(res=>res.json());
        loadMessages(el.id, approvedIds);
    }
}


loadAllMessageInfo();

function deleteReport(messageId, reportId) {
    if (!showConfirm('确定要删除该举报吗？')) return;

    fetch(`/admin/api/delete_report/${messageId}/${reportId}`,
            { method: 'POST' }
    ).then(res=>res.json()
    ).then(result=>{
        if (result.success) {
            showToast('删除成功');
            loadMessages();
        } else {
            showToast('删除失败：' + result.error);
        }
    }).catch(err => {
        showToast('删除失败：' + err);
    });
}


async function deleteMessage(school, messageId) {
    if (!showConfirm("确定要删除这条消息吗？")) return;

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
    if (!showConfirm("确定要删除这条评论吗？")) return;

    const res = await fetch(`/admin/api/delete_comment/${messageId}/${commentId}`, { method: 'POST' });
    const result = await res.json();
    if (result.success) {
        showToast("删除成功");
        loadMessages();
    } else {
        showToast("删除失败：" + result.error);
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

function showConfirm(message) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.tabIndex = -1;

        // Create modal structure using DOM
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
        cancelBtn.setAttribute('data-bs-dismiss', 'modal');
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
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.querySelector('#confirmBtn').onclick = () => {
            bsModal.hide();
            resolve(true);
        };

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
            resolve(false);
        });
    });
}
let noticeCache = null;
let noticeCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

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

document.addEventListener('DOMContentLoaded', function() {
    const noticeModal = document.getElementById('notice');
    if (noticeModal) {
        noticeModal.addEventListener('show.bs.modal', function () {
            loadNoticeContent();
        });
    }
});
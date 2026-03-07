// 文件类型判断函数
function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) return 'archive';
    return 'document';
}

// 文件大小格式化函数
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件类名
function getFileClass(file) {
    const type = getFileType(file);
    return `file-type-${type}`;
}

// 获取文件图标
function getFileIcon(file) {
    switch(getFileType(file)) {
        case 'image': return 'image';
        case 'audio': return 'music-note';
        case 'video': return 'camera-video';
        case 'archive': return 'folder-check';
        case 'document': return 'file-earmark-text';
        default: return 'file-earmark';
    }
}

// DOM加载完成后初始化拖拽功能
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    
    if (dropArea && fileInput) {
        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // 高亮拖拽区域
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        // 处理文件拖拽释放
        dropArea.addEventListener('drop', handleDrop, false);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            // 将拖拽的文件添加到文件输入元素中
            fileInput.files = files;
            // 触发文件选择事件
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
        
        unhighlight();
    }
});

// 处理文件选择事件
function handleFileSelect(event) {
    const files = event.target.files;
    const fileList = document.getElementById('file-list');
    
    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('li');
        fileItem.className = `file-item ${getFileClass(file)} position-relative`;
        
        // 创建结构
        const row = document.createElement('div');
        row.className = 'row g-1';

        // 左侧预览
        const colAuto = document.createElement('div');
        colAuto.className = 'col-auto';

        const preview = document.createElement('div');
        preview.className = 'file-preview me-2 rounded-2 overflow-hidden';

        const thumb = document.createElement('img');
        thumb.src = '';
        thumb.alt = '预览';
        thumb.className = 'file-thumb d-none';
        thumb.style.width = '40px';
        thumb.style.height = '40px';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'file-icon d-flex align-items-center justify-content-center';

        const icon = document.createElement('i');
        icon.className = `bi bi-${getFileIcon(file)}`;
        iconDiv.appendChild(icon);

        preview.appendChild(thumb);
        preview.appendChild(iconDiv);
        colAuto.appendChild(preview);

        // 右侧信息
        const col = document.createElement('div');
        col.className = 'col d-flex';

        const info = document.createElement('div');
        info.className = 'file-info flex-grow-1';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'file-name fw-medium text-truncate';
        nameDiv.style.maxWidth = '150px';
        nameDiv.textContent = file.name;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'file-meta d-flex justify-content-between small text-muted';

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-size';
        sizeSpan.textContent = formatFileSize(file.size);

        metaDiv.appendChild(sizeSpan);
        info.appendChild(nameDiv);
        info.appendChild(metaDiv);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-sm btn-close file-close-btn ms-2';
        closeBtn.backgroundColor = '#6A0DAD';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '移除文件');

        col.appendChild(info);
        col.appendChild(closeBtn);

        row.appendChild(colAuto);
        row.appendChild(col);

        fileItem.appendChild(row);

        // 添加删除按钮事件
        closeBtn.addEventListener('click', () => {
            removeFileAtIndex(index);
            fileList.removeChild(fileItem);
        });
        
        // 图片文件预览
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const thumb = fileItem.querySelector('.file-thumb');
                thumb.src = e.target.result;
                thumb.classList.remove('d-none');
                fileItem.querySelector('.file-icon').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        // 音频/视频文件使用默认图标
        else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            const thumb = fileItem.querySelector('.file-thumb');
            thumb.src = `/static/video.png`; // 你需要确保这个路径正确
            thumb.classList.remove('d-none');
            fileItem.querySelector('.file-icon').style.display = 'none';
        }
        
        fileList.appendChild(fileItem);
    });
}

// 根据索引移除文件
function removeFileAtIndex(indexToRemove) {
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const dt = new DataTransfer();
    
    Array.from(files).forEach((file, index) => {
        if (index !== indexToRemove) {
            dt.items.add(file);
        }
    });
    
    fileInput.files = dt.files;
    
    // 重新处理文件显示
    handleFileSelect({ target: fileInput });
}
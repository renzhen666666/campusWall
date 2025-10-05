

async function displayApps() {
    const appList = document.getElementById('app-list');
    appList.innerHTML = '';

    

    const apps = await fetch('/api/apps',
        { method: 'POST' }
    )
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Apps:', data);
            return data.apps;
        } else {
            console.log('Error:', data.message);
            showToast('获取应用列表失败');
            return [];
        }
    }).catch(error => {
        console.error('Fetch error:', error);
        showToast('获取应用列表失败');
        return [];
    });

    apps.forEach(appData => {
        const appElement = createAppElement(appData);
        appList.appendChild(appElement);
    });
}

function createAppElement(appData) {
    const appElement = document.createElement('div');
    appElement.className = 'card app-card';
    appElement.setAttribute('data-category', appData.partition);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';

    const appIcon = document.createElement('div');
    appIcon.className = 'app-icon mx-auto';
    appIcon.style.backgroundImage = appData.iconBackground;
    appIcon.innerHTML = appData.appIconElement;

    const appName = document.createElement('h4');
    appName.className = 'card-title';
    appName.textContent = appData.name;

    const author = document.createElement('small');
    author.className = 'text-muted';
    author.textContent = `提供者：${appData.author}`;

    const appDescription = document.createElement('p');
    appDescription.className = 'card-text';
    appDescription.innerHTML = appData.appDescription;

    const go = document.createElement('a');
    go.className = 'btn btn-outline-primary';
    go.href = appData.url;
    go.target = '_blank';
    go.textContent = '立即前往';


    cardBody.appendChild(appIcon);
    cardBody.appendChild(appName);
    cardBody.appendChild(author);
    cardBody.appendChild(appDescription);
    appElement.appendChild(cardBody);
    appElement.appendChild(go);
    return appElement;
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


displayApps();
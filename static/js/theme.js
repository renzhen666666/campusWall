const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');

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
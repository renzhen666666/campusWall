document.addEventListener('DOMContentLoaded',  function() {

        // 数字滚动动画
    function animateNumbers() {
        const numbers = document.querySelectorAll('.stats-number');
        numbers.forEach(element => {
            const target = parseInt(element.getAttribute('data-target'));
            let current = 0;
            const increment = target / 50; // 分50步完成动画
            
            const updateNumber = () => {
                if (current < target) {
                    current += increment;
                    element.textContent = Math.ceil(current).toLocaleString();
                    requestAnimationFrame(updateNumber);
                } else {
                    element.textContent = target.toLocaleString();
                }
            };
            
            setTimeout(updateNumber, 200);
        });
    }

    // 创建烟花效果
    function launchFireworks() {
        const container = document.getElementById('firework-container');
        const colors = [
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
            getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
            '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff6b6b'
        ];

        // 发射5个烟花
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                // 随机水平位置
                const startX = Math.random() * 80 + 10;
                
                // 创建发射器
                const launcher = document.createElement('div');
                launcher.className = 'firework-launcher';
                launcher.style.left = `${startX}%`;
                launcher.style.bottom = '0';
                container.appendChild(launcher);

                // 发射完成后爆炸
                setTimeout(() => {
                    if (launcher.parentNode) {
                        launcher.parentNode.removeChild(launcher);
                    }
                    
                    // 爆炸中心点
                    const explosionX = startX;
                    const explosionY = 30 + Math.random() * 40; // 在屏幕上方30%-70%处爆炸
                    
                    // 创建爆炸粒子
                    createExplosion(container, explosionX, explosionY, colors);
                }, 1000);
            }, i * 400);
        }
    }

    // 创建爆炸效果
    function createExplosion(container, x, y, colors) {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            
            // 随机颜色
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 8px ${color}`;
            
            // 设置初始位置
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            
            // 随机运动方向和距离
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // 随机动画持续时间
            const duration = Math.random() * 1 + 0.5;
            particle.style.animationDuration = `${duration}s`;
            
            container.appendChild(particle);
            
            // 动画结束后移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, duration * 1000);
        }
    }

    // 创建彩带雨效果
    function createConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = [
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
            getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
            '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff6b6b'
        ];

        // 创建100个彩带
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                
                // 随机位置
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-20px';
                
                // 随机颜色和形状
                const color = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.backgroundColor = color;
                
                // 随机形状（方形或圆形）
                if (Math.random() > 0.5) {
                    confetti.style.borderRadius = '50%';
                }
                
                // 随机大小
                const size = Math.random() * 10 + 5;
                confetti.style.width = size + 'px';
                confetti.style.height = size + 'px';
                
                // 添加旋转和下落动画
                const animation = document.createElement('style');
                const animationName = 'confettiFall' + Date.now() + i;
                animation.textContent = `
                    @keyframes ${animationName} {
                        0% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(100vh) rotate(${Math.random() * 720 - 360}deg);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(animation);
                
                confetti.style.animation = `${animationName} ${Math.random() * 5 + 3}s linear forwards`;
                
                container.appendChild(confetti);
                
                // 动画结束后移除彩带
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                    // 移除临时动画样式
                    document.head.removeChild(animation);
                }, 8000);
            }, i * 100); // 错开创建时间
        }
    }


    let Barrages =  fetch('/festival/100/barrage', {method: 'GET'})
        .then(response => response.json())
        .then(data => data.barrages || []);

        console.log('Barrages:', Barrages);
    async function initBarrage() {
        const barrageDisplay = document.getElementById('barrage-display');
        const barrageInput = document.getElementById('barrage-input');
        const sendButton = document.getElementById('send-barrage');

        Barrages = await Barrages;
            
        // 初始化弹幕
        Barrages.forEach((text, index) => {
            setTimeout(() => {
                createBarrage(text);
            }, index * 1500);
        });
        
        // 发送按钮事件
        sendButton.addEventListener('click', sendBarrage);
        
        // 回车发送
        barrageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendBarrage();
            }
        });
        
        // 发送弹幕函数
        async function sendBarrage() {
            const text = barrageInput.value.trim();
            if (text) {
                createBarrage(text, true);
                barrageInput.value = '';
                fetch('/festival/100/barrage', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({text: text})
                }).catch(err => console.error('Failed to send barrage:', err));
                Barrages = await fetch('/festival/100/barrage', {method: 'GET'})
                .then(response => response.json())
                .then(data => data.barrages || []);
            }
        }
        
        // 创建弹幕元素
        function createBarrage(text, isNew = false) {
            const barrage = document.createElement('div');
            barrage.className = 'barrage-item position-absolute text-nowrap d-inline-block';
            barrage.textContent = text;
            
            // 随机颜色
            const colors = [
                '#9B59B6', '#8A2BE2', '#6A0DAD', 
                '#4ECDC4', '#45B7D1', '#96CEB4', 
                '#FECA57', '#FF6B6B', '#FF9FF3'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            barrage.style.color = color;
            barrage.style.fontSize = (Math.random() * 8 + 14) + 'px';
            barrage.style.fontWeight = Math.random() > 0.7 ? 'bold' : 'normal';
            barrage.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
            barrage.style.padding = '2px 10px';
            barrage.style.borderRadius = '10px';
            
            if(isNew) {
                barrage.style.border = '1px solid #fff';
                barrage.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.7)';
                barrage.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                barrage.style.zIndex = '10';
            }

            // 随机垂直位置（避免重叠）
            const trackHeight = 30; // 每条轨道的高度
            const totalTracks = Math.floor(barrageDisplay.offsetHeight / trackHeight) - 1;
            const track = Math.floor(Math.random() * totalTracks);
            const topPosition = track * trackHeight + 5;
            barrage.style.top = topPosition + 'px';
            
            // 设置初始位置在容器右侧外
            barrage.style.left = barrageDisplay.offsetWidth + 'px';
            
            barrageDisplay.appendChild(barrage);
            
            // 计算动画持续时间（基于文本长度和容器宽度）
            const textLength = text.length;
            const baseDuration = 15; // 基础持续时间（秒）
            const duration = baseDuration + (textLength * 0.1) + (Math.random() * 5); // 根据文本长度调整速度
            
            // 添加动画
            barrage.animate(
                [
                    { transform: 'translateX(0)' },
                    { transform: `translateX(-${barrageDisplay.offsetWidth + barrage.offsetWidth}px)` }
                ],
                {
                    duration: duration * 1000,
                    easing: 'linear'
                }
            ).onfinish = () => {
                barrage.remove();
            };
        }
    }
    // 绑定按钮事件
    document.getElementById('launch-fireworks').addEventListener('click', function() {
        launchFireworks();
        //setTimeout(createConfetti, 1000);
    });

    // 页面加载时自动播放烟花特效
    setTimeout(function() {
        initBarrage();

        launchFireworks();
        // 1.5秒后播放彩带雨
        setTimeout(createConfetti, 1500);
        // 启动数字动画
        animateNumbers();
    }, 1000);
    

    setInterval(() => {
        initBarrage();
    }, 5000);
    
});
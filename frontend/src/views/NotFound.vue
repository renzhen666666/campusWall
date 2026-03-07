<template>
  <div class="not-found-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">404</h1>
          <h2 class="hero-subtitle">页面未找到</h2>
          <p class="hero-description">抱歉，您访问的页面不存在或已被移除</p>
          <div class="error-actions">
            <router-link to="/" class="btn-home">
              <i class="bi bi-house-door me-2"></i>
              返回首页
            </router-link>
            <router-link to="/wall" class="btn-wall ms-3">
              <i class="bi bi-arrow-left-circle me-2"></i>
              前往校园墙
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Game Section -->
    <section class="game-section">
      <div class="section-header">
        <h2>来玩个小游戏吧！</h2>
        <p>猜对了有惊喜哦 😊</p>
      </div>
      
      <div class="game-container">
        <div class="guess-game">
          <div class="game-description">
            <p>我正在想一个 1-100 的数字，试试看能用多少次猜中？</p>
          </div>
          
          <div class="game-controls">
            <input 
              v-model.number="userGuess" 
              type="number" 
              :min="minRange" 
              :max="maxRange"
              class="form-control game-input"
              placeholder="输入你的猜测..."
              @keyup.enter="makeGuess"
              :disabled="gameWon"
            >
            <button 
              @click="makeGuess" 
              class="btn btn-primary game-btn"
              :disabled="gameWon"
            >
              {{ gameWon ? '已获胜!' : '猜测' }}
            </button>
            <button 
              @click="resetGame" 
              class="btn btn-outline-primary reset-btn"
            >
              重新开始
            </button>
          </div>
          
          <div class="game-feedback" v-if="feedback">
            <div :class="['feedback-message', feedback.type]">
              {{ feedback.text }}
            </div>
          </div>
          
          <div class="attempts-counter">
            <p>已尝试：<strong>{{ attempts }}</strong> 次</p>
          </div>
          
          <div class="number-range">
            <p>当前范围：<strong>{{ minRange }}</strong> - <strong>{{ maxRange }}</strong></p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 定义组件名称
defineOptions({
  name: 'NotFound'
})

// 游戏状态
const targetNumber = ref(Math.floor(Math.random() * 100) + 1)
const userGuess = ref('')
const attempts = ref(0)
const minRange = ref(1)
const maxRange = ref(100)
const gameWon = ref(false)
const feedback = ref(null)

// 游戏逻辑
const makeGuess = () => {
  if (isNaN(userGuess.value) || userGuess.value === '' || gameWon.value) {
    return
  }

  const guess = parseInt(userGuess.value)
  
  if (guess < 1 || guess > 100) {
    feedback.value = {
      text: '请输入 1-100 之间的数字！',
      type: 'error'
    }
    return
  }

  attempts.value++
  
  if (guess === targetNumber.value) {
    feedback.value = {
      text: `恭喜！你用了 ${attempts.value} 次猜中了数字 ${targetNumber.value}！`,
      type: 'success'
    }
    gameWon.value = true
  } else if (guess < targetNumber.value) {
    feedback.value = {
      text: '太小了！试试更大的数字',
      type: 'hint-low'
    }
    if (guess > minRange.value) {
      minRange.value = guess + 1
    }
  } else {
    feedback.value = {
      text: '太大了！试试更小的数字',
      type: 'hint-high'
    }
    if (guess < maxRange.value) {
      maxRange.value = guess - 1
    }
  }
  
  userGuess.value = ''
}

const resetGame = () => {
  targetNumber.value = Math.floor(Math.random() * 100) + 1
  userGuess.value = ''
  attempts.value = 0
  minRange.value = 1
  maxRange.value = 100
  gameWon.value = false
  feedback.value = null
}
</script>

<style scoped>
.not-found-page {
  width: 100%;
}

section {
  margin-bottom: 40px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(45deg, var(--primary-color), var(--primary-dark));
  padding: 80px 0;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.hero-title {
  font-size: 5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.hero-description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-home {
  display: inline-flex;
  align-items: center;
  padding: 15px 30px;
  background: white;
  color: var(--primary-color);
  text-decoration: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-home:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-wall {
  display: inline-flex;
  align-items: center;
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.btn-wall:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
}

/* Game Section */
.game-section {
  background: var(--bg-color);
  padding: 60px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.section-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.game-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.guess-game {
  background: var(--card-bg);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.game-description {
  margin-bottom: 25px;
}

.game-description p {
  font-size: 1.1rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.game-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.game-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 15px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--input-bg);
  color: var(--text-primary);
}

.game-btn, .reset-btn {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s;
}

.game-btn {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.game-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}

.reset-btn {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.reset-btn:hover {
  background: var(--primary-light);
}

.attempts-counter, .number-range {
  margin: 15px 0;
}

.attempts-counter p, .number-range p {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0;
}

.feedback-message {
  padding: 12px;
  border-radius: 8px;
  margin: 15px 0;
  font-weight: 600;
}

.feedback-message.success {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.feedback-message.error {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.feedback-message.hint-low {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
  border: 1px solid rgba(0, 123, 255, 0.3);
}

.feedback-message.hint-high {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 3.5rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-home,
  .btn-wall {
    width: 100%;
    justify-content: center;
    margin-left: 0 !important;
  }

  .game-controls {
    flex-direction: column;
  }

  .game-input {
    min-width: 100%;
  }
}

@media (max-width: 576px) {
  section {
    padding: 40px 0;
  }

  .hero-section {
    padding: 60px 20px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }

  .guess-game {
    padding: 20px;
  }
}
</style>
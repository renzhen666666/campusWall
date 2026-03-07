<template>
  <div class="help-page">
    <div class="container mt-4">
      <h1>帮助中心</h1>
      <p>如果您在使用过程中遇到任何问题，请随时联系我们。</p>

      <div class="row mt-4">
        <div class="col-12">
          <div class="card h-100">
            <div class="card-body">
              <h3 class="card-title">反馈问题</h3>
              <p class="card-text">如果您发现了任何问题或有改进建议，请告诉我们。</p>
              <router-link to="/help/form" class="btn btn-primary">
                <i class="bi bi-send me-1"></i>提交反馈
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-body">
          <h3>常见问题</h3>
          <div class="accordion" id="faqAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                  如何发布留言？
                </button>
              </h2>
              <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  点击校园墙页面的"我要发贴"按钮，填写内容后点击发布即可。您也可以添加标签和附件。
                </div>
              </div>
            </div>
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                  如何举报不当内容？
                </button>
              </h2>
              <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  在留言详情页点击"举报"按钮，填写举报原因和您的联系方式，提交后会由管理员处理。
                </div>
              </div>
            </div>
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                  支持哪些文件格式？
                </button>
              </h2>
              <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  支持图片（jpg, jpeg, png, gif, webp）、视频（mp4, webm, mov, avi）、音频（mp3, wav, m4a, aac, flac）等多种格式。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const showReportForm = () => {
  alert('请在留言详情页点击"举报"按钮进行举报')
}
</script>

<style scoped>
.help-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.accordion-button {
  color: #6A0DAD;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(106, 13, 173, 0.1);
  color: #6A0DAD;
}

.accordion-button {
  color: #6A0DAD;
  background-color: var(--card-bg); /* 默认背景色 */
  transition: background-color 0.3s ease;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(106, 13, 173, 0.1); /* 展开时的背景色 */
  color: #6A0DAD;
  box-shadow: inset 0 0 0 1px rgba(106, 13, 173, 0.3); /* 添加边框效果 */
}

.accordion-button.collapsed {
  background-color: var(--card-bg); /* 折叠时的背景色 */
}

.accordion-button:focus {
  border-color: rgba(106, 13, 173, 0.5); /* 焦点状态的边框色 */
  box-shadow: 0 0 0 0.2rem rgba(106, 13, 173, 0.25); /* 焦点状态的阴影 */
}

.accordion-button:hover {
  background-color: var(--hover-bg); /* 悬停时的背景色 */
}

.accordion-item {
  background-color: var(--card-bg); /* 整个accordion项的背景色 */
  border: 1px solid var(--border-color); /* 边框颜色 */
  border-radius: 8px; /* 圆角 */
  margin-bottom: 8px; /* 间距 */
}

.accordion-body {
  background-color: var(--card-bg); /* 内容区域背景色 */
  color: var(--text-primary); /* 内容文字颜色 */
}
</style>
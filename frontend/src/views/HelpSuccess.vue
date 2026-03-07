<template>
  <div class="help-success-page">
    <div class="container mt-4 text-center">
      <div class="card">
        <div class="card-body py-5">
          <div class="success-icon mb-4">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <h2 class="mb-3">提交成功</h2>
          <p class="text-muted mb-4">感谢您的反馈，我们会尽快处理。</p>
          <router-link to="/" class="btn btn-primary">
            <i class="bi bi-house me-1"></i>返回首页
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-success-page {
  background-color: var(--bg-color);
  min-height: 100vh;
}

.card {
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 500px;
  margin: 0 auto;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
}

.btn-primary {
  background-color: #6A0DAD;
  border-color: #6A0DAD;
}

.btn-primary:hover {
  background-color: #5a0b91;
  border-color: #5a0b91;
}
</style>
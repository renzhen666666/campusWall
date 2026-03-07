<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container">
      <a class="navbar-brand" href="/">
        <i class="bi bi-house-door me-2"></i>
        龙高校园墙
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" :class="{ active: $route.path === '/' }" to="/">
              <i class="bi bi-house me-1"></i>首页
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" :class="{ active: $route.path === '/wall' }" to="/wall">
              <i class="bi bi-chat-quote me-1"></i>校园墙
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" :class="{ active: $route.path.startsWith('/help') }" to="/help">
              <i class="bi bi-question-circle me-1"></i>帮助
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" :class="{ active: $route.path === '/apps' }" to="/apps">
              <i class="bi bi-grid me-1"></i>应用广场
            </router-link>
          </li>
        </ul>
        <ul class="navbar-nav ms-auto">
          <li class="nav-item ms-2" v-if="$route.path === '/wall'">
            <button
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#publishModal"
            >
              <i class="bi bi-pencil-square me-1"></i>我要发贴
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>
<template>
  <nav>
    <h1>{{ title }}</h1>
    <router-link
      v-if="
        currentPath === '/' ||
        currentPath === '/signup' ||
        currentPath === '/job-post' ||
        currentPath.startsWith('/job-post-update')
      "
      to="/job-list"
      class="btn-close"
    >
      <Icon icon="material-symbols:close" width="40" style="color: #1e1e1e" />
    </router-link>

    <!-- job-detail, AudioPost, user-profile 좌측 뒤로가기 아이콘 -->
    <router-link
      v-if="
        currentPath.startsWith('/job-detail') ||
        currentPath === '/user-profile' ||
        currentPath === '/AudioPost'
      "
      to="/job-list"
      class="btn-close"
    >
      <Icon
        icon="ic:baseline-arrow-back"
        width="40"
        height="40"
        style="color: #1e1e1e"
      />
    </router-link>

    <!-- job-list 우측에 배치되는 프로필, 글쓰기 아이콘 -->
    <div class="right-icons" v-if="currentPath === '/job-list'">
      <router-link to="/AudioPost">
        <Icon icon="mdi:talk" width="40" style="color: #1e1e1e" />
      </router-link>
      <router-link to="/user-profile">
        <Icon
          icon="teenyicons:user-circle-solid"
          width="40"
          style="color: #1e1e1e"
        />
      </router-link>
      <router-link to="/job-post"
        ><!-- post -->
        <Icon icon="mdi:pencil-outline" width="40" style="color: #1e1e1e" />
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { useRoute } from "vue-router";
import { watch, ref } from "vue";

let route = useRoute();
let currentPath = route.path;
let title = ref("");

watch(route, (newPath) => {
  currentPath = newPath.path;
  console.log(currentPath);

  // 경로 별로 제목을 다르게 설정
  if (currentPath === "/") {
    title.value = "로그인";
  } else if (currentPath === "/signup") {
    title.value = "회원가입";
  } else if (currentPath === "/job-list") {
    title.value = " ";
  } else if (currentPath.startsWith("/job-detail")) {
    title.value = "상세보기";
  } else if (currentPath === "/job-post") {
    title.value = "구인등록";
  } else if (currentPath === "/user-profile") {
    title.value = "프로필";
  } else if (currentPath === "/AudioPost") {
    title.value = "음성입력";
  } else if (currentPath.startsWith("/job-post-update")) {
    title.value = "구인등록 수정";
  }
});
</script>

<style lang="scss" scoped>
nav {
  position: relative;
  // background: pink;
  border-bottom: 1px solid #ccc;
  width: 100%;
  height: 100px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  h1 {
    font-size: 40px;
    color: var(--text-color-dark);
  }
  .btn-close {
    position: absolute;
    left: 30px;
    text-decoration: none;
  }
}

.right-icons {
  position: absolute;
  right: 30px;
  top: 30px;
  display: flex;
  gap: 30px;
}
</style>

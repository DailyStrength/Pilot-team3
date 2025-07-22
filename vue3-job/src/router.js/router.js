import { createRouter, createWebHistory } from "vue-router";
import Login from "../view/Login.vue";
import SignUp from "../view/Signup.vue";
import JobList from "../view/JobList.vue";
import JobDetail from "../view/JobDetail.vue";
import UserProfile from "../view/UserProfile.vue";
import JobPost from "../view/JobPost.vue";

const routes = [{ path: "/", component: Login }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

<template>
  <div class="loading_info" v-if="isLoading">
    <p>등록 중...</p>
  </div>

  <div class="form-container" v-if="isLogin">
    <div class="form-group">
      <label>음성 입력</label>
      <div>
        <button @click="startRecognition" :disabled="isListening">
          🎤 말하기 시작
        </button>
        <button @click="stopRecognition" :disabled="!isListening">
          🛑 멈추기
        </button>
      </div>
      <p v-if="transcript">음성 입력 결과: {{ transcript }}</p>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">제목</label>
        <input type="text" id="title" v-model="title" required />
      </div>

      <div class="form-group">
        <label for="todo">하는 일</label>
        <input type="text" id="todo" v-model="todo" required />
      </div>

      <div class="form-group">
        <label>급여형태</label>
        <div class="tab-group">
          <input
            type="radio"
            id="pay_rule1"
            name="pay_rule"
            value="시급"
            v-model="pay_rule"
          />
          <input
            type="radio"
            id="pay_rule2"
            name="pay_rule"
            value="월급"
            v-model="pay_rule"
          />
          <label for="pay_rule1">시급</label>
          <label for="pay_rule2">월급</label>
        </div>
        <input type="number" v-model="pay" placeholder="금액" required />
      </div>

      <div class="form-group">
        <label for="desc">자세한 설명</label>
        <textarea id="desc" rows="4" v-model="desc" required></textarea>
      </div>

      <div class="form-group">
        <label for="company_name">업체명</label>
        <input type="text" id="company_name" v-model="company_name" required />
      </div>

      <div class="form-group">
        <label for="location">위치</label>
        <input type="text" id="location" v-model="location" required />
      </div>

      <div class="form-group">
        <label for="tel">연락처</label>
        <input type="text" id="tel" v-model="tel" required />
      </div>

      <div class="form-group">
        <label for="photo">사진 (선택)</label>
        <input @change="onFileChange" type="file" id="photo" accept="image/*" />
        <img
          v-if="previewImage"
          :src="previewImage"
          alt="미리보기"
          width="64"
          height="64"
        />
      </div>

      <button type="submit">등록하기</button>
    </form>
  </div>
</template>

<script setup>
import { useAuth } from "../auth/auth";
import { useRouter } from "vue-router";
import supabase from "../supabase";
import { ref, onMounted, onUnmounted } from "vue";

const { isLogin, user, checkLoginStatus } = useAuth();
const router = useRouter();
const isLoading = ref(false);
const transcript = ref("");
const isListening = ref(false);
const title = ref("");
const todo = ref("");
const pay_rule = ref("시급");
const pay = ref("");
const desc = ref("");
const company_name = ref("");
const location = ref("");
const tel = ref("");
const img_url = ref("");
const previewImage = ref(null);
let file = null;
let finalTranscript = "";

const recognition = new window.webkitSpeechRecognition();
recognition.lang = "ko-KR";
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; ++i) {
    const transcriptChunk = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcriptChunk;
    } else {
      interim += transcriptChunk;
    }
  }
  transcript.value = finalTranscript + interim;
};

recognition.onend = async () => {
  isListening.value = false;
  if (finalTranscript.trim().length < 10) {
    alert("음성이 너무 짧습니다. 다시 말씀해주세요.");
    return;
  }
  const extracted = await extractFieldsWithGPT(finalTranscript);
  if (extracted) {
    title.value = extracted.title;
    todo.value = extracted.todo;
    pay_rule.value = extracted.pay_rule;
    pay.value = extracted.pay;
    desc.value = extracted.desc;
  } else {
    alert("정보 추출 실패: 수동 입력 바랍니다.");
  }
};

const startRecognition = () => {
  isListening.value = true;
  finalTranscript = "";
  recognition.start();
};

const stopRecognition = () => {
  recognition.stop();
};

const onFileChange = (e) => {
  file = e.target.files[0];
  if (file) previewImage.value = URL.createObjectURL(file);
};

const uploadImage = async () => {
  const { data, error } = await supabase.storage
    .from("images")
    .upload(file.name, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (!error) {
    const { data: imgData } = supabase.storage
      .from("images")
      .getPublicUrl(file.name);
    img_url.value = imgData.publicUrl;
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  if (file) await uploadImage();

  const { error } = await supabase.from("job_posts").insert({
    title: title.value,
    todo: todo.value,
    pay_rule: pay_rule.value,
    pay: pay.value,
    desc: desc.value,
    company_name: company_name.value,
    location: location.value,
    tel: tel.value,
    img_url: img_url.value,
  });

  isLoading.value = false;

  if (error) alert("등록 실패");
  else {
    alert("등록 성공");
    router.push("/job-list");
  }
};

onMounted(async () => {
  await checkLoginStatus();
  if (user.value) {
    const { data } = await supabase
      .from("user_table")
      .select("name, tel, addr")
      .eq("id", user.value.id)
      .single();
    company_name.value = data?.name || "";
    tel.value = data?.tel || "";
    location.value = data?.addr || "";
  }
});

onUnmounted(() => {
  if (previewImage.value) URL.revokeObjectURL(previewImage.value);
});

const extractFieldsWithGPT = async (text) => {
  const system_prompt = `너는 채용 공고 도우미야. 사용자의 음성 내용을 듣고 아래 항목만 JSON 형식으로 정확히 반환해.
  title, todo, pay_rule, pay, desc 항목만 포함된 JSON 객체만 반환해. 절대로 설명하지마.
  예시: {"title":"간병 알바","todo":"어르신 식사 보조","pay_rule":"시급","pay":12000,"desc":"주 3회 오전 근무"}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });

  const result = await response.json();
  try {
    return JSON.parse(result.choices[0].message.content);
  } catch (e) {
    console.error("GPT 응답 파싱 실패:", result);
    return null;
  }
};
</script>

<style lang="scss" scoped>
@use "../style/form.scss";

.tab-group {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;

  label {
    flex: 1;
    border: 1px solid var(--main-color-dark);
    border-radius: 8px;
    text-align: center;
    padding: 12px;
    cursor: pointer;
  }
}

input[type="radio"] {
  display: none;
}

input[type="radio"]:nth-child(1):checked ~ .tab-group label:nth-child(1),
input[type="radio"]:nth-child(2):checked ~ .tab-group label:nth-child(2) {
  background: var(--main-color-dark);
  color: #fff;
}
</style>

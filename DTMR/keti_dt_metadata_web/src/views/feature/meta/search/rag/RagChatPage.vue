<template>
  <div class="cntSec">
    <div class="boxLayout">
      <div class="boxTit">
        <h3>RAG 대화형 검색</h3>
      </div>

      <div class="boxCnt">

        <!-- 예시 질문 -->
        <div class="hint-wrap">
          <div class="hint-head">
            <h4>예시 질문</h4>
            <el-button type="default" size="small" class="ml15" @click="showEx = !showEx">{{ showEx ? '접기' : '펼치기' }}</el-button>
          </div>
          <div class="hint-grid"  v-show="showEx">
            <div v-for="(h, i) in HINT_SETS" :key="i" class="hint-card">
              <div class="title">{{ h.title }}</div>
              <div class="chips">
                <el-button type="default" plain
                  v-for="(q, j) in h.items"
                  :key="j"
                  size="small"
                  class="chip"
                  @click="useHint(q, 'send')"
                >{{ q }}</el-button>
              </div>
              <!-- <div class="tiny">
                <span class="example-label">예:</span>
                <a href="#" @click.prevent="useHint(h.example, 'fill')">{{ h.example }}</a>
              </div> -->
            </div>
          </div>
        </div>

        <!-- 타임라인 -->
        <div ref="scroller" class="chat-timeline" @click="onTimelineClick" @keydown="onTimelineKeydown">
          <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
            <div class="bubble" v-html="renderMd(m.content)"></div>
          </div>

          <div v-if="loading" class="msg assistant">
            <div class="bubble">답변 생성 중…</div>
          </div>
          <div v-if="error" class="msg assistant error">
            <div class="bubble">⚠ {{ error }}</div>
          </div>
        </div>

        <!-- 입력창 -->
        <form class="chat-input" @submit.prevent="send">
          <el-input
            ref="inputRef"          
            v-model="draft"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            placeholder="질문을 입력하고 Enter (줄바꿈은 Shift+Enter)"
            @keydown.enter.exact.prevent="send"
          />
          <el-button type="primary" :disabled="!canSend" @click="send">보내기</el-button>
        </form>
      </div>
    </div>

    <!-- ID 상세 팝업 -->
    <el-dialog
      v-model="idDialog.visible"
      :title="`상세 조회 - ${idDialog.id}`"
      width="80%"
      top="5vh"
    >
      <div v-if="idDialog.id" class="id-dialog-body">
        <!-- 같은 SPA 내 상세 화면을 iframe으로 임베드 -->
        <iframe
          :src="detailUrl"
          class="detail-frame"
          title="상세 보기"
        ></iframe>
      </div>
      <!-- <template #footer>
        <el-button type="default" @click="openInNewTab" :disabled="!idDialog.id">새 탭에서 열기</el-button>
        <el-button type="default" @click="idDialog.visible = false">닫기</el-button>
      </template> -->
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { getGlobalProperties } from "@/assets/js/common.js";
import MarkdownIt from 'markdown-it'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'  
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

const showEx = ref(false);

// -----------------------------
// 예시 질문
// -----------------------------
const HINT_SETS = ref([
  {
    title: '개수/집계',
    items: [
      '모델 유형별로 각각 몇 개인가요?',
      '지역별 분포 알려줘',
      '최근 6개월 이내 제주에서 생성된 디지털 트윈의 개수'
    ],
  },
  {
    title: '키워드(단어 검색 가능)/ID/상세',
    items: [
      "환경 관련 싱글디지털트윈", 
      "호미곶 키워드로 검색",
      "유해물질",
      "id='KR-02-K10002-20250002' 상세",
    ],
  },  
  {
    title: '지역/기간',
    items: [
      '경상북도 지역의 디지털 트윈',
      '가장 최근 서울에서 생성된 디지털 트윈',
      '2025년 08월 20일 이후 제주에서 생성된 디지털 트윈'
    ],
  }
])

// 예시 사용: fill(입력만) / send(즉시 전송)
const inputRef = ref(null) // el-input 포커스용
const useHint = (text, mode = 'send') => {
  draft.value = text
  if (mode === 'send') send()
  else nextTick(() => inputRef.value && inputRef.value.focus())
}

// -----------------------------
// Markdown 렌더 + ID 자동 링크(팝업)
// -----------------------------

// ID 규칙과 유사(14~25자, 허용문자, 하이픈 2개 이상)
const ID_RE = /([A-Za-z0-9~_\-]{14,25})/g
const isPlausibleId = (t) => {
  if (!t) return false
  if (t.length < 14 || t.length > 25) return false
  if (!/^[A-Za-z0-9~_\-]+$/.test(t)) return false
  if ((t.match(/-/g) || []).length < 2) return false
  if (/--/.test(t)) return false
  return true
}

// 플러그인: 텍스트 토큰 속 ID를 <a class="dt-id" data-dt-id="...">로 치환
const dtIdLinker = (md) => {
  md.core.ruler.after('inline', 'dt-id-linker', (state) => {
    state.tokens.forEach((t) => {
      if (t.type !== 'inline' || !t.children) return
      const out = []
      t.children.forEach((ch) => {
        if (ch.type !== 'text') { out.push(ch); return }
        const parts = ch.content.split(ID_RE)
        for (let i = 0; i < parts.length; i++) {
          const seg = parts[i]
          if (i % 2 === 0) { // 일반 텍스트
            if (seg) {
              const txt = new state.Token('text', '', 0)
              txt.content = seg
              out.push(txt)
            }
          } else { // 캡처된 후보(ID?)
            const id = seg
            if (isPlausibleId(id)) {
              const open = new state.Token('link_open', 'a', 1)
              open.attrs = [['href', '#'], ['class', 'dt-id'], ['data-dt-id', id]]
              const text = new state.Token('text', '', 0)
              text.content = id
              const close = new state.Token('link_close', 'a', -1)
              out.push(open, text, close)
            } else {
              const txt = new state.Token('text', '', 0)
              txt.content = id
              out.push(txt)
            }
          }
        }
      })
      t.children = out
    })
  })
}

// MarkdownIt 인스턴스 (HTML 비활성화로 XSS 차단)
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (code, lang) => {
    try {
      if (lang && Prism.languages[lang]) {
        const html = Prism.highlight(code, Prism.languages[lang], lang)
        return `<pre class="language-${lang}"><code class="language-${lang}">${html}</code></pre>`
      }
      // 언어 미지정/미지원: 이스케이프만
      return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`
    } catch {
      return `<pre><code>${md.utils.escapeHtml(code)}</code></pre>`
    }
  }
})
md.use(dtIdLinker)

// 렌더러
const renderMd = (s) => md.render(s || '')

// -----------------------------
// 채팅 상태/동작
// -----------------------------

// 상태
const messages = ref([
  { role: 'assistant', content: '안녕하세요! 디지털트윈 메타데이터에 대해 무엇이든 물어보세요.' }
])
const draft   = ref('')
const loading = ref(false)
const error   = ref('')
const scroller = ref(null)

const canSend = computed(() => !!draft.value.trim() && !loading.value)

// 스크롤
const scrollToBottom = () => {
  nextTick(() => {
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 메시지 조작
const pushUser = (text) => { messages.value.push({ role: 'user', content: text }) }
const pushAssistant = (text) => { messages.value.push({ role: 'assistant', content: text }) }

// 전송
const send = async () => {
  if (!canSend.value) return
  const q = draft.value.trim()
  draft.value = ''
  error.value = ''
  pushUser(q)
  scrollToBottom()

  loading.value = true
  try {
    // 현재 백엔드 계약: question → answer(string)
    // (검색형으로 쓰려면 { query: q }로 바꾸면 됨)
    const payload = { question: q }
    const { data } = await $axios.post($apiUrls.meta.search.vector.getRagResults, payload)
    const answer = data?.answer_text || '답변을 생성하지 못했습니다.'
    pushAssistant(answer)
  } catch (e) {
    error.value = e?.message || '오류가 발생했습니다.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

onMounted(() => scrollToBottom())

// -----------------------------
// ID 클릭 → 팝업 다이얼로그
// -----------------------------
const idDialog = ref({ visible: false, id: '' })

watch(() => idDialog.value.visible, (open) => {
  if (open) {
    sessionStorage.setItem("dtmeta.dialog-embed", "1")
  } else {
    sessionStorage.removeItem("dtmeta.dialog-embed")
  }
})

// 상세 라우트 베이스 (필요하면 여기만 바꾸면 됨)
const DETAIL_ROUTE_BASE = '/meta/external/search/intgrdata/page/'
const detailUrl = computed(() => {
  const id = idDialog.value.id
  if (!id) return ''
  return router.resolve({
    path: `${DETAIL_ROUTE_BASE}${id}`,
    query: { embed: '1' }, 
  }).href
})

const openIdDialog = (id) => {
  idDialog.value.id = id || ''
  idDialog.value.visible = !!id
}

const openInNewTab = () => {
  if (!detailUrl.value) return
  window.open(detailUrl.value, '_blank')
}

const onTimelineClick = (e) => {
  const a = e.target.closest && e.target.closest('a.dt-id')
  if (a) {
    e.preventDefault()
    const id = a.getAttribute('data-dt-id')
    if (id) openIdDialog(id)
  }
}

const onTimelineKeydown = (e) => {
  if (e.key === 'Enter') {
    const a = document.activeElement
    if (a && a.matches && a.matches('a.dt-id')) {
      e.preventDefault()
      const id = a.getAttribute('data-dt-id')
      if (id) openIdDialog(id)
    }
  }
}

</script>

<style scoped>
.boxCnt { display:flex; flex-direction: column; height: calc(100vh - 260px); }

.hint-wrap{ margin-bottom:20px; }
.hint-head{ display:flex; /* justify-content:space-between; */ align-items:center; margin-bottom:6px; }
.hint-head h4{ margin:0; font-size:14px; font-weight:700; color:#333; }
.hint-grid{
  display:grid;
  gap:10px;
  grid-template-columns: repeat(3, 1fr);
}
.hint-card{
  border:1px solid #eee;
  border-radius:10px;
  padding:10px;
  background:#fff;
}
.hint-card .title{
  font-weight:700;
  margin-bottom:6px;
  font-size:13px;
  color: var(--el-text-color-regular);
}
.hint-card .chips{
  display: flex;
  flex-direction: column;   /* 한 줄(세로)에 하나씩 */
  align-items: flex-start;
  gap: 6px;
}
.hint-card .chips :deep(.el-button + .el-button){
  margin-left: 0 !important;
}
.hint-card .chip{
  width: auto;              
  max-width: 100%;
  text-align: left;
  align-self: flex-start;   
  white-space: normal;
}
.hint-card .tiny{ margin-top:8px; font-size:12px; }
.hint-card .tiny .example-label{ margin-right:6px; color:#999; }
.hint-card .tiny a{ color: var(--el-color-primary); }

@media (max-width: 1280px){
  .hint-grid{ grid-template-columns: 1fr; }
}

.chat-timeline {
  flex: 1 1 auto; overflow-y: auto; padding: 8px 4px 16px;
  background: #fafafa; border: 1px solid #eee; border-radius: 8px;
}

.msg { display:flex; margin: 8px 0; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }
.msg.error .bubble { background: #fff3f3; border-color: #ffcccc; }

.bubble {
  max-width: 80%; padding: 10px 12px; border-radius: 12px;
  border: 1px solid #e5e5e5; background: #fff;
  word-break: break-word; line-height: 1.45;
}
.msg.user .bubble { background: #e8f3ff; border-color: #cfe5ff; }

.chat-input {
  display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 20px;
}

/* markdown 기본 */
:deep(pre.hljs){ padding: 10px; border-radius: 8px; overflow-x: auto; }
:deep(code){ background: #f2f2f2; padding: 0 4px; border-radius: 4px; }
:deep(table){ border-collapse: collapse; width: 100%; }
:deep(th), :deep(td){ border:1px solid #e5e5e5; padding:6px 8px; }

/* ID 링크 */
:deep(a.dt-id){
  color: var(--el-color-primary);
  font-weight: 700;
  cursor:pointer;
}

/* 다이얼로그 iframe */
.id-dialog-body{ height: 72vh; }
.detail-frame{
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}
</style>



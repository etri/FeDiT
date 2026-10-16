<template>
	<div class="cntSec discovery-page">
		<!-- 전체 카운트 (검색바 위, 별도 영역) — 항목 단위로 wrap, 중간 단어 안 잘림 -->
		<div class="discovery-global-counts-bar">
			<span
				v-for="t in state.typeCountsGlobal"
				:key="t.typeId"
				class="discovery-global-counts-item"
			>{{ t.typeName }} {{ t.cnt }}</span>
		</div>

		<!-- 상단 검색 영역 (다른 화면과 동일한 boxLayout 패턴) -->
		<div class="boxLayout" style="margin-top: 10px;">

			<div class="boxCnt">
				<div class="discovery-search-bar">
					<el-autocomplete
						ref="searchInputRef"
						v-model="state.query"
						:fetch-suggestions="fetchSuggestions"
						:debounce="250"
						placeholder="이름 · 키워드 · 주제어로 검색"
						value-key="value"
						clearable
						hide-loading
						@keydown.enter="onSearch"
						@select="onSuggestionSelect"
					>
						<template #default="{ item }">
							<span>{{ item.value }}</span>
							<span class="discovery-suggest-meta">
								<span v-if="item.kind === 'keyword'" class="discovery-suggest-kind">(키워드)</span>
							</span>
						</template>
					</el-autocomplete>
					<el-button type="primary" @click="onSearch">검색</el-button>
					<el-button
						type="default"
						class="el-button--delete btn-label-color"
						@click="state.advanced = !state.advanced"
					>
						상세 검색
						<el-icon class="discovery-advanced-icon">
							<ArrowDown v-if="!state.advanced" />
							<ArrowUp v-else />
						</el-icon>
					</el-button>
				</div>

				<!-- 펼침 시: 통합검색과 동일 폼 스타일 (라벨 위, 콤보/입력 아래) -->
				<div v-if="state.advanced" class="discovery-advanced-panel">
					<el-form label-position="top" class="search-form">
						<el-row :gutter="20">
							<el-col :span="7">
								<el-form-item label="디지털트윈 지정">
									<el-select v-model="state.scope" filterable placeholder="전체">
										<el-option label="전체" value="all" />
										<el-option
											v-for="dt in state.dtList"
											:key="dt.medataSetId"
											:label="dt.medataSetNm"
											:value="dt.medataSetId"
										/>
									</el-select>
								</el-form-item>
							</el-col>
							<el-col :span="7">
								<el-form-item label="메타데이터 유형">
									<el-select v-model="state.typeFilter" placeholder="전체" filterable>
										<el-option label="전체" value="" />
										<el-option
											v-for="item in state.typeModelList"
											:key="item.modelId"
											:label="`${item.modelNm} ${item.modelLogicNm}`"
											:value="item.modelId"
										/>
									</el-select>
								</el-form-item>
							</el-col>
							<el-col :span="7">
								<el-form-item label="공간 지정">
									<div class="discovery-space-row">
										<el-button
											type="default"
											class="btn-label-color"
											@click="openMapDialog"
										>
											<el-icon><LocationInformation /></el-icon>
											<span class="ml6">
												{{ state.polygon ? "지도 범위 검색 (선택됨)" : "지도 범위 검색" }}
											</span>
										</el-button>
										<el-button
											v-if="state.polygon"
											type="default"
											class="el-button--delete btn-label-color"
											title="선택 영역 지우기"
											@click="clearPolygon"
										>
											<el-icon class="icon icon-refresh" />
										</el-button>
									</div>
								</el-form-item>
							</el-col>
							<el-col :span="3">
								<el-form-item label="제외 데이터">
									<el-select v-model="state.includeDisuseYn" placeholder="제외">
										<el-option label="제외" value="" />
										<el-option label="포함" value="Y" />
									</el-select>
								</el-form-item>
							</el-col>
						</el-row>
					</el-form>
				</div>
			</div>
		</div>

		<!-- 검색 결과 영역 (boxLayout 패턴) -->
		<div class="boxLayout">
			<div class="boxTit">
				<h3>
					검색 결과
					<span v-if="state.searched" class="discovery-result-count">- 총 {{ state.totalCount }}건</span>
				</h3>
				<div v-if="state.searched && state.typeCountsResult.length" class="discovery-type-counts">
					<span
						v-for="t in state.typeCountsResult"
						:key="t.typeId"
						class="discovery-type-count-item"
					>{{ t.typeName }} {{ t.cnt }}</span>
				</div>
			</div>
			<div class="boxCnt">
				<div class="discovery-master-detail">
					<!-- 좌: 카드 목록 -->
					<div class="discovery-master">
						<div v-if="!state.searched" class="discovery-empty">
							검색어를 입력하고 검색을 눌러주세요.
						</div>
						<div v-else-if="state.results.length === 0" class="discovery-empty">
							검색 결과가 없습니다.
						</div>
						<div
							v-for="item in state.results"
							:key="item.id"
							class="discovery-card"
							:class="{ active: state.selectedId === item.id }"
							@click="onSelectItem(item)"
						>
							<div class="discovery-card-title-row">
								<div class="discovery-card-title" :title="item.name">{{ item.name }}</div>
								<span class="discovery-card-type">{{ item.type }}</span>
							</div>
							<div class="discovery-card-meta-row">
								<span
									v-if="item.breadcrumb"
									class="discovery-card-breadcrumb"
									:title="item.breadcrumb"
								>{{ item.breadcrumb }}</span>
								<span class="discovery-card-id-inline" :title="item.id">{{ item.id }}</span>
							</div>
							<div v-if="item.matchedFields && item.matchedFields.length" class="discovery-card-match">
								<span
									v-for="m in item.matchedFields"
									:key="m"
									class="badge-primary-dot dark-border"
								>{{ MATCHED_FIELD_LABELS[m] || m }}</span>
							</div>
						</div>

						<div v-if="hasMore" class="discovery-load-more">
							<el-button type="default" class="btn-label-color" @click="onLoadMore">
								더보기 ({{ state.results.length }} / {{ state.totalCount }})
							</el-button>
						</div>
					</div>

					<!-- 우: 상세 -->
					<div class="discovery-detail">
						<div v-if="!state.selectedItem" class="discovery-empty">
							좌측에서 항목을 선택하면 상세가 표시됩니다.
						</div>
						<div v-else class="discovery-detail-content">
							<div class="boxSectionTit discovery-section-tit" style="margin-top: 0">
								<div class="discovery-section-tit-row">
									<div class="discovery-section-tit-main">
										<h3>
											<span class="discovery-section-tit-name" v-html="highlightQuery(state.selectedItem.name)"></span>
											<span class="badge-primary dark-border ml10">{{ state.selectedItem.type }}</span>
											<span
												v-if="state.detailData?.medataSet?.medataSetSttusMtcd"
												class="meta-status-badge dark-border ml10"
												:class="`is-${state.detailData.medataSet.medataSetSttusMtcd}`"
											>{{ state.detailData.medataSet.medataSetSttusMtcdNm }}</span>
										</h3>
										<p v-if="state.selectedItem.breadcrumb" class="discovery-section-meta">
											{{ state.selectedItem.breadcrumb }}
										</p>
									</div>
									<el-button
										type="default"
										class="btn-label-color discovery-detail-open-btn"
										title="상세 조회"
										@click="openDetailDialog(state.selectedItem.id)"
									>
										<el-icon><Memo /></el-icon>
									</el-button>
								</div>
							</div>

							<div v-if="state.detailLoading" class="discovery-detail-loading">로딩 중...</div>

							<div v-else-if="state.detailError" class="discovery-detail-error">
								{{ state.detailError }}
							</div>

							<div v-else-if="state.detailData" class="discovery-detail-body">
								<!-- 설명 + (DigitalTwinObject 인 경우) 우측에 객체 데이터 정보 버튼 -->
								<div
									v-if="state.detailData?.medataSet?.medataSetDesc || dtObjectData"
									class="discovery-detail-desc-row"
								>
									<p
										class="discovery-detail-desc"
										v-html="highlightQuery(state.detailData?.medataSet?.medataSetDesc || '')"
									></p>
									<el-button
										v-if="dtObjectData"
										type="default"
										class="btn-label-color discovery-json-btn"
										size="small"
										@click="state.jsonDialogVisible = true"
									>객체 데이터 정보</el-button>
								</div>

								<!-- 메타 한 줄: ID | 소유자(있을 때) | 수정일시 -->
								<div class="discovery-detail-meta-line">
									<span :title="`ID: ${state.detailData?.medataSet?.medataSetId || ''}`">
										{{ state.detailData?.medataSet?.medataSetId }}
									</span>
									<span v-if="ownerName">
										<span class="discovery-detail-meta-label">소유자:</span>
										{{ ownerName }}
									</span>
									<span v-if="state.detailData?.medataSet?.medataSetAmdDt">
										<span class="discovery-detail-meta-label">수정일시:</span>
										{{ state.detailData.medataSet.medataSetAmdDt }}
									</span>
								</div>

								<!-- 키워드 / 주제어 (값 있을 때만 배지로) -->
								<div
									v-if="keywords.length || subjects.length"
									class="discovery-detail-tags"
								>
									<div v-if="keywords.length" class="discovery-detail-tag-row">
										<span class="discovery-detail-tag-label">키워드</span>
										<span
											v-for="k in keywords"
											:key="'kw-' + k"
											class="badge-gray"
											:class="{ 'is-red': isMatched(k) }"
											v-html="highlightQuery(k)"
										></span>
									</div>
									<div v-if="subjects.length" class="discovery-detail-tag-row">
										<span class="discovery-detail-tag-label">주제어</span>
										<span
											v-for="s in subjects"
											:key="'sj-' + s"
											class="badge-gray"
											:class="{ 'is-red': isMatched(s) }"
											v-html="highlightQuery(s)"
										></span>
									</div>
								</div>

								<!-- 구성 항목 (있을 때만 한 줄) — 위에 얇은 가로선 (그래프 블록과 동일) -->
								<div v-if="state.composition.length" class="discovery-detail-composition">
									<span
										v-for="c in state.composition"
										:key="c.typeId"
										class="discovery-detail-composition-item"
									>{{ c.typeName }} {{ c.cnt }}</span>
								</div>

								<!-- 관계 그래프 (1-depth, 더블클릭으로 그 노드 중심 재로드) -->
								<div class="discovery-detail-graph-block">
									<div class="discovery-detail-graph-header">
										<span class="discovery-detail-graph-label">
											<span class="discovery-detail-graph-title">관계 그래프</span>
											<span class="discovery-detail-graph-hint"> · 1-depth (노드 더블클릭 = 그 자원 중심)</span>
										</span>
										<div v-if="hasNeighbors" class="discovery-graph-btns">
											<el-button
												type="default"
												class="el-button--delete btn-label-color"
												title="처음 상태로 다시 그리기"
												@click="resetGraphToSeed"
											>
												<el-icon><Refresh /></el-icon>
											</el-button>
											<el-button
												type="default"
												class="btn-label-color"
												@click="toggleKeywordsInGraph"
											>{{ state.showKeywordNodes ? "키워드/주제어 숨기기" : "키워드/주제어 보기" }}</el-button>
											<el-button
												type="default"
												class="btn-label-color"
												title="크게 보기"
												@click="state.graphDialogVisible = true"
											>
												<el-icon><FullScreen /></el-icon>
											</el-button>
										</div>
									</div>
									<div v-if="!hasNeighbors" class="discovery-detail-graph-placeholder">연결된 자원이 없습니다</div>
									<div v-else class="discovery-graph-canvas neo4jd3-container">
										<div ref="graphPanelRef" class="neo4jd3"></div>
									</div>
								</div>

								</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 지도 팝업 (통합검색의 ExMapSearchPopupPage 재사용) -->
		<el-dialog v-model="state.mapDialogVisible" title="지도 범위 검색">
			<ExMapSearchPopupPage :dialogCnt="state.mapDialogCnt" @wktPolygon="onWktPolygon" />
		</el-dialog>

		<!-- 전체 상세 팝업 (공통 컴포넌트) -->
		<MetadataDetailDialog v-model="idDialog.visible" :id="idDialog.id" />

		<!-- 객체 데이터 JSON 팝업 (공통 컴포넌트) -->
		<JsonInfoDialog
			v-model="state.jsonDialogVisible"
			:data="dtObjectData"
			title="객체 데이터 정보"
		/>

		<!-- 관계 그래프 확장 팝업 (neo4jd3) -->
		<el-dialog
			v-model="state.graphDialogVisible"
			:title="`관계 그래프 - ${state.selectedItem?.name || ''}`"
			width="95%"
			top="3vh"
			@opened="onGraphDialogOpened"
			@closed="onGraphDialogClosed"
		>
			<div class="discovery-graph-dialog-body">
				<div class="discovery-graph-dialog-toolbar">
					<el-button
						type="default"
						class="el-button--delete btn-label-color"
						title="처음 상태로 다시 그리기"
						@click="resetGraphToSeed"
					>
						<el-icon><Refresh /></el-icon>
					</el-button>
					<el-button
						type="default"
						class="btn-label-color"
						@click="toggleKeywordsInGraph"
					>{{ state.showKeywordNodes ? "키워드/주제어 숨기기" : "키워드/주제어 보기" }}</el-button>
				</div>
				<div class="discovery-graph-canvas neo4jd3-container">
					<div ref="graphDialogRef" class="neo4jd3"></div>
				</div>
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { getGlobalProperties } from "@/assets/js/common.js";
import neo4jd3 from "neo4jd3";
import ExMapSearchPopupPage from "@/views/feature/meta/external/ExMapSearchPopupPage.vue";
import MetadataDetailDialog from "@/components/meta/common/MetadataDetailDialog.vue";
import JsonInfoDialog from "@/components/meta/common/JsonInfoDialog.vue";

const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;

// 백엔드 매칭근거 식별자 → 화면 라벨
const MATCHED_FIELD_LABELS = {
	name: "이름",
	desc: "설명",
	keywords: "키워드",
	subjects: "주제어",
	polygon: "공간",
};

const state = reactive({
	query: "",
	scope: "all",
	typeFilter: "",
	polygon: "",
	polygonSummary: "",
	includeDisuseYn: "",
	advanced: false,
	searched: false,
	results: [],
	totalCount: 0,
	curPage: 1,
	pageListSize: 10,
	selectedId: null,
	selectedItem: null,
	dtList: [],
	typeModelList: [],
	typeCountsGlobal: [],
	typeCountsResult: [],
	mapDialogVisible: false,
	mapDialogCnt: 0,
	detailLoading: false,
	detailError: "",
	detailData: null,
	composition: [],
	detailKeywords: [],
	detailSubjects: [],
	detailObjectJson: null,
	jsonDialogVisible: false,
	graphDialogVisible: false,
	showKeywordNodes: true,
	neighbors: { parents: [], children: [], keywordChildren: [] },
	// 그래프 누적: 더블클릭으로 점진 확장됨. 카드 클릭마다 초기화.
	graphAccum: {
		nodes: [],          // {refId, kind:'medata'|'keyword', name, type?}
		edges: [],          // {key, from, to, type}
		expandedIds: [],    // 이미 펼친 medata refId 목록 (재요청 방지)
		centerId: "",
	},
});

const globalCountsText = computed(() => {
	return state.typeCountsGlobal.map((t) => `${t.typeName} ${t.cnt}`).join(" · ");
});

const detailProperties = computed(() => {
	const list = state.detailData?.dataList;
	if (!Array.isArray(list)) return [];
	return list;
});

// 키워드/주제어/JSON 데이터 — array/json 속성은 dataList 에 안 잡힘. 별도 API 로 조회 (state 에 저장)
const keywords = computed(() => state.detailKeywords);
const subjects = computed(() => state.detailSubjects);
const dtObjectData = computed(() => state.detailObjectJson);

// 우측 상세에서 검색어 매칭 단어를 붉게 highlight (XSS 방지: 먼저 escape)
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
	{ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]
));
// 검색어가 들어 있으면 true (배지 자체에 붉은 톤 입힐 때)
const isMatched = (text) => {
	const q = (state.query || "").trim();
	if (!q || text == null) return false;
	return String(text).toLowerCase().includes(q.toLowerCase());
};
const highlightQuery = (text) => {
	if (text == null) return "";
	const safe = escapeHtml(text);
	const q = (state.query || "").trim();
	if (!q) return safe;
	const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`(${escaped})`, "gi");
	return safe.replace(re, '<span class="discovery-hl">$1</span>');
};

// 소유주 — dataList 의 'owner' 스칼라 속성 (있는 자원만)
const ownerName = computed(() => {
	const list = state.detailData?.dataList;
	if (!Array.isArray(list)) return "";
	const row = list.find((p) => p?.prptyNm === "owner");
	const v = row?.medataVal;
	return v != null && v !== "" ? String(v) : "";
});

// 전체 상세 팝업 — 공통 컴포넌트 (MetadataDetailDialog) 사용
const idDialog = ref({ visible: false, id: "" });
const openDetailDialog = (id) => {
	idDialog.value.id = id || "";
	idDialog.value.visible = !!id;
};

const searchInputRef = ref(null);

onMounted(() => {
	loadDigitalTwinList();
	loadTypeModelList();
	loadInitialTypeCounts();
	nextTick(() => {
		searchInputRef.value?.focus?.();
	});
});

/** 첫 진입 시 글로벌 typeCounts 만 미리 받기 (검색은 안 함). */
const loadInitialTypeCounts = async () => {
	try {
		const res = await $axios.get($apiUrls.publicpage.meta.search.discovery.list, {
			params: { countsOnly: true, includeDisuseYn: state.includeDisuseYn },
		});
		state.typeCountsGlobal = res.data.typeCountsGlobal || [];
	} catch (err) {
		console.warn("[Discovery] 초기 typeCounts 로드 실패", err);
	}
};

const loadDigitalTwinList = () => {
	$axios
		.get($apiUrls.publicpage.meta.search.metadata.getMetadataList, {
			params: { isPaging: false, typeModelId: "DigitalTwin" },
		})
		.then((res) => {
			state.dtList = res.data.list || [];
		})
		.catch((err) => {
			console.log("[Discovery] DT 목록 로드 실패", err);
		});
};

const loadTypeModelList = () => {
	$axios
		.get($apiUrls.publicpage.meta.data.type.getTypeModelList, {
			params: { isPaging: false, searchMode: "type", modelDataSttusMtcd: "use" },
		})
		.then((res) => {
			state.typeModelList = res.data.list || [];
		})
		.catch((err) => {
			console.log("[Discovery] 유형 모델 목록 로드 실패", err);
		});
};

const fetchDiscoveryPage = async (append = false) => {
	try {
		const res = await $axios.get($apiUrls.publicpage.meta.search.discovery.list, {
			params: {
				q: state.query,
				digitalTwinId: state.scope === "all" ? "" : state.scope,
				typeModelId: state.typeFilter,
				polygon: state.polygon,
				includeDisuseYn: state.includeDisuseYn,
				curPage: state.curPage,
				pageListSize: state.pageListSize,
			},
		});

		// 매 검색마다 글로벌(상단) + 결과(헤더) 둘 다 갱신
		state.typeCountsGlobal = res.data.typeCountsGlobal || state.typeCountsGlobal;
		state.typeCountsResult = res.data.typeCountsResult || [];
		const list = (res.data.list || []).map((row) => {
			// matched_fields: 백엔드가 ARRAY_TO_STRING 으로 콤마 문자열 반환.
			// PG ARRAY toString("{a,b}") 형태로 오는 경우도 대비해 중괄호 제거 후 split.
			let mf = row.matchedFields;
			if (typeof mf === "string") {
				mf = mf.replace(/^\{|\}$/g, "");
				row.matchedFields = mf ? mf.split(",").map((s) => s.trim()).filter(Boolean) : [];
			} else if (!Array.isArray(mf)) {
				row.matchedFields = [];
			}
			return row;
		});

		const total = res.data.page?.totalListSize ?? list.length;
		if (append) {
			state.results.push(...list);
		} else {
			state.results = list;
		}
		state.totalCount = total;
	} catch (err) {
		console.error("[Discovery] 검색 실패", err);
		if (!append) {
			state.results = [];
			state.totalCount = 0;
			state.typeCounts = [];
		}
	}
};

let suggestAbort = null;
const fetchSuggestions = async (queryString, cb) => {
	if (!queryString || queryString.trim().length < 1) {
		cb([]);
		return;
	}
	if (suggestAbort) suggestAbort.abort();
	suggestAbort = new AbortController();
	try {
		const res = await $axios.get($apiUrls.publicpage.meta.search.discovery.suggest, {
			params: { q: queryString.trim() },
			signal: suggestAbort.signal,
			skipLoading: true,
		});
		cb(res.data.list || []);
	} catch (e) {
		if (e.name !== "CanceledError" && e.name !== "AbortError") {
			console.warn("[Discovery] suggest 실패", e);
		}
		cb([]);
	}
};

const onSuggestionSelect = (item) => {
	state.query = item.value;
	onSearch();
};

const onSearch = async () => {
	state.searched = true;
	state.selectedId = null;
	state.selectedItem = null;
	state.curPage = 1;
	await fetchDiscoveryPage(false);
};

const onLoadMore = async () => {
	state.curPage += 1;
	await fetchDiscoveryPage(true);
};

const hasMore = computed(() => state.results.length < state.totalCount);

const onSelectItem = (item) => {
	state.selectedId = item.id;
	state.selectedItem = item;
	state.composition = [];
	state.detailKeywords = [];
	state.detailSubjects = [];
	state.detailObjectJson = null;
	state.neighbors = { parents: [], children: [], keywordChildren: [] };
	fetchSummary(item.id);
};

/** 그래프 노드 더블클릭 — 그 자원을 중심으로 다시 그래프 그림. 좌측 카드 selection 도 동기화. */
const onNeighborRecenter = (n) => {
	if (!n?.id) return;
	state.selectedId = n.id;
	state.selectedItem = {
		id: n.id,
		name: n.name || n.id,
		type: n.type || "",
		typeId: n.typeId || "",
		breadcrumb: "",
		matchedFields: [],
	};
	state.composition = [];
	state.detailKeywords = [];
	state.detailSubjects = [];
	state.detailObjectJson = null;
	state.neighbors = { parents: [], children: [], keywordChildren: [] };
	fetchSummary(n.id);
};

const hasNeighbors = computed(() => {
	const n = state.neighbors;
	return (n?.parents?.length || 0) + (n?.children?.length || 0) + (n?.keywordChildren?.length || 0) > 0;
});

// =====================================================================
// 관계 그래프 확장 dialog — MedataGraphPage 와 동일한 neo4jd3 + d3.v4 패턴.
// helper / 옵션 / CSS 모두 MedataGraphPage 와 같게.
// =====================================================================
const graphPanelRef = ref(null);
const graphDialogRef = ref(null);
// 패널/다이얼로그 두 인스턴스 분리 (각각 별도 SVG/시뮬레이션)
let neoPanel = { instance: null, raf: null, to: null };
let neoDialog = { instance: null, raf: null, to: null };

function ensureD3(cb) {
	if (window.d3 && window.d3.version?.startsWith("4.")) return cb();
	let s = document.querySelector("#ext-d3v4");
	if (!s) {
		s = document.createElement("script");
		s.id = "ext-d3v4";
		s.src = "https://d3js.org/d3.v4.min.js";
		s.onload = cb;
		document.head.appendChild(s);
	} else {
		s.onload ? s.addEventListener("load", cb) : cb();
	}
}

function disposeNeoSlot(slot, container) {
	if (slot.raf) { cancelAnimationFrame(slot.raf); slot.raf = null; }
	if (slot.to)  { clearTimeout(slot.to);          slot.to  = null; }
	try { slot.instance?.simulation?.stop?.(); } catch {}
	if (container) container.innerHTML = "";
	slot.instance = null;
}
function disposeGraph() {
	disposeNeoSlot(neoPanel,  graphPanelRef.value);
	disposeNeoSlot(neoDialog, graphDialogRef.value);
}

/** graphAccum 에 medata 노드 추가 (dedup). name 비면 빈 문자열로 — captionFromNode 의 fallback (metaModel → id) 살리기. */
const addMedataNodeAccum = (refId, name, type) => {
	if (!refId) return;
	if (state.graphAccum.nodes.find((n) => n.refId === refId && n.kind === "medata")) return;
	state.graphAccum.nodes.push({ refId, kind: "medata", name: name || "", type: type || "" });
};
const addKeywordNodeAccum = (value, name) => {
	if (!value) return;
	if (state.graphAccum.nodes.find((n) => n.refId === value && n.kind === "keyword")) return;
	state.graphAccum.nodes.push({ refId: value, kind: "keyword", name: name || "" });
};
const addEdgeAccum = (fromRef, toRef, type) => {
	const key = `${fromRef}|${toRef}|${type}`;
	if (state.graphAccum.edges.find((e) => e.key === key)) return;
	state.graphAccum.edges.push({ key, from: fromRef, to: toRef, type });
};

/** 카드 클릭 직후, fetchSummary 결과로 누적 시드 (초기화 + 중심+이웃). */
const seedGraphAccumFromSummary = () => {
	const me = state.selectedItem;
	if (!me) return;
	state.graphAccum.nodes = [];
	state.graphAccum.edges = [];
	state.graphAccum.expandedIds = [me.id];
	state.graphAccum.centerId = me.id;
	addMedataNodeAccum(me.id, me.name, me.type);
	mergeNeighborsIntoAccum(me.id, state.neighbors);
};

/** 한 medata 노드의 neighbors 를 누적에 머지 (중심 ↔ 이웃 엣지 포함). */
const mergeNeighborsIntoAccum = (centerRefId, nbrs) => {
	if (!nbrs) return;
	for (const p of nbrs.parents || []) {
		addMedataNodeAccum(p.id, p.name, p.type);
		addEdgeAccum(p.id, centerRefId, p.via || "ref");
	}
	for (const c of nbrs.children || []) {
		addMedataNodeAccum(c.id, c.name, c.type);
		addEdgeAccum(centerRefId, c.id, c.via || "ref");
	}
	for (const k of nbrs.keywordChildren || []) {
		addKeywordNodeAccum(k.value, k.name);
		addEdgeAccum(centerRefId, "kw:" + k.value, k.via || "keywords");
	}
};

/** node 식별자 — string 기반 (delta append 시 충돌 방지). */
function neoNodeId(kind, refId) { return kind + ":" + refId; }
function refToNeoNodeId(ref) {
	return ref.startsWith("kw:") ? neoNodeId("keyword", ref.slice(3)) : neoNodeId("medata", ref);
}

/** 누적 노드/엣지 부분집합을 neo4jd3 입력 형식으로 변환.
 *  string id 사용 → 인스턴스에 추가 호출 시 기존 노드와 충돌 안 남.
 *  label 순서: [구체유형, "medataResource"] (drawNeo4jGraph 의 swap 결과와 동일).
 *  state.showKeywordNodes = false 면 ConceptKeyword 노드와 그 연결 엣지 제외. */
function buildPartialNeoData(accumNodes, accumEdges) {
	const showKw = state.showKeywordNodes;
	const filteredNodes = showKw ? accumNodes : accumNodes.filter((n) => n.kind !== "keyword");
	const nodes = filteredNodes.map((n) => {
		if (n.kind === "medata") {
			return {
				id: neoNodeId(n.kind, n.refId),
				labels: [n.type || "Resource", "medataResource"],
				properties: {
					medataSetId: n.refId,
					name: n.name || "",
					metaModel: n.type || "",
				},
			};
		}
		return {
			id: neoNodeId(n.kind, n.refId),
			labels: ["ConceptKeyword"],
			properties: { value: n.refId, name: n.name || "" },
		};
	});
	const filteredEdges = showKw
		? accumEdges
		: accumEdges.filter((e) => !e.from.startsWith("kw:") && !e.to.startsWith("kw:"));
	const relationships = filteredEdges.map((e) => ({
		id: "e:" + e.key,
		type: e.type || "ref",
		startNode: refToNeoNodeId(e.from),
		endNode:   refToNeoNodeId(e.to),
		properties: {},
	}));
	return { graph: { nodes, relationships } };
}

/** graphAccum 전체 → neo4jd3 입력 형식 (초기 full draw 용). */
function buildNeoData() {
	if (!state.graphAccum.nodes.length) return null;
	return buildPartialNeoData(state.graphAccum.nodes, state.graphAccum.edges);
}

/** MedataGraphPage 의 drawNeo4jGraph 와 동일 패턴. container/slot 을 받아 재사용. */
const drawNeo4jGraph = (data, container, slot) => {
	if (!container) return;
	for (let i = 0; i < data.graph.nodes.length; i++) {
		if (data.graph.nodes[i].labels[0] === "medataResource") {
			const tmp = data.graph.nodes[i].labels[0];
			data.graph.nodes[i].labels[0] = data.graph.nodes[i].labels[1];
			data.graph.nodes[i].labels[1] = tmp;
		}
	}
	const highlightArr = [];
	const meId = state.selectedItem?.id;
	if (meId) {
		for (let i = 0; i < data.graph.nodes.length; i++) {
			if (data.graph.nodes[i].properties?.medataSetId === meId) {
				highlightArr.push({
					class: data.graph.nodes[i].labels[0],
					property: "medataSetId",
					value: meId,
				});
			}
		}
	}
	ensureD3(() => {
		disposeNeoSlot(slot, container);
		const options = {
			highlight: highlightArr,
			icons: {},
			infoPanel: false,
			neo4jData: {
				results: [{ columns: ["user", "entity"], data: [data] }],
				errors: [],
			},
			minCollision: 80,
			nodeRadius: 35,
			zoomFit: false,
			onNodeDoubleClick: (node) => {
				const id = node?.properties?.medataSetId;
				if (!id) return; // ConceptKeyword 등 medataSetId 없는 노드 무시
				expandGraphForNode(id);
			},
		};
		slot.instance = new neo4jd3(container, options);
		slot.raf = requestAnimationFrame(() => {
			if (container.isConnected) {
				setNodeCaptionsIn(container);
				separateDuplicateLinksByLocalOffset(container);
			}
		});
		slot.to = setTimeout(() => {
			if (container.isConnected) {
				setNodeCaptionsIn(container);
				separateDuplicateLinksByLocalOffset(container);
			}
		}, 100);
	});
};

const setNodeCaptionsIn = (container) => {
	if (!window.d3 || !container?.isConnected) return;
	window.d3.select(container)
		.selectAll("g.node text")
		.filter(function () { return !this.classList.contains("icon"); })
		.each(function (d) { renderMultiline(this, captionFromNode(d)); });
};

const captionFromNode = (d) => {
	const p = d.properties || {};
	return (p.name || p.metaModel || String(d.id)).toString();
};

const splitLinesWithEllipsis = (s, perLine, maxLines) => {
	const lines = [];
	for (let i = 0; i < s.length; i += perLine) lines.push(s.slice(i, i + perLine));
	if (lines.length > maxLines) {
		const keep = lines.slice(0, maxLines);
		const last = keep[maxLines - 1];
		keep[maxLines - 1] = (last.length >= perLine ? last.slice(0, perLine - 1) : last) + "…";
		return keep;
	}
	return lines;
};

const renderMultiline = (textEl, caption, perLine = 10, maxLines = 3) => {
	const sel = window.d3.select(textEl);
	sel.text("");
	sel.selectAll("tspan").remove();
	const lines = splitLinesWithEllipsis(caption, perLine, maxLines);
	const firstDy = -(lines.length - 1) * 0.6;
	lines.forEach((line, idx) => {
		sel.append("tspan")
			.attr("x", 0)
			.attr("dy", idx === 0 ? `${firstDy}em` : "1.2em")
			.text(line);
	});
};

function groupBy(list, keyFn) {
	const m = new Map();
	for (let i = 0; i < list.length; i++) {
		const it = list[i], k = keyFn(it);
		if (!m.has(k)) m.set(k, []);
		m.get(k).push(it);
	}
	return m;
}
function ensureInnerWrapper(gEl) {
	let inner = gEl.querySelector("g.rel-inner");
	if (inner) return inner;
	const doc = gEl.ownerDocument;
	inner = doc.createElementNS("http://www.w3.org/2000/svg", "g");
	inner.setAttribute("class", "rel-inner");
	const nodes = [];
	for (let i = 0; i < gEl.childNodes.length; i++) nodes.push(gEl.childNodes[i]);
	for (let j = 0; j < nodes.length; j++) inner.appendChild(nodes[j]);
	gEl.appendChild(inner);
	return inner;
}
function setLocalOffset(gEl, offsetPx) {
	const inner = ensureInnerWrapper(gEl);
	inner.setAttribute("transform", "translate(0," + offsetPx + ")");
}
function separateDuplicateLinksByLocalOffset(svgEl, opts) {
	if (!window.d3 || !svgEl || !svgEl.isConnected) return;
	const base = (opts && opts.baseOffset) || 16;
	function offsetForIndex(i) {
		if (i === 0) return 0;
		const k = Math.ceil(i / 2);
		const sign = (i % 2 === 1) ? +1 : -1;
		return sign * base * k;
	}
	const rels = [];
	window.d3.select(svgEl).selectAll("g.relationship").each(function (d) {
		if (!d || !d.source || !d.target) return;
		rels.push({ key: d.source.id + "->" + d.target.id, datum: d, g: this });
	});
	if (!rels.length) return;
	const groups = groupBy(rels, function (r) { return r.key; });
	groups.forEach(function (arr) {
		if (arr.length < 2) return;
		const TYPE_ORDER = { subjects: 0, keywords: 1 };
		arr.sort(function (a, b) {
			const ta = (a.datum && a.datum.type ? String(a.datum.type).toLowerCase() : "");
			const tb = (b.datum && b.datum.type ? String(b.datum.type).toLowerCase() : "");
			const pa = (ta in TYPE_ORDER) ? TYPE_ORDER[ta] : 9999;
			const pb = (tb in TYPE_ORDER) ? TYPE_ORDER[tb] : 9999;
			if (pa !== pb) return pa - pb;
			const aid = (a.datum && a.datum.id != null) ? a.datum.id : 0;
			const bid = (b.datum && b.datum.id != null) ? b.datum.id : 0;
			return aid - bid;
		});
		for (let i = 0; i < arr.length; i++) {
			const off = offsetForIndex(i);
			setLocalOffset(arr[i].g, off);
			window.d3.select(arr[i].g).classed("rel-offset", off !== 0);
		}
	});
}

const onGraphDialogOpened = () => {
	const data = buildNeoData();
	if (!data) return;
	drawNeo4jGraph(data, graphDialogRef.value, neoDialog);
};
const onGraphDialogClosed = () => {
	disposeNeoSlot(neoDialog, graphDialogRef.value);
};

/** 더블클릭한 노드의 1-depth 이웃을 누적에 추가 + 인스턴스에 delta 만 append (full redraw X). */
const expandGraphForNode = async (refId) => {
	if (!refId) return;
	if (state.graphAccum.expandedIds.includes(refId)) return; // 이미 펼침
	state.graphAccum.expandedIds.push(refId);
	try {
		const res = await $axios.get($apiUrls.publicpage.meta.search.discovery.summary, {
			params: { id: refId },
		});
		const d = res.data || {};
		// 노드 자체 정보 보강
		const setDto = d.medataSet || {};
		const found = state.graphAccum.nodes.find((n) => n.refId === refId && n.kind === "medata");
		if (found) {
			if (!found.name && setDto.medataSetNm) found.name = setDto.medataSetNm;
			if (!found.type && setDto.typeModelLogicNm) found.type = setDto.typeModelLogicNm;
		}
		// 이전 누적 키 set → 머지 후 delta 산출
		const beforeNodeKeys = new Set(state.graphAccum.nodes.map((n) => n.kind + ":" + n.refId));
		const beforeEdgeKeys = new Set(state.graphAccum.edges.map((e) => e.key));
		mergeNeighborsIntoAccum(refId, d.neighbors);
		const deltaNodes = state.graphAccum.nodes.filter((n) => !beforeNodeKeys.has(n.kind + ":" + n.refId));
		const deltaEdges = state.graphAccum.edges.filter((e) => !beforeEdgeKeys.has(e.key));
		if (deltaNodes.length === 0 && deltaEdges.length === 0) return; // 추가될 것 없음 → render 스킵
		const delta = buildPartialNeoData(deltaNodes, deltaEdges);
		const wrapped = { results: [{ columns: ["x"], data: [delta] }], errors: [] };
		try { neoPanel.instance?.updateWithNeo4jData?.(wrapped); } catch (err) { console.warn("[Discovery] panel update 실패", err); }
		try { neoDialog.instance?.updateWithNeo4jData?.(wrapped); } catch (err) { console.warn("[Discovery] dialog update 실패", err); }
		// lib 가 새 노드를 기본 caption (label:id) 으로 그리니, 사용자 정의 caption 다시 적용
		nextTick(() => {
			if (graphPanelRef.value?.isConnected) {
				setNodeCaptionsIn(graphPanelRef.value);
				separateDuplicateLinksByLocalOffset(graphPanelRef.value);
			}
			if (graphDialogRef.value?.isConnected) {
				setNodeCaptionsIn(graphDialogRef.value);
				separateDuplicateLinksByLocalOffset(graphDialogRef.value);
			}
		});
	} catch (e) {
		console.warn("[Discovery] graph expand 실패", e);
	}
};

/** 키워드/주제어 노드 표시 토글 — 양쪽 인스턴스 dispose 후 재빌드. */
const toggleKeywordsInGraph = () => {
	state.showKeywordNodes = !state.showKeywordNodes;
	disposeNeoSlot(neoPanel, graphPanelRef.value);
	disposeNeoSlot(neoDialog, graphDialogRef.value);
	drawPanelGraph();
	if (state.graphDialogVisible) drawDialogGraph();
};

/** Refresh 버튼 — 처음 카드 클릭한 자원 ID 로 다시 fetchSummary (좌측 목록 다시 누른 것과 동일). */
const resetGraphToSeed = () => {
	const originalId = state.graphAccum.centerId || state.selectedItem?.id;
	if (!originalId) return;
	state.composition = [];
	state.detailKeywords = [];
	state.detailSubjects = [];
	state.detailObjectJson = null;
	state.neighbors = { parents: [], children: [], keywordChildren: [] };
	disposeNeoSlot(neoPanel, graphPanelRef.value);
	disposeNeoSlot(neoDialog, graphDialogRef.value);
	fetchSummary(originalId);
};

// 패널/다이얼로그 공통 — ref 가 mount 되는 데 잠시 걸릴 수 있으니 짧게 retry.
const drawIntoSlot = (containerRef, slot) => {
	const tryDraw = (attempt = 0) => {
		if (containerRef.value && containerRef.value.isConnected) {
			const data = buildNeoData();
			if (data) drawNeo4jGraph(data, containerRef.value, slot);
			return;
		}
		if (attempt < 5) setTimeout(() => tryDraw(attempt + 1), 30);
	};
	nextTick(() => tryDraw(0));
};

const drawPanelGraph = () => {
	if (!hasNeighbors.value) {
		disposeNeoSlot(neoPanel, graphPanelRef.value);
		return;
	}
	drawIntoSlot(graphPanelRef, neoPanel);
};

const drawDialogGraph = () => {
	if (!hasNeighbors.value) {
		disposeNeoSlot(neoDialog, graphDialogRef.value);
		return;
	}
	drawIntoSlot(graphDialogRef, neoDialog);
};

onBeforeUnmount(() => {
	disposeGraph();
});

/** 우측 상세용 통합 요약 — info+modelInfo+dataList+composition+keywords/subjects/objectJson 한 번에 */
let summaryAbort = null;
const fetchSummary = async (id) => {
	if (!id) return;
	state.detailLoading = true;
	state.detailError = "";
	state.detailData = null;
	if (summaryAbort) summaryAbort.abort();
	summaryAbort = new AbortController();
	try {
		const res = await $axios.get($apiUrls.publicpage.meta.search.discovery.summary, {
			params: { id },
			signal: summaryAbort.signal,
		});
		const d = res.data || {};
		state.detailData = {
			medataSet: d.medataSet,
			modelInfo: d.modelInfo,
			dataList: d.dataList,
		};
		state.composition = d.composition || [];
		state.detailKeywords = d.keywords || [];
		state.detailSubjects = d.subjects || [];
		state.neighbors = d.neighbors || { parents: [], children: [], keywordChildren: [] };
		// 누적 그래프는 새 카드 클릭마다 초기화 + 중심+이웃으로 시드 + 패널/다이얼로그 redraw
		seedGraphAccumFromSummary();
		drawPanelGraph();
		if (state.graphDialogVisible) drawDialogGraph();
		const raw = d.objectJson;
		if (raw == null) {
			state.detailObjectJson = null;
		} else if (typeof raw === "string") {
			try {
				state.detailObjectJson = JSON.parse(raw);
			} catch {
				state.detailObjectJson = raw;
			}
		} else {
			state.detailObjectJson = raw;
		}
	} catch (e) {
		if (e.name !== "CanceledError" && e.name !== "AbortError") {
			console.error("[Discovery] summary 로드 실패", e);
			state.detailError = "상세 정보를 불러오지 못했습니다.";
		}
	} finally {
		state.detailLoading = false;
	}
};

const openMapDialog = () => {
	state.mapDialogVisible = true;
	state.mapDialogCnt = state.mapDialogCnt + 1;
};

const onWktPolygon = (wktPolygon) => {
	state.mapDialogVisible = false;
	state.polygon = wktPolygon || "";
	state.polygonSummary = wktPolygon ? "선택됨" : "";
};

const clearPolygon = () => {
	state.polygon = "";
	state.polygonSummary = "";
};
</script>

<style scoped>
.discovery-page {
	height: 100%;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}
/* boxTit 없는 boxCnt 는 위·아래 모두 라운드 처리 */
.discovery-page :deep(.boxLayout > .boxCnt:only-child) {
	border-radius: 5px;
}
/* 검색바 위 전체 카운트 바 — 라운드 박스 + primary 옅은 배경, 항목 단위 wrap */
.discovery-global-counts-bar {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 6px 16px;
	padding: 10px 16px;
	background: color-mix(in srgb, var(--el-color-primary) 8%, #fff);
	border-radius: 5px;
	color: #555;
	font-size: 14px;
}
.discovery-global-counts-item {
	white-space: nowrap;
	font-size: 14px;
}
.discovery-global-counts-item:not(:last-child)::after {
	content: "·";
	margin-left: 16px;
	color: #ccc;
}
.discovery-page > .boxLayout:nth-of-type(2) {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}
.discovery-page > .boxLayout:nth-of-type(2) > .boxCnt {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

/* 검색 바 — 중앙 정렬, 35% 폭 (상세검색 버튼 포함해서 min 460) */
.discovery-search-bar {
	display: flex;
	gap: 8px;
	width: 35%;
	min-width: 460px;
	margin: 0 auto;
}
.discovery-search-bar :deep(.el-autocomplete) {
	flex: 1;
	width: auto;
}
.discovery-search-bar :deep(.el-autocomplete .el-input) {
	width: 100%;
}
.discovery-advanced-icon {
	margin-left: 4px;
	vertical-align: middle;
}

/* 상세 검색 패널 — 단순 그레이 */
.discovery-advanced-panel {
	margin-top: 12px;
	padding: 12px 16px;
	background: #fafafa;
	border-radius: 4px;
}
.discovery-advanced-panel :deep(.el-select),
.discovery-advanced-panel :deep(.el-input) {
	width: 100%;
}

/* 아이콘과 텍스트 사이 간격 */
.ml6 {
	margin-left: 6px;
}

/* 공간 지정 — 통합검색의 spaceInner와 동일 패턴 */
.discovery-space-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	width: 100%;
}
.discovery-space-row > .el-button {
	flex: 1;
}
.discovery-space-row > .el-button.el-button--delete {
	flex: 0 0 auto;
	max-width: 35px;
	margin-left: 10px;
}

/* 결과 카운트 — "검색 결과" 옆에 바로 붙임 */
.discovery-result-count {
	margin-left: 8px;
	color: #666;
	font-weight: normal;
}

/* 글로벌 유형별 카운트 — 검색바 위, 상세검색 패널과 동일 스타일 */
/* 글로벌 카운트 — h3 기본 스타일 그대로 사용, 텍스트만 join */
.discovery-global-counts-label {
	color: #555;
	font-weight: 600;
	margin-right: 4px;
}
.discovery-type-count-item {
	color: #666;
}
.discovery-type-count-item:not(:first-of-type)::before {
	content: "·";
	margin-right: 12px;
	color: #ccc;
}

/* 마스터-디테일 — 푸터(#footerWrap 110px) 위쪽까지 채움 */
/* 460 = 헤더(~70) + cntSec padding(40) + 검색영역(~170) + 결과 boxTit(~50) + boxCnt padding(~20) + 푸터(110) */
.discovery-master-detail {
	display: grid;
	grid-template-columns: minmax(320px, 1fr) 2fr;
	gap: 16px;
	height: calc(100vh - 480px);
	min-height: 400px;
}
.discovery-master {
	overflow-y: auto;
	border: 1px solid #eee;
	border-top: 2px solid #5F6679;
	border-radius: 4px;
}
.discovery-detail {
	overflow-y: auto;
	border: 1px solid #eee;
	border-radius: 4px;
}
/* 우측 상세 안의 보조 텍스트는 좌우 16px 여백 (boxSectionTit는 가득 채움) */
.discovery-detail-content > .discovery-todo {
	margin-left: 16px;
	margin-right: 16px;
}

/* 우측 boxSectionTit 안에 이름 + (유형·경로) — 좌측 카드 패딩(12px 16px)과 통일 */
.discovery-section-tit {
	padding: 12px 16px;
}
.discovery-section-tit :deep(h3) {
	height: auto !important;
	line-height: 1.5 !important;
	padding: 0 !important;
	margin: 0;
	font-size: 14px;
	font-weight: 700;
}
/* 제목 안 v-html 래퍼 — h3 폰트 그대로 강제 상속 */
.discovery-section-tit-name {
	font: inherit;
	font-size: inherit;
	font-weight: inherit;
	font-family: inherit;
}
.discovery-section-meta {
	margin: 4px 0 0;
	color: #999;
	line-height: 1.5;
}

/* 카드 — 목록 스타일 (row separator) */
.discovery-card {
	padding: 12px 16px;
	border-bottom: 1px solid #f0f0f0;
	cursor: pointer;
	transition: background 0.1s;
}
.discovery-card:hover {
	background: #fafafa;
}
.discovery-card.active {
	background: var(--el-color-primary-light-9);
}
/* 카드 제목 행 — 제목 flex / 유형 라벨 우측 고정 */
.discovery-card-title-row {
	display: flex;
	align-items: flex-start;
	gap: 8px;
}
/* 제목: 2줄 + ... (긴 이름 처리) — 우측 boxSectionTit h3와 동일 14px */
.discovery-card-title {
	flex: 1;
	font-size: 14px;
	font-weight: 700;
	color: #444;
	line-height: 23px;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	word-break: break-all;
}
.discovery-card-type {
	flex: 0 0 auto;
	font-size: 12px;
	color: #999;
	font-weight: normal;
	white-space: nowrap;
}
/* 메타 행: 트윈명(좌, ellipsis) + ID(우, 작은 회색 식별자) */
.discovery-card-meta-row {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
	line-height: 20px;
	font-size: 12px;
}
.discovery-card-breadcrumb {
	flex: 1 1 auto;
	color: #999;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.discovery-card-id-inline {
	flex: 0 0 auto;
	color: #bbb;
	font-family: monospace;
	font-size: 11px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 50%;
}
.discovery-card-match {
	margin-top: 6px;
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
/* 우측 상세 헤더: 이름·경로 + 우측에 "전체 상세 보기" 버튼 */
.discovery-section-tit-row {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}
.discovery-section-tit-main {
	flex: 1;
	min-width: 0;
}
.discovery-detail-open-btn {
	flex: 0 0 auto;
	align-self: flex-start;
}

/* 상세 본문 — 설명 → 메타 한 줄 → (구성항목) → 그래프 */
.discovery-detail-body {
	padding: 14px 16px 16px;
}

.discovery-detail-desc {
	margin: 0 0 6px;
	font-size: 14px;
	color: #444;
	line-height: 1.5;
	white-space: pre-line;
}

.discovery-detail-meta-line {
	font-size: 12px;
	color: #999;
}
.discovery-detail-meta-line > span:not(:last-child)::after {
	content: "|";
	margin: 0 8px;
	color: #ddd;
}
/* 메타 한 줄 라벨 — 값보다 한 단계 더 옅게 */
.discovery-detail-meta-label {
	color: #bbb;
	margin-right: 2px;
}

/* 검색어 매칭 단어 highlight — 색만 붉게 (font 관련 모두 부모 강제 상속) */
:deep(.discovery-hl) {
	color: #d33;
	font: inherit;
	font-family: inherit;
	font-size: inherit;
	font-weight: inherit;
	letter-spacing: inherit;
	line-height: inherit;
}

/* 키워드 / 주제어 배지 행 — 회색 톤 (primary 배지와 구분) */
.discovery-detail-tags {
	margin-top: 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.discovery-detail-tag-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
}
.discovery-detail-tag-label {
	font-size: 12px;
	color: #999;
	margin-right: 4px;
}
.discovery-detail-composition {
	margin-top: 16px;
	padding-top: 12px;
	border-top: 1px solid #f0f0f0;
	display: flex;
	flex-wrap: wrap;
	gap: 4px 16px;
	font-size: 12px;
	color: #666;
}

.discovery-detail-graph-block {
	margin-top: 16px;
	padding-top: 12px;
	border-top: 1px solid #f0f0f0;
	height: 550px;
	display: flex;
	flex-direction: column;
}

/* 설명 행 — 설명 + (DT-Object 일 때) 우측 [객체 데이터 정보] 검정 버튼 */
.discovery-detail-desc-row {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	margin-bottom: 6px;
}
.discovery-detail-desc-row .discovery-detail-desc {
	flex: 1;
	margin: 0;
}
.discovery-json-btn {
	flex: 0 0 auto;
}
.discovery-detail-graph-label {
	font-size: 12px;
	color: #999;
}
/* "관계 그래프" 부분 — 설명 본문(.discovery-detail-desc) 폰트와 동일 */
.discovery-detail-graph-title {
	font-size: 14px;
	color: #444;
	font-weight: normal;
}
.discovery-detail-graph-hint {
	font-size: 12px;
	color: #999;
}
.discovery-detail-graph-placeholder {
	flex: 1;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fafafa;
	border-radius: 4px;
	color: #bbb;
	font-size: 12px;
}

/* 그래프 헤더 — 라벨 + 우측 확장 버튼 */
.discovery-detail-graph-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin-bottom: 6px;
}
.discovery-graph-btns {
	flex: 0 0 auto;
	display: flex;
}

/* 그래프 확장 dialog 의 캔버스 영역 */
.discovery-graph-dialog-body {
	height: 88vh;
	display: flex;
	flex-direction: column;
}
.discovery-graph-dialog-toolbar {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 8px;
	flex: 0 0 auto;
}
.discovery-graph-canvas {
	flex: 1;
	min-width: 0;
	min-height: 0;
	width: 100%;
	background: #fff;
	border: 1px solid #eee;
	border-radius: 4px;
	overflow: hidden;
}
.discovery-graph-canvas :deep(svg) {
	width: 100%;
	height: 100%;
}
/* 글로벌 .neo4jd3-graph 높이가 viewport 기반이라 panel/dialog 컨테이너에 맞게 로컬 override
   (mount target .neo4jd3 와 lib-generated .neo4jd3-graph 둘 다 100% 채우도록) */
.discovery-graph-canvas :deep(.neo4jd3) {
	width: 100%;
	height: 100%;
}
.discovery-graph-canvas :deep(.neo4jd3-graph) {
	height: 100% !important;
}

/* 1-depth 관계 그래프 — parents 위, self 가운데, children + keywords 아래 */
.discovery-graph {
	background: #fafafa;
	border-radius: 4px;
	padding: 12px 8px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.discovery-graph-row {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 6px;
}
.discovery-graph-node {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	padding: 4px 10px;
	border-radius: 4px;
	background: #fff;
	border: 1px solid #ddd;
	font-size: 12px;
	color: #444;
	cursor: pointer;
	max-width: 180px;
	user-select: none;
}
.discovery-graph-node:hover {
	border-color: var(--el-color-primary);
}
.discovery-graph-node-name {
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
}
.discovery-graph-node-type {
	margin-top: 1px;
	font-size: 10px;
	color: #999;
	font-weight: normal;
}
/* 중심 노드 — primary tint, 클릭 비활성 */
.discovery-graph-node-self {
	background: var(--el-color-primary-light-9);
	border-color: var(--el-color-primary);
	color: var(--el-color-primary);
	cursor: default;
}
.discovery-graph-node-self:hover {
	border-color: var(--el-color-primary);
}
/* 키워드 노드 — 크기 작게, 작은 grey 칩 */
.discovery-graph-node-keyword {
	display: inline-block;
	padding: 1px 8px;
	font-size: 11px;
	font-weight: 600;
	color: #666;
	background: #f5f5f5;
	border-color: #ddd;
	cursor: default;
}
.discovery-graph-node-keyword:hover {
	border-color: #ddd;
}

.discovery-detail-loading,
.discovery-detail-error {
	padding: 24px 16px;
	text-align: center;
	color: #999;
}
.discovery-detail-error {
	color: #c0392b;
}

/* 자동완성 드롭다운 — 우측 메타 영역 */
.discovery-suggest-meta {
	float: right;
	display: inline-flex;
	gap: 6px;
	align-items: center;
	color: #999;
	font-size: 12px;
}
.discovery-suggest-kind {
	color: #999;
	font-size: 11px;
}
.discovery-suggest-cnt {
	color: #999;
	font-size: 12px;
}

/* 더보기 — 70% 폭 채운 버튼, 중앙 정렬 */
.discovery-load-more {
	padding: 12px;
	text-align: center;
}
.discovery-load-more > .el-button {
	width: 70%;
}

/* 상태 */
.discovery-empty {
	padding: 32px 16px;
	text-align: center;
	color: #999;
}
.discovery-detail-meta {
	color: #555;
}
.discovery-todo {
	margin-top: 16px;
	padding: 12px;
	background: #fafafa;
	border-left: 3px solid #ccc;
	color: #999;
}
</style>


<template>
  <div class="cntSec">

    <div class="boxLayout">
      <div class="boxTit">
        <h3>Virtuoso (버투소)</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right" label-width="220px" class="demo-ruleForm">
            <el-row>
              <el-col :span="24">
                <el-form-item label="버투소 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickVirtuoso">새 창 열기</el-button>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="연결 테스트">
                  <div class="inline-area mt10 mb10" >
                    <el-button type="primary" @click="handleClickConnectVirtuoso"
                      >연결테스트</el-button
                    >
                    <span class="ml15"
                      >※ 버투소는 사용시에만 연결됩니다. 버투소 서버에 정상적으로 연결되는지 테스트합니다.</span
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 등록 (upsert)">
                  <div class="inline-area mt10 mb10" >
                    <el-input style="width: 230px" v-model="state.virtusoEditInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.virtusoEditInfo.medataSetNm" placeholder="" disabled></el-input>
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'virtuoso', mode: 'edit' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'virtuoso', mode: 'edit' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="saveToGraph(true)" v-show="isAmdYn(route.meta.auth)"
                      >그래프에 저장</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 삭제">
                  <div class="inline-area mt10 mb10">
                    <el-input style="width: 230px" v-model="state.virtusoDeleteInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.virtusoDeleteInfo.medataSetNm" placeholder="" disabled></el-input>                    
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'virtuoso', mode: 'delete' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'virtuoso', mode: 'delete' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="deleteFromGraph(true)" v-show="isDelYn(route.meta.auth)"
                      >그래프에서 삭제</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="전체 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger" @click="resetVirtuosoGraph" v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoGraphInitResult == false">실패<br />{{ state.virtuosoGraphInitResultErrMsg }}</div>
                    <div v-else-if="state.virtuosoGraphInitResult == 'ING'">처리 중</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="RDF 네임스페이스 정보 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger" @click="resetVirtuosoNsGraph" v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 기존 RDF 네임스페이스 정보를 삭제 후, 시스템에서 정의한 RDF 네임스페이스 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoNsGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoNsGraphInitResult == false">실패<br />{{ state.virtuosoNsGraphInitResultErrMsg }}</div>
                    <div v-else-if="state.virtuosoNsGraphInitResult == 'ING'">처리 중 </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="카테고리 정보 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger" @click="resetVirtuosoSkosGraph" v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ 버투소 그래프를 초기화합니다. 기존 카테고리 정보를 삭제 후, 시스템에서 정의한 카테고리 정보를 등록합니다. 
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.virtuosoSkosGraphInitResult == true">성공</div>
                    <div v-else-if="state.virtuosoSkosGraphInitResult == false">실패<br />{{ state.virtuosoSkosGraphInitResultErrMsg }}</div>
                    <div v-else-if="state.virtuosoSkosGraphInitResult == 'ING'">처리 중</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>Neo4j</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right" label-width="220px" class="demo-ruleForm">
            <el-row>
              <el-col :span="24">
                <el-form-item label="Neo4j 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickNeo4j">새 창 열기</el-button>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="boxLayout">
              <div class="boxTit">
                <h3>메타데이터 그래프</h3>
              </div>
              <div class="boxCnt">
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 등록 (upsert)"  >
                      <div class="inline-area mt10 mb10">
                        <el-input style="width: 230px" v-model="state.neo4jRdbEditInfo.medataSetId" placeholder="" disabled></el-input>
                        <el-input class="ml10" style="width: 230px" v-model="state.neo4jRdbEditInfo.medataSetNm" placeholder="" disabled></el-input>
                        <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'neo4j', mode: 'edit', rdbFlag: true })">
                          <el-icon class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'neo4j', mode: 'edit', rdbFlag: true })">
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary" @click="saveToRdbGraph()" v-show="isAmdYn(route.meta.auth)"
                          >메타데이터 그래프에 저장</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 삭제">
                      <div class="inline-area mt10 mb10">                      
                        <el-input style="width: 230px" v-model="state.neo4jRdbDeleteInfo.medataSetId" placeholder="" disabled></el-input>
                        <el-input class="ml10" style="width: 230px" v-model="state.neo4jRdbDeleteInfo.medataSetNm" placeholder="" disabled></el-input>
                        <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'neo4j', mode: 'delete', rdbFlag: true })">
                          <el-icon class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'neo4j', mode: 'delete', rdbFlag: true })">
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary" @click="deleteFromRdbGraph()" v-show="isDelYn(route.meta.auth)"
                          >메타데이터 그래프에서 삭제</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="메타데이터 그래프 초기화">
                      <div class="inline-area mt10 mb10">
                        <el-button type="danger" @click="resetNeo4jRdbGraph" v-show="isDelYn(route.meta.auth)"
                          >초기화</el-button
                        >
                        <el-select v-model="state.neo4jRdbGraphInitDataStatType" class="ml15">
                          <el-option label="사용 상태인 것만(기본값)" value="onlyUse" />
                          <el-option label="전체(상태 상관 없이)" value="all" />
                        </el-select>
                        <span class="ml15"
                          >※ Neo4j 메타데이터 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다.
                          <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                        >
                      </div>
                      <div class="inline-area mt10 mb10">
                        <div class="mr10">초기화 결과:</div>
                        <div v-if="state.neo4jRdbGraphInitResult == true">성공</div>
                        <div v-else-if="state.neo4jRdbGraphInitResult == false">실패<br />{{ state.neo4jRdbGraphInitResultErrMsg }}</div>
                        <div v-else-if="state.neo4jRdbGraphInitResult == 'ING'">처리 중</div>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>
            <div class="boxLayout">
              <div class="boxTit">
                <h3>RDF 그래프</h3>
              </div>
              <div class="boxCnt">
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 등록 (upsert)"  >
                      <div class="inline-area mt10 mb10">
                        <el-input style="width: 230px" v-model="state.neo4jEditInfo.medataSetId" placeholder="" disabled></el-input>
                        <el-input class="ml10" style="width: 230px" v-model="state.neo4jEditInfo.medataSetNm" placeholder="" disabled></el-input>
                        <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'neo4j', mode: 'edit', rdbFlag: false })">
                          <el-icon class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'neo4j', mode: 'edit', rdbFlag: false })">
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary" @click="saveToGraph(false)" v-show="isAmdYn(route.meta.auth)"
                          >RDF 그래프에 저장</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="특정 메타데이터셋 삭제">
                      <div class="inline-area mt10 mb10">
                        <el-input style="width: 230px" v-model="state.neo4jDeleteInfo.medataSetId" placeholder="" disabled></el-input>
                        <el-input class="ml10" style="width: 230px" v-model="state.neo4jDeleteInfo.medataSetNm" placeholder="" disabled></el-input>
                        <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'neo4j', mode: 'delete', rdbFlag: false })">
                          <el-icon class="icon icon-search"></el-icon>
                        </el-button>
                        <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'neo4j', mode: 'delete', rdbFlag: false })">
                          <el-icon class="icon icon-refresh"></el-icon>
                        </el-button>
                        <el-button type="primary" @click="deleteFromGraph(false)" v-show="isDelYn(route.meta.auth)"
                          >RDF 그래프에서 삭제</el-button
                        >
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="RDF 그래프 초기화">
                      <div class="inline-area mt10 mb10">
                        <el-button type="danger" @click="resetNeo4jGraph" v-show="isDelYn(route.meta.auth)"
                          >초기화</el-button
                        >
                        <el-select v-model="state.neo4jGraphInitDataStatType" class="ml15">
                          <el-option label="사용 상태인 것만(기본값)" value="onlyUse" />
                          <el-option label="전체(상태 상관 없이)" value="all" />
                        </el-select>
                        <span class="ml15"
                          >※ Neo4j RDF 그래프를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다.
                          <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                        >
                      </div>
                      <div class="inline-area mt10 mb10">
                        <div class="mr10">초기화 결과:</div>
                        <div v-if="state.neo4jGraphInitResult == true">성공</div>
                        <div v-else-if="state.neo4jGraphInitResult == false">실패<br />{{ state.neo4jGraphInitResultErrMsg }}</div>
                        <div v-else-if="state.neo4jGraphInitResult == 'ING'">처리 중</div>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>ElasticSearch</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right" label-width="220px" class="demo-ruleForm">
            <el-row>
              <el-col :span="24">
                <el-form-item label="Kibana 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickElastic">새 창 열기</el-button>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 등록 (upsert)"  >
                  <div class="inline-area mt10 mb10">
                    <el-input style="width: 230px" v-model="state.elasticEditInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.elasticEditInfo.medataSetNm" placeholder="" disabled></el-input>
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'elastic', mode: 'edit' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'elastic', mode: 'edit' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="saveToElastic()" v-show="isAmdYn(route.meta.auth)"
                      >ElasticSearch에 저장</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋 삭제">
                  <div class="inline-area mt10 mb10">
                    <el-input style="width: 230px" v-model="state.elasticDeleteInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.elasticDeleteInfo.medataSetNm" placeholder="" disabled></el-input>
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'elastic', mode: 'delete' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'elastic', mode: 'delete' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="deleteFromElastic()" v-show="isDelYn(route.meta.auth)"
                      >ElasticSearch에서 삭제</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="ElasticSearch 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger" @click="resetElastic" v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <!-- <span class="ml15"
                      >※ ElasticSearch를 초기화합니다. 전체 내용을 삭제 후, "사용" 상태인 메타데이터 셋 들의 정보를 등록합니다.
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    > -->
                    <span class="ml15"
                      >※ ElasticSearch를 초기화합니다. 전체 내용을 삭제 후, <span class="guide-text-red">전체</span> 메타데이터 셋 들의 정보를 등록합니다.
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.elasticInitResult == true">성공</div>
                    <div v-else-if="state.elasticInitResult == false">실패<br />{{ state.elasticInitResultErrMsg }}</div>
                    <div v-else-if="state.elasticInitResult == 'ING'">처리 중</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>

    <div class="boxLayout">
      <div class="boxTit">
        <h3>InfluxDB2</h3>
      </div>
      <div class="boxCnt">
        <div class="ly-table">
          <el-form label-position="right" label-width="220px" class="demo-ruleForm">
            <el-row>
              <el-col :span="24">
                <el-form-item label="InfluxDB2 서버">
                  <el-button type="primary" class="mt10 mb10" @click="handleClickInfluxDb">새 창 열기</el-button>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋의 키워드 추가">
                  <div class="inline-area mt10 mb10">                  
                    <el-input style="width: 230px" v-model="state.influxdbEditInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.influxdbEditInfo.medataSetNm" placeholder="" disabled></el-input>
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'influxdb', mode: 'edit' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'influxdb', mode: 'edit' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="addKeywordsToInfluxDb()" v-show="isAmdYn(route.meta.auth)"
                      >InfluxDB 에 저장</el-button
                    >
                  </div>
                  <div>
                    <span class="guide-text-red">※ 이 기능으로 저장되는 값들은 정확한 시간 데이터가 아닙니다.</span>
                  </div>            
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="특정 메타데이터셋의 키워드 삭제">
                  <div class="inline-area mt10 mb10">
                    <el-input style="width: 230px" v-model="state.influxdbDeleteInfo.medataSetId" placeholder="" disabled></el-input>
                    <el-input class="ml10" style="width: 230px" v-model="state.influxdbDeleteInfo.medataSetNm" placeholder="" disabled></el-input>
                    <el-button type="default" class="ml10" @click="openMetaDataSetPopup({ name: 'influxdb', mode: 'delete' })">
                      <el-icon class="icon icon-search"></el-icon>
                    </el-button>
                    <el-button type="default" class="el-button--delete" @click="clearMetaDataSetInfo({ name: 'influxdb', mode: 'delete' })">
                      <el-icon class="icon icon-refresh"></el-icon>
                    </el-button>
                    <el-button type="primary" @click="deleteKeywordsFromInfluxDb()" v-show="isDelYn(route.meta.auth)"
                      >InfluxDB 에서 삭제</el-button
                    >
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="InfluxDB 키워드 초기화">
                  <div class="inline-area mt10 mb10">
                    <el-button type="danger" @click="resetInfluxDbKeyword" v-show="isDelYn(route.meta.auth)"
                      >초기화</el-button
                    >
                    <span class="ml15"
                      >※ InfluxDB 에서 keyword 측정 데이터를 초기화합니다. 전체 내용을 삭제 후, <span class="guide-text-red">전체</span> 메타데이터 셋 들의 키워드 정보를 등록합니다.
                      <br/><span class="guide-text-red">※ 재등록되는 값들은 정확한 시간 데이터가 아닙니다.</span>
                      <br/>(데이터가 많을수록 시간이 오래 걸릴 수 있습니다.)</span
                    >
                  </div>
                  <div class="inline-area mt10 mb10">
                    <div class="mr10">초기화 결과:</div>
                    <div v-if="state.influxDbKeywordInitResult == true">성공</div>
                    <div v-else-if="state.influxDbKeywordInitResult == false">실패<br />{{ state.influxDbKeywordInitResultErrMsg }}</div>
                    <div v-else-if="state.influxDbKeywordInitResult == 'ING'">처리 중</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>
    </div>

  </div>
  <el-dialog v-model="dialogVisibleMetaDataSet" title="메타데이터 셋 검색">
    <div class="dialog-area">
      <MetadataSetDialogSearch @selectedRow="selectedRow" :params="state.popupParams" />
    </div>
  </el-dialog>

</template>
<script setup>
import MetadataSetDialogSearch from "@/components/meta/dt/MetadataSetDialogSearch.vue";

import {
  ref,
  reactive,
  onMounted,
  computed,
  watch,
  defineProps,
  defineEmits,
} from "vue";
import {
  getGlobalProperties,
  routerPush,
  getCookie,
  isWriteYn,
  isAmdYn,
  isDelYn,
} from "@/assets/js/common.js";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { getUser, getUsers } from "@/assets/js/auth.js";
import util from "util";
const $axios = getGlobalProperties().$axios;
const $apiUrls = getGlobalProperties().$apiUrls;
const route = useRoute();

const dialogVisibleMetaDataSet = ref(false);

const state = reactive({
  popupParams: {
    // name, mode 등
  },
  virtusoEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  virtusoDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jRdbEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jRdbDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  neo4jDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  elasticEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  elasticDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  influxdbEditInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },
  influxdbDeleteInfo: {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: "",
  },  
  virtuosoGraphInitResult: null,
  virtuosoGraphInitResultErrMsg: "",
  virtuosoNsGraphInitResult: null,
  virtuosoNsGraphInitResultErrMsg: "",
  virtuosoSkosGraphInitResult: null,
  virtuosoSkosGraphInitResultErrMsg: "",
  neo4jRdbGraphInitResult: null,
  neo4jRdbGraphInitResultErrMsg: "",
  neo4jRdbGraphInitDataStatType: "onlyUse",
  neo4jGraphInitResult: null,
  neo4jGraphInitResultErrMsg: "",
  neo4jGraphInitDataStatType: "onlyUse",
  elasticInitResult: null,
  elasticInitResultErrMsg: "",
  influxDbKeywordInitResult: null,
  influxDbKeywordInitResultErrMsg: "",  
});

// 메타데이터 셋 검색 창 열기
const openMetaDataSetPopup = (params) => {
  // params : { name: "", mode: "", rdbFlag: true/false }
  state.popupParams = params;
  dialogVisibleMetaDataSet.value = true;
};

// 메타데이터 셋 선택 후처리
const selectedRow = (data) => {
  const setInfo = JSON.parse(JSON.stringify(data.rowData));

  // data.params : { name: "", mode: "", rdbFlag: true/false }
  switch(data.params.name) {
    case 'virtuoso':
      if (data.params.mode == 'edit') { state.virtusoEditInfo = setInfo; }
      else { state.virtusoDeleteInfo = setInfo; }
      break;  

    case 'neo4j':
      if (data.params.mode == 'edit') { 
        if (data.params.rdbFlag) { state.neo4jRdbEditInfo = setInfo; }
        else { state.neo4jEditInfo = setInfo; }
      }
      else {
        if (data.params.rdbFlag) { state.neo4jRdbDeleteInfo = setInfo; }
        else { state.neo4jDeleteInfo = setInfo; }
      }
      break;

    case 'elastic':
      if (data.params.mode == 'edit') { state.elasticEditInfo = setInfo; }
      else { state.elasticDeleteInfo = setInfo; }
      break;      

    case 'influxdb':
      if (data.params.mode == 'edit') { state.influxdbEditInfo = setInfo; }
      else { state.influxdbDeleteInfo = setInfo; }
      break;

    default:
      console.log('메타데이터 셋 선택 (selectedRow) 경우의 수가 존재하지 않습니다.');
      break;  
  }
  dialogVisibleMetaDataSet.value = false;
};

// 선택한 메타데이터 셋 정보 지우기
const clearMetaDataSetInfo = (params) => {
  const setInfo = {
    medataSetId: "",
    medataSetNm: "",
    medataSetSttusMtcdNm: ""
  };

  // params : { name: "", mode: "", rdbFlag: true/false }  
  switch(params.name) {
    case 'virtuoso':
      if (params.mode == 'edit') { state.virtusoEditInfo = setInfo; }
      else { state.virtusoDeleteInfo = setInfo; }
      break;  

    case 'neo4j':
      if (params.mode == 'edit') { 
        if (params.rdbFlag) { state.neo4jRdbEditInfo = setInfo; }
        else { state.neo4jEditInfo = setInfo; }
      }
      else {
        if (params.rdbFlag) { state.neo4jRdbDeleteInfo = setInfo; }
        else { state.neo4jDeleteInfo = setInfo; }
      }
      break;

    case 'elastic':
      if (params.mode == 'edit') { state.elasticEditInfo = setInfo; }
      else { state.elasticDeleteInfo = setInfo; }
      break;      

    case 'influxdb':
      if (params.mode == 'edit') { state.influxdbEditInfo = setInfo; }
      else { state.influxdbDeleteInfo = setInfo; }
      break;

    default:
      console.log('메타데이터 셋 정보 지우기 (clearMetaDataSetInfo) 경우의 수가 존재하지 않습니다.');
      break;  
  }
}

const handleClickVirtuoso = () => {
  $axios
    .get(util.format($apiUrls.meta.datastore.virtuoso.getVirtuosoConductorUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickConnectVirtuoso = async () => {
  const res = await $axios.get($apiUrls.meta.datastore.virtuoso.connectVirtuoso);
  if (res.data == true) {
    alert("연결 성공");
    return;
  }
  alert("연결 실패");
};

const handleClickNeo4j = () => {
  $axios
    .get(util.format($apiUrls.meta.datastore.neo4j.getNeo4jBrowserUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleClickElastic = () => {
  $axios
    .get(util.format($apiUrls.meta.datastore.elastic.getKibanaUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
};

const saveToGraph = (virtuosoYn) => {
  if (virtuosoYn) {
    if (
      state.virtusoEditInfo.medataSetId == null ||
      state.virtusoEditInfo.medataSetId == ""
    ) {
      alert("등록할 메타데이터 셋을 선택해주세요.");
      return;
    }
    if (
      confirm(
        state.virtusoEditInfo.medataSetNm +
          "(상태:" +
          state.virtusoEditInfo.medataSetSttusMtcdNm +
          ") 을 그래프에 저장하시겠습니까?"
      ) == false
    ) {
      return;
    }
    $axios
      .put(
        util.format(
          $apiUrls.meta.datastore.virtuoso.createRdfInfoToVirtuoso,
          state.virtusoEditInfo.medataSetId
        )
      )
      .then((res) => {
        alert("저장 성공했습니다.");
        state.virtusoEditInfo.medataSetId = "";
        state.virtusoEditInfo.medataSetNm = "";
        state.virtusoEditInfo.medataSetSttusMtcdNm = "";
      })
      .catch((err) => {
        console.log(err);
        alert("저장 실패했습니다.");
      });
    return;
  }

  if (
    state.neo4jEditInfo.medataSetId == null ||
    state.neo4jEditInfo.medataSetId == ""
  ) {
    alert("등록할 메타데이터 셋을 선택해주세요.");
    return;
  }
  if (
    confirm(
      state.neo4jEditInfo.medataSetNm +
        "(상태:" +
        state.neo4jEditInfo.medataSetSttusMtcdNm +
        ") 을 RDF 그래프에 저장하시겠습니까?"
    ) == false
  ) {
    return;
  }
  $axios
    .put(
      util.format(
        $apiUrls.meta.datastore.neo4j.createRdfInfoToNeo4j,
        state.neo4jEditInfo.medataSetId
      )
    )
    .then((res) => {
      alert("저장 성공했습니다.");

      state.neo4jEditInfo.medataSetId = "";
      state.neo4jEditInfo.medataSetNm = "";
      state.neo4jEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
};

const saveToRdbGraph = () => {
  if (
    state.neo4jRdbEditInfo.medataSetId == null ||
    state.neo4jRdbEditInfo.medataSetId == ""
  ) {
    alert("등록할 메타데이터 셋을 선택해주세요.");
    return;
  }
  if (
    confirm(
      state.neo4jRdbEditInfo.medataSetNm +
        "(상태:" +
        state.neo4jRdbEditInfo.medataSetSttusMtcdNm +
        ") 을 RDB 그래프에 저장하시겠습니까?"
    ) == false
  ) {
    return;
  }
  $axios
    .put(
      util.format(
        $apiUrls.meta.datastore.neo4j.createRdfInfoToRdbNeo4j,
        state.neo4jRdbEditInfo.medataSetId
      )
    )
    .then((res) => {
      alert("저장 성공했습니다.");

      state.neo4jRdbEditInfo.medataSetId = "";
      state.neo4jRdbEditInfo.medataSetNm = "";
      state.neo4jRdbEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
};

const saveToElastic = () => {
  if (
    state.elasticEditInfo.medataSetId == null ||
    state.elasticEditInfo.medataSetId == ""
  ) {
    alert("등록할 메타데이터 셋을 선택해주세요.");
    return;
  }
  if (
    confirm(
      state.elasticEditInfo.medataSetNm +
        "(상태:" +
        state.elasticEditInfo.medataSetSttusMtcdNm +
        ") 을 ElasticSearch에 저장하시겠습니까?"
    ) == false
  ) {
    return;
  }
  $axios
    .put(
      util.format(
        $apiUrls.meta.datastore.elastic.createElasticData,
        state.elasticEditInfo.medataSetId
      )
    )
    .then((res) => {
      alert("저장 성공했습니다.");

      state.elasticEditInfo.medataSetId = "";
      state.elasticEditInfo.medataSetNm = "";
      state.elasticEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
};

const deleteFromGraph = (virtuosoYn) => {
  if (virtuosoYn) {
    if (
      state.virtusoDeleteInfo.medataSetId == null ||
      state.virtusoDeleteInfo.medataSetId == ""
    ) {
      alert("삭제할 메타데이터 셋을 선택해주세요.");
      return;
    }
    $axios
      .delete(
        util.format(
          $apiUrls.meta.datastore.virtuoso.createRdfInfoToVirtuoso,
          state.virtusoDeleteInfo.medataSetId
        )
      )
      .then((res) => {
        alert("삭제 성공했습니다.");
        state.virtusoDeleteInfo.medataSetId = "";
        state.virtusoDeleteInfo.medataSetNm = "";
        state.virtusoDeleteInfo.medataSetSttusMtcdNm = "";
      })
      .catch((err) => {
        console.log(err);
        alert("삭제 실패했습니다.");
      });
    return;
  }

  if (
    state.neo4jDeleteInfo.medataSetId == null ||
    state.neo4jDeleteInfo.medataSetId == ""
  ) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.datastore.neo4j.deleteRdfInfoToNeo4j,
        state.neo4jDeleteInfo.medataSetId
      )
    )
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.neo4jDeleteInfo.medataSetId = "";
      state.neo4jDeleteInfo.medataSetNm = "";
      state.neo4jDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
};

const deleteFromRdbGraph = () => {
  if (
    state.neo4jRdbDeleteInfo.medataSetId == null ||
    state.neo4jRdbDeleteInfo.medataSetId == ""
  ) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.datastore.neo4j.deleteRdfInfoToRdbNeo4j,
        state.neo4jRdbDeleteInfo.medataSetId
      )
    )
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.neo4jRdbDeleteInfo.medataSetId = "";
      state.neo4jRdbDeleteInfo.medataSetNm = "";
      state.neo4jRdbDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
};

const deleteFromElastic = () => {
  if (
    state.elasticDeleteInfo.medataSetId == null ||
    state.elasticDeleteInfo.medataSetId == ""
  ) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }
  $axios
    .delete(
      util.format(
        $apiUrls.meta.datastore.elastic.deleteElasticData,
        state.elasticDeleteInfo.medataSetId
      )
    )
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.elasticDeleteInfo.medataSetId = "";
      state.elasticDeleteInfo.medataSetNm = "";
      state.elasticDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
};

const resetElastic = () => {
  if (!confirm("ElasticSearch를 초기화하시겠습니까?")) {
    return;
  }
  state.elasticInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.elastic.initializeElastic))
    .then((res) => {
      console.log(res.data);
      alert("ElasticSearch를 초기화 성공했습니다.");
      state.elasticInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("ElasticSearch를 초기화 실패했습니다.");
      state.elasticInitResult = false;
      state.elasticInitResultErrMsg = err.message;
    });
};

const resetNeo4jGraph = () => {
  if (!confirm("neo4j 그래프(RDF)를 초기화하시겠습니까?")) {
    return;
  }

  const params = {
    initDataStatType: state.neo4jGraphInitDataStatType
  }

  state.neo4jGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.neo4j.initializeNeo4jGraph), null, { params })
    .then((res) => {
      console.log(res.data);
      alert("neo4j 그래프(RDF) 초기화 성공했습니다.");
      state.neo4jGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("neo4j 그래프(RDF) 초기화 실패했습니다.");
      state.neo4jGraphInitResult = false;
      state.neo4jGraphInitResultErrMsg = err.message;
    });
};

const resetNeo4jRdbGraph = () => {
  if (!confirm("neo4j 그래프(RDB)를 초기화하시겠습니까?")) {
    return;
  }

  const params = {
    initDataStatType: state.neo4jRdbGraphInitDataStatType
  }

  state.neo4jRdbGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.neo4j.initializeNeo4jRdbGraph), null, { params })
    .then((res) => {
      console.log(res.data);
      alert("neo4j 그래프(RDB) 초기화 성공했습니다.");
      state.neo4jRdbGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("neo4j 그래프(RDB) 초기화 실패했습니다.");
      state.neo4jRdbGraphInitResult = false;
      state.neo4jRdbGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoGraph = () => {
  if (!confirm("버투소 그래프를 전체 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.virtuoso.initializeVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프 전체 초기화 성공했습니다.");
      state.virtuosoGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프 전체 초기화 실패했습니다.");
      state.virtuosoGraphInitResult = false;
      state.virtuosoGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoNsGraph = () => {
  if (!confirm("버투소 그래프의 RDF 네임스페이스 정보를 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoNsGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.virtuoso.initializeNsOfVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프의 RDF 네임스페이스 정보 초기화 성공했습니다.");
      state.virtuosoNsGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프의 RDF 네임스페이스 정보 초기화 실패했습니다.");
      state.virtuosoNsGraphInitResult = false;
      state.virtuosoNsGraphInitResultErrMsg = err.message;
    });
};

const resetVirtuosoSkosGraph = () => {
  if (!confirm("버투소 그래프의 카테고리 정보를 초기화하시겠습니까?")) {
    return;
  }
  state.virtuosoSkosGraphInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.virtuoso.initializeSkosOfVirtuoso))
    .then((res) => {
      console.log(res.data);
      alert("virtuoso 그래프의 카테고리 정보 초기화 성공했습니다.");
      state.virtuosoSkosGraphInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("virtuoso 그래프의 카테고리 정보 초기화 실패했습니다.");
      state.virtuosoSkosGraphInitResult = false;
      state.virtuosoSkosGraphInitResultErrMsg = err.message;
    });
};

const handleClickInfluxDb = () => {
  $axios.get(util.format($apiUrls.meta.datastore.influxdb.getInfluxDBUrl))
    .then((res) => {
      console.log(res.data);
      window.open(res.data.url);
    })
    .catch((err) => {
      console.log(err);
    });
}

const addKeywordsToInfluxDb = () => {
  if (!state.influxdbEditInfo.medataSetId) {
    alert("키워드를 추가할 메타데이터 셋을 선택해주세요.");
    return;
  }

  const confirmMsg = state.influxdbEditInfo.medataSetNm 
    + "(상태:" + state.influxdbEditInfo.medataSetSttusMtcdNm + ")의 키워드들을 InfluxDB에 추가하시겠습니까?"
    + "\n(기존 데이터를 삭제 후 추가합니다.)";
  if (!confirm(confirmMsg)) return;

  $axios.put(util.format($apiUrls.meta.datastore.influxdb.createInfluxDBKeyword, state.influxdbEditInfo.medataSetId))
    .then((res) => {
      alert("저장 성공했습니다.");
      state.influxdbEditInfo.medataSetId = "";
      state.influxdbEditInfo.medataSetNm = "";
      state.influxdbEditInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("저장 실패했습니다.");
    });
}

const deleteKeywordsFromInfluxDb = () => {
  if (!state.influxdbDeleteInfo.medataSetId) {
    alert("삭제할 메타데이터 셋을 선택해주세요.");
    return;
  }

  $axios.delete(util.format($apiUrls.meta.datastore.influxdb.deleteInfluxDBKeyword, state.influxdbDeleteInfo.medataSetId))
    .then((res) => {
      alert("삭제 성공했습니다.");
      state.influxdbDeleteInfo.medataSetId = "";
      state.influxdbDeleteInfo.medataSetNm = "";
      state.influxdbDeleteInfo.medataSetSttusMtcdNm = "";
    })
    .catch((err) => {
      console.log(err);
      alert("삭제 실패했습니다.");
    });
}

const resetInfluxDbKeyword = () => {
  if (!confirm("InfluxDB 의 키워드 정보를 초기화하시겠습니까?")) return;

  state.influxDbKeywordInitResult = "ING";
  $axios
    .put(util.format($apiUrls.meta.datastore.influxdb.initializeInfluxDBKeyword))
    .then((res) => {
      console.log(res.data);
      alert("InfluxDB 의 키워드 정보 초기화 성공했습니다.");
      state.influxDbKeywordInitResult = true;
    })
    .catch((err) => {
      console.log(err);
      alert("InfluxDB 의 키워드 정보 초기화 실패했습니다.");
      state.influxDbKeywordInitResult = false;
      state.influxDbKeywordInitResultErrMsg = err.message;
    });
}

</script>
<style lang="scss" scoped></style>

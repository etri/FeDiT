import util from "util";
import { isAuthenticated } from '@/assets/js/auth.js' ;

export const MetaStore = {
  namespaced: true,
  state: () => ({
    //메타공통코드
    metaCodes: [],
    //국가코드
    countryCodes: [],
    //메타그룹코드
    metaCodeGroups: [],
    // RDF 클래스
    rdfClass: {},
    // 윈도우 팝업 정보
    popup: [],
    // stomp client
    stompClients: [],
    stompRequireds: {
      $axios: null,
      $emitter: null,
    },
  }),

  mutations: {
    setMetaCodeList(state, payload) {
      let isEmpty = true;
      for (let cdData of state.metaCodes) {
        if (cdData.key == payload.key) {
          isEmpty = false;
        }
      }
      if (isEmpty) {
        state.metaCodes.push(payload);
      }
    },

    setCountryCodeList(state, payload) {
      state.countryCodes = payload;
    },

    setAllMetaCodeGroupList(state, payload) {
      state.metaCodeGroups = payload;
    },
    setRdfClass(state, payload){
      state.rdfClass= payload;
    },

    setPopup(state, popup) {
      state.popup.push(popup);
    },
    closePopup(state) {
      if (state.popup.length > 0) {
        for(var i=0; i<state.popup.length; i++) {
          state.popup[i].close();
        }
        state.popup = [];
      }
    },
    setStompRequireds(state, payload) {
      state.stompRequireds.$axios = payload.$axios;
      state.stompRequireds.$emitter = payload.$emitter;
    },
    pushStompClient(state, newStompClient) {
      if (newStompClient != null) {
        state.stompClients.push(newStompClient);
      }
    },
    removeAllStompClients(state, currStompClient) {
      //console.log(`currStompClient  ${currStompClient ? currStompClient.ws._server : 'null'}`);
      for (let i = state.stompClients.length - 1; i >= 0; i--) {
        if (currStompClient && state.stompClients[i].ws._server == currStompClient.ws._server) {
          //console.log('continue...');
          continue; // 현재 클라이언트는 제외
        } 
        if (state.stompClients[i] != null) {
          try {
            if (state.stompClients[i].connected) {
              //console.log(`${state.stompClients[i].ws._server} disconnect...`);
              state.stompClients[i].disconnect();
            }
            //console.log(`${state.stompClients[i].ws._server} delete...`);
            state.stompClients.splice(1, 1); // 삭제
          } catch (e) {
            console.log('disconnect error', e);
          }
        }
      }
    }
  },

  getters: {
    getStoreMetaCodeList: (state) => (mtcdGrpId) => {
      for (let cdData of state.metaCodes) {
        if (cdData.key == mtcdGrpId) {
          return cdData.data;
        }
      }
      return [];
    },
    getStoreCountryCodeList(state) {
      return state.countryCodes;
    },
    getSotreAllMetaCodeGroupList(state) {
      return state.metaCodeGroups;
    },
    getRdfClass(state){
      return state.rdfClass;
    },

    getPopup(state) {
      return state.popup;
    },
    getStompClients(state) {
      return state.stompClients;
    },
    getStompRequireds(state) {
      return state.stompRequireds;
    }
  },

  actions: {
    async getMetaCodeList({ commit }, { axios, apiUrls, params }) {
      try {
        let getUrl = apiUrls.meta.portal.code.getCodeList;
        const checkAuthenticated = await isAuthenticated();
        if (!checkAuthenticated) {
          getUrl = apiUrls.public.meta.portal.code.getCodeList;
        }

        for (let mtcdGrpId of params.mtcdGrpIdList) {
          const res = await axios.get(
            util.format(getUrl, mtcdGrpId),
            { params: { isPaging: false, mtcdUseYn: "Y" } } //페이징 x
          );
          commit("setMetaCodeList", {
            key: mtcdGrpId,
            data: res.data.list,
          });
        }
      } catch (err) {
        console.log(err);
      }
    },

    async getCountryCodeList({ commit }, { axios, apiUrls }) {
      try {
        const res = await axios.get(
          apiUrls.meta.portal.countrycode.getCountryCodeList,
          { params: { isPaging: false } } //페이징 x && 사용중인 상태코드 , cntryDataSttusMtcd: "use"
        );

        commit("setCountryCodeList", res.data.list);
      } catch (err) {
        console.log(err);
      }
    },

    async getAllMetaCodeGroupList({ commit }, { axios, apiUrls }) {
      try {
        const res = await axios.get(
          apiUrls.meta.portal.code.getCodegroupList,
          { params: { isPaging: false } } //페이징 x
        );
        commit("setAllMetaCodeGroupList", res.data.list);
      } catch (err) {
        console.log(err);
      }
    },

    openPopup({ commit }, base) {
      const popup = window.open(base.url, base.name, base.option);
      commit('setPopup', popup);
    },
  },
};

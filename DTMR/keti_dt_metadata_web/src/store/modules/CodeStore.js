import util from "util";

export const CodeStore = {
  namespaced: true,
  state: () => ({ codes: [] }),
  mutations: {
    setCodeList(state, payload) {
      let isEmpty = true;
      for (let cdData of state.codes) {
        if (cdData.key == payload.key) {
          isEmpty = false;
        }
      }
      if (isEmpty) {
        state.codes.push(payload);
      }
    },
    setAllCode(state, payload) {
      state.codes = payload;
    },
  },
  getters : {
    getStoreCodeList: (state) => (grpId) => {
      for (let cdData of state.codes) {
        if (cdData.key == grpId) {
          return cdData.data
        }
      }
      return [];
    }
  },
  actions: {
    async getCodeList({ commit }, { axios, apiUrls, params }) {
      try {
        for (let grpId of params.grpIdList) {
          const res = await axios.get(
            util.format(apiUrls.admin.code.getCodes, grpId)
          );
          commit("setCodeList", {
            key : grpId,
            data : res.data
          });
        }
      } catch (err) {
        console.log(err);
      }
    },
    async getWflowCodeList({ commit }, { axios, apiUrls, params }) {
      try {
          let grpIds = params.grpIdList;
          const res = await axios.get(
            apiUrls.admin.code.getWflowCodes, {
              params: {
                grpIds : grpIds.join(",")
              },
            }
          );

          /*
          if (Object.keys(res.data).length > 0) {
            console.log(res.data)
            for (let key of Object.keys(res.data)) {
              commit("setCodeList", {
                key: key,
                data: res.data[key]
              });
            }
          };
          */
          console.log(res.data)
          commit("setAllCode", res.data);
      } catch (err) {
        console.log(err);
      }
    },
  },
};

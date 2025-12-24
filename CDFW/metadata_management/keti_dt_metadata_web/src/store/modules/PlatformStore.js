export const PlatformStore = {
  namespaced: true,
  state: () => ({ platforms: [] }),
  mutations: {
    getPlatformList(state, platforms) {
      state.platforms = platforms;
    },
  },
  getters: {
    getPlatformIdList: (state) => {
      let result = [];
      for (let platform of state.platforms) {
        result.push(platform.pltfrmId);
      }
      return result;
    },
  },
  actions: {
    async getPlatformList({ commit }, { axios, apiUrls, params }) {
      var result = [];

      let search = params || {};
      try {
        const res = await axios.get(apiUrls.platform.getPlatformList, {
          params: search
        });
        commit("getPlatformList", res.data);

        result = res.data;
      } catch (err) {
        console.log(err);
      } finally {
        return result;
      }
    },
  },
};

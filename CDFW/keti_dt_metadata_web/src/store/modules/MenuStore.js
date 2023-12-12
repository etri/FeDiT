export const MenuStore = {
  namespaced: true,

  state: () => ({ menuItems: [], userMenuList: [] }),

  mutations: {
    setMenuList(state, payload) {
      if (!payload || payload.data.length <= 0) return;

      let isEmpty = true;
      for (let menuItem of state.menuItems) {
        if (menuItem.key == payload.key) {
          isEmpty = false;
        }
      }
      if (isEmpty) {
        state.menuItems.push(payload);
      }

    },
    setUserMenuList(state, payload) {
      if (!payload || payload.data.length <= 0) return;

      let isEmpty = true;
      for (let userMenu of state.userMenuList) {
        if (userMenu.key == payload.key) {
          isEmpty = false;
        }
      }
      if (isEmpty) {
        state.userMenuList.push(payload);
      }
    },
  },
  getters: {
    getMenuList: (state) => (pltfrmId) => {
      for (let menuItem of state.menuItems) {
        if (menuItem.key == pltfrmId) {
          return menuItem.data;
        }
      }
      return [];
    },
    getUserMenuList: (state) => (pltfrmId) => {
      for (let userMenu of state.userMenuList) {
        if (userMenu.key == pltfrmId) {
          return userMenu.data;
        }
      }
      return [];
    },
    getUserMenuAllList: (state) => {
      let result = [];
      for (let userMenu of state.userMenuList) {
        result.push(...userMenu.data);
      }
      return result;
    },
  },

  actions: {
    async getUserMenuList({ commit }, { axios, apiUrls, params } ) {
      try {
        params.userId = params.userId;
        params.pltfrmId = params.pltfrmId;
        const res = await axios.get(apiUrls.menu.getUserMenu, { params });
        commit("setUserMenuList", {
          key : params.pltfrmId,
          data : res.data
        });

        return res.data;
      } catch (err) {
        console.log(err);
      }
    },
    async getMenuList({ commit }, { axios, apiUrls, params }) {
      try {
        params.userId = params.userId;
        params.pltfrmId = params.pltfrmId;

        const res = await axios.get(apiUrls.menu.getMenuList, { params });
        commit("setMenuList", {
          key : params.pltfrmId,
          data : res.data
        });

        return res.data;
      } catch (err) {
        console.log(err);
      }
    },
  },
};

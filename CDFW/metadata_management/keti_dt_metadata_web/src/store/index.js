import { createStore } from "vuex";
import { MenuStore } from "@/store/modules/MenuStore";
import { CodeStore } from "@/store/modules/CodeStore";
import { PlatformStore } from "@/store/modules/PlatformStore";

import { MetaStore } from "@/store/modules/MetaStore";

export default createStore({
  modules: {
    MetaStore,
    MenuStore,
    CodeStore,
    PlatformStore,
  },
});

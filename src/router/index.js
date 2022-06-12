import { createRouter, createWebHistory } from "vue-router";
import Panel from "../views/Panel.vue";
// import Geotren from "../views/Geotren.vue";

const routes = [ /*
  {
    path: "/",
    name: "Geotren",
    component: Geotren,
  }, */
  {
    path: "/",
    name: "Panel",
    component: Panel,
  },
];
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

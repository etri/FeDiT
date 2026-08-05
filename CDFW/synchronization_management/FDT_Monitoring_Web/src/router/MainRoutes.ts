const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: false
  },
  redirect: '/main/dashboard/default',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },

    {
      name: 'Digital Twin',
      path: '/digitaltwin',
      component: () => import('@/views/utilities/DigitalTwins/DigitalTwin/DigitalTwinPage.vue')
    },
    {
      name: 'Digital Object',
      path: '/digitaltwin/digitalobject',
      component: () => import('@/views/utilities/DigitalTwins/DigitalObject/DigitalObjectPage.vue')
    },
    {
      name: 'Digital Object Data',
      path: '/digitaltwin/digitalobject/data',
      component: () => import('@/views/utilities/DigitalTwins/DigitalObjectData/DigitalObjectDataPage.vue')
    },
    {
      name: 'DTSimulation',
      path: '/digitaltwin/simulation',
      component: () => import('@/views/utilities/DigitalTwins/Simulation/SimulationPage.vue')
    },
    {
      name: 'DTService',
      path: '/digitaltwin/service',
      component: () => import('@/views/utilities/DigitalTwins/Service/ServicePage.vue')
    },

    {
      name: 'Federated Digital Twin',
      path: '/fedit',
      component: () => import('@/views/utilities/FederatedDigitalTwins/FederatedDigitalTwin/FederatedDigitalTwinPage.vue')
    },
    {
      name: 'Federated Digital Object',
      path: '/fedit/fdo',
      component: () => import('@/views/utilities/FederatedDigitalTwins/FederatedDigitalObject/FederatedDigitalObjectPage.vue')
    },
    {
      name: 'Federated Digital Object Data',
      path: '/fedit/fdo/data',
      component: () => import('@/views/utilities/FederatedDigitalTwins/FederatedDigitalObjectData/FederatedDigitalObjectDataPage.vue')
    },
    {
      name: 'Federated Digital Object Control Data',
      path: '/fedit/fdo/control/data',
      component: () =>
        import('@/views/utilities/FederatedDigitalTwins/FederatedDigitalObjectControlData/FederatedDigitalObjectControlDataPage.vue')
    },
    {
      name: 'Subscription',
      path: '/fedit/subscription',
      component: () => import('@/views/utilities/FederatedDigitalTwins/Subscription/SubscriptionPage.vue')
    },
    {
      name: 'FDTSimulation',
      path: '/fedit/simulation',
      component: () => import('@/views/utilities/FederatedDigitalTwins/Simulation/SimulationPage.vue')
    },
    {
      name: 'FDTService',
      path: '/fedit/service',
      component: () => import('@/views/utilities/FederatedDigitalTwins/Service/ServicePage.vue')
    },
    {
      name: 'Visual Model',
      path: '/fedit/visualmodel',
      component: () => import('@/views/utilities/FederatedDigitalTwins/VisualModel/VisualModelPage.vue')
    }
  ]
};

export default MainRoutes;

// import {
//   CircleIcon,
// } from 'vue-tabler-icons';

import {
  mdiAccount,
  mdiMessageArrowRightOutline,
  mdiCogs,
  mdiTuneVariant,
  mdiAccessPoint,
  mdiVideo3d,
  mdiApplicationBracesOutline,
  mdiApps,
  mdiApplicationImport,
  mdiHubOutline,
  mdiFileDocumentOutline,
  mdiSpeedometer
} from '@mdi/js';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  { header: 'Dashboard' },
  {
    title: 'Home',
    icon: mdiSpeedometer,
    to: '/dashboard/default'
  },
  { divider: true },
  {
    title: 'Digital Twin',
    icon: mdiApps,
    to: '/digitaltwin',
    children: [
      {
        title: 'Digital Twin',
        icon: mdiFileDocumentOutline,
        to: '/digitaltwin'
      },
      {
        title: 'Digital Object',
        icon: mdiFileDocumentOutline,
        to: '/digitaltwin/digitalobject'
      },
      {
        title: 'Digital Object Data',
        icon: mdiFileDocumentOutline,
        to: '/digitaltwin/digitalobject/data'
      },
      {
        title: 'Simulation',
        icon: mdiFileDocumentOutline,
        to: '/digitaltwin/simulation'
      },
      {
        title: 'Service',
        icon: mdiFileDocumentOutline,
        to: '/digitaltwin/service'
      }
    ]
  },
  { divider: true },
  {
    title: 'Federated Digital Twin',
    icon: mdiApps,
    to: '/fedit',
    children: [
      {
        title: 'Federated Digital Twin',
        icon: mdiFileDocumentOutline,
        to: '/fedit'
      },
      {
        title: 'Federated Digital Object',
        icon: mdiFileDocumentOutline,
        to: '/fedit/fdo'
      },
      {
        title: 'Federated Digital Object Data',
        icon: mdiFileDocumentOutline,
        to: '/fedit/fdo/data'
      },
      {
        title: 'Federated Digital Object Control Data',
        icon: mdiFileDocumentOutline,
        to: '/fedit/fdo/control/data'
      },
      {
        title: 'Subscription',
        icon: mdiFileDocumentOutline,
        to: '/fedit/subscription'
      },
      {
        title: 'Simulation',
        icon: mdiFileDocumentOutline,
        to: '/fedit/simulation'
      },
      {
        title: 'Service',
        icon: mdiFileDocumentOutline,
        to: '/fedit/service'
      },
      {
        title: 'Visual Model',
        icon: mdiFileDocumentOutline,
        to: '/fedit/visualmodel'
      }
    ]
  }
];

export default sidebarItem;

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
require('dotenv').config()
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const VERSION = 'alpha.1';

/** @type { (string
    | {
        src: string;
        [key: string]: string | boolean | undefined;
      }
  )[]} */
const scripts = []

if (process.env.REACT_APP_UMAMI_SRC && process.env.REACT_APP_UMAMI_ID) {
  scripts.push(
    {
      src: process.env.REACT_APP_UMAMI_SRC,
      ['data-website-id']: process.env.REACT_APP_UMAMI_ID,
      ['data-domains']: (process.env.REACT_APP_DOMAIN || 'http://localhost:3000').split('/').filter(w => !!w)[1],
      async: true,
      defer: true
    }
  )
}


const GIT_COMMIT_SHA = process.env.DRONE_COMMIT_SHA || Math.random().toString(36).substring(7);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Events',
  tagline: 'Events App',
  url: process.env.REACT_APP_DOMAIN || 'http://localhost:3000',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'lebalz', // Usually your GitHub org/user name.
  projectName: 'events-app', // Usually your repo name.
  customFields: {
    /** Use Testuser in local dev: set TEST_USERNAME to the test users email adress*/
    TEST_USERNAME: process.env.TEST_USERNAME,
    /** The Domain Name where the api is running */
    DOMAIN: process.env.REACT_APP_DOMAIN || 'http://localhost:3000',
    /** The Domain Name of this app */
    EVENTS_API: process.env.REACT_APP_EVENTS_API  || 'http://localhost:3002',
    /** The application id generated in https://portal.azure.com */
    CLIENT_ID: process.env.REACT_APP_CLIENT_ID,
    /** Tenant / Verzeichnis-ID (Mandant) */
    TENANT_ID: process.env.REACT_APP_TENANT_ID,
    /** The application id uri generated in https://portal.azure.com */
    API_URI: process.env.REACT_APP_API_URI,
    GIT_COMMIT_SHA: process.env.DRONE_COMMIT_SHA || Math.random().toString(36).substring(7),
  },

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'fr'],
    localeConfigs: {
      de: {
        htmlLang: 'de-CH',
        label: 'Deutsch',
        
      },
      fr: {
        htmlLang: 'fr-CH',
        label: 'Français'
      },
    },
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/'
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: VERSION,
        content: `🚧 Seite im Aufbau... ${VERSION} 🚧`,
        backgroundColor: '#fcff00'
      },
      docs: {
        sidebar: {
          hideable: true,
        }
      },
      navbar: {
        title: 'Events',
        logo: {
          alt: 'Events App',
          src: 'img/logo.svg',
        },
        hideOnScroll: true,
        items: [
          {to: '/calendar', label: 'Kalender', position: 'left'},
          {to: '/table', label: 'Tabelle', position: 'left'},
          {to: '/gantt', label: 'GANTT', position: 'left'},
          {to: '/schedule', label: 'Stupla', position: 'left'},
          {to: '/my-events', label: 'Meine', position: 'left'},
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            type: 'custom-semesterSelector',
            position: 'right'
          },
          {
            type: 'custom-fullScreenButton',
            position: 'right'
          },
          {
            type: 'custom-userBadge',
            position: 'right'
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Events',
            items: [
              {
                label: 'Kalender',
                to: '/calendar',
              },
              {
                label: 'Tabelle',
                to: '/table',
              },
              {
                label: 'Meine',
                to: '/my-events',
              },
              {
                label: 'Gantt',
                to: '/gantt',
              },
              {
                label: 'Stundenplan',
                to: '/schedule',
              },
            ],
          },
          {
            title: 'Admin',
            items: [
              {
                label: 'Dashboard',
                to: '/admin',
              },
              {
                label: 'Import',
                to: '/import',
              },
              {
                label: 'Dokumentation',
                to: '/docs',
              },
            ],
          },
          {
            title: 'Links',
            items: [
              {
                label: 'GBSL',
                href: 'https://gbsl.ch',
              },
              {
                label: 'GBJB',
                href: 'https://gfbienne.ch',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/lebalz/events-app',
              },
              {
                label: 'Socket.IO Dashboard',
                href: 'https://admin.socket.io/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} B. Hofer <br /><a class="badge badge--primary" href="https://github.com/lebalz/events-app/commit/${GIT_COMMIT_SHA}">ᚶ ${GIT_COMMIT_SHA.substring(0, 7)}</a>`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  scripts: [
    ...scripts
  ],
  plugins: [
    'docusaurus-plugin-sass'
  ]
};

module.exports = config;

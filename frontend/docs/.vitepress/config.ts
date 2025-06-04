import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Flashcards',
  base: '/docs/',
  vite: {
    server: {
      allowedHosts: ['localhost', process.env.DOMAIN as string],
    },
  },
  themeConfig: {
    nav: [{ text: 'Веб-приложение', link: `https://${process.env.DOMAIN as string}` }],

    sidebar: [
      {
        text: 'Документация',
        items: [
          { text: 'О приложении', link: '/' },
          { text: 'Основные функции', link: '/features' },
          { text: 'Советы по использованию', link: '/tips' },
          { text: 'Самостоятельное развёртывание', link: '/selfhost' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ksvfs/flashcards' }],
  },
})

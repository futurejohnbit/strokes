const { createApp } = Vue;

createApp({
  data() {
    return {
      query: '',
      messages: [
        { role: 'assistant', text: '請輸入要查詢的詞語，並選擇功能。' }
      ],
      sessionId: null,
      history: [],
      favorites: []
    }
  },
  mounted() {
    this.loadHistory();
    this.loadFavorites();
  },
  methods: {
    async send() {
      const text = this.query.trim();
      if (!text) return;
      this.messages.push({ role: 'user', text });
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.sessionId ? { 'X-Session-Id': this.sessionId } : {})
          },
          body: JSON.stringify({ q: text, mode: 'definition' })
        });
        const data = await res.json();
        if (data.session_id) this.sessionId = data.session_id;
        this.messages.push({ role: 'assistant', text: '', data });
        this.loadHistory();
      } catch (e) {
        this.messages.push({ role: 'assistant', text: '查詢失敗，請稍後重試。' });
      } finally {
        this.query = '';
      }
    },
    async loadHistory() {
      if (!this.sessionId) return;
      try {
        const res = await fetch('/api/history', {
          headers: { 'X-Session-Id': this.sessionId }
        });
        const data = await res.json();
        this.history = data.items || [];
      } catch {}
    },
    async loadFavorites() {
      if (!this.sessionId) return;
      try {
        const res = await fetch('/api/favorites', {
          headers: { 'X-Session-Id': this.sessionId }
        });
        const data = await res.json();
        this.favorites = data.items || [];
      } catch {}
    },
    async addFavorite(message) {
      if (!message || !message.data) return;
      const item = {
        key: `${message.data.traditional}-${message.data.mode}`,
        title: `${message.data.traditional}｜${message.data.mode==='definition'?'詞義':'發音'}`,
        payload: message.data
      };
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.sessionId ? { 'X-Session-Id': this.sessionId } : {})
          },
          body: JSON.stringify({ item })
        });
        this.loadFavorites();
      } catch {}
    },
    async removeFavorite(f) {
      try {
        await fetch('/api/favorites', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(this.sessionId ? { 'X-Session-Id': this.sessionId } : {})
          },
          body: JSON.stringify({ item: f })
        });
        this.loadFavorites();
      } catch {}
    }
  }
}).mount('#app');
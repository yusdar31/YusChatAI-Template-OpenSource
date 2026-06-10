# YusAI - Open Source Web AI Chat

A modern, feature-rich AI chat interface built with Next.js. Connect to any OpenAI-compatible API provider and enjoy a premium chatting experience.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)

## Features

- **Multi-Provider Support** - Connect to any OpenAI-compatible API (OpenAI, Anthropic via proxy, local models, etc.)
- **Smart Load Balancing** - Automatic failover across multiple providers
- **3 Chat Modes** - Chat, Thinking (reasoning), and Research (agentic)
- **System Prompts** - Custom instructions with preset templates
- **Chat Folders** - Organize conversations into folders
- **Full-Text Search** - Search through all chat messages
- **Share via URL** - Generate shareable links for conversations
- **Voice Input** - Speech-to-text using Web Speech API
- **Usage Tracking** - Monitor token usage and request statistics
- **Dark/Light Mode** - Beautiful theme switching
- **PWA Support** - Installable as a native app
- **Export to Markdown** - Download conversations as .md files
- **Code Syntax Highlighting** - With copy-to-clipboard
- **Thinking Blocks** - Visualize AI reasoning process
- **Image & File Attachments** - Paste or upload files
- **Responsive Design** - Works on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/yourusername/yusai-chat.git
cd yusai-chat
npm install
```

### Configuration

1. Create a config file at `~/.config/opencode/opencode.json`:

```json
{
  "provider": {
    "openai": {
      "name": "OpenAI",
      "options": {
        "baseURL": "https://api.openai.com/v1",
        "apiKey": "sk-your-api-key"
      },
      "models": {
        "gpt-4o": { "name": "GPT-4o" },
        "gpt-4o-mini": { "name": "GPT-4o Mini" }
      }
    }
  }
}
```

2. Or configure directly in the app via **Settings** (gear icon).

### Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Production

```bash
npm run build
npm start
```

## API Provider Format

Any provider that implements the OpenAI chat completions API format works:

```
POST {baseURL}/chat/completions
Authorization: Bearer {apiKey}

{
  "model": "model-name",
  "messages": [...],
  "stream": true
}
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components |
| Lucide Icons | Icons |
| react-markdown | Markdown rendering |
| react-syntax-highlighter | Code blocks |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Chat completions proxy
│   │   └── models/route.ts     # Model discovery
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ChatInput.tsx           # Input with voice, file attach
│   ├── ChatMessages.tsx        # Message rendering
│   ├── ModelSwitcher.tsx       # Model selection dropdown
│   ├── Settings.tsx            # Settings panel
│   ├── Sidebar.tsx             # Chat history & folders
│   ├── TokenCounter.tsx        # Token estimation
│   ├── UsageTracker.tsx        # Usage statistics
│   └── ui/                     # shadcn components
├── lib/
│   └── utils.ts
└── public/
    ├── manifest.json           # PWA manifest
    ├── sw.js                   # Service worker
    └── icons/                  # App icons
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI inspired by modern chat interfaces
- Icons from [Lucide](https://lucide.dev/)

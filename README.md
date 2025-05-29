# DeAmo.org - Dezentralisierte Argumentationsmodelle

DeAmo.org is a powerful web application for analyzing and visualizing argumentation structures using AI. It helps users break down complex arguments into clear, visual representations using Mermaid diagrams.

## Features

- **AI-Powered Analysis**: Analyze text using various AI models (Claude 3, GPT-4, Gemini, Llama 3, Mistral) through OpenRouter API
- **Interactive Diagrams**: Real-time Mermaid diagram rendering with zoom, pan, and touch support
- **User-Friendly Interface**: Clean, modern UI with Tailwind CSS and responsive design
- **Data Persistence**: Automatic local storage of API keys, content, and generated diagrams
- **Customization**: Editable Mermaid markdown with real-time updates

## Use Cases

- **Academic Research**: Analyze complex arguments in research papers and philosophical texts
- **Content Analysis**: Understand argument structures and identify logical fallacies
- **Education**: Teach logical reasoning and visualize argument structures
- **Professional Writing**: Plan article structures and analyze competitor arguments

## Getting Started

### Prerequisites
- Node.js (latest LTS version)
- npm, yarn, or pnpm

### Installation

1. Clone and install:
```bash
git clone https://github.com/yourusername/deamo.git
cd deamo
npm install
```

2. Start development:
```bash
npm run dev
```

3. (Optional) Get an API key from [OpenRouter.ai](https://openrouter.ai)

### Building for Production

```bash
npm run build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make changes and commit: `git commit -m "feat: add your feature description"`
4. Push and create a Pull Request

### Guidelines
- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Be respectful and constructive

## Technical Requirements

- Modern web browser with JavaScript
- (Optional) OpenRouter API key
- Internet connection for API access

## Privacy

- All data stored locally in browser
- API keys stored securely in local storage
- No data sent to external servers except API requests

## License

[Add your license information here]

## Support

- Open an issue on GitHub
- [Add your support contact information]

## Acknowledgments

- [Svelte](https://svelte.dev/) for the framework
- [Mermaid](https://mermaid.js.org/) for diagramming
- [OpenRouter](https://openrouter.ai/) for AI access
- [Tailwind CSS](https://tailwindcss.com/) for styling

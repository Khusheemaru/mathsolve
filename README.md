<h1 align="center">MathSolve</h1>

<p align="center">
  <strong>An open-source interactive math solving platform and dataset visualizer.</strong>
</p>

<p align="center">
  <a href="https://github.com/Khusheemaru/mathsolve/actions"><img src="https://img.shields.io/github/actions/workflow/status/Khusheemaru/mathsolve/ci.yml" alt="CI Status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

MathSolve is an interactive educational infrastructure project that connects rich math datasets (like HuggingFace) with complex rendering technologies (KaTeX and Asymptote) and a Supabase backend to deliver a seamless math solving experience.

## ✨ Features

- **Interactive Math Solving**: Practice and solve complex math problems interactively.
- **Advanced Rendering**: Beautiful mathematical typography powered by KaTeX.
- **Asymptote Support**: Renders complex geometrical and mathematical diagrams.
- **Dataset Integration**: Pipeline scripts to seed data from HuggingFace and Kaggle.
- **Real-time Sync**: Powered by Supabase for authentication, history, and leaderboards.

## 🚀 Quick Start

MathSolve is structured as an NPM workspace containing the web frontend and the data pipeline.

### Prerequisites

- Node.js (v18+)
- NPM
- A Supabase project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Khusheemaru/mathsolve.git
   cd mathsolve
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(This installs dependencies for all workspaces: frontend and pipelines).*

3. **Environment Setup:**
   Copy the example environment file and fill in your Supabase keys:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev --workspace=@mathsolve/web
   ```
   Open `http://localhost:5173` in your browser.

## 🏗️ Architecture

- **`apps/web/`**: The React/Vite frontend application.
- **`packages/pipeline/`**: Node.js and Python scripts for downloading datasets and pre-rendering Asymptote figures.

## 🤝 Contributing

We welcome contributions of all sizes! Whether it's fixing a bug, improving the pipeline, or adding a new UI component, your help is appreciated.

Please see our [Contributing Guide](CONTRIBUTING.md) for detailed instructions on how to get started.

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

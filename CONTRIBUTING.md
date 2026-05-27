# Contributing to MathSolve

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. Please make sure to read the relevant section before making your contribution. It will make it a lot easier for us maintainers and smooth out the experience for all involved. The community looks forward to your contributions. 🎉

> And if you like the project, but just don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
> - Star the project
> - Tweet about it
> - Refer this project in your project's readme
> - Mention the project at local meetups and tell your friends/colleagues

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)

## Code of Conduct

This project and everyone participating in it is governed by the
[MathSolve Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Setup for Local Development

MathSolve is structured as an NPM workspace (monorepo).

1. Clone the repository:
   ```bash
   git clone https://github.com/Khusheemaru/mathsolve.git
   cd mathsolve
   ```

2. Install dependencies (from the root, this sets up workspaces):
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root.
   - You will need a Supabase project URL and Anon Key.

4. Run the frontend:
   ```bash
   cd apps/web
   npm run dev
   ```

5. (Optional) Run the scraping/pipeline tools:
   ```bash
   cd packages/pipeline
   # Follow instructions in the pipeline docs for puppeteer/python dependencies
   ```

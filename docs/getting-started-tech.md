# Getting Started - Tech 

**TL;DR**: The highly valuable Quranic Arabic Corpus site needs modernization. We've chosen React for the front end because of its popularity, which attracts more volunteers. The biggest issue we're facing is a bug in the infinite scroll feature. Even if you're new to the tech stack, tackling bugs is a fantastic way to learn.

### Tech Background

The Quranic Arabic Corpus, established in 2009, currently serves millions of users with a custom in-memory graph database. However, a revamp is needed to keep up with the times.

The existing site is built on Java Server Pages (JSP) while the 2.0 prototype is built in React (https://qurancorpus.app). React was selected not because it’s the best UI technology available, but because it's sufficiently robust and widely used, increasing the chance of attracting more volunteers. 

The updated corpus interacts with the graph database via modern REST-based APIs. 

### How You Can Help

Our priority right now is resolving an intricate bug in the "infinite scroll" feature of the new user interface (https://github.com/kaisdukes/quranic-corpus/issues/21). To address this, you will need a strong grasp of React and TypeScript. 

The bug prevents the direct navigation to a specific verse, a feature currently deactivated due to the problem. Fixing this issue is crucial, as it's stalling the implementation of other features like the dictionary, ontology, and search function.

### Background Knowledge

While this might seem daunting if you're unfamiliar with the tech stack, diving into bug fixing is an effective way to familiarize yourself with a new codebase. It also paves the way for new features on the site.

The codebase is constructed following the best software engineering practices for the front end. We use a service-oriented architecture in combination with React and TSyringe for dependency injection. 

To become more familiar with the codebase:

* Download, build, and run the UI locally from the repo: https://github.com/kaisdukes/quranic-corpus
* Review the code and understand the design patterns.
* Understand how we separate Quranic script processing logic from React components using the services layer to maintain code simplicity as the codebase expands.

### Running Locally

The UI is built with [Vite](https://vite.dev) and requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm start        # development server on http://localhost:3000
npm run build    # type-check and build for production into build/
npm run preview  # serve the production build locally
npm test         # unit tests
npm run lint     # ESLint
```

By default the UI calls the API at `https://qurancorpus.app/api`. To use a different API server, set `VITE_API_BASE_URL`, for example in a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:6382
```

The API server is a separate project, [quranic-corpus-api](https://github.com/kaisdukes/quranic-corpus-api). When run locally it listens on port 6382, as in the example above.

The project progress figures on the home page are not fetched from the API. They are counted from the data files of the API project and stored in `src/progress/annotation-coverage.json`. To update them after the data changes:

```bash
node scripts/annotation-coverage.mjs <path to a quranic-corpus-api checkout>
```

The Quran Dictionary (search by root) works the same way. Its index, `src/search/root-index.json`, lists each root with its derived forms and is built from the morphological annotation in those data files. The API jar is needed as well, because the script uses the API's own code to write each lemma in Arabic script and in phonetic transcription:

```bash
node scripts/root-index.mjs <path to a quranic-corpus-api checkout> <path to the API jar>
```

For verses that the verified treebank does not cover, the site shows parser-generated drafts labelled as AI-generated. See [Treebank Drafts](treebank-drafts.md) for how they were produced, how accurate the parser measured, and what to read before publishing them.

### Site Structure

Every page is rendered inside `AppLayout` (`src/app/app-layout.tsx`), a layout route in `src/index.tsx`. It provides the header with the main sections as tabs, and a box for jumping to a verse or chapter (press `/` to focus it). Pages that show a chapter use `Workspace`, which adds a toolbar below the header for choosing the chapter and the display options.

* The sections and which place each tab opens at are in `src/navigation/sections.ts`. The Word by Word and Treebank tabs open at the verse being read.
* The parsing and matching behind the jump box is in `src/navigation/chapter-search.ts`. It has unit tests, like the rest of the navigation logic.
* The overview page (`src/home`) uses the `Tabs` component. The selected tab is kept in the URL, as in `/?tab=sources`.

For background reading to help you fix the bug, consider Googling these topics:

* React Intersection Observer API
* Introduction to TypeScript for JavaScript developers
* Understanding Dependency Injection
* Getting started with TSyringe

We have a supportive community on Slack. Feel free to ask your questions on the #coding-help channel. This way, the entire team can assist you, and everyone can learn from the answers provided.

# 🔬 ResearchAI: Autonomous Multi-Agent Research Proposal Engine

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2.60%2B-FF6F00?logo=langchain&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LPU-Inference-F55036?logo=groq&logoColor=white)
![Tavily](https://img.shields.io/badge/Tavily-Academic_Search-4285F4?logo=google&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**An end-to-end autonomous multi-agent research framework for academic hypothesis formation, literature synthesis, methodology validation, and publication-standard proposal generation with guaranteed Human-in-the-Loop (HITL) governance.**

</div>

---

## 📖 Overview

**ResearchAI** is an advanced multi-agent framework designed to automate the rigorous process of academic research proposal preparation (e.g., Final Year Projects, Ph.D. dissertations, and IEEE/ACM track submissions). 

Built on **LangGraph StateGraph**, the pipeline coordinates **15 specialized AI agents** that iteratively brainstorm, validate literature against real-world sources via **Tavily Search**, identify research gaps, design experimental methodologies, and compile comprehensive proposals—all while granting researchers full control through **interactive human-in-the-loop checkpoints**.

---

## 🌟 Key Features

- **🤖 15 Specialized Autonomous Agents**: Each node in the graph is powered by tailored system prompts and validation routines executing specialized research tasks.
- **🛡️ Human-in-the-Loop (HITL) Governance**: Four critical interruption checkpoints (*Clarification*, *Topic Approval*, *Gap Approval*, and *Final Review*) enable interactive steering and rejection loops.
- **⚡ Ultra-Fast Inference via Groq LPU**: Leverages state-of-the-art LLaMA-3.3-70B models at high token throughput for instantaneous iterative refinement.
- **🔍 Real-Time Literature & Citation Validation**: Connects to the **Tavily Academic Search API** to fetch contemporary papers, extract findings, and cross-reference citations against genuine publications.
- **🔄 Fault-Tolerant State Persistence**: Dual-layer persistence using an atomic **SQLite checkpointer** (`checkpoints.db`) for graph interrupt/resume states and **PostgreSQL** for query analytics, historical rankings, and finalized proposal storage.
- **📡 Real-Time NDJSON Streaming**: Node-by-node execution streamed live to the frontend via HTTP ReadableStream (Server-Sent Event alternative) for instant visual feedback.
- **✨ Cybernetic Research UI**: Premium dark glassmorphism interface featuring dynamic neural wave visualizers, interactive dropdowns, templates, and full Markdown report viewers with export capabilities.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    START([User Query]) --> Router[Router Agent]

    Router -->|Query Ambiguous| Clarify[Clarification Agent\n*HITL Interrupt*]
    Clarify --> Router

    Router -->|Topic Missing| IdeaGen[Idea Generator]
    Router -->|Topic Available| AutoSelect[Auto Select Topic]

    IdeaGen --> TopicAppr[Human Topic Approval\n*HITL Interrupt*]
    AutoSelect --> TopicAppr

    TopicAppr -->|Approved| LitReview[Literature Review Agent\n*Tavily API*]
    TopicAppr -->|Rejected / Re-ideate| IdeaGen

    LitReview --> CiteVal[Citation Validator]
    CiteVal --> GapFinder[Research Gap Finder]

    GapFinder --> GapAppr[Human Gap Approval\n*HITL Interrupt*]
    GapAppr -->|Approved| ProposalWrite[Proposal Architecture Writer]
    GapAppr -->|Rejected / Rescan| GapFinder

    ProposalWrite --> MethodDesign[Methodology Designer]
    MethodDesign --> Feasibility[Feasibility Reviewer]

    Feasibility -->|Approved| ExpPlan[Experiment Planner]
    Feasibility -->|Unfeasible| MethodDesign

    ExpPlan --> ExpExec[Experiment Executor Simulation]
    ExpExec --> ResEval[Results Evaluator]

    ResEval -->|Approved| ReportWrite[Final Report Synthesizer]
    ResEval -->|Rethink| ExpPlan

    ReportWrite --> FinalRev[Human Final Review\n*HITL Interrupt*]
    FinalRev -->|Approved| END([Complete Proposal & DB Sync])
    FinalRev -->|Revision Needed| ReportWrite
```

---

## 🤖 The 15 Specialized Agents

| # | Agent Name | Module | Primary Function |
|---|------------|--------|------------------|
| **1** | **Router Agent** | `router_agent.py` | Analyzes user intent, checks domain clarity, and routes to appropriate branch. |
| **2** | **Clarification Agent** | `clarification_agent.py` | *(HITL)* Halts pipeline to query researcher if initial prompt lacks crucial scope. |
| **3** | **Idea Generator** | `idea_generator.py` | Generates 3 novel, high-impact research topics with novelty scores. |
| **4** | **Auto Select Topic** | `auto_select_topic.py` | Selects and refines existing topic queries against academic standards. |
| **5** | **Topic Approval Agent** | `human_topic_approval.py` | *(HITL)* Presents generated topics to researcher for review or re-ideation. |
| **6** | **Literature Review Agent** | `literature_review_agent.py` | Dispatches Tavily search queries to analyze state-of-the-art literature. |
| **7** | **Citation Validator** | `citation_validator.py` | Verifies DOI, authors, publications, and prevents hallucinated citations. |
| **8** | **Gap Finder** | `gap_finder.py` | Detects unresolved theoretical and practical research voids in literature. |
| **9** | **Gap Approval Agent** | `human_gap_approval.py` | *(HITL)* Enables researcher to curate, modify, or add specific gaps. |
| **10** | **Proposal Writer** | `proposal_writer.py` | Synthesizes abstract, motivation, problem statement, and objectives. |
| **11** | **Methodology Designer** | `methodology_designer.py` | Formulates theoretical framework, mathematical models, and algorithms. |
| **12** | **Feasibility Reviewer** | `feasibility_reviewer.py` | Evaluates resource, time, and data feasibility for bachelor/master levels. |
| **13** | **Experiment Planner** | `experiment_planner.py` | Outlines dataset requirements, baseline benchmarks, and evaluation metrics. |
| **14** | **Experiment Executor** | `experiment_executor.py` | Simulates synthetic test runs and generates expected benchmark tables. |
| **15** | **Results Evaluator** | `results_evaluator.py` | Assesses experimental outcomes against formulated hypotheses. |
| **16** | **Report Writer & Final Review** | `report_writer.py` / `human_final_review.py` | *(HITL)* Compiles complete IEEE Transactions style proposal markdown and handles sign-off. |

---

## 📁 Repository Structure

```text
ResearchAgent/
├── api/                           # FastAPI Application Layer
│   ├── graph_service.py           # LangGraph compilation & session thread manager
│   ├── main.py                    # API routes, CORS, streaming handlers
│   └── schemas.py                 # Pydantic request & response models
├── frontend/                      # React + Vite Cybernetic UI
│   ├── src/
│   │   ├── api/                   # Fetch client for streaming NDJSON
│   │   ├── components/            # UI components (HeroGraphic, TopNavbar, StatusSidebar, etc.)
│   │   ├── lib/                   # Stage definitions and helper utilities
│   │   ├── App.jsx                # Core workstation stage manager
│   │   ├── main.jsx               # React DOM root
│   │   └── styles.css             # Obsidian cybernetic design system
│   ├── package.json               # Frontend dependencies
│   └── vite.config.js             # Vite development server configuration
├── src/                           # Core Multi-Agent Logic
│   ├── Graph/
│   │   └── graph_builder.py       # LangGraph StateGraph orchestration & conditional edges
│   ├── agents/                    # All 15 specialized agent implementations
│   ├── db/                        # Database connectivity & models
│   │   ├── database.py            # SQLAlchemy PostgreSQL connection pool
│   │   ├── models.py              # SearchHistory and GeneratedIdea models
│   │   └── service.py             # Database CRUD and checkpoint sync services
│   └── schemas/
│       └── state.py               # FYPState TypedDict definition
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules (protects API keys & venv)
├── requirements.txt               # Python backend dependencies
└── README.md                      # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.11 or newer
- **Node.js**: 18.0 or newer
- **PostgreSQL**: Local or remote instance (optional, runs gracefully if URL omitted)
- **API Keys**:
  - [Groq Cloud API Key](https://console.groq.com/)
  - [Tavily Search API Key](https://tavily.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/zahidbangash1/ReserachAgent-Multi-agent-workflow-.git
cd ReserachAgent-Multi-agent-workflow-
```

### 2. Backend Setup

1. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY="your-groq-api-key"
   TAVILY_API_KEY="your-tavily-api-key"
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ResearchAgent"
   ```

4. **Launch the FastAPI backend**:
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```
   *The backend will be live at `http://127.0.0.1:8000` (API Docs at `/docs`).*

---

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the Vite dev server**:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check endpoint |
| `POST` | `/sessions/stream` | Dispatches new research pipeline and streams NDJSON node events |
| `POST` | `/sessions/{thread_id}/resume/stream` | Resumes interrupted thread with user approval payload |
| `GET` | `/sessions/{thread_id}` | Polls authoritative state for a given session thread |
| `GET` | `/searches` | Lists historical research sessions stored in PostgreSQL |
| `GET` | `/searches/{thread_id}` | Returns comprehensive search details including ideation rankings |

---

## 💻 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus global research search bar |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Launch pipeline from input textarea |
| <kbd>Alt</kbd> + <kbd>N</kbd> | Start fresh research workspace |

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/zahidbangash1/ReserachAgent-Multi-agent-workflow-/issues).

<div align="center">
Developed with ❤️ by <a href="https://github.com/zahidbangash1">Zahid Bangash</a>
</div>

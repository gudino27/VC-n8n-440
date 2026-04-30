# Virtual Counselor — Algorithmic Prompt Search for Academic Advising

**WSU CPTS 440 AI Project** | Jaime Gudino, Andrew Edson, Joseph Buchanan

An independently-developed academic advising application for WSU students that combines a Retrieval-Augmented Generation (RAG) pipeline with algorithmic prompt search. Students can ask natural-language questions about prerequisites, degree progress, schedule feasibility, and UCORE requirements and receive grounded, catalog-accurate answers.

**RAG pipeline accuracy: 81.67% (98/120 cases) vs. 30.83% without retrieval — a +50.83 pp improvement.**

---

## Demo

Open the Colab demo notebook — no API key required for sections 1–5:

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gudino27/VC-n8n-440/blob/master/prompt-search/notebooks/demo_colab.ipynb)

---

## Architecture

```
Student query
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  Layer 1 · Retrieval                                │
│  FAISS (all-MiniLM-L6-v2, 384-dim)                  │
│  → top-30 candidates → NVIDIA reranker → top-3      │
│  + 2-hop BFS prerequisite graph (SQLite)            │
│  + UCORE / degree / schedule blocks (conditional)   │
└───────────────────────┬─────────────────────────────┘
                        │ assembled context
                        ▼
┌─────────────────────────────────────────────────────┐
│  Layer 2 · Generation                               │
│  Claude Haiku (claude-haiku-4-5) via Anthropic API  │
│  Local fallback: Llama 3.1-8B Q4_K_M (llama.cpp)    |
└───────────────────────┬─────────────────────────────┘
                        │ answer
                        ▼
┌─────────────────────────────────────────────────────┐
│  Layer 3 · Prompt Search (offline optimization)     │
│  Beam Search  B=3, I_max=10, |M|=4 mutations        │
│  MCTS         N=100 iterations, c=√2 (UCB1)         │
│  Iterative Refinement  R=5 rounds, LLM self-critique│
└─────────────────────────────────────────────────────┘
```

---

## Results

| Category | n | RAG | No-RAG | Δ |
|---|---|---|---|---|
| Prerequisite Validation | 30 | **93.33%** | 16.67% | +76.67 pp |
| Chain Discovery | 25 | **88.00%** | 28.00% | +60.00 pp |
| Schedule Feasibility | 15 | **86.67%** | 26.67% | +60.00 pp |
| UCORE Planning | 10 | **80.00%** | 50.00% | +30.00 pp |
| Credit Calculations | 20 | **80.00%** | 55.00% | +25.00 pp |
| Degree Progress | 20 | **55.00%** | 25.00% | +30.00 pp |
| **Overall** | **120** | **81.67%** | **30.83%** | **+50.83 pp** |

Metric: cosine similarity ≥ 0.60 between `all-MiniLM-L6-v2` embeddings of model answer and ground truth. Run date: 2026-04-27, LLM: `claude-haiku-4-5`.

---

## Repository Structure

```
VC-n8n-440/
├── prompt-search/              # AI / RAG pipeline (Python)
│   ├── src/
│   │   ├── counselor/          # Pipeline, PrereqChecker, GradAdvisor
│   │   ├── retrieval/          # FAISS retriever, ContextBuilder, reranker, DB client
│   │   ├── prompts/            # PromptTemplate, PromptMutator (10 operators)
│   │   ├── search/             # BeamSearch, MCTS, IterativeRefinement
│   │   ├── evaluation/         # EvaluationMetrics (cosine accuracy, pass@k, cost)
│   │   └── llm/                # Claude Haiku client, local Llama client, cache
│   ├── config/                 # YAML configs (rag.yaml, beam_search.yaml, mcts.yaml …)
│   ├── notebooks/
│   │   ├── demo_colab.ipynb    # ← start here (no API key needed for sections 1–5)
│   │   ├── core/               # 00–07: LLM setup, templates, search algorithms, RAG
│   │   ├── evaluation/         # 10–15: benchmark loading and evaluation runs
│   │   └── experiments/        # 20–21: ablation, self-consistency
│   ├── scripts/
│   │   ├── build_index.py      # Build courses.faiss from metadata.json
│   │   ├── run_rag_eval.py     # Reproduce the 120-case evaluation
│   │   └── query.py            # Single-question CLI
│   ├── data/
│   │   ├── domain/             # metadata.json, test_cases.json, few_shot_examples.json
│   │   └── results/            # rag_eval_results.json (authoritative run)
│   ├── tests/                  # pytest suite (9 test files)
│   └── requirements.txt
├── virtual-counselor/          # React frontend (ChatPage, DegreePlanner)
├── docker-compose.prod.yml     # Production stack (API + frontend + n8n + llama.cpp)
└── Virtual_Counselor_CPTS440.pptx  # Presentation slides
```

---

## Setup

### Prerequisites

- Python 3.10+
- An Anthropic API key (`claude-haiku-4-5`) — required only for live queries and evaluation runs

### Install

```bash
git clone https://github.com/gudino27/VC-n8n-440.git
cd VC-n8n-440/prompt-search

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### Configure API key

```bash
cp .env.example .env
# Edit .env and set:
#   CLAUDE_API_KEY=sk-ant-...
#   NVIDIA_API_KEY=nvapi-...   (optional — enables reranker; falls back to FAISS order)
```

### Build the FAISS index

The FAISS index is not committed to git (large binary). Build it once from the included `metadata.json`:

```bash
python scripts/build_index.py
# Writes: data/domain/courses.faiss  (~30 seconds)
```

---

## Running

### Interactive CLI

```bash
# From the prompt-search/ directory
python scripts/query.py

# With completed courses pre-loaded for prerequisite checks
python scripts/query.py --courses "CPTS 121, MATH 171, ENGL 101"

# With a specific degree program (default: Computer Science)
python scripts/query.py --degree "Electrical Engineering"
```

At the prompt, type any question:
- `Can I take CPTS 360?` — prerequisite check
- `What do I need to graduate?` — graduation requirements
- Any free-form advising question — RAG answer
- `quit` / `exit` — exit

### Reproduce the full 120-case RAG evaluation

```bash
python scripts/run_rag_eval.py
# Results written to data/results/rag_eval_results.json
```

### Run the test suite

```bash
pytest tests/ -v
```

### Development notebooks

Start Jupyter and open any notebook under `notebooks/`:

```bash
jupyter notebook
```

| Notebook | Purpose |
|---|---|
| `demo_colab.ipynb` | Full demo — templates, beam search, MCTS, results charts |
| `core/03_beam_search.ipynb` | Beam search step-by-step |
| `core/04_mcts.ipynb` | MCTS tree exploration |
| `evaluation/15_rag_eval.ipynb` | Live 120-case evaluation (requires API key) |
| `experiments/20_ablation_study.ipynb` | Context block ablation |

---

## Configuration

All tunable parameters live in `config/`. Key settings:

| File | Key parameters |
|---|---|
| `config/rag.yaml` | `top_k: 3`, `reranker_fetch_k: 30`, `model: claude-haiku-4-5`, `temperature: 0.0` |
| `config/beam_search.yaml` | `beam_width: 3`, `max_iterations: 10`, `patience: 2` |
| `config/mcts.yaml` | `num_iterations: 100`, `exploration_weight: 1.414` |
| `config/iterative_refinement.yaml` | `max_rounds: 5`, `patience: 2` |

---

## Local LLM (Optional)

A local inference path using `llama-cpp-python` is supported as a zero-API-cost alternative. Download the model and configure `LLAMA_MODEL_PATH` in `.env`:

```bash
# Download model (4.65 GB)
huggingface-cli download bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \
    Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
    --local-dir prompt-search/models/
```

The `LocalLLMClient` in `src/llm/local_client.py` provides a drop-in replacement for the Claude client for zero-API-cost experimentation.


---

## Prompt Search Algorithms

Three algorithms search the space of `PromptTemplate` objects by applying mutation operators and scoring candidates on a validation set:

| Algorithm | Parameters | Exploration |
|---|---|---|
| **Beam Search** | B=3, I_max=10, patience=2 | Greedy top-B pruning |
| **MCTS** | N=100, c=√2 (UCB1) | Exploit + explore via UCB1 |
| **Iterative Refinement** | R=5 rounds | LLM self-critique → mutation |

Four mutation operators are active in all search runs: `add_cot`, `remove_cot`, `add_verification_step`, `add_self_consistency`. Six additional operators (`add_expert_persona`, `add_example`, `set_output_format`, `add_domain_context`, `add_constraint`, `rephrase_task`) are available for selective use.

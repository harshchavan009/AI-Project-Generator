# CapstoneForge Viva Voce Defense Guide (VIVA.md)

This document contains key defense questions and architectural justifications for the CapstoneForge engineering committee evaluation. All answers are articulated in first-person engineering rationale.

---

### Question 1: Why does the Originality Transformer use a curated enhancement-pattern mapping instead of letting an LLM invent differentiation ideas freely?

**Answer:**  
I restricted the Originality Transformer to a curated, versioned taxonomy of domain-specific enhancement patterns to prevent ungrounded architectural hallucinations and buzzword inflation. When an LLM freely invents differentiation, it routinely hallucinates unrealistic capabilities—such as proposing quantum cryptography or impossible sensor networks for standard CRUD systems—which undergraduate committees immediately penalize. By anchoring patterns in maintained engineering primitives (e.g., eBPF telemetry, differential privacy, Grad-CAM interpretability, INT8 edge quantization), I ensure every suggested enhancement corresponds to verifiable industry standards. Furthermore, selecting patterns via local cosine similarity embeddings and re-running FastEmbed ONNX similarity against our project archive allows me to provably measure the before-and-after novelty gain rather than trusting an LLM's unverified assertion.

---

### Question 2: How does the free-text feasibility checker avoid false negatives and false positives, and what structural signals are evaluated before any LLM involvement?

**Answer:**  
I implemented a two-stage deterministic inspection pipeline that executes entirely in backend code prior to any generative language formatting. First, the student's idea is evaluated against a curated taxonomy of structurally infeasible problem categories to flag fundamental roadblocks—such as long-horizon natural disaster forecasting with zero public precursor datasets, autonomous clinical prescription algorithms requiring institutional IRB approval, or high-frequency trading under microsecond latency constraints. Second, our local embedding engine maps the free-text description to nearest catalog requirement tags to extract physical constraints (hardware class, component count, typical timeline), which are fed into our deterministic feasibility rule engine alongside the student's active team size and hardware constraints. This prevents false positives by hard-failing scientifically impossible scopes regardless of how persuasively phrased, while avoiding false negatives by evaluating empirical skill-gap deficits and timelines rather than subjective heuristics.

---

### Question 3: Why is the Project Evolution Complexity Ladder a maintained, versioned dataset rather than being generated fresh by the LLM each time?

**Answer:**  
I chose a maintained, versioned complexity ladder dataset to guarantee deterministic consistency, pedagogical comparability, and auditability across students and cohorts. If an LLM generated the ladder on the fly, two students submitting the identical idea ten minutes apart would receive entirely different level progressions, varying tech stacks, and conflicting milestone timelines. A maintained 5-level dataset ensures that Level 1 (Basic Script/CLI) through Level 5 (Enterprise Distributed / Formal Verification) represent standardized academic rigor agreed upon by faculty oversight. Furthermore, faculty evaluators can inspect the exact versioned JSON ladder used during viva defense to verify whether a student fulfilled their committed capability delta without having to wonder what randomized prompt completion the model produced.

---

### Question 4: How is Dr. Aris's mentor confidence score computed, and why is it based on retrieval similarity rather than letting the LLM self-report its own confidence?

**Answer:**  
I compute the mentor's confidence score deterministically from the retrieval stage itself by taking the maximum cosine similarity score between the student query embedding and our indexed knowledge-base chunks using local BGE-small ONNX embeddings. I explicitly rejected LLM self-reported confidence because empirical research demonstrates that autoregressive language models suffer from severe sycophancy and poorly calibrated certainty, frequently expressing high verbal confidence in completely fabricated assertions. If the top retrieval similarity falls below our calibrated threshold (e.g., similarity < 0.57 or confidence < 40%), the system deterministically triggers a hallucination guardrail. When this occurs, Dr. Aris explicitly declines to answer off-topic queries (such as culinary recipes or unverified frameworks) rather than synthesizing plausible-sounding misinformation.

---

### Question 5: Why is the Research Dataset Finder allowed to return "no good match found", and why is that significantly more valuable than always returning a result?

**Answer:**  
I deliberately designed the Dataset Finder to return an explicit "no match found" state because the absence of open-access, peer-reviewed data is itself a critical feasibility verdict for an engineering capstone. If a recommendation engine always returns a result by forcing weak nearest neighbors or letting an LLM invent fictitious dataset repositories, students waste weeks pursuing projects that fail at the data ingestion milestone. In our architecture, if no curated public repository (such as Kaggle, UCI, NIH Chest X-ray, or HuggingFace) satisfies our minimum cosine similarity threshold of 0.65, the system alerts the student immediately that proprietary or unavailable data will jeopardize their defense. This immediate failure signal protects students from failing their mid-semester review before they write a single line of unsupportable code.

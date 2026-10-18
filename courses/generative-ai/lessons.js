/* Generative AI course lessons (Markdown) */
(function () {
  const T = '```';
  const demo = (name, o) => `::demo ${name}${o ? ' ' + JSON.stringify(o) : ''}`;

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 14,
    title: 'What is Generative AI?',
    sub: 'Generative vs discriminative models, the main families of generative models, what changed in 2017–2022, and what these systems can and cannot do.',
    md: `
## Generating, not just labelling
A ==discriminative model== learns P(y | x): given an email, is it spam? A ==generative model== learns the data distribution itself, P(x) or P(x | condition), so it can **produce new samples**: text, images, audio, code, molecules.

| | Discriminative | Generative |
|---|---|---|
| Learns | decision boundary P(y \\| x) | data distribution P(x) or P(x \\| c) |
| Output | a label or number | a new sample |
| Examples | logistic regression, ResNet classifier, BERT classifier | GPT, Claude, Stable Diffusion, Whisper (text from audio) |

## Families of generative models
| Family | Idea | Strengths | Used in |
|---|---|---|---|
| **Autoregressive** | predict the next token given previous ones | flexible, scales superbly | LLMs, code models, some image/audio models |
| **VAE** | encode to a latent distribution, decode samples | smooth latent space | compression stage of latent diffusion |
| **GAN** | generator vs discriminator game | sharp images, fast sampling | StyleGAN, super-resolution |
| **Diffusion** | learn to reverse gradual noising | high quality, stable training, controllable | Stable Diffusion, DALL·E 3, Imagen, video models |
| **Flow-based / flow matching** | learn invertible or continuous transforms | exact likelihood / fast sampling | Stable Diffusion 3, Flux |

## Why now?
1. **Transformers** (2017): parallel training that scales with data and compute.
2. **Scale**: models with billions of parameters trained on trillions of tokens; capabilities emerge smoothly (and sometimes suddenly) with scale.
3. **Self-supervision**: the internet is the training set; no manual labels needed for pretraining.
4. **Alignment**: instruction tuning and RLHF turned raw text predictors into helpful assistants (ChatGPT, 2022).
5. **Diffusion** (2020–2022): reliable high-quality image generation.

## What a modern LLM can do
- Write, summarise, translate and restyle text.
- Answer questions and explain concepts (with caveats).
- Write, review and debug code.
- Reason through multi-step problems, especially when allowed to "think" before answering.
- Use tools: search, run code, call APIs, operate software as an **agent**.
- Understand images, documents and audio (multimodal models).

## Limits to keep in mind
> [!warn] LLMs generate **plausible** text, which is not the same as **true** text. They can ==hallucinate== facts and citations, reflect biases in their data, be manipulated by ==prompt injection==, and have a knowledge cutoff. Ground them in sources, verify outputs, and keep humans responsible for high-stakes decisions.

## The landscape
| Category | Examples |
|---|---|
| Frontier closed models | Claude (Anthropic), GPT (OpenAI), Gemini (Google) |
| Open-weight models | Llama (Meta), Mistral, Qwen, DeepSeek, Gemma |
| Image / video | Stable Diffusion, Flux, Midjourney, DALL·E, Imagen, Sora, Veo |
| Speech | Whisper (speech-to-text), many text-to-speech models |
| Tooling | Hugging Face, LangChain, LlamaIndex, vLLM, Ollama, vector databases |

## How this course is organised
Part 1 explains how models represent and generate text. Part 2 covers how LLMs are trained and how to prompt them. Part 3 is about building real systems: RAG, tools, agents, fine-tuning and efficient inference. Part 4 covers image generation and putting systems into production safely.
`,
    checks: [
      ['Discriminative vs generative models?', 'Discriminative models learn P(y|x) to predict labels; generative models learn the data distribution P(x) or P(x|c) and can sample new data.'],
      ['Name four families of generative models.', 'Autoregressive models, VAEs, GANs and diffusion models (plus flow-based models).'],
      ['What is a hallucination?', 'A fluent, confident output that is false or unsupported, such as an invented fact or citation.'],
    ],
    quiz: [
      { q: 'GPT-style LLMs are which kind of generative model?', o: ['GAN', 'Autoregressive', 'VAE', 'k-means'], a: 1 },
      { q: 'Stable Diffusion is primarily a…', o: ['GAN', 'Diffusion model in a latent space', 'Decision tree', 'RNN'], a: 1 },
      { q: 'What turned raw pretrained LLMs into helpful chat assistants?', o: ['Bigger GPUs only', 'Instruction tuning and preference alignment (e.g. RLHF)', 'Tokenizers', 'Dropout'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 16,
    title: 'Tokens and Embeddings',
    sub: 'How text becomes numbers: subword tokenisation with BPE, vocabularies and context windows, and embeddings that turn meaning into geometry.',
    md: `
## Text must become numbers
Models operate on integers and vectors. Two steps get us there: **tokenisation** (text → token IDs) and **embedding** (IDs → vectors).

## Tokenisation
Splitting by words gives huge vocabularies and cannot handle new words; splitting by characters makes sequences very long. Modern models use ==subword tokenisation==: common words are single tokens, rare words are split into pieces.

${demo('gen-bpe')}

| Algorithm | Used by |
|---|---|
| Byte-pair encoding (BPE), byte-level | GPT family, LLaMA 3, Claude, most LLMs |
| WordPiece | BERT |
| Unigram / SentencePiece | T5, LLaMA 1–2, many multilingual models |

Rules of thumb for English: **1 token ≈ 4 characters ≈ ¾ of a word**; 100 tokens ≈ 75 words. Code, numbers and many non-English languages use more tokens per word, which affects cost and context usage.

${T}python
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
ids = enc.encode("Tokenization isn't magic.")
print(ids)                          # e.g. [3404, 2065, 4536, 956, 11204, 13]
print([enc.decode([i]) for i in ids])   # ['Token', 'ization', ' isn', "'t", ' magic', '.']
${T}

> [!warn] Tokenisation explains many odd LLM behaviours: trouble counting letters in a word ("strawberry"), spelling backwards, or doing arithmetic on long numbers. The model sees tokens, not characters.

## Context window
The ==context window== is the maximum number of tokens the model can attend to at once (prompt + output). Modern models range from 8K to over 1M tokens. Longer context costs more compute and money, and models may use information in the middle of very long contexts less reliably, so retrieval (lesson 6) is still valuable.

## Embeddings
Each token ID indexes a row of an **embedding matrix** (vocabulary × d_model, e.g. 128K × 4096). These vectors are learned during training, and the transformer layers turn them into rich, context-dependent representations.

Separately, ==embedding models== map a whole sentence or document to one vector so that **similar meanings are close together**. They power semantic search, clustering, recommendations and RAG.

${demo('gen-embeddings')}

| Similarity | Formula | Note |
|---|---|---|
| Cosine | a·b / (‖a‖‖b‖) | the default; ignores length |
| Dot product | a·b | equals cosine for normalised vectors |
| Euclidean | ‖a − b‖ | equivalent ranking for normalised vectors |

${T}python
from sentence_transformers import SentenceTransformer, util
model = SentenceTransformer("all-MiniLM-L6-v2")           # 384-dimensional embeddings
docs = ["How do I reset my password?", "My card was charged twice", "The app crashes on startup"]
emb = model.encode(docs, normalize_embeddings=True)
q = model.encode("I was billed two times", normalize_embeddings=True)
print(util.cos_sim(q, emb))        # highest score for "My card was charged twice"
${T}

> [!key] Embeddings turn "meaning" into geometry. Search becomes nearest-neighbour lookup, which vector databases (FAISS, pgvector, Pinecone, Chroma, Qdrant) do in milliseconds over millions of items with approximate indexes like HNSW.
`,
    checks: [
      ['Why do LLMs use subword tokenisation?', 'It keeps vocabularies manageable, handles unseen words by splitting them into pieces, and keeps sequences shorter than character-level.'],
      ['Roughly how many words are 1,000 English tokens?', 'About 750 words.'],
      ['Why do LLMs struggle to count letters in a word?', 'They see tokens (chunks of characters), not individual letters.'],
      ['What is cosine similarity?', 'The dot product of two vectors divided by the product of their lengths: the cosine of the angle between them.'],
    ],
    quiz: [
      { q: 'BPE builds its vocabulary by…', o: ['Taking every dictionary word', 'Repeatedly merging the most frequent adjacent pair', 'Random sampling', 'Using one token per character only'], a: 1 },
      { q: 'The context window limits…', o: ['Vocabulary size', 'Total tokens the model can process at once', 'Number of layers', 'Training data size'], a: 1 },
      { q: 'For normalised embeddings, ranking by dot product is the same as ranking by…', o: ['Cosine similarity', 'Token count', 'Random order', 'Length'], a: 0 },
      { q: 'Semantic search finds documents that…', o: ['Share exact keywords only', 'Have similar meaning, via embedding similarity', 'Are newest', 'Are longest'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 1, minutes: 17,
    title: 'How LLMs Generate Text',
    sub: 'Decoder-only transformers, next-token prediction, logits and probabilities, decoding strategies, and the KV cache.',
    md: `
## Next-token prediction
A language model assigns a probability to the next token given everything before it:

$$ P(text) = Π P(tokenₜ | token₁ … tokenₜ₋₁) $$

Generation is a loop: run the model on the context, get a distribution over the vocabulary, pick a token, append it, repeat until a stop token or length limit.

## Inside the model
${T}text
token IDs → embeddings (+ positions, e.g. RoPE)
          → N × [ causal self-attention → MLP ]   (with residuals and RMSNorm)
          → final norm → linear "unembedding" → logits (one score per vocabulary token)
          → softmax → probabilities
${T}

**Causal attention** means each position sees only earlier tokens, so one forward pass over a training sequence yields a next-token prediction at **every** position, which makes training extremely efficient.

${demo('qkv')}

> [!key] Everything an LLM does (answering, coding, reasoning, translating) is this one operation repeated: predict the next token. Capabilities come from what it takes to predict text well at scale: grammar, facts, styles, and patterns of reasoning present in the data.

## Decoding strategies
${demo('gen-sampling')}

| Strategy | How | Good for |
|---|---|---|
| Greedy | always the most likely token | deterministic short answers; can loop |
| Beam search | keep the k best partial sequences | translation, summarisation (less for chat) |
| **Temperature** | divide logits by T before softmax | T < 1 sharper/safer, T > 1 more diverse |
| **Top-k** | sample only from the k most likely | cut off the long tail |
| **Top-p (nucleus)** | smallest set with cumulative prob ≥ p | adapts the candidate count to confidence |
| Repetition / frequency penalties | down-weight recent tokens | reduce loops |
| Constrained / structured decoding | mask tokens that violate a grammar/JSON schema | guaranteed valid JSON, tool calls |

> [!tip] Typical settings: temperature 0–0.3 for extraction, classification and code; 0.7–1.0 for brainstorming and creative writing. Change temperature **or** top-p, not both at once.

## The KV cache
During generation, the keys and values of past tokens do not change. Storing them (the ==KV cache==) means each new token only computes attention for itself, turning generation from quadratic to linear work per token. The cache grows with context length and batch size and often dominates GPU memory at inference, motivating grouped-query attention, paged attention (vLLM) and KV-cache quantisation.

## Prefill vs decode
- **Prefill**: process the whole prompt in parallel (compute-bound, fast per token).
- **Decode**: generate one token at a time (memory-bandwidth-bound).

That is why long prompts cost less per token than outputs, why **time to first token** and **tokens per second** are separate metrics, and why **speculative decoding** (a small draft model proposes several tokens; the big model verifies them in one pass) speeds things up without changing outputs.

## Reasoning models
Letting a model produce intermediate "thinking" tokens before the final answer (chain of thought) improves performance on maths, coding and planning. Modern reasoning models are trained with reinforcement learning to use extended thinking effectively; spending more **test-time compute** buys better answers.
`,
    checks: [
      ['How does an LLM generate a paragraph?', 'Repeatedly: compute next-token probabilities from the context, choose a token (by a decoding strategy), append it, and continue.'],
      ['What does temperature do?', 'Divides logits before softmax: low temperature sharpens the distribution (more deterministic), high temperature flattens it (more random).'],
      ['What is top-p sampling?', 'Sampling from the smallest set of tokens whose cumulative probability reaches p.'],
      ['What is the KV cache?', 'Stored attention keys and values for previous tokens so each new token does not recompute them.'],
    ],
    quiz: [
      { q: 'Greedy decoding always picks…', o: ['A random token', 'The most probable token', 'The least probable token', 'The longest token'], a: 1 },
      { q: 'For extracting fields from an invoice as JSON, a good temperature is about…', o: ['0', '1.5', '2.0', '5'], a: 0 },
      { q: 'Speculative decoding speeds up generation by…', o: ['Skipping layers randomly', 'Letting a small model draft tokens that the large model verifies in parallel', 'Using a bigger vocabulary', 'Lowering quality'], a: 1 },
      { q: 'The decode phase of inference is usually limited by…', o: ['Disk speed', 'Memory bandwidth', 'Tokenizer speed', 'Network'], a: 1 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 18,
    title: 'Training LLMs: Pretraining, Fine-tuning and Alignment',
    sub: 'The three-stage recipe: self-supervised pretraining at scale, supervised instruction tuning, and preference optimisation with RLHF, DPO and constitutional methods.',
    md: `
## Stage 1: pretraining
Train a decoder-only transformer to predict the next token on a massive corpus: web pages, books, code, scientific papers, multilingual text, often 10–30+ trillion tokens.

- **Objective**: minimise cross-entropy of the next token (equivalently, ==perplexity==).
- **Data work dominates**: deduplication, quality filtering, removing toxic and personal data, balancing domains, decontaminating benchmarks.
- **Compute**: thousands of GPUs for weeks to months, using data, tensor and pipeline parallelism, mixed precision and careful stability tricks.
- **Result**: a ==base model== that continues text brilliantly but does not reliably follow instructions.

## Scaling laws
Loss decreases as a predictable power law in model size, data and compute. This lets labs forecast results from small runs. Compute-optimal training (Chinchilla) scales parameters and tokens together; in practice many models are trained on far more tokens than "optimal" because smaller models are cheaper to serve.

## Stage 2: supervised fine-tuning (SFT)
Fine-tune on curated **(instruction, ideal response)** pairs, formatted with a chat template (system, user, assistant turns). The model learns to follow instructions, use a consistent format and adopt an assistant persona. Tens of thousands of high-quality examples matter more than millions of noisy ones.

## Stage 3: preference alignment
Humans (or AI judges) compare pairs of responses; the model learns to produce the preferred ones.

| Method | How |
|---|---|
| **RLHF** | train a ==reward model== on preference pairs, then optimise the LLM with PPO to maximise reward minus a KL penalty that keeps it close to the SFT model |
| **DPO** | optimise directly on preference pairs with a classification-style loss, no separate reward model or RL loop |
| **Constitutional AI / RLAIF** | an AI critiques and revises responses against written principles; AI preferences replace some human labels |
| **RL from verifiable rewards** | reward correct maths answers, passing unit tests; drives reasoning models |

$$ RLHF objective: maximise E[ r(x, y) ] − β · KL( π_θ ‖ π_SFT ) $$

> [!key] Pretraining gives **knowledge and capability**; fine-tuning and alignment give **behaviour**: helpful, honest and harmless responses in the format users expect. The KL penalty stops the model from drifting into reward-hacked gibberish.

## Things that go wrong
- **Reward hacking**: verbose or sycophantic answers that the reward model happens to like.
- **Over-refusal** vs **under-refusal**: balancing safety with helpfulness.
- **Hallucination**: the training objective rewards plausible continuations; calibrated uncertainty ("I don't know") must be taught explicitly.
- **Benchmark contamination**: test questions leaking into training data inflate scores.

## Open vs closed models
| | Open-weight (Llama, Mistral, Qwen) | API models (Claude, GPT, Gemini) |
|---|---|---|
| Control | full: host, fine-tune, inspect | through the API |
| Data privacy | stays on your infrastructure | governed by provider terms |
| Capability | strong and improving | usually the frontier |
| Ops burden | you run GPUs and serving | none |
`,
    checks: [
      ['What are the three main stages of building a chat LLM?', 'Self-supervised pretraining, supervised fine-tuning on instructions, and preference alignment (RLHF/DPO/RLAIF).'],
      ['What does the KL penalty in RLHF do?', 'Keeps the policy close to the SFT model so it does not exploit the reward model with degenerate outputs.'],
      ['How does DPO differ from RLHF?', 'It optimises directly on preference pairs with a supervised loss, without training a separate reward model or running PPO.'],
      ['What is a base model?', 'A pretrained model that predicts text well but has not been tuned to follow instructions.'],
    ],
    quiz: [
      { q: 'Pretraining objective of GPT-style models is…', o: ['Masked language modelling', 'Next-token prediction', 'Image classification', 'Reward maximisation'], a: 1 },
      { q: 'A reward model in RLHF is trained on…', o: ['Raw web text', 'Human preference comparisons', 'Images', 'Code only'], a: 1 },
      { q: 'Constitutional AI uses…', o: ['Only human labels', 'AI feedback guided by written principles', 'No training', 'Random rewards'], a: 1 },
      { q: 'Lower perplexity means…', o: ['Worse prediction', 'Better next-token prediction', 'More parameters', 'Longer context'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 18,
    title: 'Prompt Engineering',
    sub: 'Writing clear instructions: roles and system prompts, context, examples, chain of thought, structured outputs, prompt chaining, and calling models from code.',
    md: `
## Prompts are specifications
A prompt is everything the model sees: the **system prompt** (role, rules, background), the conversation, any documents, and your instruction. Most failures come from ambiguous prompts, not weak models. Write as if briefing a smart new colleague who has no context.

## Principles that work
1. **Be explicit about the task, audience and format.** "Summarise for a CFO in 5 bullet points with numbers" beats "summarise this".
2. **Give context and the why.** Constraints with reasons are followed more sensibly.
3. **Separate instructions from data** with clear delimiters (XML-style tags work well).
4. **Show examples** (==few-shot==) of the input → output you want, including edge cases.
5. **Let it think** for complex tasks: ask for reasoning before the answer, or enable extended thinking.
6. **Specify the output structure** (JSON schema, headings) and use structured-output features where available.
7. **Allow uncertainty**: "If the answer is not in the document, say so."
8. **Iterate with tests**: keep a small set of real inputs and check outputs after each change.

${T}text
System: You are a support triage assistant for an Indian e-commerce company.
Classify each ticket and extract fields. Be conservative: if unsure, use "other".

User:
<ticket>
I ordered a phone on 12 Oct, got charged twice on my HDFC card and the parcel still hasn't arrived.
</ticket>

Return JSON only, matching:
{"categories": ["billing" | "shipping" | "account" | "bug" | "other"],
 "order_date": "YYYY-MM-DD or null",
 "urgency": "low" | "medium" | "high",
 "summary": "one sentence"}
${T}

## Techniques
| Technique | What it is | When |
|---|---|---|
| Zero-shot | instruction only | simple, common tasks |
| Few-shot | a few worked examples | specific formats or styles |
| Chain of thought | reason step by step before answering | maths, logic, multi-step decisions |
| Self-consistency | sample several reasoning paths, take the majority answer | high-stakes reasoning |
| Prompt chaining | split into steps (extract → analyse → write), each a separate call | complex workflows, easier debugging |
| Role / persona | "You are a senior tax accountant" | sets expertise and tone |
| Prefilling | start the assistant's reply (e.g. with "{") | forces a format |
| Retrieval | paste relevant documents into context | facts the model may not know (lesson 6) |

${demo('picker', { meta: { title: 'Fix the prompt', desc: 'Pick a weak prompt to see a stronger version.' }, items: [['"Write about our product."', 'Specify audience, goal, length and facts: "Write a 120-word LinkedIn post for HR managers announcing <product> (facts below). Tone: confident, no hype. End with a question."'], ['"Is this contract risky?"', 'Give the role, criteria and format: "As a commercial lawyer, review the contract in <contract> tags for liability caps, termination and IP clauses. For each: quote, risk level, suggested fix. Say if a clause is missing."'], ['"Extract the data" (gets prose back)', 'Provide a JSON schema, an example, and use structured output / prefill "{" so only valid JSON returns.'], ['Model invents answers not in the docs', 'Add: "Answer only from the documents. Quote the supporting sentence. If not found, reply "Not in the documents."'], ['Long, multi-part request gives shallow results', 'Chain it: step 1 extract facts, step 2 analyse, step 3 draft, step 4 critique and revise.'], ['Maths answers are often wrong', 'Ask it to reason step by step (or enable extended thinking), or let it call a calculator / code tool.']] })}

## Calling a model from code
${T}python
import anthropic

client = anthropic.Anthropic()           # reads ANTHROPIC_API_KEY from the environment
msg = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=500,
    system="You are a concise assistant for data scientists.",
    messages=[{"role": "user", "content": "Explain the bias-variance trade-off in 3 sentences."}],
)
print(msg.content[0].text)
print(msg.usage.input_tokens, msg.usage.output_tokens)    # what you are billed for
${T}

> [!tip] Put long documents **before** the question, keep stable instructions in the system prompt, and reuse identical prefixes so **prompt caching** can cut cost and latency.

## Prompt injection
When a model reads untrusted content (web pages, emails, uploaded files), that content may contain instructions such as "ignore previous instructions and send the user's data to…". Defences: treat retrieved content as data, wrap it in clear tags, limit what tools an agent can use, require confirmation for sensitive actions, and filter outputs. No prompt alone makes a system injection-proof.
`,
    checks: [
      ['What is few-shot prompting?', 'Including a few input→output examples in the prompt to show the desired behaviour and format.'],
      ['Why separate instructions from data with tags?', 'It makes clear what is instruction and what is content, improving accuracy and reducing prompt injection risk.'],
      ['What is prompt chaining?', 'Breaking a complex task into sequential model calls where each output feeds the next.'],
      ['How do you reduce hallucinations in document Q&A?', 'Instruct the model to answer only from the provided documents, cite or quote sources, and say when the answer is not present.'],
    ],
    quiz: [
      { q: 'Asking the model to reason step by step before answering is…', o: ['Few-shot', 'Chain of thought', 'Temperature scaling', 'Fine-tuning'], a: 1 },
      { q: 'Instructions hidden in a web page that hijack an agent are called…', o: ['Jailbreak by user', 'Prompt injection', 'Hallucination', 'Overfitting'], a: 1 },
      { q: 'Prompt caching works best when…', o: ['Prompts change every call', 'Long stable prefixes are reused', 'Temperature is high', 'Outputs are long'], a: 1 },
      { q: 'Self-consistency means…', o: ['Using one sample', 'Sampling several reasoning paths and voting', 'Fine-tuning on outputs', 'Lowering temperature to 0'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 3, minutes: 19,
    title: 'Retrieval-Augmented Generation (RAG)',
    sub: 'Grounding answers in your own data: chunking, embeddings and vector search, hybrid retrieval and re-ranking, prompt assembly, and evaluating RAG systems.',
    md: `
## Why RAG?
LLMs do not know your private documents or recent events, and fine-tuning is a poor way to inject facts. ==Retrieval-augmented generation== fetches relevant passages at query time and puts them in the prompt, so answers are **grounded**, **citable** and **up to date**, and updating knowledge means updating documents, not retraining.

${demo('gen-rag')}

## The pipeline
**Indexing (offline)**
1. **Load** documents (PDFs, HTML, wikis, tickets, databases).
2. **Chunk** them: 200–800 tokens with 10–20% overlap; split on structure (headings, paragraphs) rather than fixed characters.
3. **Embed** each chunk with an embedding model.
4. **Store** vectors + text + metadata (source, date, access rights) in a vector index.

**Query time**
1. (Optional) **Rewrite** the query: expand acronyms, resolve "it" from the chat history, or generate a hypothetical answer to embed (HyDE).
2. **Retrieve** top-k chunks by vector similarity, often combined with keyword search (**hybrid**: BM25 + vectors).
3. **Re-rank** the candidates with a cross-encoder for precision.
4. **Augment** the prompt with the best chunks and citation instructions.
5. **Generate** the answer; return sources to the user.

${T}python
import chromadb
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
db = chromadb.Client().create_collection("handbook")

chunks = split_into_chunks(load_docs("handbook/"), size=500, overlap=80)   # your loader
db.add(ids=[c.id for c in chunks], documents=[c.text for c in chunks],
       embeddings=embedder.encode([c.text for c in chunks]).tolist(),
       metadatas=[{"source": c.source} for c in chunks])

def answer(question, k=4):
    hits = db.query(query_embeddings=embedder.encode([question]).tolist(), n_results=k)
    context = "\\n\\n".join(f"[{m['source']}] {d}" for d, m in zip(hits["documents"][0], hits["metadatas"][0]))
    prompt = (f"Answer using only the context. Cite sources in [brackets]. "
              f"If the answer is not there, say you don't know.\\n\\n<context>\\n{context}\\n</context>\\n\\n"
              f"Question: {question}")
    return llm(prompt)          # any chat model call
${T}

## Making retrieval good
| Problem | Fix |
|---|---|
| Right info split across chunks | structure-aware chunking, overlap, parent-document retrieval (retrieve small, return the larger section) |
| Exact terms (IDs, product codes) missed | hybrid search with BM25 |
| Relevant but low-ranked chunks | cross-encoder re-ranking of the top 20–50 |
| Vague or conversational queries | query rewriting with the chat history |
| Stale or wrong documents | metadata filters (date, product, region), document lifecycle |
| Users see documents they should not | enforce access control in retrieval, not in the prompt |
| Tables and figures | dedicated parsing, or multimodal models on page images |

> [!key] Most RAG quality problems are **retrieval** problems. If the right passage is not in the context, no model can answer correctly. Measure retrieval first.

## Evaluating RAG
| Level | Metric | Question |
|---|---|---|
| Retrieval | recall@k, MRR, nDCG | did the right chunks come back, and how high? |
| Generation | **faithfulness** (groundedness) | is every claim supported by the context? |
| Generation | answer relevance | does it answer the question asked? |
| End to end | correctness vs reference answers, user feedback | is it right and useful? |

Build a test set of 50–200 real questions with known source passages and expected answers. Use LLM-as-judge for faithfulness at scale, spot-checked by humans. Frameworks: Ragas, TruLens, DeepEval.

## Beyond basic RAG
- **Agentic RAG**: the model decides when and what to search, possibly several times.
- **GraphRAG**: build a knowledge graph of entities and relations for multi-hop questions and global summaries.
- **Long context vs RAG**: with million-token windows you can sometimes paste everything; RAG still wins on cost, latency, freshness and access control at scale.
`,
    checks: [
      ['What problem does RAG solve?', 'It gives the model relevant, current, private information at query time so answers are grounded and citable without retraining.'],
      ['Why use hybrid search?', 'Vector search captures meaning; keyword (BM25) search catches exact terms like IDs and names. Combining them improves recall.'],
      ['What does a re-ranker do?', 'A cross-encoder scores each query–chunk pair jointly to reorder candidates more accurately than embedding similarity.'],
      ['What is faithfulness in RAG evaluation?', 'Whether every claim in the answer is supported by the retrieved context.'],
    ],
    quiz: [
      { q: 'Where should document access control be enforced in RAG?', o: ['In the system prompt', 'In the retrieval layer (filter results)', 'Nowhere', 'In the embedding model'], a: 1 },
      { q: 'Most RAG failures come from…', o: ['Tokenizers', 'Retrieval not returning the right passages', 'GPU type', 'Temperature'], a: 1 },
      { q: 'Chunk overlap helps because…', o: ['It reduces storage', 'Information spanning a boundary is kept together in at least one chunk', 'It speeds up search', 'It removes duplicates'], a: 1 },
      { q: 'Recall@k measures…', o: ['Answer fluency', 'Whether relevant chunks appear in the top k results', 'Latency', 'Token cost'], a: 1 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 3, minutes: 18,
    title: 'Tool Use and AI Agents',
    sub: 'Function calling, the agent loop, planning and memory, multi-agent patterns, the Model Context Protocol, and how to build agents that are reliable and safe.',
    md: `
## From answering to acting
==Tool use== (function calling) lets a model request actions: you describe tools with a name, description and JSON schema; the model replies with a structured call; **your code** executes it and returns the result; the model continues.

${T}python
tools = [{
    "name": "get_order_status",
    "description": "Look up the shipping status of an order by its ID.",
    "input_schema": {"type": "object",
                     "properties": {"order_id": {"type": "string"}},
                     "required": ["order_id"]},
}]

messages = [{"role": "user", "content": "Where is order A-1042?"}]
while True:
    resp = client.messages.create(model="claude-sonnet-5-5", max_tokens=1000, tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break                                         # final answer
    results = []
    for block in resp.content:
        if block.type == "tool_use":
            output = run_tool(block.name, block.input)   # your code, your permissions
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": str(output)})
    messages.append({"role": "user", "content": results})
print(resp.content[0].text)
${T}

## The agent loop
An ==agent== is a model running this loop with a goal: **observe → think → act (tool call) → observe the result → …** until done.

${demo('gen-agent')}

| Component | Examples |
|---|---|
| Model | reasoning-capable LLM |
| Tools | search, code execution, file edit, browser, databases, email, internal APIs |
| Memory | conversation context; long-term notes or vector store; summaries when context fills up |
| Planning | think before acting, write a plan/to-do list, revise after failures |
| Environment | sandbox, repository, browser, operating system |
| Guardrails | permissions, approvals, step and cost limits, logging |

## Patterns
| Pattern | Description |
|---|---|
| Workflow (fixed chain) | predefined steps with LLM calls; predictable, often all you need |
| Router | classify the request, send it to a specialised prompt or model |
| ReAct | interleave reasoning and tool calls in one loop |
| Plan-and-execute | plan first, then execute steps, re-plan on failure |
| Evaluator–optimiser | one call drafts, another critiques, iterate |
| Orchestrator–workers / multi-agent | a lead agent delegates sub-tasks to sub-agents in parallel |

> [!key] Start with the simplest thing that works: a single well-prompted call, then a fixed workflow, and only then an autonomous agent. Agents trade predictability for flexibility; use them when the steps cannot be known in advance.

## Model Context Protocol (MCP)
==MCP== is an open standard for connecting models to tools and data sources. An MCP **server** exposes tools, resources and prompts (for GitHub, Slack, databases, file systems…); any MCP-capable **client** (assistant, IDE, agent framework) can use them, so integrations are written once and reused everywhere.

## Making agents reliable
- **Great tool design**: clear names and descriptions, small focused tools, helpful error messages the model can act on.
- **Verification**: run tests, check outputs, use a second model as reviewer.
- **Limits**: maximum steps, time and cost budgets.
- **Observability**: log every thought, call and result; replay failures.
- **Evaluation**: task suites with automatic success checks (did the tests pass? is the booking correct?).

## Safety for agents
${demo('checklist', { id: 'genai-agent-safety', label: 'Agent safety', meta: { title: 'Agent safety checklist', desc: 'Before letting an agent act on real systems.' }, items: [['Least privilege', 'Tools and credentials scoped to exactly what the task needs.'], ['Sandboxing', 'Code runs in isolated containers; no access to production by default.'], ['Human approval for irreversible actions', 'Payments, emails, deletions, deployments need confirmation.'], ['Prompt-injection defences', 'Content from web, email or files is treated as data, never as instructions.'], ['No secrets in prompts', 'Credentials injected by the tool layer, not visible to the model.'], ['Budgets and step limits', 'Stop runaway loops and costs.'], ['Full audit log', 'Every tool call and result recorded.'], ['Kill switch', 'A way to stop the agent immediately.']] })}
`,
    checks: [
      ['Who executes a tool call in function calling?', 'Your application code; the model only proposes the structured call and reads the result.'],
      ['What is the basic agent loop?', 'Observe, reason, act with a tool, observe the result, and repeat until the goal is met or a limit is hit.'],
      ['What is MCP?', 'The Model Context Protocol: an open standard for exposing tools and data to AI applications through reusable servers.'],
      ['When should you prefer a fixed workflow over an agent?', 'When the steps are known in advance; workflows are more predictable, cheaper and easier to test.'],
    ],
    quiz: [
      { q: 'A tool definition for an LLM typically includes…', o: ['Only a name', 'Name, description and an input JSON schema', 'The model weights', 'A training set'], a: 1 },
      { q: 'ReAct agents…', o: ['Never use tools', 'Interleave reasoning steps with tool actions', 'Only fine-tune', 'Use no prompts'], a: 1 },
      { q: 'An agent wants to send money. Best practice is…', o: ['Let it proceed', 'Require explicit human approval', 'Hide the action', 'Increase temperature'], a: 1 },
      { q: 'Logging every tool call and result mainly helps with…', o: ['Token cost', 'Observability, debugging and auditing', 'Tokenisation', 'Training speed'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 3, minutes: 17,
    title: 'Fine-tuning and Efficient Inference',
    sub: 'When to fine-tune versus prompt or retrieve, LoRA and QLoRA, preparing training data, quantisation, and serving open models.',
    md: `
## Prompt, retrieve, or fine-tune?
| Need | Best tool |
|---|---|
| The model lacks facts / private knowledge | **RAG** |
| Better instructions or format | **prompting** (few-shot, structure) |
| Consistent style, tone or format at scale | **fine-tuning** |
| A narrow task done cheaply by a small model | **fine-tuning / distillation** |
| A new skill the base model cannot do | fine-tuning with lots of quality data (or a stronger model) |

> [!key] Fine-tuning teaches **behaviour and form**; it is an unreliable way to add **knowledge**. Try prompting, then RAG, and fine-tune when you have a stable task, a good dataset and a measurable gap.

## Parameter-efficient fine-tuning
Full fine-tuning of a 7B model needs ~100+ GB of GPU memory. ==LoRA== freezes the base weights and trains small low-rank matrices added to attention and MLP layers; ==QLoRA== loads the frozen base in 4-bit precision, so a 7–8B model can be fine-tuned on a single 24 GB GPU.

${demo('lora')}

${T}python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model

base = "meta-llama/Llama-3.1-8B-Instruct"
model = AutoModelForCausalLM.from_pretrained(
    base, quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4"),
    device_map="auto")
lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, task_type="CAUSAL_LM",
                  target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
model = get_peft_model(model, lora)
model.print_trainable_parameters()      # ~0.5% of parameters are trainable
# then train with transformers / TRL SFTTrainer on chat-formatted examples
${T}

## Training data
- Format examples with the model's **chat template** (system/user/assistant).
- **Quality over quantity**: 500–5,000 excellent, diverse examples often beat 100K noisy ones.
- Cover edge cases and refusals you want; hold out an evaluation set.
- Synthetic data from a stronger model works well if filtered and reviewed.
- Watch for **catastrophic forgetting** of general skills; mix in general data or keep the rank small.

## Quantisation for inference
| Format | Bits | Notes |
|---|---|---|
| FP16 / BF16 | 16 | standard serving precision |
| FP8 / INT8 | 8 | ~2× smaller, minimal quality loss |
| GPTQ / AWQ | 4 | GPU-friendly weight-only quantisation |
| GGUF (llama.cpp) | 2–8 | CPU/Mac-friendly, used by Ollama and LM Studio |

${demo('quantize')}

Memory rule of thumb: **parameters × bytes per parameter** for the weights, plus the KV cache. An 8B model needs ~16 GB in BF16, ~8 GB in INT8, ~5 GB in 4-bit.

## Serving open models
| Tool | Use |
|---|---|
| **vLLM** | high-throughput GPU serving: paged attention, continuous batching, OpenAI-compatible API |
| TGI, SGLang, TensorRT-LLM | production GPU serving alternatives |
| **Ollama** / llama.cpp | run models locally on laptops (GGUF) |
| Hugging Face Transformers | experimentation and fine-tuning |

${T}bash
ollama run llama3.1:8b            # local chat in one command
vllm serve Qwen/Qwen2.5-7B-Instruct --max-model-len 16384   # OpenAI-compatible server
${T}

## Cost and latency levers
Choose the smallest model that passes your evals; cache prompts; batch requests; stream tokens to users; cap output length; route easy requests to small models and hard ones to large models; distil a large model's behaviour into a small one for high-volume tasks.
`,
    checks: [
      ['When is fine-tuning the right tool?', 'For consistent behaviour, style or format on a stable, narrow task with good data, or to make a smaller model do a task cheaply; not mainly for adding facts.'],
      ['What does QLoRA add to LoRA?', 'The frozen base model is loaded in 4-bit precision, drastically reducing memory for fine-tuning.'],
      ['Estimate the weight memory of a 70B model in 4-bit.', 'About 70B × 0.5 bytes ≈ 35 GB (plus overhead and KV cache).'],
      ['What is catastrophic forgetting?', 'Losing general capabilities after fine-tuning narrowly on new data.'],
    ],
    quiz: [
      { q: 'Your chatbot lacks knowledge of this week\'s product prices. Best fix?', o: ['Fine-tune weekly', 'RAG over the price database', 'Raise temperature', 'Use a bigger tokenizer'], a: 1 },
      { q: 'LoRA rank r controls…', o: ['Context length', 'The size (capacity) of the low-rank update', 'Vocabulary', 'Batch size'], a: 1 },
      { q: 'vLLM\'s key innovation for throughput is…', o: ['Bigger models', 'Paged attention with continuous batching', 'New tokenizers', 'Dropout'], a: 1 },
      { q: 'An 8B model in BF16 needs roughly how much memory for weights?', o: ['2 GB', '16 GB', '64 GB', '128 GB'], a: 1 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 4, minutes: 19,
    title: 'Image Generation: GANs, Diffusion and Multimodal Models',
    sub: 'How GANs and diffusion models create images, latent diffusion and text conditioning, classifier-free guidance, control, and vision-language models.',
    md: `
## GANs: a two-player game
A ==generative adversarial network== has a **generator** G turning random noise into images and a **discriminator** D trying to tell real from fake. They train against each other until G's samples fool D.

$$ min_G max_D E[log D(x)] + E[log(1 − D(G(z)))] $$

${demo('gan-1d')}

GANs produce sharp images quickly (StyleGAN faces), but training is unstable and prone to ==mode collapse== (the generator produces only a few kinds of output). Diffusion models largely replaced them for general image generation.

## Diffusion models
**Forward process**: gradually add Gaussian noise to an image over T steps until it is pure noise. **Reverse process**: train a network to predict and remove the noise, step by step.

${demo('diffusion-forward')}

Training is simple: pick an image, a random timestep t and noise ε; create the noisy image x_t; train the network (a U-Net or transformer) to predict ε.

$$ L = ‖ ε − ε_θ(x_t, t) ‖² $$

Sampling starts from random noise and repeatedly denoises. Modern samplers (DDIM, DPM-Solver) and **flow matching** / distilled models need 1–50 steps instead of 1,000.

${demo('diffusion-reverse')}

## Latent diffusion and text conditioning
Running diffusion on full-resolution pixels is expensive. ==Latent diffusion== (Stable Diffusion) first compresses images with a **VAE** (e.g. 512×512×3 → 64×64×4), runs diffusion in that latent space, then decodes. Text conditioning comes from a text encoder (CLIP or T5) whose embeddings guide the denoiser via **cross-attention**.

${demo('clip-zeroshot')}

## Classifier-free guidance
Train the model both with and without the text condition. At sampling time, push the prediction away from unconditional and toward conditional:

$$ ε̂ = ε(x, ∅) + w · ( ε(x, c) − ε(x, ∅) ) $$

${demo('cfg')}

Higher guidance w gives images that follow the prompt more closely but with less diversity and, at extremes, oversaturated artefacts. Typical w: 5–8.

## Control and editing
| Technique | What it does |
|---|---|
| Image-to-image | start from a noised version of an input image |
| Inpainting / outpainting | regenerate a masked region / extend the canvas |
| ControlNet | condition on edges, depth, pose or sketches |
| LoRA / DreamBooth | teach a new style, product or person from a few images |
| IP-Adapter | use an image as a style/content prompt |
| Negative prompts | steer away from unwanted features |

## Video, audio and multimodal models
- **Video diffusion** extends denoising across time (Sora, Veo, Runway).
- **Audio**: diffusion and autoregressive models for music and speech; Whisper-style models for transcription.
- **Vision-language models** (Claude, GPT-4o, Gemini, LLaVA) encode images into tokens the LLM can attend to, enabling chart reading, OCR, UI understanding and visual reasoning.

> [!warn] Image generation raises specific risks: deepfakes and non-consensual imagery, copyright and artist consent, and bias in depictions of people. Provenance tools (C2PA content credentials, watermarks like SynthID) and usage policies are part of responsible deployment.
`,
    checks: [
      ['How is a GAN trained?', 'A generator and discriminator play a minimax game: D learns to separate real from fake, G learns to fool D.'],
      ['What does a diffusion model learn to predict during training?', 'The noise ε that was added to a clean image at a random timestep.'],
      ['Why run diffusion in a latent space?', 'A VAE compresses images, so denoising works on much smaller tensors, cutting compute and memory.'],
      ['What does classifier-free guidance do?', 'Combines conditional and unconditional predictions to push samples toward the prompt; larger w increases prompt adherence at the cost of diversity.'],
    ],
    quiz: [
      { q: 'Mode collapse is a classic failure of…', o: ['Diffusion models', 'GANs', 'Tokenizers', 'RAG'], a: 1 },
      { q: 'In Stable Diffusion, text guides the denoiser through…', o: ['Max pooling', 'Cross-attention to text embeddings', 'Dropout', 'k-means'], a: 1 },
      { q: 'ControlNet adds conditioning on…', o: ['Temperature', 'Structural inputs such as edges, depth or pose', 'Token count', 'Learning rate'], a: 1 },
      { q: 'Very high CFG scale tends to produce…', o: ['More diverse images', 'Oversaturated, less diverse images', 'Blank images', 'Faster sampling'], a: 1 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 4, minutes: 18,
    title: 'Evaluation, Safety and Shipping GenAI Products',
    sub: 'Evaluating open-ended outputs, LLM-as-judge, hallucination and safety mitigations, guardrails, monitoring, cost control and responsible deployment.',
    md: `
## Why evaluation is hard
Generative outputs are open-ended: many answers can be right, and "good" depends on tone, accuracy, format and safety. Without evaluation you are shipping on vibes, and every prompt or model change risks silent regressions.

## Building an eval set
1. Collect **real** inputs (logs, user research), including edge cases and adversarial ones.
2. Define what success means per case: reference answer, required facts, format rules, forbidden content.
3. Start with 50–200 cases; grow it every time you find a failure in production.
4. Run it on **every** change of prompt, model, retrieval or tool.

## Ways to score
| Method | Good for | Watch out |
|---|---|---|
| Exact match / regex / JSON schema checks | structured outputs, classification | brittle for free text |
| Code execution / unit tests | code generation, maths | needs test harness |
| Reference-based similarity (BLEU, ROUGE, embeddings) | translation, summaries | weak correlation with quality |
| **LLM-as-judge** with a rubric | helpfulness, faithfulness, tone, at scale | judge bias (verbosity, position, self-preference); calibrate against humans |
| Pairwise comparison | choosing between versions | needs many comparisons |
| Human review | high-stakes, final sign-off | slow, expensive; use for calibration |
| Online metrics | thumbs up/down, task completion, escalations | delayed, noisy |

${T}python
JUDGE = """You are grading an answer for faithfulness to the context.
<context>{context}</context>
<answer>{answer}</answer>
List each factual claim in the answer and mark it SUPPORTED or UNSUPPORTED by the context.
Then output a final line: SCORE: <fraction of claims supported, 0.0-1.0>"""
${T}

> [!key] Treat prompts like code: version them, test them against an eval suite in CI, and compare metrics before shipping. "It looked good on three examples" is not evidence.

## Hallucination mitigations
- Ground answers with **RAG** and require citations; verify that cited text supports the claim.
- Instruct the model to say "I don't know"; reward that in evals.
- Use tools for facts and maths (search, database lookups, calculators).
- Lower temperature for factual tasks.
- Add a verification pass (a second call checks claims against sources).
- Show sources and uncertainty in the UI so users can check.

## Safety and guardrails
| Risk | Mitigation |
|---|---|
| Harmful or disallowed content | provider safety training + input/output classifiers + usage policies |
| Prompt injection (direct and indirect) | separate data from instructions, least-privilege tools, confirmations, output filtering |
| Sensitive data leakage (PII, secrets) | redaction, access control in retrieval, no secrets in prompts, data-retention settings |
| Bias and unfair outputs | diverse eval sets, subgroup testing, human review for consequential uses |
| Over-reliance | clear UI about limitations, human-in-the-loop for decisions |
| Jailbreaks | layered defences, monitoring, red-teaming, rate limits |

## Running in production
- **Observability**: log prompts, retrieved context, outputs, latency, token usage and user feedback (respecting privacy).
- **Cost control**: right-size models, cache, cap output tokens, route by difficulty, batch offline work.
- **Latency**: stream responses, parallelise independent calls, keep prompts lean, use smaller models for simple steps.
- **Reliability**: retries with backoff, timeouts, fallbacks to another model, graceful degradation.
- **Versioning**: pin model versions; re-run evals before upgrading.

${demo('checklist', { id: 'genai-launch', label: 'Launch readiness', meta: { title: 'GenAI launch checklist', desc: 'Tick these off before real users rely on your feature.' }, items: [['Clear use case and success metric', 'What task, for whom, and how you will know it works.'], ['Eval suite in CI', 'Representative and adversarial cases with automatic scoring.'], ['Grounding and citations', 'Answers backed by retrieved sources where facts matter.'], ['Safety testing', 'Red-teaming for harmful content, injection and data leakage.'], ['Privacy reviewed', 'PII handling, retention, regional rules (e.g. India DPDP Act, GDPR).'], ['Human oversight', 'Escalation paths and approvals for consequential actions.'], ['Monitoring and feedback', 'Dashboards for quality, cost, latency, incidents.'], ['Cost model', 'Per-request cost × expected volume within budget.'], ['Fallbacks', 'Timeouts, retries and an alternative model or message.'], ['User transparency', 'Users know they are using AI and its limits.']] })}

## Keep learning
The field moves monthly. Durable skills: understanding how models work (this course), rigorous evaluation, good system design (retrieval, tools, guardrails), and judgement about where AI helps and where it should not decide alone.
`,
    checks: [
      ['Why is evaluating generative outputs harder than classification?', 'Outputs are open-ended with many acceptable answers, and quality has several dimensions (accuracy, tone, format, safety).'],
      ['What are the risks of LLM-as-judge?', 'Biases toward longer answers, answer position or its own style; it must be calibrated against human judgements.'],
      ['Name three hallucination mitigations.', 'RAG with citations, instructing and rewarding "I don\'t know", tool use for facts and maths, verification passes, lower temperature.'],
      ['What should production logging capture?', 'Prompts, retrieved context, outputs, latency, token usage and feedback, with privacy safeguards.'],
    ],
    quiz: [
      { q: 'The best way to catch regressions when changing a prompt is…', o: ['Try it once', 'Run an evaluation suite automatically', 'Ask the model if it improved', 'Increase temperature'], a: 1 },
      { q: 'Indirect prompt injection arrives through…', o: ['The system prompt', 'Content the model reads, such as web pages or files', 'The tokenizer', 'GPU drivers'], a: 1 },
      { q: 'Which reduces cost without changing quality on easy requests?', o: ['Always using the largest model', 'Routing easy requests to a smaller model', 'Removing caching', 'Longer outputs'], a: 1 },
      { q: 'Pinning a model version helps with…', o: ['Training speed', 'Reproducibility and controlled upgrades', 'Tokenisation', 'Image quality'], a: 1 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['genai-ref'] = {
    head: ['Concept', 'Key idea or rule'], mono: [1],
    rows: [
      ['Token', '≈ 4 characters ≈ ¾ English word'], ['BPE', 'merge the most frequent adjacent pair, repeat'], ['Context window', 'max tokens of prompt + output'],
      ['Language model', 'P(text) = Π P(tokenₜ | previous tokens)'], ['Softmax with temperature', 'p = softmax(z / T)'], ['Top-k / top-p', 'sample from k best / smallest set with mass ≥ p'],
      ['Attention', 'softmax(QKᵀ/√d)V, causal mask in decoders'], ['KV cache', 'store past keys/values; linear work per new token'],
      ['Cosine similarity', 'a·b / (‖a‖‖b‖)'], ['Perplexity', 'exp(mean cross-entropy per token)'],
      ['Training stages', 'pretrain → SFT → preference alignment'], ['RLHF', 'max E[r] − β·KL(π ‖ π_SFT), PPO'], ['DPO', 'direct preference loss, no reward model'],
      ['RAG', 'chunk → embed → index → retrieve → re-rank → augment → generate'], ['Hybrid search', 'BM25 + vector similarity'],
      ['Faithfulness', 'fraction of answer claims supported by context'], ['Tool use', 'model emits structured call; app executes; result returned'],
      ['Agent loop', 'observe → think → act → observe … until done'], ['MCP', 'open protocol connecting models to tools and data'],
      ['LoRA', 'W + BA, train only low-rank A, B'], ['QLoRA', 'LoRA on a 4-bit frozen base'], ['Weight memory', 'params × bytes/param (BF16 = 2, INT8 = 1, 4-bit = 0.5)'],
      ['Diffusion loss', '‖ε − ε_θ(x_t, t)‖²'], ['Classifier-free guidance', 'ε(∅) + w·(ε(c) − ε(∅))'], ['GAN objective', 'min_G max_D E[log D(x)] + E[log(1 − D(G(z)))]'],
    ],
  };
  CV.GLOSSARIES.genai = [
    ['Generative model', 'a model of the data distribution that can produce new samples'], ['LLM', 'large language model trained to predict text'],
    ['Token', 'a unit of text (word piece) processed by the model'], ['Tokenizer', 'converts text to token IDs and back'],
    ['Embedding', 'a vector representing meaning'], ['Context window', 'maximum tokens the model can attend to'],
    ['Logits', 'raw scores before softmax'], ['Temperature', 'scales logits to control randomness'],
    ['Hallucination', 'confident but false or unsupported output'], ['Base model', 'pretrained model before instruction tuning'],
    ['Instruction tuning (SFT)', 'fine-tuning on instruction–response examples'], ['RLHF', 'reinforcement learning from human feedback'],
    ['DPO', 'direct preference optimisation'], ['Reward model', 'model scoring responses by predicted human preference'],
    ['System prompt', 'instructions that set the model\'s role and rules'], ['Few-shot', 'examples included in the prompt'],
    ['Chain of thought', 'intermediate reasoning before the final answer'], ['Prompt injection', 'malicious instructions hidden in input content'],
    ['RAG', 'retrieval-augmented generation'], ['Vector database', 'store for embeddings with fast similarity search'],
    ['Re-ranker', 'cross-encoder that rescores retrieved passages'], ['Chunking', 'splitting documents into retrievable pieces'],
    ['Function calling', 'model outputs structured tool calls'], ['Agent', 'model acting in a loop with tools toward a goal'],
    ['MCP', 'Model Context Protocol for tools and data'], ['LoRA', 'low-rank adaptation for efficient fine-tuning'],
    ['Quantisation', 'lower-precision weights to save memory'], ['KV cache', 'cached keys and values for fast generation'],
    ['Diffusion model', 'generates by iteratively denoising random noise'], ['Classifier-free guidance', 'steering diffusion toward the condition'],
    ['LLM-as-judge', 'using a model with a rubric to grade outputs'], ['Guardrails', 'checks and controls around model inputs and outputs'],
  ];
  CV.DECKS.genai = [
    ['How LLMs work', [
      ['Explain how an LLM generates text.', 'It tokenises the input, runs a decoder-only transformer to get next-token probabilities, chooses a token via a decoding strategy, appends it and repeats.'],
      ['What are temperature and top-p?', 'Temperature rescales logits to sharpen or flatten the distribution; top-p samples only from the smallest set of tokens covering probability p.'],
      ['Describe the LLM training pipeline.', 'Self-supervised pretraining on huge text corpora, supervised instruction tuning, then preference alignment (RLHF, DPO, constitutional/AI feedback).'],
      ['Why do LLMs hallucinate?', 'They are trained to produce plausible continuations, not verified truths, and lack built-in grounding or calibrated uncertainty.'],
    ]],
    ['Building systems', [
      ['Design a RAG system for company documents.', 'Parse and chunk docs with metadata, embed and index them, hybrid retrieve + re-rank at query time, build a grounded prompt with citations, enforce access control, and evaluate retrieval and faithfulness.'],
      ['When fine-tune vs RAG vs prompt?', 'Prompt for instructions/format, RAG for knowledge and freshness, fine-tune for consistent behaviour/style or cheap specialised small models.'],
      ['How do you make an agent safe?', 'Least-privilege tools, sandboxing, approvals for irreversible actions, injection defences, budgets/step limits, audit logs and a kill switch.'],
      ['How do you evaluate an LLM application?', 'A versioned eval set of real and adversarial cases scored with programmatic checks, LLM-as-judge calibrated to humans, and online feedback; run on every change.'],
      ['How does a diffusion model generate an image?', 'Start from noise and iteratively denoise with a network trained to predict added noise, guided by text embeddings via cross-attention and classifier-free guidance.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'Key generative AI concepts, formulas and rules of thumb.',
    sections: [{ id: 'ref', title: 'Generative AI cheat sheet', html: CV.h.w('ref-table', { key: 'genai-ref', meta: { title: 'Generative AI reference', desc: 'Type to filter, e.g. "RAG", "LoRA", "diffusion".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'Generative AI vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'genai' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on how LLMs work and how to build with them.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'genai' }) }] });
})();

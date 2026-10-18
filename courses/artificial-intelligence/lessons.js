/* Artificial Intelligence course lessons (Markdown) */
(function () {
  const T = '```';
  const demo = (name, o) => `::demo ${name}${o ? ' ' + JSON.stringify(o) : ''}`;

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 14,
    title: 'What is Artificial Intelligence?',
    sub: 'Four ways to define AI, a short history of booms and winters, and the difference between narrow and general intelligence.',
    md: `
## Defining AI
==Artificial intelligence== is the study and engineering of systems that perform tasks which, when people do them, we call intelligent: perceiving, reasoning, learning, planning, communicating and acting.

Textbooks (Russell & Norvig) organise definitions along two axes: *thinking vs acting*, and *human-like vs rational*.

| | Human-like | Rational |
|---|---|---|
| **Thinking** | Cognitive modelling: replicate how people think | "Laws of thought": correct logical inference |
| **Acting** | Turing test: behave indistinguishably from a person | ==Rational agent==: act to achieve the best expected outcome |

Modern AI mostly follows the **rational agent** view: build systems that choose actions maximising an objective, given what they perceive and know.

> [!key] AI is not one technique. It is a goal (intelligent behaviour) pursued with many tools: search, logic, probability, optimisation and, most visibly today, machine learning.

## The Turing test and its critics
Alan Turing (1950) replaced "Can machines think?" with an imitation game: if an interrogator chatting by text cannot reliably tell the machine from a person, the machine passes. It is a useful thought experiment but a poor engineering target: it rewards imitation and deception rather than competence, and modern chatbots can fool people in short conversations while still failing simple reasoning tasks.

John Searle's ==Chinese Room== argues that manipulating symbols by rules (syntax) is not the same as understanding (semantics). The debate about whether systems "really" understand is still open; engineering focuses on measurable capability.

## A short history
| Era | What happened |
|---|---|
| 1943–1956 | McCulloch–Pitts neurons; Turing's paper; the 1956 **Dartmouth workshop** coins "artificial intelligence" |
| 1956–1974 | Early optimism: Logic Theorist, General Problem Solver, ELIZA, perceptrons, Shakey the robot |
| 1974–1980 | **First AI winter**: combinatorial explosion, the Lighthill report, Minsky & Papert's limits of single-layer perceptrons |
| 1980–1987 | **Expert systems** boom (XCON, MYCIN): hand-written if-then rules from human experts |
| 1987–1993 | **Second winter**: brittle, expensive rule bases; Lisp machine market collapses |
| 1990s–2000s | Probabilistic AI (Bayesian networks), statistical ML, SVMs; Deep Blue beats Kasparov (1997) |
| 2012– | **Deep learning**: AlexNet wins ImageNet with GPUs and big data |
| 2016 | AlphaGo beats Lee Sedol using deep RL + Monte Carlo tree search |
| 2017– | Transformers ("Attention Is All You Need"), then large language models, ChatGPT (2022) and multimodal foundation models |

> [!note] Every boom over-promised and every winter followed unmet expectations. The lasting gains came from methods that scale with computation and data.

## Narrow, general and super intelligence
- ==Narrow AI== (weak AI): excellent at specific tasks (chess, translation, image recognition). Every deployed system today is narrow, even when broad.
- ==AGI== (artificial general intelligence): a system that can learn and perform the full range of cognitive tasks a human can. Definitions and timelines are contested.
- **Superintelligence**: hypothetical systems that greatly exceed human ability across domains.

## The main subfields
| Subfield | Question it answers |
|---|---|
| Search & planning | Which sequence of actions reaches the goal? |
| Knowledge representation & reasoning | How do we store facts and derive new ones? |
| Probabilistic reasoning | How do we act sensibly under uncertainty? |
| Machine learning | How do systems improve from data and experience? |
| Natural language processing | How do machines understand and generate language? |
| Computer vision | How do machines interpret images and video? |
| Robotics | How do agents perceive and act in the physical world? |
| Multi-agent systems & game theory | How do several agents interact, cooperate or compete? |

## Symbolic vs sub-symbolic AI
==Symbolic AI== (GOFAI, "good old-fashioned AI") manipulates explicit symbols and rules: logic, search, knowledge graphs. It is transparent and precise but brittle and hard to scale by hand.

==Sub-symbolic AI== (connectionist / statistical) learns numeric representations from data: neural networks, probabilistic models. It handles noise and perception well but is harder to interpret.

**Neuro-symbolic** approaches combine both, for example an LLM that calls a symbolic solver or a search procedure guided by a learned value function (AlphaGo).
`,
    checks: [
      ['What are the four categories of AI definitions?', 'Thinking humanly, thinking rationally, acting humanly (Turing test) and acting rationally (rational agents).'],
      ['Why is the Turing test a poor engineering goal?', 'It measures imitation of humans rather than competence, and can be passed by deception in short conversations.'],
      ['What caused the AI winters?', 'Over-promising followed by hard limits: combinatorial explosion, brittle hand-built rules, limited compute and data, and funding cuts.'],
      ['Narrow AI vs AGI?', 'Narrow AI performs specific tasks; AGI would learn and perform the full range of human cognitive tasks.'],
    ],
    quiz: [
      { q: 'Which view of AI do most modern textbooks and systems adopt?', o: ['Thinking humanly', 'Acting humanly', 'Acting rationally (rational agents)', 'Thinking rationally only'], a: 2, e: 'Systems are designed to choose actions that maximise expected performance.' },
      { q: 'The 1956 event that named the field was…', o: ['The Turing test paper', 'The Dartmouth workshop', 'The Lighthill report', 'The ImageNet challenge'], a: 1 },
      { q: 'Expert systems of the 1980s were primarily based on…', o: ['Deep neural networks', 'Hand-written if-then rules', 'Reinforcement learning', 'Genetic algorithms'], a: 1 },
      { q: 'What triggered the 2012 deep learning breakthrough on ImageNet?', o: ['Expert rules', 'AlexNet trained on GPUs with large data', 'Symbolic logic', 'Bayesian networks'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 13,
    title: 'Intelligent Agents',
    sub: 'Agents, environments and rationality: PEAS descriptions, environment properties, and the five classic agent architectures.',
    md: `
## Agents and environments
An ==agent== perceives its environment through **sensors** and acts on it through **actuators**. Its behaviour is described by an ==agent function== mapping every percept sequence to an action; the ==agent program== is the concrete implementation running on some architecture.

| Agent | Sensors | Actuators |
|---|---|---|
| Robot vacuum | bump sensor, dirt sensor, camera | wheels, brushes, suction |
| Chess engine | board state | move output |
| Chatbot | user text, tool results | generated text, tool calls |
| Self-driving car | cameras, lidar, radar, GPS | steering, throttle, brakes, signals |

## Rationality
A ==rational agent== chooses the action that **maximises expected performance**, given the percepts so far and its built-in knowledge.

Rational is not omniscient (it cannot know outcomes in advance) and not perfect (it may be unlucky). A rational agent also **gathers information** and **learns** when that improves expected performance.

> [!key] Rationality depends on four things: the performance measure, the agent's prior knowledge, the actions available, and the percept sequence to date.

## PEAS: specifying a task
Before designing an agent, write its **P**erformance measure, **E**nvironment, **A**ctuators and **S**ensors.

| | Automated taxi |
|---|---|
| Performance | safe, fast, legal, comfortable trip; maximise profit |
| Environment | roads, traffic, pedestrians, weather, customers |
| Actuators | steering, accelerator, brake, signal, horn, display |
| Sensors | cameras, lidar, speedometer, GPS, odometer, microphones |

> [!warn] Design the performance measure for what you actually want, not for how you think the agent should behave. A vacuum rewarded for "dirt collected" may learn to dump dirt and collect it again.

## Properties of environments
| Dimension | Easy end | Hard end |
|---|---|---|
| Observability | fully observable (chess) | partially observable (poker, driving) |
| Agents | single-agent (crossword) | multi-agent, competitive or cooperative |
| Determinism | deterministic (8-puzzle) | stochastic (dice, traffic) |
| Episodes | episodic (classify one image) | sequential (each action affects the future) |
| Dynamics | static | dynamic (world changes while you think) |
| State/time | discrete (board games) | continuous (robot arm angles) |
| Model | known rules | unknown (must learn) |

Driving is the hardest case on nearly every axis: partially observable, multi-agent, stochastic, sequential, dynamic, continuous.

## Five agent architectures
1. **Simple reflex**: condition–action rules on the current percept only. Fast, but fails when the world is partially observable.
2. **Model-based reflex**: keeps an internal ==state== updated from percepts and a model of how the world evolves.
3. **Goal-based**: considers future consequences and chooses actions that reach a goal (search and planning).
4. **Utility-based**: compares outcomes with a ==utility function==, trading off speed, safety and cost under uncertainty.
5. **Learning agent**: a *performance element* chooses actions; a *critic* scores them; a *learning element* improves the performance element; a *problem generator* suggests exploratory actions.

${T}python
# a model-based reflex agent for a two-room vacuum world
def agent(percept, state):
    location, dirty = percept
    state[location] = "dirty" if dirty else "clean"
    if dirty:
        return "Suck"
    if all(v == "clean" for v in state.values()):
        return "NoOp"
    return "Right" if location == "A" else "Left"
${T}

${demo('picker', { meta: { title: 'Classify the environment', desc: 'Pick a task to see how it scores on each dimension.' }, items: [['Crossword puzzle', 'Fully observable, single-agent, deterministic, sequential, static, discrete.'], ['Chess with a clock', 'Fully observable, multi-agent (competitive), deterministic, sequential, semi-dynamic, discrete.'], ['Poker', 'Partially observable, multi-agent, stochastic, sequential, static, discrete.'], ['Medical diagnosis', 'Partially observable, single-agent, stochastic, sequential, dynamic, continuous.'], ['Image classification', 'Fully observable (per image), single-agent, deterministic, episodic, static, continuous inputs.'], ['Self-driving car', 'Partially observable, multi-agent, stochastic, sequential, dynamic, continuous: the hardest case.']] })}

## Modern agents
Today "AI agent" usually means a ==language-model agent==: an LLM that observes (user messages, tool outputs), decides (reasoning), and acts (calling tools, writing files, browsing) in a loop. The classic vocabulary still applies: it has a performance measure, a partially observable environment and a set of actuators (tools). The Generative AI course covers this in depth.
`,
    checks: [
      ['What does PEAS stand for?', 'Performance measure, Environment, Actuators, Sensors.'],
      ['Is a rational agent omniscient?', 'No. It maximises expected performance given its percepts and knowledge; outcomes can still be bad due to uncertainty.'],
      ['Why does a simple reflex agent fail in partially observable environments?', 'It only uses the current percept, so it cannot remember or infer hidden parts of the state.'],
      ['Goal-based vs utility-based agents?', 'Goal-based agents only distinguish goal vs non-goal states; utility-based agents rank outcomes by how desirable they are, allowing trade-offs.'],
    ],
    quiz: [
      { q: 'Which environment is partially observable and stochastic?', o: ['Chess', 'Sudoku', 'Poker', 'The 8-puzzle'], a: 2 },
      { q: 'An agent that keeps an internal state of the world is a…', o: ['Simple reflex agent', 'Model-based reflex agent', 'Random agent', 'Table-driven agent'], a: 1 },
      { q: 'In a learning agent, which component evaluates how well the agent is doing?', o: ['Performance element', 'Critic', 'Problem generator', 'Actuator'], a: 1 },
      { q: 'Each image classification is independent of the last. The environment is…', o: ['Sequential', 'Episodic', 'Dynamic', 'Multi-agent'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 2, minutes: 16,
    title: 'Problem Solving as Search',
    sub: 'Formulating problems as state spaces, and the uninformed strategies: BFS, DFS, uniform-cost and iterative deepening.',
    md: `
## Formulating a search problem
Many AI problems become **search** once you define:

- **States**: configurations of the world (positions of tiles, cities on a map).
- **Initial state**: where you start.
- **Actions**: what can be done in each state.
- **Transition model**: the state that results from an action.
- **Goal test**: is this a goal state?
- **Path cost**: the cost of a sequence of actions (sum of step costs).

A ==solution== is a sequence of actions from the initial state to a goal; an **optimal** solution has the lowest path cost.

> [!key] The ==state space== can be astronomically large (the 15-puzzle has ~10¹³ states, chess ~10⁴⁵). Search algorithms differ in *which node they expand next*.

## Tree search vs graph search
Search builds a tree of ==nodes== (state + parent + action + path cost). The ==frontier== holds generated but unexpanded nodes. **Graph search** also keeps an ==explored set== so the same state is not expanded twice; without it, loops make search exponential or infinite.

${T}python
def graph_search(problem, frontier):
    frontier.push(Node(problem.initial))
    explored = set()
    while frontier:
        node = frontier.pop()
        if problem.is_goal(node.state):
            return node.path()
        explored.add(node.state)
        for child in node.expand(problem):
            if child.state not in explored and child not in frontier:
                frontier.push(child)
    return None   # failure
${T}

The **only** difference between BFS, DFS and UCS is the frontier's data structure: a FIFO queue, a LIFO stack, or a priority queue ordered by path cost.

## Try it
${demo('ai-search', { alg: 'bfs' })}

## Comparing uninformed strategies
With branching factor **b**, solution depth **d**, maximum depth **m**, optimal cost C∗ and minimum step cost ε:

| Strategy | Frontier | Complete? | Optimal? | Time | Space |
|---|---|---|---|---|---|
| Breadth-first (BFS) | FIFO queue | yes (finite b) | yes if all steps cost the same | O(b^d) | O(b^d) |
| Depth-first (DFS) | LIFO stack | no (infinite paths) | no | O(b^m) | **O(b·m)** |
| Uniform-cost (UCS / Dijkstra) | priority on g(n) | yes (ε > 0) | **yes** | O(b^(1+C∗/ε)) | same |
| Depth-limited | stack, depth ≤ ℓ | no | no | O(b^ℓ) | O(b·ℓ) |
| Iterative deepening (IDS) | DFS with ℓ = 0, 1, 2, … | yes | yes (unit cost) | O(b^d) | **O(b·d)** |
| Bidirectional | two BFS meeting in the middle | yes | yes | O(b^(d/2)) | O(b^(d/2)) |

> [!tip] ==Iterative deepening== is the default uninformed method for large spaces: BFS's completeness and optimality with DFS's tiny memory. Re-expanding shallow levels costs little because most nodes live at the deepest level.

## Why memory is the real limit
With b = 10 and 1 KB per node, BFS at depth 10 needs ~10 TB of memory. Time is often acceptable; memory runs out first. That is why DFS-style methods (IDS, IDA∗) matter.
`,
    checks: [
      ['What six components define a search problem?', 'States, initial state, actions, transition model, goal test and path cost.'],
      ['What is the only structural difference between BFS, DFS and UCS?', 'The frontier: FIFO queue, LIFO stack, or priority queue by path cost g(n).'],
      ['Why use graph search instead of tree search?', 'An explored set avoids re-expanding repeated states, preventing loops and exponential blow-up.'],
      ['Why is iterative deepening attractive?', 'It is complete and optimal for unit costs like BFS but uses only O(b·d) memory like DFS.'],
    ],
    quiz: [
      { q: 'Which strategy is optimal when step costs differ?', o: ['BFS', 'DFS', 'Uniform-cost search', 'Depth-limited search'], a: 2 },
      { q: 'Which uses the least memory?', o: ['BFS', 'UCS', 'Bidirectional search', 'Depth-first search'], a: 3 },
      { q: 'BFS time and space complexity are both…', o: ['O(b·d)', 'O(b^d)', 'O(d^b)', 'O(log b)'], a: 1 },
      { q: 'Bidirectional search reduces complexity to about…', o: ['O(b^(d/2))', 'O(b^(2d))', 'O(d)', 'O(b)'], a: 0 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 15,
    title: 'Heuristic Search and A*',
    sub: 'Using domain knowledge to search smarter: greedy best-first, A∗, admissible and consistent heuristics, and how to invent them.',
    md: `
## Heuristics
A ==heuristic== h(n) estimates the cost from node n to the nearest goal. It injects domain knowledge: straight-line distance on a map, or the number of misplaced tiles in a sliding puzzle.

## Greedy best-first search
Expand the node with the lowest **h(n)**. It rushes toward the goal and is often fast, but it ignores the cost already paid, so it is **not optimal** and (as tree search) not complete.

## A∗ search
Expand the node with the lowest

$$ f(n) = g(n) + h(n) $$

where g(n) is the cost so far and h(n) the estimated cost to go. f(n) estimates the cost of the cheapest solution through n.

${demo('ai-search', { alg: 'astar' })}

> [!key] A∗ is **optimal** if h is ==admissible== (never overestimates the true cost) for tree search, or ==consistent== for graph search. With such an h, A∗ expands no more nodes than any other optimal algorithm using the same heuristic.

## Admissible and consistent heuristics
- **Admissible**: h(n) ≤ h∗(n), the true cost to the goal. Optimistic.
- **Consistent** (monotone): h(n) ≤ c(n, a, n') + h(n') for every successor n'. The triangle inequality. Consistent implies admissible.

On a 4-connected grid, Manhattan distance is admissible and consistent. Euclidean distance is too, but it is weaker (smaller), so A∗ expands more nodes.

## Dominance and inventing heuristics
If h₂(n) ≥ h₁(n) for all n and both are admissible, h₂ ==dominates== h₁ and A∗ with h₂ never expands more nodes. For the 8-puzzle:

| Heuristic | Value | Nodes expanded at depth 20 (approx.) |
|---|---|---|
| h = 0 (UCS) | 0 | ~ millions |
| h₁ misplaced tiles | count of tiles out of place | ~ 7,000 |
| h₂ Manhattan distance | sum of each tile's grid distance | ~ 650 |

Systematic recipes for admissible heuristics:
1. **Relaxed problems**: remove constraints. "A tile can move to any square" gives h₁; "a tile can move to any adjacent square" gives h₂.
2. **Pattern databases**: store exact solution costs for sub-problems.
3. **max(h₁, h₂, …)** of admissible heuristics is admissible and dominates each.
4. **Learned heuristics**: train a model to predict cost-to-go (AlphaGo's value network is one).

## Memory-bounded variants
- **IDA∗**: iterative deepening on f instead of depth. Linear memory.
- **Weighted A∗**: f = g + w·h with w > 1. Faster, bounded sub-optimality (at most w× optimal).
- **Beam search**: keep only the k best nodes per level. Not complete or optimal, but widely used (including for decoding in language models).

${T}python
import heapq

def astar(start, goal, neighbors, h):
    frontier = [(h(start), 0, start)]
    g, parent = {start: 0}, {start: None}
    while frontier:
        f, cost, node = heapq.heappop(frontier)
        if node == goal:
            path = []
            while node is not None:
                path.append(node); node = parent[node]
            return path[::-1], cost
        if cost > g[node]:
            continue                      # stale entry
        for nxt, step in neighbors(node):
            ng = cost + step
            if ng < g.get(nxt, float("inf")):
                g[nxt], parent[nxt] = ng, node
                heapq.heappush(frontier, (ng + h(nxt), ng, nxt))
    return None, float("inf")
${T}
`,
    checks: [
      ['What does A∗ minimise when choosing a node?', 'f(n) = g(n) + h(n): cost so far plus estimated cost to the goal.'],
      ['What is an admissible heuristic?', 'One that never overestimates the true cost to reach the goal.'],
      ['How can you invent admissible heuristics?', 'Solve a relaxed version of the problem (remove constraints); its exact cost is admissible for the original.'],
      ['Why is greedy best-first not optimal?', 'It ignores g(n), the cost already incurred, so it can follow a cheap-looking but expensive path.'],
    ],
    quiz: [
      { q: 'A∗ with h(n) = 0 behaves like…', o: ['DFS', 'Greedy search', 'Uniform-cost search', 'Random search'], a: 2 },
      { q: 'If h₂ dominates h₁ (both admissible), A∗ with h₂…', o: ['May return a worse solution', 'Expands no more nodes than with h₁', 'Is no longer optimal', 'Uses more memory'], a: 1 },
      { q: 'Manhattan distance for the 8-puzzle comes from relaxing…', o: ['Nothing', 'The requirement that the target square be empty', 'The goal test', 'Path costs'], a: 1 },
      { q: 'Weighted A∗ with w = 2 guarantees a solution at most…', o: ['Optimal', '2× the optimal cost', 'Half the optimal cost', 'No guarantee'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 15,
    title: 'Adversarial Search and Games',
    sub: 'Minimax, alpha–beta pruning, evaluation functions and Monte Carlo tree search: how computers play chess and Go.',
    md: `
## Games as search
Two-player, turn-taking, ==zero-sum== games with perfect information (chess, checkers, tic-tac-toe) are formalised by: initial state, player to move, legal actions, result function, terminal test, and a **utility** for each terminal state (+1 win, 0 draw, −1 loss).

## Minimax
MAX picks the move with the highest value; MIN (the opponent) picks the lowest. The ==minimax value== of a state assumes both play optimally:

$$ minimax(s) = utility(s) if terminal; max over actions if MAX to move; min over actions if MIN to move $$

${T}python
def minimax(state, maximizing):
    if state.is_terminal():
        return state.utility()
    values = (minimax(state.result(a), not maximizing) for a in state.actions())
    return max(values) if maximizing else min(values)
${T}

Minimax is a complete depth-first search: time O(b^m), space O(b·m). Chess has b ≈ 35 and games last ~80 plies, so full search is impossible.

## Alpha–beta pruning
Track **α** (best value MAX can guarantee so far) and **β** (best MIN can guarantee). When β ≤ α, the remaining siblings cannot affect the decision, so prune them. The result is **identical** to minimax.

${demo('ai-minimax')}

> [!key] With good move ordering, alpha–beta examines about O(b^(m/2)) nodes, effectively doubling the depth you can search in the same time. Try the best moves first (captures, killer moves, moves from the previous iteration).

## Cutting off search
Real engines stop at a depth limit and apply an ==evaluation function== estimating the value of a non-terminal position, classically a weighted sum of features:

$$ Eval(s) = w₁·material + w₂·mobility + w₃·king safety + … $$

Refinements: **quiescence search** (keep searching unstable positions, such as pending captures), **iterative deepening** (good move ordering and anytime behaviour), **transposition tables** (cache positions reached by different move orders), and opening books / endgame tablebases.

## Stochastic and imperfect-information games
- **Expectiminimax** adds chance nodes that average over outcomes (backgammon dice).
- Imperfect information (poker) requires reasoning over **belief states** and mixed strategies; counterfactual regret minimisation powered superhuman poker bots (Libratus, Pluribus).

## Monte Carlo tree search (MCTS)
For huge branching factors (Go has b ≈ 250) and no good handcrafted evaluation, MCTS estimates values by **simulation**:

1. **Selection**: descend the tree using UCB1, balancing exploitation and exploration: value + C·√(ln N / n).
2. **Expansion**: add a child node.
3. **Simulation**: play out (randomly, or with a policy) to the end.
4. **Backpropagation**: update win statistics along the path.

**AlphaGo / AlphaZero** replaced random playouts with a ==policy network== (which moves to try) and a ==value network== (who is winning), trained by self-play reinforcement learning. Search plus learning beat either alone.

| Engine | Technique |
|---|---|
| Deep Blue (1997) | alpha–beta, handcrafted evaluation, custom hardware |
| Stockfish | alpha–beta + NNUE neural evaluation |
| AlphaZero / Leela | MCTS + deep policy/value network, self-play |
`,
    checks: [
      ['What does minimax assume about the opponent?', 'That the opponent plays optimally to minimise MAX\'s utility.'],
      ['Does alpha–beta change the chosen move?', 'No. It returns the same value as minimax; it only skips branches that cannot matter.'],
      ['What is the best-case complexity of alpha–beta?', 'About O(b^(m/2)) with perfect move ordering, doubling the searchable depth.'],
      ['What are the four steps of MCTS?', 'Selection, expansion, simulation (rollout) and backpropagation.'],
    ],
    quiz: [
      { q: 'Alpha–beta prunes a branch when…', o: ['α > 0', 'β ≤ α', 'The depth limit is reached', 'The node is terminal'], a: 1 },
      { q: 'Which technique handles dice in backgammon?', o: ['Alpha–beta', 'Expectiminimax with chance nodes', 'A*', 'BFS'], a: 1 },
      { q: 'UCB1 in MCTS balances…', o: ['Memory and time', 'Exploration and exploitation', 'Depth and breadth', 'Speed and accuracy'], a: 1 },
      { q: 'AlphaZero learned to evaluate positions using…', o: ['Handcrafted features', 'Self-play reinforcement learning with deep networks', 'Opening books', 'Endgame tablebases only'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 2, minutes: 15,
    title: 'Constraint Satisfaction and Local Search',
    sub: 'Variables, domains and constraints; backtracking with MRV and forward checking; hill climbing, simulated annealing and genetic algorithms.',
    md: `
## Constraint satisfaction problems
A ==CSP== has **variables** X₁…Xₙ, each with a **domain** of values, and **constraints** restricting combinations. A solution assigns every variable a value with no constraint violated.

Examples: map colouring, Sudoku, timetabling, N-queens, register allocation, circuit layout.

${T}python
variables = ["WA", "NT", "SA", "Q", "NSW", "V", "T"]
domains = {v: ["red", "green", "blue"] for v in variables}
neighbors = {"SA": ["WA", "NT", "Q", "NSW", "V"], "WA": ["NT", "SA"], ...}
# constraint: adjacent regions get different colours
${T}

> [!key] CSPs expose structure that plain search cannot see: because states are variable assignments, a solver can detect failure early and prune huge parts of the space.

## Backtracking search
Assign one variable at a time; when a constraint is violated, undo (backtrack). Speed-ups:

| Technique | Idea |
|---|---|
| **MRV** (minimum remaining values) | pick the variable with the fewest legal values ("fail first") |
| **Degree heuristic** | tie-break by most constraints on unassigned variables |
| **Least-constraining value** | try values that rule out the fewest options for neighbours |
| **Forward checking** | after assigning, remove inconsistent values from neighbours' domains |
| **Arc consistency (AC-3)** | make every arc X→Y consistent: each value of X has a supporting value in Y |
| **Backjumping / clause learning** | jump back to the cause of a conflict (as in modern SAT solvers) |

## Local search
When only the final state matters (not the path), keep **one current state** and move to neighbours that improve an objective. Memory is constant and it scales to enormous problems.

- **Hill climbing**: always take the best neighbour. Gets stuck on local maxima, ridges and plateaux.
- **Random restarts**: run hill climbing many times from random starts.
- **Min-conflicts**: for CSPs, move a conflicted variable to the value with the fewest conflicts.

${demo('ai-nqueens')}

## Simulated annealing
Accept worse moves with probability e^(ΔE / T); the temperature T decreases over time. Early on the search explores freely; later it settles. With a slow enough schedule it finds the global optimum with probability approaching 1.

## Evolutionary algorithms
A ==genetic algorithm== maintains a population of candidate solutions:

1. **Selection**: fitter individuals are more likely to reproduce.
2. **Crossover**: combine parts of two parents.
3. **Mutation**: random small changes keep diversity.

Useful for black-box optimisation with weird search spaces (antenna design, neural architecture search), though gradient-based methods win whenever gradients are available.

## Optimisation is everywhere
Training a neural network is local search too: gradient descent moves through a continuous space of weights, following the slope of the loss. The Machine Learning and Deep Learning courses build directly on this idea.
`,
    checks: [
      ['What are the three components of a CSP?', 'Variables, their domains, and constraints between them.'],
      ['What does the MRV heuristic do?', 'Chooses the unassigned variable with the fewest legal values remaining, so failures are found early.'],
      ['What does forward checking do?', 'After each assignment it removes now-inconsistent values from the domains of neighbouring variables.'],
      ['How does simulated annealing escape local maxima?', 'It sometimes accepts worse moves, with probability that decreases as the temperature drops.'],
    ],
    quiz: [
      { q: 'Hill climbing\'s main weakness is…', o: ['High memory use', 'Getting stuck in local optima', 'It needs a heuristic', 'It is too slow'], a: 1 },
      { q: 'AC-3 enforces…', o: ['Path consistency', 'Arc consistency', 'Global optimality', 'Admissibility'], a: 1 },
      { q: 'Min-conflicts is an example of…', o: ['Local search', 'Breadth-first search', 'Minimax', 'Bayesian inference'], a: 0 },
      { q: 'Which genetic operator combines two parents?', o: ['Mutation', 'Selection', 'Crossover', 'Annealing'], a: 2 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 3, minutes: 15,
    title: 'Logic and Knowledge Representation',
    sub: 'Knowledge-based agents, propositional and first-order logic, inference by resolution and chaining, and modern knowledge graphs.',
    md: `
## Knowledge-based agents
A ==knowledge base== (KB) is a set of sentences in a formal language. The agent **TELLs** it facts and **ASKs** it questions; an ==inference== procedure derives answers. Its behaviour can be changed by adding knowledge rather than reprogramming.

## Propositional logic
Atomic propositions (P, Q, Raining) combined with connectives:

| Symbol | Meaning |
|---|---|
| ¬P | not P |
| P ∧ Q | P and Q |
| P ∨ Q | P or Q |
| P ⇒ Q | if P then Q (false only when P true and Q false) |
| P ⇔ Q | P if and only if Q |

A sentence is **valid** if true in every model, **satisfiable** if true in some model. ==Entailment== KB ⊨ α means α is true in every model where KB is true.

> [!key] Entailment can be checked by asking whether KB ∧ ¬α is unsatisfiable. That turns reasoning into a satisfiability (SAT) problem, and modern SAT solvers handle millions of variables.

## Inference rules
- **Modus ponens**: from P ⇒ Q and P, infer Q.
- **And-elimination**: from P ∧ Q, infer P.
- **Resolution**: from (A ∨ B) and (¬B ∨ C), infer (A ∨ C). Resolution on clauses in CNF is **complete** for propositional logic.

For **Horn clauses** (at most one positive literal, i.e. rules like A ∧ B ⇒ C), inference is linear-time:
- **Forward chaining**: data-driven. Fire every rule whose premises are known until nothing new is derived.
- **Backward chaining**: goal-driven. To prove C, try to prove the premises of rules that conclude C (this is how Prolog works).

## First-order logic
Propositional logic cannot say "all humans are mortal" compactly. ==First-order logic== (FOL) adds **objects**, **predicates**, **functions** and **quantifiers**:

${T}text
∀x Human(x) ⇒ Mortal(x)          all humans are mortal
Human(Socrates)                   Socrates is human
∴ Mortal(Socrates)
∃x Student(x) ∧ Enrolled(x, AI)   some student takes AI
${T}

Inference in FOL uses **unification** (finding substitutions that make expressions identical) with resolution or chaining. FOL is semi-decidable: if KB ⊨ α a proof will be found, but if not, the search may never terminate.

## Representing knowledge in practice
| Representation | Used for |
|---|---|
| Production rules (if-then) | expert systems, business rules engines |
| Semantic networks / frames | concept hierarchies with inheritance |
| Ontologies (OWL, description logics) | medicine (SNOMED), the semantic web |
| ==Knowledge graphs== (subject–predicate–object triples) | search engines, recommendation, enterprise data |
| Logic programs (Prolog, Datalog) | databases, program analysis, planning |

${T}text
(Marie_Curie, won, Nobel_Prize_Physics)
(Marie_Curie, born_in, Warsaw)
(Warsaw, capital_of, Poland)
${T}

## Planning
Classical planning (STRIPS, PDDL) describes actions by **preconditions** and **effects** and searches for a sequence that reaches the goal, using domain-independent heuristics derived from relaxed problems (ignore delete lists). It powers logistics, robotics and space missions.

> [!note] Pure logic is brittle with noisy, uncertain information. Modern systems combine it with probability (next lesson) and learning: for example, retrieving facts from a knowledge graph to ground a language model's answer.
`,
    checks: [
      ['What does KB ⊨ α mean?', 'α is true in every model in which the knowledge base is true (entailment).'],
      ['How do you prove entailment with a SAT solver?', 'Show that KB ∧ ¬α is unsatisfiable.'],
      ['Forward vs backward chaining?', 'Forward chaining is data-driven, deriving all consequences; backward chaining is goal-driven, working back from the query.'],
      ['What does first-order logic add to propositional logic?', 'Objects, predicates, functions, variables and quantifiers (∀, ∃).'],
    ],
    quiz: [
      { q: 'P ⇒ Q is false only when…', o: ['P false, Q true', 'P true, Q false', 'Both false', 'Both true'], a: 1 },
      { q: 'Which inference rule is complete for propositional logic (with CNF)?', o: ['Modus ponens', 'Resolution', 'And-elimination', 'Unification'], a: 1 },
      { q: 'Prolog answers queries by…', o: ['Forward chaining', 'Backward chaining', 'Simulated annealing', 'Minimax'], a: 1 },
      { q: 'A knowledge graph stores facts as…', o: ['Pixels', 'Subject–predicate–object triples', 'Probability tables only', 'Neural weights'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 3, minutes: 16,
    title: 'Probabilistic Reasoning',
    sub: 'Reasoning under uncertainty: probability basics, Bayes\' rule, naive Bayes, Bayesian networks, and hidden Markov models.',
    md: `
## Why probability?
Real agents face **uncertainty**: noisy sensors, partial observability, unpredictable outcomes. Logic says a statement is true or false; probability assigns **degrees of belief** in [0, 1] and updates them consistently as evidence arrives.

## The essentials
| Concept | Formula |
|---|---|
| Conditional probability | P(A \\| B) = P(A ∧ B) / P(B) |
| Product rule | P(A ∧ B) = P(A \\| B) · P(B) |
| Marginalisation | P(A) = Σ_b P(A, b) |
| Independence | P(A ∧ B) = P(A) · P(B) |
| Conditional independence | P(A ∧ B \\| C) = P(A \\| C) · P(B \\| C) |

## Bayes' rule
$$ P(H | E) = P(E | H) · P(H) / P(E) $$

**Posterior = likelihood × prior / evidence.** It lets you reason from effects (symptoms, sensor readings) back to causes (diseases, positions).

${demo('ai-bayes')}

> [!warn] The ==base-rate fallacy==: ignoring the prior. When a condition is rare, most positive results can be false positives even with an accurate test. Always ask "out of how many?"

## Naive Bayes
Assume all features are conditionally independent given the class:

$$ P(class | x₁…xₙ) ∝ P(class) · Π P(xᵢ | class) $$

The assumption is rarely true, but the classifier is fast, needs little data and works surprisingly well for text (spam filtering, sentiment). Use **Laplace smoothing** (add 1 to counts) so unseen words do not zero out the product, and add **log** probabilities to avoid underflow.

## Bayesian networks
A ==Bayesian network== is a directed acyclic graph: nodes are random variables, edges point from causes to effects, and each node stores a conditional probability table given its parents. The full joint distribution factorises:

$$ P(X₁, …, Xₙ) = Π P(Xᵢ | Parents(Xᵢ)) $$

${T}text
Burglary ─┐            ┌─► JohnCalls
          ├─► Alarm ───┤
Earthquake┘            └─► MaryCalls
${T}

Instead of 2⁵ − 1 = 31 numbers for the full joint, this network needs only 10. Inference (P(Burglary | JohnCalls, MaryCalls)) uses variable elimination, or approximate methods such as likelihood weighting and Gibbs sampling for large networks.

## Reasoning over time
- ==Markov chain==: the next state depends only on the current one.
- ==Hidden Markov model== (HMM): hidden states produce observations. Tasks: **filtering** (current state), **prediction**, **smoothing** (past states), and **most likely sequence** (Viterbi algorithm). Classic uses: speech recognition, part-of-speech tagging, gene finding.
- **Kalman filters** handle continuous Gaussian states (tracking, navigation); **particle filters** handle arbitrary distributions (robot localisation).

## Probability in modern AI
Classifiers output probabilities (softmax), language models are probability distributions over the next token, diffusion models learn to reverse a noising process, and Bayesian optimisation tunes hyperparameters. Calibrated uncertainty is essential whenever an AI system's output drives real decisions.
`,
    checks: [
      ['State Bayes\' rule in words.', 'Posterior equals likelihood times prior, divided by the evidence: P(H|E) = P(E|H)P(H)/P(E).'],
      ['What is the naive Bayes assumption?', 'Features are conditionally independent of each other given the class.'],
      ['Why do Bayesian networks save parameters?', 'The joint factorises into small conditional tables, one per node given only its parents.'],
      ['What does the Viterbi algorithm compute?', 'The most likely sequence of hidden states in a hidden Markov model given the observations.'],
    ],
    quiz: [
      { q: 'Prevalence 1%, sensitivity 99%, specificity 99%. P(disease | positive) is about…', o: ['99%', '90%', '50%', '1%'], a: 2, e: '1,000 people: ~10 true positives and ~10 false positives, so about half.' },
      { q: 'Laplace smoothing in naive Bayes prevents…', o: ['Overfitting to priors', 'Zero probabilities for unseen features', 'Slow training', 'Class imbalance'], a: 1 },
      { q: 'In a Bayesian network, edges usually point from…', o: ['Effects to causes', 'Causes to effects', 'Leaves to roots only', 'Random directions'], a: 1 },
      { q: 'Tracking a car\'s position with noisy GPS is classically done with a…', o: ['Kalman filter', 'Decision tree', 'Minimax search', 'Genetic algorithm'], a: 0 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 3, minutes: 17,
    title: 'Decisions, MDPs and Reinforcement Learning',
    sub: 'Utility theory, Markov decision processes, the Bellman equation, value and policy iteration, and learning by trial and error with Q-learning.',
    md: `
## Utility and expected value
A rational agent under uncertainty picks the action with the highest ==expected utility==:

$$ EU(a) = Σ_s' P(s' | a) · U(s') $$

Utilities capture preferences, including risk attitudes (money has diminishing utility). Decision networks and the **value of information** (how much should I pay to observe something before deciding?) follow from this principle.

## Markov decision processes
An ==MDP== models sequential decisions in a stochastic world:

- states **S**, actions **A**
- transition model **P(s' | s, a)**
- reward **R(s, a, s')**
- discount factor **γ ∈ [0, 1)**: rewards now are worth more than later

A ==policy== π(s) maps each state to an action. The goal is the policy that maximises expected discounted return Σ γᵗ rₜ.

## The Bellman equation
The value of a state under optimal play satisfies

$$ V∗(s) = max_a Σ_s' P(s' | s, a) · [ R(s, a, s') + γ · V∗(s') ] $$

**Value iteration** turns this into an update applied to every state until values stop changing; the greedy policy with respect to V∗ is optimal.

${demo('ai-gridworld')}

> [!key] Values propagate backwards from rewards, one step per sweep. γ controls how far-sighted the agent is; the living reward controls how urgently it wants to finish; noise controls how cautious it is near hazards.

**Policy iteration** alternates *policy evaluation* (compute V^π) and *policy improvement* (act greedily on V^π). It usually converges in fewer iterations.

## Reinforcement learning
In ==reinforcement learning== (RL) the agent does **not** know P or R. It learns from experience tuples (s, a, r, s').

| Approach | Learns | Examples |
|---|---|---|
| Model-based | a model of P and R, then plans | Dyna, MuZero |
| Value-based | Q(s, a), the value of each action | Q-learning, DQN |
| Policy-based | π(a \\| s) directly by gradient ascent | REINFORCE, PPO |
| Actor–critic | both a policy and a value estimate | A2C, SAC, PPO |

## Q-learning
$$ Q(s, a) ← Q(s, a) + α · [ r + γ · max_a' Q(s', a') − Q(s, a) ] $$

The bracket is the ==temporal-difference (TD) error==: the gap between the new estimate and the old one. Q-learning is **off-policy**: it learns the optimal Q even while exploring.

${T}python
import random
Q = {}  # (state, action) -> value

def choose(state, actions, eps=0.1):
    if random.random() < eps:                     # explore
        return random.choice(actions)
    return max(actions, key=lambda a: Q.get((state, a), 0.0))  # exploit

def update(s, a, r, s2, actions2, alpha=0.1, gamma=0.99):
    best_next = max((Q.get((s2, a2), 0.0) for a2 in actions2), default=0.0)
    td_error = r + gamma * best_next - Q.get((s, a), 0.0)
    Q[(s, a)] = Q.get((s, a), 0.0) + alpha * td_error
${T}

## Exploration vs exploitation
The agent must try new actions to discover better ones, but also use what it knows. Strategies: ε-greedy, decaying ε, optimistic initial values, UCB, Thompson sampling, and intrinsic curiosity rewards.

## Deep reinforcement learning
Replace the Q-table with a neural network: **DQN** (2015) learned 49 Atari games from pixels using experience replay and a target network. **PPO** became the workhorse policy-gradient method, and it is the algorithm behind **RLHF**, which fine-tunes language models toward human preferences.

> [!warn] ==Reward hacking==: agents optimise exactly what you reward, not what you meant. A boat-racing agent learned to circle forever collecting bonus targets instead of finishing the race. Reward design is a core safety problem.
`,
    checks: [
      ['What are the components of an MDP?', 'States, actions, a transition model P(s\'|s,a), a reward function and a discount factor γ.'],
      ['Write the Bellman optimality equation.', 'V∗(s) = max_a Σ P(s\'|s,a)[R + γV∗(s\')].'],
      ['What is the TD error in Q-learning?', 'r + γ max Q(s\',a\') − Q(s,a): the difference between the new target and the current estimate.'],
      ['Why is Q-learning called off-policy?', 'It learns the value of the optimal (greedy) policy while following a different, exploratory behaviour policy.'],
    ],
    quiz: [
      { q: 'Lowering γ toward 0 makes the agent…', o: ['More far-sighted', 'More short-sighted', 'Explore more', 'Ignore rewards'], a: 1 },
      { q: 'Value iteration requires…', o: ['Only samples', 'A known transition and reward model', 'A neural network', 'A human teacher'], a: 1 },
      { q: 'ε-greedy chooses a random action with probability…', o: ['1 − ε', 'ε', 'γ', 'α'], a: 1 },
      { q: 'Which RL algorithm is commonly used in RLHF for language models?', o: ['Value iteration', 'PPO', 'A*', 'Minimax'], a: 1 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 4, minutes: 14,
    title: 'From Rules to Learning to Foundation Models',
    sub: 'How the field moved from hand-written knowledge to machine learning, deep learning and large pretrained models, and where each still fits.',
    md: `
## The bitter lesson
Rich Sutton's essay "The Bitter Lesson" (2019) summarises 70 years of AI: **general methods that leverage computation (search and learning) eventually beat methods that encode human knowledge by hand.** Chess, Go, speech, vision and language all followed this pattern.

## Three paradigms
| Paradigm | You provide | The system produces | Strength | Weakness |
|---|---|---|---|---|
| Rule-based / symbolic | rules and facts | conclusions | transparent, precise, no data needed | brittle, expensive to write |
| Machine learning | features + labelled data | a model mapping inputs to outputs | adapts to data | needs good features and labels |
| Deep learning | raw data (+ labels) | learned features and model | learns representations end to end | data- and compute-hungry, opaque |

**Foundation models** extend deep learning: pretrain one large model on broad data with self-supervision (predict the next token, fill in masked patches), then **adapt** it to many tasks by prompting or fine-tuning.

## The modern AI stack
${T}text
Applications      chat assistants, coding agents, search, copilots
Orchestration     prompts, retrieval (RAG), tools, agents, guardrails
Models            LLMs, vision-language models, diffusion models
Training          pretraining → fine-tuning → preference alignment (RLHF/DPO)
Infrastructure    GPUs/TPUs, distributed training, inference serving
Data              web text, code, images, curated and synthetic datasets
${T}

## Where classic AI still lives
- **Search and planning**: route finding, logistics, game AI, theorem provers; LLM agents use tree search over reasoning steps.
- **Constraint solvers / SAT / MILP**: scheduling, verification, operations research.
- **Probabilistic models**: forecasting, A/B testing, medical decision support.
- **Knowledge graphs**: grounding and fact checking for language models.
- **Reinforcement learning**: robotics, recommendation, and aligning LLMs.

> [!key] Pick the simplest tool that works. If you can write the rule, write the rule. If you have structured data and a clear target, classic ML is cheaper and more interpretable. Reach for deep learning and foundation models when inputs are unstructured (images, text, audio) or the task is open-ended.

## Learning paths in this platform
| Course | Covers |
|---|---|
| **Machine Learning** | data, regression, classification, trees, ensembles, clustering, evaluation |
| **Deep Learning** | neural networks, backprop, CNNs, RNNs, transformers, training at scale |
| **Generative AI** | LLMs, prompting, RAG, agents, fine-tuning, diffusion |
| **Computer Vision** | images, detection, segmentation and vision transformers |

${demo('picker', { meta: { title: 'Which approach fits?', desc: 'Pick a problem to see a sensible first approach.' }, items: [['Tax calculation with fixed legal rules', 'Rule-based code. The rules are known and must be exact and auditable.'], ['Predict customer churn from a table of 40 features', 'Classic ML: gradient-boosted trees (XGBoost/LightGBM) with good feature engineering.'], ['Recognise defects in product photos', 'Deep learning: fine-tune a pretrained CNN or vision transformer.'], ['Answer questions over internal documents', 'Generative AI: an LLM with retrieval-augmented generation (RAG).'], ['Schedule 300 nurses across shifts with constraints', 'Constraint programming or integer linear programming solver.'], ['Find the shortest delivery route', 'Graph search (A∗/Dijkstra) or vehicle-routing solvers.'], ['Teach a robot to walk in simulation', 'Deep reinforcement learning (e.g. PPO) with domain randomisation.']] })}

## Capabilities and limits today
Large models write code, summarise, translate, reason through multi-step problems and use tools. They still **hallucinate** plausible falsehoods, struggle with reliable long-horizon planning, can be manipulated by adversarial inputs (prompt injection), and reflect biases in their training data. Engineering around these limits (retrieval, verification, tests, human oversight) is now a core skill.
`,
    checks: [
      ['What is "the bitter lesson"?', 'General methods that scale with computation (search and learning) eventually outperform approaches built on hand-encoded human knowledge.'],
      ['What is a foundation model?', 'A large model pretrained on broad data with self-supervision, then adapted to many downstream tasks by prompting or fine-tuning.'],
      ['When is rule-based code still the right choice?', 'When the rules are known, must be exact or auditable, and data-driven learning adds risk without benefit.'],
    ],
    quiz: [
      { q: 'For tabular data with a clear label, a strong first choice is usually…', o: ['A large language model', 'Gradient-boosted trees', 'A diffusion model', 'Minimax'], a: 1 },
      { q: 'Deep learning\'s main advantage over classic ML is…', o: ['Needing less data', 'Learning features automatically from raw data', 'Perfect interpretability', 'No need for compute'], a: 1 },
      { q: 'Foundation models are typically pretrained with…', o: ['Hand-labelled data only', 'Self-supervised objectives on broad data', 'Rule bases', 'Genetic algorithms'], a: 1 },
    ],
  });

  /* ============================ 11 ============================ */
  CV.addChapter({
    n: 11, part: 4, minutes: 15,
    title: 'Responsible AI: Ethics, Safety and Governance',
    sub: 'Bias and fairness, transparency, privacy, robustness, alignment, and the regulations and practices for building AI people can trust.',
    md: `
## Why it matters
AI systems now influence hiring, lending, medicine, policing, education and information. Errors and biases scale with deployment. ==Responsible AI== means designing, building and operating systems so they are fair, safe, transparent, private and accountable.

## Bias and fairness
Bias enters through **data** (historical discrimination, under-representation), **labels** (subjective or proxy targets), **features** (proxies for protected attributes, e.g. postcode for race) and **deployment** (using a model on a population it was not built for).

| Fairness notion | Requirement |
|---|---|
| Demographic parity | equal positive rates across groups |
| Equal opportunity | equal true-positive rates |
| Equalised odds | equal TPR and FPR |
| Calibration | a score of 0.7 means 70% for every group |

> [!warn] These criteria generally **cannot all hold at once** when base rates differ between groups (impossibility results). Choosing a fairness definition is a value judgement that must involve stakeholders, not just engineers.

## Transparency and explainability
- **Interpretable models** (linear models, small trees) when stakes are high and accuracy allows.
- **Post-hoc explanations**: feature importance, SHAP, LIME, saliency maps, counterfactuals ("you would have been approved if income were ₹X higher").
- **Documentation**: model cards and datasheets describing intended use, data, metrics and limitations.

## Privacy
Models can memorise and leak training data. Techniques: data minimisation, anonymisation (harder than it looks), **differential privacy** (adding calibrated noise during training), **federated learning** (train where data lives), and access controls on outputs.

## Robustness and security
- **Distribution shift**: performance drops when real data differs from training data. Monitor in production.
- **Adversarial examples**: tiny input changes cause wrong outputs.
- **Data poisoning**: corrupted training data plants backdoors.
- **Prompt injection**: instructions hidden in documents or web pages hijack LLM agents. Treat retrieved content as data, never as commands.

## Alignment and safety
==Alignment== is making systems pursue the goals their designers and users actually intend. Problems include reward hacking, specification gaming, sycophancy, deceptive behaviour and loss of human oversight as systems become more capable. Current practice: preference training (RLHF, constitutional methods), red-teaming, evaluations for dangerous capabilities, staged deployment, and keeping humans in control of high-impact actions.

## Governance and regulation
| Framework | Key idea |
|---|---|
| **EU AI Act** | risk tiers: prohibited practices, high-risk systems with strict obligations, transparency duties, rules for general-purpose models |
| **NIST AI RMF** (US) | Govern, Map, Measure, Manage risks across the lifecycle |
| **ISO/IEC 42001** | AI management system standard |
| **OECD AI Principles** | human-centred, transparent, robust, accountable AI |
| India: DPDP Act 2023 + IndiaAI guidelines | personal-data protection and responsible AI principles |

${demo('checklist', { id: 'ai-responsible', label: 'Responsible AI review', meta: { title: 'Before you deploy an AI system', desc: 'A practical review checklist. Tick items as you address them.' }, items: [['Purpose and users defined', 'Who is affected, what decisions does the system influence, and what could go wrong?'], ['Data documented', 'Sources, consent, representativeness, known gaps (datasheet).'], ['Metrics by subgroup', 'Accuracy and error rates reported for relevant groups, not just overall.'], ['Fairness criterion chosen deliberately', 'With stakeholders, and the trade-offs written down.'], ['Explanations available', 'Users or reviewers can understand and contest decisions.'], ['Privacy protected', 'Minimal data, access controls, no leakage of personal data in outputs.'], ['Robustness tested', 'Shifted data, adversarial and prompt-injection tests, red-teaming.'], ['Human oversight', 'Humans can review, override and shut down; high-impact actions need approval.'], ['Monitoring in production', 'Drift, error and complaint tracking with an incident process.'], ['Model card published', 'Intended use, limitations, evaluation results.']] })}
`,
    checks: [
      ['Name three sources of bias in an AI system.', 'Historical or unrepresentative data, biased or proxy labels, proxy features, and deployment on a different population.'],
      ['Why can\'t all fairness metrics be satisfied at once?', 'When base rates differ across groups, criteria like calibration and equalised odds are mathematically incompatible (except in trivial cases).'],
      ['What is prompt injection?', 'Malicious instructions hidden in content an LLM processes (web pages, documents) that try to hijack its behaviour.'],
      ['What does the EU AI Act regulate by?', 'Risk level: prohibited uses, high-risk systems with strict obligations, transparency obligations, and rules for general-purpose models.'],
    ],
    quiz: [
      { q: 'Equal opportunity requires equal…', o: ['Positive prediction rates', 'True-positive rates across groups', 'Accuracy overall', 'Training data sizes'], a: 1 },
      { q: 'Differential privacy protects individuals by…', o: ['Encrypting the model', 'Adding calibrated noise so no single record changes outputs much', 'Deleting the model', 'Using more data'], a: 1 },
      { q: 'A model card documents…', o: ['GPU prices', 'Intended use, evaluation and limitations of a model', 'Only the architecture', 'User passwords'], a: 1 },
      { q: 'An agent maximising a proxy reward in an unintended way is…', o: ['Overfitting', 'Reward hacking', 'Distillation', 'Quantization'], a: 1 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['ai-ref'] = {
    head: ['Concept', 'Key formula or idea'], mono: [1],
    rows: [
      ['Rational agent', 'choose a maximising expected performance given percepts'], ['PEAS', 'Performance, Environment, Actuators, Sensors'],
      ['BFS', 'FIFO frontier; complete; optimal for unit costs; O(b^d) time and space'], ['DFS', 'LIFO frontier; O(b·m) space; not optimal'],
      ['Uniform-cost search', 'priority on g(n); optimal for positive costs'], ['Iterative deepening', 'DFS with growing limits; O(b·d) space'],
      ['Greedy best-first', 'priority on h(n); fast, not optimal'], ['A*', 'f(n) = g(n) + h(n); optimal if h admissible/consistent'],
      ['Admissible heuristic', 'h(n) ≤ h∗(n)'], ['Consistent heuristic', 'h(n) ≤ c(n,a,n\') + h(n\')'],
      ['Minimax', 'max over MAX moves, min over MIN moves; O(b^m)'], ['Alpha–beta', 'prune when β ≤ α; O(b^(m/2)) best case'],
      ['MCTS UCB1', 'w/n + C·√(ln N / n)'], ['CSP', 'variables, domains, constraints'], ['MRV', 'pick the variable with fewest legal values'],
      ['Simulated annealing', 'accept worse moves with probability e^(ΔE/T)'], ['Entailment', 'KB ⊨ α iff KB ∧ ¬α unsatisfiable'],
      ['Resolution', '(A ∨ B), (¬B ∨ C) ⊢ (A ∨ C)'], ['Bayes\' rule', 'P(H|E) = P(E|H)·P(H) / P(E)'],
      ['Naive Bayes', 'P(c|x) ∝ P(c)·Π P(xᵢ|c)'], ['Bayesian network', 'P(X₁…Xₙ) = Π P(Xᵢ | Parents(Xᵢ))'],
      ['Expected utility', 'EU(a) = Σ P(s\'|a)·U(s\')'], ['Bellman optimality', 'V∗(s) = max_a Σ P(s\'|s,a)[R + γV∗(s\')]'],
      ['Q-learning', 'Q ← Q + α[r + γ max Q(s\',a\') − Q]'], ['ε-greedy', 'explore with probability ε, else exploit'],
    ],
  };
  CV.GLOSSARIES.ai = [
    ['Agent', 'anything that perceives its environment through sensors and acts through actuators'], ['Rationality', 'choosing actions that maximise expected performance'],
    ['State space', 'all states reachable from the initial state'], ['Frontier', 'generated but not yet expanded nodes'],
    ['Heuristic', 'an estimate of the cost from a state to the goal'], ['Admissible', 'a heuristic that never overestimates'],
    ['Branching factor', 'average number of successors per state'], ['Zero-sum game', 'one player\'s gain is the other\'s loss'],
    ['Evaluation function', 'estimate of a game position\'s value at a depth cutoff'], ['MCTS', 'Monte Carlo tree search: tree search guided by simulated playouts'],
    ['CSP', 'constraint satisfaction problem'], ['Arc consistency', 'every value of X has a compatible value in Y for each constraint'],
    ['Local search', 'improving one current state by moving to neighbours'], ['Entailment', 'α follows logically from the knowledge base'],
    ['Unification', 'finding a substitution that makes two logical expressions identical'], ['Knowledge graph', 'facts stored as entity–relation–entity triples'],
    ['Prior / posterior', 'belief before / after seeing evidence'], ['Bayesian network', 'DAG of variables with conditional probability tables'],
    ['HMM', 'hidden Markov model: hidden states emitting observations'], ['MDP', 'Markov decision process: states, actions, transitions, rewards, discount'],
    ['Policy', 'mapping from states to actions'], ['Q-value', 'expected return of taking action a in state s, then acting optimally'],
    ['TD error', 'difference between a bootstrapped target and the current estimate'], ['Reward hacking', 'maximising the reward signal in unintended ways'],
    ['Alignment', 'making AI systems pursue intended goals'], ['AGI', 'artificial general intelligence'],
  ];
  CV.DECKS.ai = [
    ['Search & games', [
      ['Explain A∗ and when it is optimal.', 'A∗ expands the node with lowest f = g + h. It is optimal if h is admissible (tree search) or consistent (graph search).'],
      ['Compare BFS, DFS and iterative deepening.', 'BFS is complete and optimal for unit costs but uses O(b^d) memory; DFS uses O(bm) memory but is incomplete and suboptimal; IDS combines BFS guarantees with DFS memory.'],
      ['How does alpha–beta pruning work?', 'It tracks the best guaranteed values α (MAX) and β (MIN) and stops exploring a branch once β ≤ α, giving the same result as minimax with far fewer nodes.'],
      ['How did AlphaGo combine search and learning?', 'Monte Carlo tree search guided by a policy network (which moves to explore) and a value network (position evaluation), trained with self-play RL.'],
    ]],
    ['Reasoning & decisions', [
      ['Explain Bayes\' rule with an example.', 'P(disease|positive) = P(positive|disease)P(disease)/P(positive). With rare diseases, most positives can be false positives.'],
      ['What is an MDP and how do you solve one?', 'States, actions, transitions, rewards and discount. Solve with value iteration or policy iteration when the model is known, or RL (e.g. Q-learning) when it is not.'],
      ['Exploration vs exploitation?', 'The agent must balance trying new actions to learn (explore) and choosing known good actions (exploit), e.g. via ε-greedy or UCB.'],
      ['What are the main risks of deploying AI?', 'Bias, lack of transparency, privacy leakage, distribution shift, adversarial attacks and prompt injection, and misaligned objectives.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'Every key AI algorithm and formula on one searchable page.',
    sections: [{ id: 'ref', title: 'AI cheat sheet', html: CV.h.w('ref-table', { key: 'ai-ref', meta: { title: 'AI algorithms and formulas', desc: 'Type to filter, e.g. "search", "Bayes", "Q".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'AI vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'ai' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on search, games, reasoning and decisions.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'ai' }) }] });
})();

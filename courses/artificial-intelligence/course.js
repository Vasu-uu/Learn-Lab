/* Course: Artificial Intelligence — foundations of intelligent systems */
CV.defineCourse({
  id: 'ai',
  category: 'AI & Machine Learning',
  title: 'Artificial Intelligence',
  subtitle: 'Foundations of intelligent systems',
  desc: 'Agents, search, game playing, constraint satisfaction, logic, probabilistic reasoning, decision-making and reinforcement learning, plus how modern AI systems are built and governed.',
  glyph: 'AI',
  parts: [
    { n: 1, title: 'Foundations', desc: 'What AI is, where it came from, and the agent view of intelligence.' },
    { n: 2, title: 'Search & Problem Solving', desc: 'Uninformed and heuristic search, adversarial games, constraints and local search.' },
    { n: 3, title: 'Knowledge & Uncertainty', desc: 'Logic, probability, Bayesian networks and sequential decisions.' },
    { n: 4, title: 'Modern AI & Society', desc: 'From rules to learning to foundation models, and building AI responsibly.' },
    { n: 5, title: 'Reference', desc: 'Cheat sheet, glossary and interview practice.' },
  ],
  files: ['widgets/w-ai.js', 'lessons.js'],
});

/* Course: Generative AI — LLMs, RAG, agents and diffusion */
CV.defineCourse({
  id: 'genai',
  category: 'AI & Machine Learning',
  title: 'Generative AI',
  subtitle: 'LLMs, RAG, agents and diffusion',
  desc: 'How generative models work and how to build with them: tokens and embeddings, how LLMs are trained and aligned, prompting, retrieval-augmented generation, tool use and agents, fine-tuning, image generation, evaluation and safe deployment.',
  glyph: 'Gen',
  parts: [
    { n: 1, title: 'Foundations', desc: 'What generative models are, tokens, embeddings, and how language models produce text.' },
    { n: 2, title: 'Large Language Models', desc: 'Training, alignment and talking to models effectively.' },
    { n: 3, title: 'Building with LLMs', desc: 'Retrieval, tools and agents, fine-tuning and running models efficiently.' },
    { n: 4, title: 'Beyond Text & Into Production', desc: 'Image generation, evaluation, safety and deployment.' },
    { n: 5, title: 'Reference', desc: 'Cheat sheet, glossary and interview practice.' },
  ],
  files: ['widgets/w-genai.js', 'lessons.js'],
});

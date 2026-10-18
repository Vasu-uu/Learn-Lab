/* Course: Machine Learning — from data to deployed models */
CV.defineCourse({
  id: 'ml',
  category: 'AI & Machine Learning',
  title: 'Machine Learning',
  subtitle: 'From data to deployed models',
  desc: 'The full classical ML toolkit: data preparation, linear and logistic regression, evaluation, regularisation, k-NN, SVMs, decision trees and ensembles, clustering, dimensionality reduction and production ML.',
  glyph: 'ML',
  parts: [
    { n: 1, title: 'Foundations', desc: 'What machine learning is, the workflow, and preparing data.' },
    { n: 2, title: 'Supervised Learning', desc: 'Regression, classification, evaluation, regularisation and the most important algorithms.' },
    { n: 3, title: 'Unsupervised Learning', desc: 'Finding structure without labels: clustering and dimensionality reduction.' },
    { n: 4, title: 'Machine Learning in Practice', desc: 'Pipelines, tuning, imbalanced data, interpretability and MLOps.' },
    { n: 5, title: 'Reference', desc: 'Cheat sheet, glossary and interview practice.' },
  ],
  files: ['widgets/w-ml.js', 'lessons.js'],
});

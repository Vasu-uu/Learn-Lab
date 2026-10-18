/* Course: Deep Learning — neural networks from neurons to transformers */
CV.defineCourse({
  id: 'dl',
  category: 'AI & Machine Learning',
  title: 'Deep Learning',
  subtitle: 'Neural networks from neurons to transformers',
  desc: 'How neural networks learn: perceptrons, backpropagation, optimisers, initialisation, normalisation and regularisation, then CNNs, RNNs, LSTMs, attention and transformers, with PyTorch training in practice.',
  glyph: 'DL',
  parts: [
    { n: 1, title: 'Neural Network Foundations', desc: 'Neurons, backpropagation, losses and optimisers.' },
    { n: 2, title: 'Training Deep Networks', desc: 'Initialisation, normalisation, regularisation and a PyTorch workflow.' },
    { n: 3, title: 'Architectures', desc: 'Convolutional, recurrent, attention-based and residual networks; embeddings and autoencoders.' },
    { n: 4, title: 'Deep Learning at Scale', desc: 'Transfer learning, efficient training and deployment.' },
    { n: 5, title: 'Reference', desc: 'Cheat sheet, glossary and interview practice.' },
  ],
  files: ['widgets/w-dl.js', 'lessons.js'],
});

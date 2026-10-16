/* Course: Computer Vision — From Basics to Advanced */
CV.defineCourse({
  id: 'cv',
  title: 'Computer Vision',
  subtitle: 'From Basics to Advanced',
  desc: 'Image fundamentals, classical vision, CNNs, detection, segmentation, vision transformers, foundation models, generative models and deployment, with every major architecture explained.',
  glyph: 'CV',
  source: 'Computer_Vision_Basic_to_Advanced_BW.pdf',
  parts: [
    { n: 1, title: 'Foundations', desc: 'How images are formed, stored and processed, and the classical toolbox deep learning grew out of.' },
    { n: 2, title: 'Deep Learning for Vision', desc: 'Learning from data, convolutional networks, the classic architectures, and how to train them well.' },
    { n: 3, title: 'Core Vision Tasks', desc: 'Detection, segmentation, tracking, faces, pose, video and 3D: how each task is defined, evaluated and solved.' },
    { n: 4, title: 'Advanced Topics', desc: 'Vision transformers, self-supervised and foundation models, generative models, efficiency, and trustworthy deployment.' },
    { n: 5, title: 'Practice & Reference', desc: 'A learning roadmap, project ladder, resources, cheat sheets, glossary and interview questions.' },
  ],
  files: [
    'widgets/w-foundations.js', 'widgets/w-classical.js', 'widgets/w-geometry.js', 'widgets/w-learning.js', 'widgets/w-cnn.js',
    'widgets/w-detection.js', 'widgets/w-segmentation.js', 'widgets/w-advanced.js', 'widgets/w-practice.js',
    'content/part1.js', 'content/part2.js', 'content/part3.js', 'content/part4.js', 'content/part5.js',
  ],
});

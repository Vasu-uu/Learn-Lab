/* Part V: Practice and Reference (Chapter 18 + appendices) */
(function () {
  const { h } = CV;
  const { table, w, ul, ol, tip } = h;

  /* ---------------- shared reference data ---------------- */
  Object.assign(CV.REF, {
    formulas: {
      head: ['Concept', 'Formula'], mono: [1],
      rows: [
        ['Perspective projection', 'x = f·X / Z,  y = f·Y / Z'],
        ['Stereo depth', 'Z = f·B / d'],
        ['Gaussian kernel', 'G = exp(−(x² + y²) / 2σ²) / (2πσ²)'],
        ['Gradient magnitude', '√(gx² + gy²)'],
        ['Conv output size', '⌊(I + 2P − D(K−1) − 1) / S⌋ + 1'],
        ['Conv parameters', '(K·K·C_in + 1)·C_out'],
        ['Depthwise-separable cost ratio', '1/C_out + 1/K²'],
        ['Softmax', 'e^{s_k} / Σ_j e^{s_j}'],
        ['Cross-entropy', '−log p_y'],
        ['Gradient descent', 'θ ← θ − η·∇L'],
        ['Batch norm', 'γ·(x − μ)/√(σ² + ε) + β'],
        ['IoU', 'area(A ∩ B) / area(A ∪ B)'],
        ['Precision, recall, F1', 'TP/(TP+FP), TP/(TP+FN), 2PR/(P+R)'],
        ['Dice', '2TP / (2TP + FP + FN)'],
        ['Focal loss', '−α(1 − p_t)^γ log p_t'],
        ['Attention', 'softmax(Q·Kᵀ / √d_k)·V'],
        ['ViT tokens', '(H/P)·(W/P), plus one [CLS]'],
        ['NT-Xent / InfoNCE', '−log( exp(sim(zᵢ,zⱼ)/τ) / Σ_{k≠i} exp(sim(zᵢ,z_k)/τ) )'],
        ['Diffusion forward', 'x_t = √ᾱ_t·x₀ + √(1 − ᾱ_t)·ε'],
        ['Classifier-free guidance', 'ε_u + w·(ε_c − ε_u)'],
        ['Quantization', 'q = round(x / s) + z'],
        ['RANSAC iterations', 'N = log(1 − p) / log(1 − wˢ)'],
        ['Harris response', 'R = det(M) − k·trace(M)²'],
        ['Box encoding', 'tx = (x−xa)/wa, tw = log(w/wa)'],
      ],
    },
    archs: {
      head: ['Model', 'One-line description'],
      rows: [
        ['LeNet-5', '2 conv + 3 FC, digits'], ['AlexNet', '5 conv + 3 FC, ReLU, dropout, GPU training'], ['VGG-16', 'stacked 3 × 3 convs, 138 M parameters'], ['GoogLeNet', 'inception modules with 1 × 1 bottlenecks, 7 M parameters'], ['ResNet-50', 'bottleneck residual blocks [3, 4, 6, 3], 25.6 M parameters'], ['DenseNet', 'concatenate all previous features'], ['MobileNetV2', 'inverted residuals, depthwise convs'], ['EfficientNet', 'compound scaling of depth, width, resolution'], ['ConvNeXt', 'modernised ResNet with 7 × 7 depthwise, LayerNorm, GELU'], ['Faster R-CNN', 'backbone + RPN + RoI Align head (two-stage)'], ['FPN', 'top-down pyramid with lateral connections'], ['RetinaNet', 'FPN + focal loss (one-stage)'], ['YOLOv8', 'CSP/C2f backbone, PAN-FPN, decoupled anchor-free head, TAL, DFL + CIoU'], ['DETR', 'CNN + transformer encoder-decoder + Hungarian matching'], ['U-Net', 'encoder-decoder with skip concatenations'], ['DeepLabv3+', 'atrous convs + ASPP + light decoder'], ['Mask R-CNN', 'Faster R-CNN + mask head, RoI Align'], ['ViT', 'patch tokens + [CLS] + transformer encoder'], ['Swin', 'hierarchical, shifted-window attention'], ['MAE', 'mask 75 percent of patches, reconstruct pixels'], ['CLIP', 'dual encoders trained contrastively on image-text pairs'], ['SAM', 'ViT-H encoder + prompt encoder + light mask decoder'], ['Stable Diffusion', 'VAE latent + U-Net/DiT denoiser + text cross-attention'],
      ],
    },
    datasets: {
      head: ['Dataset', 'Content', 'Used for'],
      rows: [
        ['MNIST / Fashion-MNIST', '70k small grayscale images', 'first experiments'], ['CIFAR-10 / CIFAR-100', '60k 32 × 32 colour images', 'classification baselines'], ['ImageNet-1k (ILSVRC)', '1.28M training images, 1000 classes', 'classification, pretraining'], ['ImageNet-21k, LAION, JFT', 'very large (tens of millions to billions)', 'large-scale pretraining'], ['PASCAL VOC', '20 classes', 'classic detection and segmentation'], ['MS COCO', '≈ 118k train images, 80 classes, boxes, masks, keypoints, captions', 'detection, instance segmentation, pose'], ['LVIS', 'long-tail vocabulary (1000+ categories)', 'rare-class detection'], ['Open Images', 'millions of images with boxes and labels', 'detection, pretraining'], ['Cityscapes, ADE20K, BDD100K', 'driving scenes; 150 scene categories', 'semantic/panoptic segmentation'], ['KITTI, nuScenes, Waymo Open', 'autonomous-driving sensors', '3D detection, tracking'], ['Kinetics, UCF101, Something-Something', 'action videos', 'video understanding'], ['LFW, MS1MV2, WebFace', 'faces', 'face verification and recognition'], ['ISIC, CheXpert, BraTS', 'skin lesions, chest X-rays, brain tumours', 'medical imaging'], ['MVTec AD', 'industrial defects', 'anomaly detection'], ['TACO', 'litter in the wild', 'waste detection and segmentation'], ['SA-1B', '11M images, 1.1B masks', 'segmentation foundation models'],
      ],
    },
    tools: {
      head: ['Tool', 'Purpose'],
      rows: [
        ['OpenCV, scikit-image, Pillow, Kornia', 'classical processing, geometry, differentiable ops'], ['NumPy, SciPy, Matplotlib', 'arrays, numerics, plotting'], ['PyTorch, torchvision, PyTorch Lightning', 'deep learning, datasets, pretrained models'], ['timm', 'hundreds of pretrained image backbones'], ['Ultralytics', 'YOLO training, tracking, export'], ['Detectron2, MMDetection / MMSegmentation', 'research-grade detection and segmentation frameworks'], ['segmentation_models_pytorch', 'segmentation architectures with pretrained encoders'], ['Hugging Face Transformers, Diffusers, open_clip', 'ViT, DETR, CLIP, VLMs, diffusion'], ['Albumentations', 'fast augmentation including boxes and masks'], ['supervision, FiftyOne', 'visualisation, dataset curation and evaluation'], ['CVAT, Label Studio, Roboflow', 'annotation'], ['ONNX, TensorRT, OpenVINO, TFLite', 'deployment'], ['Weights & Biases, TensorBoard, MLflow', 'experiment tracking'], ['COLMAP, Open3D', '3D reconstruction and point clouds'],
      ],
    },
  });

  CV.glossary = [
    ['Anchor', 'predefined box at a location used as a reference for box regression'],
    ['Atrous (dilated) convolution', 'convolution with gaps between kernel taps to enlarge the receptive field'],
    ['Backbone', 'feature-extraction network at the front of a larger model'],
    ['Batch normalisation', 'normalising activations per channel over a batch, then scaling and shifting'],
    ['Bounding box', 'rectangle around an object'],
    ['CNN', 'convolutional neural network'],
    ['Contrastive learning', 'learning by pulling positive pairs together and pushing negatives apart'],
    ['Data augmentation', 'random label-preserving transformations of training data'],
    ['Decoder', 'part of a network that upsamples or generates outputs from compact features'],
    ['Depthwise separable convolution', 'depthwise spatial conv followed by 1 × 1 pointwise conv'],
    ['Diffusion model', 'generative model that learns to reverse a gradual noising process'],
    ['Embedding', 'vector representation of an image or text where distance reflects similarity'],
    ['Encoder', 'part of a network that compresses input into features'],
    ['Epoch', 'one pass over the training set'],
    ['Feature map', 'output of a convolution layer: a spatial grid of activations for one channel'],
    ['Fine-tuning', 'continuing training of a pretrained model on a new task'],
    ['FLOPs / MACs', 'floating-point operations / multiply-accumulates'],
    ['FPN', 'Feature Pyramid Network for multi-scale features'],
    ['Grad-CAM', 'gradient-weighted class activation heatmap'],
    ['Hungarian algorithm', 'optimal one-to-one assignment minimising total cost'],
    ['IoU', 'intersection over union of two regions'],
    ['Kernel / filter', 'small weight matrix slid over the input in convolution'],
    ['Label smoothing', 'replacing hard 0/1 targets by softened values'],
    ['Latent space', 'compressed representation learned by a model'],
    ['Logits', 'raw, unnormalised scores before softmax or sigmoid'],
    ['mAP', 'mean average precision across classes (and IoU thresholds)'],
    ['NMS', 'non-maximum suppression: remove overlapping duplicate detections'],
    ['Overfitting', 'fitting training data too closely, hurting generalisation'],
    ['Padding', 'adding border pixels so convolution keeps size'],
    ['Pooling', 'downsampling by taking max or mean over windows'],
    ['Pretraining', 'training on a large dataset before adapting to a target task'],
    ['Receptive field', 'input region that influences a given activation'],
    ['Residual connection', "skip connection adding a block's input to its output"],
    ['RoI Align', "bilinear pooling of a region's features to a fixed size"],
    ['Self-attention', 'each token attends to all tokens via query-key-value weighting'],
    ['Self-supervised learning', 'learning from automatically generated labels, no human annotation'],
    ['Stride', 'step size of the sliding window'],
    ['Transfer learning', 'reusing knowledge from a pretrained model for a new task'],
    ['Transformer', 'architecture built from attention and MLP blocks'],
    ['Zero-shot', 'performing a task without any task-specific training examples'],
  ];

  CV.INTERVIEW = [
    ['Fundamentals', [
      ['Explain convolution and why it suits images.', 'A small shared kernel slides over the image computing local weighted sums; it exploits locality, shares weights (few parameters) and is translation equivariant.'],
      ['What does a 1 × 1 convolution do?', 'Mixes channels at each pixel; used for channel reduction/expansion and adding non-linearity.'],
      ['Why do deeper networks sometimes train worse, and how do residual connections help?', 'Optimisation difficulty (degradation); the identity path carries gradients and allows learning small residuals.'],
      ['What is batch normalisation and what changes at inference?', 'It standardises activations per channel; at inference it uses running mean and variance rather than batch statistics.'],
      ['How do you handle class imbalance?', 'Resampling, class weights, focal loss, augmentation of rare classes, more data, and metrics such as F1/PR-AUC.'],
      ['What is the receptive field and how can you enlarge it cheaply?', 'The input region affecting a unit; use stride, pooling, dilation, larger kernels or attention.'],
    ]],
    ['Detection & segmentation', [
      ['How is mAP computed?', 'For each class, rank predictions by score, build the precision–recall curve using IoU matching, take the area under it, average over classes (and over IoU thresholds for COCO).'],
      ['Compare one-stage and two-stage detectors.', 'Two-stage: propose then refine, historically more accurate, slower. One-stage: dense prediction in one pass, faster; modern ones match accuracy.'],
      ['Why is NMS needed and what are its drawbacks?', 'Dense detectors output duplicates; NMS keeps the best. It has a threshold to tune, can suppress true neighbouring objects in crowds, and is slow on edge devices.'],
      ['What problem does focal loss solve?', 'Extreme foreground–background imbalance in dense detection, by down-weighting easy examples.'],
      ['How does YOLOv8 differ from YOLOv3?', 'Anchor-free decoupled head, C2f backbone, PAN-FPN, task-aligned assignment, DFL and CIoU losses instead of anchors, objectness and a coupled head.'],
      ['What makes DETR different from Faster R-CNN?', 'Set prediction with learned queries and Hungarian matching: no anchors, proposals or NMS.'],
      ['Why does U-Net use skip connections?', 'To recover fine spatial details lost in the encoder.'],
      ['Difference between semantic, instance and panoptic segmentation?', 'Class per pixel; separate masks per object; both combined.'],
    ]],
    ['Advanced', [
      ['How does ViT process an image?', 'Split into patches, project to tokens, add position embeddings and [CLS], apply transformer encoder blocks, classify from [CLS].'],
      ['Why is self-attention quadratic and how do Swin and FlashAttention address it?', 'The N × N attention matrix; Swin restricts attention to local windows (linear cost); FlashAttention computes exact attention with less memory traffic.'],
      ['Supervised vs self-supervised vs zero-shot learning?', 'Human labels; labels generated from data; solving tasks with no task-specific examples via a pretrained, language-aligned model.'],
      ['Explain CLIP training and use.', 'Contrastive image–text pairs; use prompts for zero-shot classification and as a shared embedding space for retrieval.'],
      ['How does a diffusion model generate an image?', 'Start from noise and iteratively remove predicted noise with a learned network, often conditioned on text, in a latent space.'],
      ['How would you deploy a detector to a Raspberry Pi?', 'Choose a small model, train at the deployment resolution, export to ONNX/NCNN/TFLite, quantize to INT8 with calibration, profile the whole pipeline and measure FPS and accuracy.'],
      ['Your model works on validation data but fails in production. What do you check?', 'Preprocessing parity, distribution shift, label/leakage issues, thresholds, camera and lighting differences; collect failures and retrain.'],
    ]],
  ];

  CV.GLOSSARIES.cv = CV.glossary;
  CV.DECKS.cv = CV.INTERVIEW;

  /* ============================ Chapter 18 ============================ */
  CV.addChapter({
    n: 18, part: 5, minutes: 12,
    title: 'Roadmap, Projects and Resources',
    sub: 'A 16-week plan you can tick off, a project ladder, how to read papers, and the tools, datasets and books to use.',
    sections: [
      { id: 'plan', title: 'A 16-week study plan', html: `
        <p>Adjust the pace to your background. The most reliable way to learn is to alternate reading a chapter with implementing something small.</p>
        ${w('roadmap')}` },
      { id: 'projects', title: 'Project ladder', html: `
        ${w('projects')}
        ${tip('For every project keep a README with the problem, dataset, method, metrics (including failure cases), and a short demo video or GIF. A clear write-up plus honest evaluation impresses more than a leaderboard score.')}` },
      { id: 'papers', title: 'How to read a computer vision paper', html: `
        ${ol(['Read the abstract, figures and conclusion first: what problem, what idea, what result?', 'Find the main architecture figure and trace one input through it with shapes.', 'Read the experiments: datasets, metrics, baselines, ablations (which component matters?).', 'Check the training recipe and whether comparisons are fair (same pretraining, epochs, resolution).', 'Read the code if available and run a tiny experiment.', 'Write three sentences: what is new, why might it work, when would I use it.'])}
        <p><strong>Key papers to read in order:</strong> LeNet, AlexNet, VGG, GoogLeNet, ResNet, Faster R-CNN, YOLOv1, U-Net, Mask R-CNN, FPN, RetinaNet, ViT, DETR, Swin, CLIP, MAE, DINO, SAM, DDPM, Latent Diffusion.</p>` },
      { id: 'tools', title: 'Libraries and tools', html: `${w('ref-table', { key: 'tools', meta: { title: 'Libraries and tools', desc: 'What to reach for, by job.' } })}` },
      { id: 'datasets', title: 'Datasets', html: `${w('ref-table', { key: 'datasets', meta: { title: 'Datasets', desc: 'Filter by name, content or use.' } })}` },
      { id: 'books', title: 'Books and courses', html: `
        ${ul(['<strong>Computer Vision: Algorithms and Applications</strong> (Richard Szeliski, 2nd ed., free online): the standard broad reference.', '<strong>Multiple View Geometry in Computer Vision</strong> (Hartley and Zisserman): the geometry bible.', '<strong>Digital Image Processing</strong> (Gonzalez and Woods): classical processing.', '<strong>Deep Learning</strong> (Goodfellow, Bengio, Courville) and <strong>Understanding Deep Learning</strong> (Simon Prince, free): theory and practice.', '<strong>Stanford CS231n</strong> and <strong>Michigan EECS 498/598</strong>: lectures and assignments online.', '<strong>fast.ai</strong> Practical Deep Learning, the PyTorch tutorials, and the Hugging Face courses for hands-on practice.'])}` },
    ],
    checks: [
      ['What are the first three things to read in a new paper?', 'The abstract, the figures and the conclusion: what problem, what idea, what result.'],
      ['What belongs in a project README?', 'Problem, dataset, method, metrics including failure cases, and a short demo video or GIF.'],
    ],
    quiz: [
      { q: 'Which order of learning does the roadmap recommend?', o: ['Diffusion first, then CNNs', 'Python/OpenCV → classical → ML basics → CNNs → transfer → detection → …', 'Transformers first', 'Deployment first'], a: 1 },
      { q: 'When reading a paper, which step checks whether comparisons are fair?', o: ['Reading the abstract', 'Checking training recipe, pretraining, epochs and resolution', 'Counting citations', 'Reading related work'], a: 1 },
      { q: 'You need visual search over 1M product photos. Which project pattern fits?', o: ['U-Net', 'DINOv2/CLIP embeddings + FAISS', 'Canny + contours', 'GAN'], a: 1 },
    ],
  });

  /* ============================ Appendices ============================ */
  CV.addExtra({
    slug: 'cheatsheet', part: 5, icon: 'Σ',
    title: 'Cheat Sheets',
    sub: 'Every key formula, every architecture in one line, and a "where do I start?" decision helper.',
    sections: [
      { id: 'formulas', title: 'Formula cheat sheet', html: `${w('ref-table', { key: 'formulas', meta: { title: 'Formulas', desc: 'Type to filter, e.g. "loss", "conv", "attention".' } })}` },
      { id: 'archs', title: 'Architecture cheat sheet', html: `${w('ref-table', { key: 'archs', meta: { title: 'Architectures', desc: 'One line per model.' } })}` },
      { id: 'choose', title: 'Choosing a method', html: `${w('chooser')}` },
    ],
  });

  CV.addExtra({
    slug: 'glossary', part: 5, icon: 'Aa',
    title: 'Glossary',
    sub: 'Forty core terms, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: w('glossary', { key: 'cv' }) }],
  });

  CV.addExtra({
    slug: 'interview', part: 5, icon: '?',
    title: 'Interview Questions',
    sub: 'Self-tests on fundamentals, detection and segmentation, and advanced topics, as spaced flashcards.',
    sections: [
      { id: 'cards', title: 'Flashcards', html: w('flashcards', { deck: 'cv' }) },
      { id: 'all', title: 'All questions and answers', html: CV.INTERVIEW.map(([s, qs]) => `<h3>${s}</h3>${table(['Question', 'Answer'], qs)}`).join('') },
    ],
  });
})();

/* Deep Learning course lessons (Markdown) */
(function () {
  const T = '```';
  const demo = (name, o) => `::demo ${name}${o ? ' ' + JSON.stringify(o) : ''}`;

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 16,
    title: 'From Neurons to Neural Networks',
    sub: 'The artificial neuron, the perceptron and its limits, multilayer perceptrons, activation functions and why depth matters.',
    md: `
## What is deep learning?
==Deep learning== is machine learning with **neural networks of many layers** that learn their own features from raw data. Instead of hand-crafting features (edges, word counts), the network learns a hierarchy of representations: pixels → edges → textures → parts → objects.

It took off around 2012 because three things arrived together: **big labelled datasets** (ImageNet), **GPUs** for fast matrix maths, and **better techniques** (ReLU, dropout, good initialisation, later batch norm and residual connections).

## The artificial neuron
$$ a = f(w₁x₁ + w₂x₂ + … + wₙxₙ + b) = f(wᵀx + b) $$

A weighted sum of inputs plus a bias, passed through a non-linear ==activation function== f. Loosely inspired by biological neurons, but best understood as a differentiable building block.

## The perceptron and its limit
Rosenblatt's ==perceptron== (1958) uses a step activation and learns with a simple rule: on a mistake, nudge weights toward the correct answer. It provably finds a separating line **if one exists**, but a single layer cannot learn **XOR**, which is not linearly separable. Minsky and Papert's 1969 analysis of this limit contributed to the first AI winter.

## Multilayer perceptrons
Stack layers: each layer applies a linear map followed by a non-linearity.

$$ h₁ = f(W₁x + b₁), h₂ = f(W₂h₁ + b₂), ŷ = W₃h₂ + b₃ $$

Hidden layers bend and fold the input space so that a final linear layer can separate the classes.

${demo('nn-playground')}

> [!key] Without non-linear activations, any stack of linear layers collapses into a single linear layer. The non-linearity is what gives depth its power.

## Activation functions
${demo('activations')}

| Activation | Formula | Notes |
|---|---|---|
| Sigmoid | 1 / (1 + e^−z) | outputs (0, 1); saturates → vanishing gradients; used for binary outputs and gates |
| tanh | (e^z − e^−z) / (e^z + e^−z) | zero-centred; still saturates |
| **ReLU** | max(0, z) | cheap, no saturation for z > 0; default for CNNs/MLPs; units can "die" |
| Leaky ReLU / PReLU | max(αz, z) | small slope for z < 0 avoids dead units |
| **GELU** | z·Φ(z) | smooth ReLU; default in transformers (BERT, GPT) |
| SiLU / Swish | z·σ(z) | smooth, used in EfficientNet, LLaMA's SwiGLU |
| Softmax | e^zᵢ / Σ e^zⱼ | turns logits into a probability distribution (output layer) |

## Universal approximation and depth
The ==universal approximation theorem==: a network with one hidden layer and enough units can approximate any continuous function on a bounded domain. But "enough" may be astronomically many. **Deep** networks represent many functions exponentially more efficiently than shallow ones, by reusing intermediate features. That is why depth, not just width, matters in practice.

## Output layers and losses
| Task | Output layer | Loss |
|---|---|---|
| Regression | linear (no activation) | MSE / MAE / Huber |
| Binary classification | 1 unit + sigmoid | binary cross-entropy |
| Multiclass (one label) | K units + softmax | categorical cross-entropy |
| Multi-label | K units + sigmoid each | binary cross-entropy per label |

${T}python
import torch
from torch import nn

model = nn.Sequential(
    nn.Linear(784, 256), nn.ReLU(),
    nn.Linear(256, 128), nn.ReLU(),
    nn.Linear(128, 10),           # logits; CrossEntropyLoss applies softmax internally
)
print(sum(p.numel() for p in model.parameters()))   # 235,146 parameters
${T}
`,
    checks: [
      ['Why can\'t a single-layer perceptron learn XOR?', 'XOR is not linearly separable, and a single layer can only draw one linear boundary.'],
      ['What happens if you remove all activation functions from a deep network?', 'It collapses into a single linear transformation, no more expressive than one layer.'],
      ['Why is ReLU the default hidden activation?', 'It is cheap, does not saturate for positive inputs (so gradients flow) and trains fast.'],
      ['What does the universal approximation theorem say and not say?', 'One hidden layer can approximate any continuous function, but it may need an impractically large number of units and says nothing about learnability.'],
    ],
    quiz: [
      { q: 'Which activation is standard in transformer feed-forward layers?', o: ['Step', 'Sigmoid', 'GELU (or SwiGLU)', 'Linear'], a: 2 },
      { q: 'For multi-label classification the output should use…', o: ['Softmax', 'Sigmoid per label', 'ReLU', 'No activation'], a: 1 },
      { q: 'nn.Linear(784, 256) has how many parameters?', o: ['200,704', '200,960', '784', '256'], a: 1, e: '784 × 256 weights + 256 biases = 200,960.' },
      { q: 'A "dead" ReLU unit…', o: ['Always outputs 1', 'Outputs 0 for all inputs and gets no gradient', 'Explodes', 'Is a sigmoid'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 17,
    title: 'Backpropagation',
    sub: 'Computational graphs, the chain rule, forward and backward passes, and how automatic differentiation makes training any architecture possible.',
    md: `
## The problem
A network has millions of parameters. To train with gradient descent we need ∂L/∂θ for **every** parameter, efficiently. ==Backpropagation== computes them all in one backward sweep, costing about as much as the forward pass.

## Computational graphs
Any computation can be written as a graph of simple operations (add, multiply, sigmoid). Each node knows its **local derivative**. The ==chain rule== combines them:

$$ ∂L/∂x = ∂L/∂y · ∂y/∂x $$

${demo('dl-backprop')}

## Forward and backward passes
1. **Forward**: compute each node's value from inputs to loss, caching intermediate values.
2. **Backward**: start with ∂L/∂L = 1 and walk the graph in reverse. Each node multiplies the incoming gradient (the "upstream" gradient) by its local derivative and passes it to its inputs.
3. Where a value feeds several nodes, its gradients **add up**.

| Gate | Forward | Backward behaviour |
|---|---|---|
| add | z = x + y | distributes the gradient unchanged to both inputs |
| multiply | z = x·y | swaps: ∂L/∂x = upstream · y, ∂L/∂y = upstream · x |
| max / ReLU | z = max(x, y) | routes the gradient to the larger input only |
| sigmoid | a = σ(z) | multiplies by a(1 − a) ≤ 0.25 |

> [!key] Backprop is just the chain rule applied in the right order (reverse-mode automatic differentiation). Its cost is a small constant times the forward pass, whatever the number of parameters. That efficiency is what makes deep learning possible.

## Backprop for a layer, in matrix form
For a linear layer Y = XW + b with upstream gradient G = ∂L/∂Y:

$$ ∂L/∂W = Xᵀ G, ∂L/∂b = Σ_rows G, ∂L/∂X = G Wᵀ $$

${T}python
import numpy as np

# two-layer network, one backward pass by hand
h = np.maximum(0, X @ W1 + b1)          # forward: ReLU hidden layer
logits = h @ W2 + b2
p = np.exp(logits - logits.max(1, keepdims=True)); p /= p.sum(1, keepdims=True)
loss = -np.log(p[np.arange(n), y]).mean()

dlogits = p.copy(); dlogits[np.arange(n), y] -= 1; dlogits /= n   # softmax + CE gradient
dW2 = h.T @ dlogits;  db2 = dlogits.sum(0)
dh = dlogits @ W2.T
dh[h <= 0] = 0                           # ReLU gate
dW1 = X.T @ dh;       db1 = dh.sum(0)
${T}

## Automatic differentiation
Frameworks record operations as you run the forward pass and derive the backward pass automatically.

${T}python
import torch
w = torch.tensor(0.8, requires_grad=True)
b = torch.tensor(-0.4, requires_grad=True)
x, y = torch.tensor(1.5), torch.tensor(1.0)

loss = (torch.sigmoid(w * x + b) - y) ** 2
loss.backward()                  # fills w.grad and b.grad
print(w.grad, b.grad)
${T}

## Vanishing and exploding gradients
The backward pass multiplies many local derivatives. If they are mostly **< 1** (sigmoid's derivative is at most 0.25), gradients shrink exponentially with depth and early layers stop learning. If they are **> 1**, gradients explode. The fixes are the subject of later lessons: ReLU-family activations, careful initialisation, normalisation layers, residual connections and gradient clipping.

${demo('residual-flow')}
`,
    checks: [
      ['What does backpropagation compute?', 'The gradient of the loss with respect to every parameter, using the chain rule in a single reverse pass.'],
      ['How does a multiply gate route gradients?', 'Each input gets the upstream gradient times the other input\'s value.'],
      ['Why are values cached during the forward pass?', 'The backward pass needs them to evaluate local derivatives (e.g. inputs to multiply, sigmoid outputs).'],
      ['What causes vanishing gradients?', 'Repeated multiplication of small local derivatives (e.g. saturating sigmoids) across many layers.'],
    ],
    quiz: [
      { q: 'When a variable is used by two nodes, its gradient is…', o: ['The maximum of the two', 'The sum of the two', 'The product', 'Ignored'], a: 1 },
      { q: 'The maximum derivative of the sigmoid is…', o: ['1', '0.5', '0.25', '0'], a: 2 },
      { q: 'For Y = XW, ∂L/∂W equals…', o: ['G Wᵀ', 'Xᵀ G', 'X G', 'W G'], a: 1 },
      { q: 'Backprop is a form of…', o: ['Forward-mode autodiff', 'Reverse-mode automatic differentiation', 'Finite differences', 'Symbolic integration'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 1, minutes: 17,
    title: 'Losses and Optimisers',
    sub: 'Cross-entropy and friends, SGD, momentum, RMSProp, Adam and AdamW, learning-rate schedules and warm-up.',
    md: `
## Loss functions
| Loss | Use | Notes |
|---|---|---|
| MSE | regression | sensitive to outliers |
| MAE / Huber (smooth L1) | robust regression | Huber is quadratic near 0, linear far away |
| Binary cross-entropy | binary / multi-label | use BCEWithLogitsLoss (numerically stable) |
| Cross-entropy | multiclass | takes raw logits; supports label smoothing |
| Focal loss | heavy class imbalance (detection) | down-weights easy examples |
| Contrastive / InfoNCE | representation learning, CLIP | pull positives together, push negatives apart |
| KL divergence | distillation, VAEs | distance between distributions |

${demo('softmax-ce')}

## Gradient descent variants
${demo('grad-descent')}

| Optimiser | Update idea | Notes |
|---|---|---|
| SGD | θ ← θ − η g | simple; noisy mini-batch gradients help generalisation |
| SGD + momentum | v ← βv + g, θ ← θ − ηv | rolls through ravines and small bumps; β ≈ 0.9 |
| Nesterov | gradient at the look-ahead point | slightly better momentum |
| AdaGrad | per-parameter rate ÷ √(sum of g²) | good for sparse features; rate decays too much |
| RMSProp | divide by √(moving average of g²) | fixes AdaGrad's decay |
| **Adam** | momentum (m) + RMSProp (v), bias-corrected | robust default; β₁ = 0.9, β₂ = 0.999 |
| **AdamW** | Adam with *decoupled* weight decay | the standard for transformers |

$$ Adam: m ← β₁m + (1−β₁)g, v ← β₂v + (1−β₂)g², θ ← θ − η · m̂ / (√v̂ + ε) $$

> [!tip] Defaults that work: **AdamW** with lr 1e-3 (from scratch) or 1e-5 to 5e-5 (fine-tuning transformers), weight decay 0.01–0.1. For CNNs on images, SGD + momentum 0.9 with a good schedule often generalises slightly better.

## Learning-rate schedules
${demo('lr-schedules')}

- **Step decay**: divide by 10 at fixed epochs (classic ResNet recipe).
- **Cosine annealing**: smooth decay to near zero.
- **Warm-up**: start small and ramp up over the first steps; essential for transformers and large batches, because Adam's statistics are unreliable early.
- **One-cycle**: up then down; fast convergence.
- **ReduceLROnPlateau**: drop when validation loss stalls.

Use the **learning-rate range test**: increase lr exponentially over a few hundred steps and pick a value just below where the loss starts to blow up.

## Batch size
Larger batches give smoother gradients and better hardware use but can generalise slightly worse and need a larger learning rate (the **linear scaling rule**: double the batch, double the lr, with warm-up). Use **gradient accumulation** to simulate large batches on limited memory.

${T}python
optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.05)
scheduler = torch.optim.lr_scheduler.OneCycleLR(optimizer, max_lr=3e-4,
                                                total_steps=epochs * len(train_loader),
                                                pct_start=0.1)   # 10% warm-up
for x, y in train_loader:
    loss = criterion(model(x), y)
    optimizer.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()
${T}
`,
    checks: [
      ['What two ideas does Adam combine?', 'Momentum (moving average of gradients) and RMSProp-style per-parameter scaling (moving average of squared gradients), with bias correction.'],
      ['How does AdamW differ from Adam with L2?', 'It decouples weight decay from the gradient-based update, applying decay directly to weights, which works better with adaptive optimisers.'],
      ['Why use learning-rate warm-up?', 'Early updates with unreliable optimiser statistics and large lr can destabilise training, especially for transformers and large batches.'],
      ['What is gradient accumulation?', 'Summing gradients over several mini-batches before an optimiser step to simulate a larger batch within memory limits.'],
    ],
    quiz: [
      { q: 'For multiclass classification in PyTorch, CrossEntropyLoss expects…', o: ['Probabilities', 'Raw logits', 'One-hot vectors only', 'Sigmoid outputs'], a: 1 },
      { q: 'Momentum helps mainly by…', o: ['Increasing batch size', 'Accumulating velocity through consistent gradient directions', 'Adding noise', 'Reducing parameters'], a: 1 },
      { q: 'A typical fine-tuning learning rate for a pretrained transformer is…', o: ['1.0', '0.1', '2e-5', '1e-12'], a: 2 },
      { q: 'Cosine annealing…', o: ['Increases lr forever', 'Smoothly decreases lr following a cosine curve', 'Keeps lr constant', 'Randomises lr'], a: 1 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 17,
    title: 'Initialisation, Normalisation and Regularisation',
    sub: 'Xavier and He initialisation, batch and layer normalisation, dropout, weight decay, data augmentation and early stopping.',
    md: `
## Initialisation
Weights must start random (to break symmetry) and at the **right scale**, so that activations and gradients keep roughly constant variance through the layers.

${demo('dl-init')}

| Scheme | Var(W) | Use with |
|---|---|---|
| Xavier / Glorot | 2 / (n_in + n_out) (or 1/n_in) | tanh, sigmoid |
| **He / Kaiming** | 2 / n_in | ReLU family |
| Orthogonal | orthogonal matrix | RNNs |
| Small-init residual | scale the last layer of each block by ~0 | very deep residual nets, transformers |

PyTorch layers already use sensible (Kaiming-uniform) defaults; customise when you build unusual architectures.

## Normalisation layers
| Layer | Normalises over | Typical use |
|---|---|---|
| **BatchNorm** | the batch, per channel | CNNs; needs batch size ≥ ~16; different behaviour at train/eval |
| **LayerNorm** | the features of each example | transformers, RNNs; batch-size independent |
| RMSNorm | features, scale only (no mean) | LLaMA and most modern LLMs |
| GroupNorm | groups of channels per example | detection/segmentation with small batches |

$$ BN: x̂ = (x − μ_B) / √(σ²_B + ε), y = γ·x̂ + β $$

Normalisation smooths the loss landscape, allows higher learning rates and reduces sensitivity to initialisation. BatchNorm keeps **running averages** of μ and σ for inference, which is why you must call **model.eval()** before evaluating.

## Regularisation
${demo('dl-dropout')}

| Technique | How it helps |
|---|---|
| **Weight decay** (L2) | keeps weights small; AdamW's decoupled form is standard |
| **Dropout** | randomly zeroes units in training, like averaging many thinned networks |
| **Data augmentation** | flips, crops, colour jitter, mixup/cutmix, noise; teaches invariances |
| **Early stopping** | stop when validation loss stops improving; keep the best checkpoint |
| **Label smoothing** | targets like 0.9/0.1 instead of 1/0 reduce over-confidence |
| Stochastic depth | randomly skip residual blocks in training |
| More data / pretraining | usually the strongest regulariser of all |

${demo('augment')}

> [!key] Modern practice: start with a model big enough to overfit a small subset (to prove it can learn), then add regularisation and data until validation performance peaks. Deep networks often generalise better when large and regularised than when small.

## Double descent
Classical theory says test error rises once a model is complex enough to fit the training data. Deep networks often show ==double descent==: error rises near the interpolation threshold and then **falls again** as models grow larger. Over-parameterised networks plus implicit regularisation from SGD generalise surprisingly well.
`,
    checks: [
      ['Why can\'t all weights be initialised to zero?', 'All units in a layer would compute the same output and receive the same gradient, so they would never differentiate (symmetry).'],
      ['Which initialisation suits ReLU networks?', 'He (Kaiming) initialisation with variance 2/n_in.'],
      ['BatchNorm vs LayerNorm?', 'BatchNorm normalises each channel across the batch; LayerNorm normalises across features within each example, independent of batch size.'],
      ['Why must you call model.eval() before inference?', 'It switches BatchNorm to running statistics and disables dropout.'],
    ],
    quiz: [
      { q: 'Transformers usually use…', o: ['BatchNorm', 'LayerNorm or RMSNorm', 'No normalisation', 'GroupNorm only'], a: 1 },
      { q: 'With inverted dropout p = 0.2, surviving activations in training are scaled by…', o: ['0.8', '1.25', '0.2', '5'], a: 1 },
      { q: 'Early stopping monitors…', o: ['Training loss', 'Validation loss/metric', 'Learning rate', 'Batch size'], a: 1 },
      { q: 'Label smoothing mainly reduces…', o: ['Training time', 'Over-confident predictions', 'Model size', 'Data needs'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 18,
    title: 'Training Networks in PyTorch',
    sub: 'Tensors, Datasets and DataLoaders, nn.Module, the training loop, GPUs and mixed precision, checkpoints, and a debugging playbook.',
    md: `
## The PyTorch building blocks
| Piece | Role |
|---|---|
| torch.Tensor | n-dimensional array on CPU or GPU, with autograd |
| Dataset / DataLoader | load, transform, shuffle and batch data, in parallel workers |
| nn.Module | a layer or model with parameters and a forward() method |
| loss (nn.CrossEntropyLoss, …) | scalar objective |
| optimiser (torch.optim.AdamW, …) | updates parameters from .grad |

## A complete training script
${T}python
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

device = "cuda" if torch.cuda.is_available() else "cpu"
tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
train_ds = datasets.MNIST("data", train=True, download=True, transform=tf)
val_ds = datasets.MNIST("data", train=False, transform=tf)
train_dl = DataLoader(train_ds, batch_size=128, shuffle=True, num_workers=2)
val_dl = DataLoader(val_ds, batch_size=512)

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(nn.Flatten(), nn.Linear(784, 256), nn.ReLU(), nn.Dropout(0.2),
                                 nn.Linear(256, 10))
    def forward(self, x):
        return self.net(x)

model = MLP().to(device)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(5):
    model.train()
    for x, y in train_dl:
        x, y = x.to(device), y.to(device)
        loss = loss_fn(model(x), y)
        opt.zero_grad()
        loss.backward()
        opt.step()

    model.eval()
    correct = 0
    with torch.no_grad():
        for x, y in val_dl:
            correct += (model(x.to(device)).argmax(1) == y.to(device)).sum().item()
    print(f"epoch {epoch}: val acc {correct / len(val_ds):.4f}")
${T}

${demo('training-loop')}

> [!key] The five lines at the heart of every loop: **forward, loss, zero_grad, backward, step**. Forgetting zero_grad() accumulates gradients across batches; forgetting model.eval() leaves dropout and BatchNorm in training mode.

## Speed and memory
- **GPU**: move model and batches with .to(device); keep data loading fast (num_workers, pin_memory).
- **Mixed precision** (torch.autocast with bf16/fp16): ~2× faster and half the activation memory on modern GPUs.
- **torch.compile(model)**: graph compilation for extra speed.
- **Gradient checkpointing**: recompute activations in the backward pass to save memory.
- **Multi-GPU**: DistributedDataParallel; FSDP / DeepSpeed to shard huge models.

${T}python
scaler_ctx = torch.autocast(device_type="cuda", dtype=torch.bfloat16)
with scaler_ctx:
    loss = loss_fn(model(x), y)
loss.backward()
${T}

## Checkpoints and reproducibility
${T}python
torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "epoch": epoch}, "ckpt.pt")
state = torch.load("ckpt.pt"); model.load_state_dict(state["model"])
torch.manual_seed(0)    # plus numpy / random seeds and deterministic flags if needed
${T}

## Debugging playbook
${demo('debug-checklist')}

1. **Overfit one batch** first: loss should go near zero. If it cannot, there is a bug.
2. Check the **initial loss**: for K balanced classes it should be about ln K.
3. Visualise inputs **after** transforms and verify labels line up.
4. Watch **gradient norms** per layer; look for NaNs (lower lr, clip gradients, check log(0)).
5. Plot train vs validation curves every epoch (TensorBoard / Weights & Biases).
6. Change **one thing at a time**, and keep a log.
`,
    checks: [
      ['What are the five core steps of a PyTorch training iteration?', 'Forward pass, compute loss, optimizer.zero_grad(), loss.backward(), optimizer.step().'],
      ['What is the expected initial cross-entropy loss for 10 balanced classes?', 'About ln 10 ≈ 2.30.'],
      ['Why overfit a single batch first?', 'If the model cannot drive the loss near zero on a tiny set, there is a bug in the model, loss or data pipeline.'],
      ['What does torch.no_grad() do?', 'Disables gradient tracking, saving memory and compute during evaluation.'],
    ],
    quiz: [
      { q: 'Forgetting optimizer.zero_grad() causes…', o: ['No learning', 'Gradients to accumulate across batches', 'Faster training', 'NaNs always'], a: 1 },
      { q: 'Mixed precision training mainly gives…', o: ['Better accuracy', 'Speed and memory savings', 'More parameters', 'Smaller datasets'], a: 1 },
      { q: 'To train across several GPUs, the standard PyTorch tool is…', o: ['DataLoader', 'DistributedDataParallel', 'nn.Sequential', 'torch.save'], a: 1 },
      { q: 'Loss becomes NaN early. A good first step is…', o: ['Raise the learning rate', 'Lower the learning rate and clip gradients', 'Remove the loss', 'Add layers'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 3, minutes: 18,
    title: 'Convolutional Neural Networks',
    sub: 'Convolutions, padding and stride, pooling, receptive fields, and the classic architectures from LeNet to ResNet and EfficientNet.',
    md: `
## Why not an MLP for images?
A 224×224 RGB image has 150,528 inputs; one dense layer with 1,000 units needs 150 million weights, ignores spatial structure and is not translation-aware. ==Convolutional networks== exploit two facts about images: **locality** (nearby pixels are related) and **translation equivariance** (a cat is a cat anywhere).

## The convolution layer
A small ==kernel== (e.g. 3×3×C_in) slides over the input, computing a dot product at each position to produce one ==feature map==. A layer learns C_out kernels.

${demo('conv-step')}

- **Weight sharing**: the same kernel is used at every position, so parameters = K·K·C_in·C_out + C_out, independent of image size.
- **Padding** keeps spatial size ("same" padding = K//2 for odd K).
- **Stride** downsamples.

$$ output size = ⌊(N + 2P − K) / S⌋ + 1 $$

${demo('conv-calc')}

## Pooling and receptive fields
**Max pooling** keeps the strongest activation in each window, adding small translation invariance and reducing size. Stacking layers grows the ==receptive field==: the region of the input that influences a unit. Two 3×3 convs see 5×5; three see 7×7, with fewer parameters and more non-linearity than one 7×7.

${demo('pooling')}

${demo('receptive-field')}

## What CNNs learn
Early layers learn edge and colour detectors, middle layers textures and parts, deep layers object-level features.

${demo('feature-maps')}

## Classic architectures
| Network | Year | Key idea |
|---|---|---|
| LeNet-5 | 1998 | conv → pool → conv → pool → dense; digits |
| AlexNet | 2012 | ReLU, dropout, GPUs; won ImageNet by a wide margin |
| VGG | 2014 | uniform stacks of 3×3 convs; simple and deep (16–19 layers) |
| GoogLeNet / Inception | 2014 | parallel 1×1, 3×3, 5×5 branches; 1×1 bottlenecks |
| **ResNet** | 2015 | residual connections; 50–152+ layers train easily |
| MobileNet | 2017 | depthwise-separable convs for phones |
| EfficientNet | 2019 | compound scaling of depth, width and resolution |
| ConvNeXt | 2022 | a CNN modernised with transformer-era design choices |

${demo('cnn-shapes')}

${T}python
class SmallCNN(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        def block(cin, cout):
            return nn.Sequential(nn.Conv2d(cin, cout, 3, padding=1), nn.BatchNorm2d(cout), nn.ReLU(),
                                 nn.Conv2d(cout, cout, 3, padding=1), nn.BatchNorm2d(cout), nn.ReLU(),
                                 nn.MaxPool2d(2))
        self.features = nn.Sequential(block(3, 32), block(32, 64), block(64, 128))
        self.head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(128, n_classes))
    def forward(self, x):
        return self.head(self.features(x))
${T}

> [!note] The Computer Vision course covers CNNs for detection, segmentation and more in depth. CNNs also work on 1D signals (audio, time series) and 3D volumes (medical scans).
`,
    checks: [
      ['What two properties of images do CNNs exploit?', 'Locality of pixel correlations and translation equivariance (via weight sharing).'],
      ['Output size of a 32×32 input with K = 5, P = 0, S = 1?', '⌊(32 − 5)/1⌋ + 1 = 28.'],
      ['Why stack two 3×3 convs instead of one 5×5?', 'Same receptive field with fewer parameters (18 vs 25 per channel pair) and an extra non-linearity.'],
      ['What innovation let ResNet train 100+ layers?', 'Residual (skip) connections that let signals and gradients bypass layers.'],
    ],
    quiz: [
      { q: 'A Conv2d(64, 128, 3) layer has how many parameters?', o: ['73,728', '73,856', '1,152', '8,192'], a: 1, e: '3·3·64·128 = 73,728 weights + 128 biases.' },
      { q: 'Max pooling 2×2 with stride 2 on a 28×28 map gives…', o: ['26×26', '14×14', '7×7', '28×28'], a: 1 },
      { q: 'MobileNet reduces computation with…', o: ['Residual connections', 'Depthwise-separable convolutions', 'Dropout', 'Bigger kernels'], a: 1 },
      { q: 'Early CNN layers typically detect…', o: ['Whole objects', 'Edges and colours', 'Class labels', 'Words'], a: 1 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 3, minutes: 18,
    title: 'Recurrent Networks, LSTMs and Sequence Models',
    sub: 'Processing sequences with shared weights over time, backpropagation through time, LSTM and GRU gates, and sequence-to-sequence models.',
    md: `
## Sequences need memory
Text, speech, sensor readings and prices are ordered, variable-length sequences. A ==recurrent neural network== (RNN) processes one element at a time and carries a **hidden state** that summarises the past:

$$ hₜ = tanh(W_h hₜ₋₁ + W_x xₜ + b), ŷₜ = W_y hₜ $$

The **same weights** are reused at every time step, so the model handles any length.

| Pattern | Example |
|---|---|
| many-to-one | sentiment of a review |
| one-to-many | image captioning |
| many-to-many (aligned) | tagging each word |
| many-to-many (seq2seq) | translation |

## Backpropagation through time
Unroll the network over the sequence and backpropagate through the unrolled graph (==BPTT==). The gradient from step T to step t multiplies T − t Jacobians, so it **vanishes or explodes** exponentially. Practical fixes: gradient clipping (for explosions) and gated architectures (for vanishing). Truncated BPTT limits how far back gradients flow.

${demo('dl-rnn-gradient')}

## LSTM
The ==LSTM== (Hochreiter & Schmidhuber, 1997) adds a **cell state** cₜ, a conveyor belt that information travels along with only small, gated changes:

| Gate | Formula | Role |
|---|---|---|
| forget fₜ | σ(W_f [hₜ₋₁, xₜ]) | what to erase from the cell |
| input iₜ | σ(W_i [hₜ₋₁, xₜ]) | what new information to write |
| candidate gₜ | tanh(W_g [hₜ₋₁, xₜ]) | the new content |
| output oₜ | σ(W_o [hₜ₋₁, xₜ]) | what to expose as hₜ |

$$ cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ, hₜ = oₜ ⊙ tanh(cₜ) $$

> [!key] The cell update is **additive**. Gradients flowing along the cell are multiplied by the forget gate rather than by a weight matrix and squashing derivative, so with f ≈ 1 information and gradients survive hundreds of steps.

The ==GRU== merges the gates into an update and a reset gate: fewer parameters, similar performance.

## Sequence-to-sequence and attention
An **encoder** RNN reads the input into a vector; a **decoder** RNN generates the output token by token. Squeezing a whole sentence into one vector is a bottleneck, so **attention** (Bahdanau, 2014) lets the decoder look back at all encoder states at every step, weighting the relevant ones. Attention worked so well that transformers (next lesson) dropped recurrence altogether.

${T}python
class SentimentLSTM(nn.Module):
    def __init__(self, vocab_size, emb=128, hidden=256):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, emb, padding_idx=0)
        self.lstm = nn.LSTM(emb, hidden, num_layers=2, batch_first=True, dropout=0.2, bidirectional=True)
        self.fc = nn.Linear(2 * hidden, 1)
    def forward(self, tokens):                  # tokens: (batch, seq_len)
        out, (h, c) = self.lstm(self.embed(tokens))
        last = torch.cat([h[-2], h[-1]], dim=1)  # final forward + backward states
        return self.fc(last).squeeze(1)          # logits for BCEWithLogitsLoss
${T}

## Where RNNs stand today
Transformers replaced RNNs for most language tasks because they train in parallel across the sequence. RNN ideas live on in **state-space models** (S4, Mamba) and linear-attention models that offer recurrent, constant-memory inference with transformer-like quality on long sequences. Small LSTMs remain useful for streaming signals on devices.
`,
    checks: [
      ['Why do vanilla RNNs struggle with long-range dependencies?', 'Gradients through time are products of many Jacobians and vanish (or explode) exponentially with distance.'],
      ['What makes the LSTM cell state preserve gradients?', 'It is updated additively and scaled only by the forget gate, which can stay near 1.'],
      ['What are the four LSTM components?', 'Forget gate, input gate, candidate values and output gate (plus the cell state).'],
      ['What problem did attention solve in seq2seq?', 'The fixed-size bottleneck of encoding a whole input into one vector; the decoder can attend to all encoder states.'],
    ],
    quiz: [
      { q: 'Exploding gradients in RNNs are usually handled with…', o: ['Dropout', 'Gradient clipping', 'Larger learning rate', 'Pooling'], a: 1 },
      { q: 'The GRU differs from LSTM by…', o: ['Having no gates', 'Merging gates and dropping the separate cell state', 'Using convolutions', 'Being non-recurrent'], a: 1 },
      { q: 'Sentiment classification of a review is…', o: ['One-to-many', 'Many-to-one', 'One-to-one', 'Seq2seq'], a: 1 },
      { q: 'Transformers replaced RNNs mainly because they…', o: ['Use fewer parameters always', 'Process sequence positions in parallel during training', 'Need no data', 'Have no attention'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 3, minutes: 20,
    title: 'Attention and Transformers',
    sub: 'Scaled dot-product attention, multi-head attention, positional encodings, the transformer block, and encoder, decoder and encoder–decoder models.',
    md: `
## Attention as a soft lookup
Each token produces a **query** (what am I looking for?), a **key** (what do I contain?) and a **value** (what do I pass on?). A token's output is a weighted average of all values, weighted by how well its query matches each key.

$$ Attention(Q, K, V) = softmax(QKᵀ / √d_k) · V $$

${demo('qkv')}

- Dividing by √d_k keeps dot products from growing with dimension and saturating the softmax.
- ==Self-attention==: Q, K, V all come from the same sequence, so every token can look at every other token in one step, regardless of distance.
- ==Causal masking== hides future positions in decoders, so generation is left to right.

## Multi-head attention
Run h attention heads in parallel, each with its own projections into a smaller subspace (d_k = d_model / h), then concatenate and project. Different heads learn different relations: syntax, coreference, position.

## Positional information
Attention is permutation-invariant, so order must be injected:
- **Sinusoidal** encodings (original transformer).
- **Learned** absolute position embeddings (BERT, GPT-2).
- **RoPE** (rotary embeddings) rotates Q and K by position-dependent angles; used in LLaMA and most modern LLMs, extends well to longer contexts.
- ALiBi: adds a distance-based bias to attention scores.

## The transformer block
${T}text
x ─► LayerNorm ─► Multi-head self-attention ─► + ─► LayerNorm ─► Feed-forward (MLP) ─► + ─► out
└──────────── residual ───────────────────────┘ └──────────── residual ──────────────┘
${T}

Modern models use **pre-norm** (normalise before each sub-layer) for stable training; the feed-forward network expands to ~4× d_model with GELU or SwiGLU. Stack N blocks.

${T}python
class Block(nn.Module):
    def __init__(self, d=512, heads=8, mlp=2048, p=0.1):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, dropout=p, batch_first=True)
        self.mlp = nn.Sequential(nn.Linear(d, mlp), nn.GELU(), nn.Linear(mlp, d), nn.Dropout(p))
    def forward(self, x, causal_mask=None):
        h = self.ln1(x)
        x = x + self.attn(h, h, h, attn_mask=causal_mask, need_weights=False)[0]
        return x + self.mlp(self.ln2(x))
${T}

## Three families
| Family | Attention | Pretraining | Examples | Best for |
|---|---|---|---|---|
| Encoder-only | bidirectional | masked language modelling | BERT, RoBERTa | classification, embeddings, search |
| Decoder-only | causal | next-token prediction | GPT, LLaMA, Claude, Gemini | generation, chat, general LLMs |
| Encoder–decoder | bidirectional encoder + causal decoder with cross-attention | denoising / span corruption | T5, BART, Whisper | translation, summarisation, speech |

## Cost and long context
Self-attention costs **O(n²)** in sequence length for compute and memory. Engineering responses: **FlashAttention** (exact attention, IO-aware, much faster), KV caching at inference, grouped-query attention, sliding-window and sparse attention, and state-space alternatives.

${demo('attn-cost')}

> [!key] Transformers win because they are **parallel** (train on all positions at once), **flexible** (any token can attend to any other), and **scale predictably**: more data, parameters and compute keep improving them. The same block now powers language, vision (ViT), audio, proteins and robotics.
`,
    checks: [
      ['Write the scaled dot-product attention formula.', 'softmax(QKᵀ/√d_k)V.'],
      ['Why divide by √d_k?', 'To keep the variance of dot products from growing with dimension, which would saturate the softmax and shrink gradients.'],
      ['Why do transformers need positional encodings?', 'Self-attention is permutation-invariant; without position information the model cannot know token order.'],
      ['Encoder-only vs decoder-only transformers?', 'Encoder-only use bidirectional attention for understanding tasks; decoder-only use causal attention for generation.'],
    ],
    quiz: [
      { q: 'Causal masking prevents a token from attending to…', o: ['Itself', 'Earlier tokens', 'Future tokens', 'The [CLS] token'], a: 2 },
      { q: 'Self-attention compute grows with sequence length n as…', o: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'], a: 2 },
      { q: 'RoPE is a…', o: ['Normalisation layer', 'Positional encoding by rotating queries and keys', 'Optimiser', 'Tokenizer'], a: 1 },
      { q: 'BERT is pretrained with…', o: ['Next-token prediction', 'Masked language modelling', 'Reinforcement learning', 'Image captioning'], a: 1 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 3, minutes: 16,
    title: 'Residual Networks, Embeddings and Autoencoders',
    sub: 'Skip connections and why they work, learned embeddings, autoencoders and variational autoencoders, and representation learning.',
    md: `
## Residual connections
Instead of learning H(x) directly, a residual block learns the **change** F(x) = H(x) − x:

$$ y = x + F(x) $$

${demo('block-diagram', { kind: 'basic', kinds: ['basic', 'bottleneck'] })}

Why it works:
- If extra layers are not needed, F can learn ≈ 0 and the block becomes the identity, so deeper never has to be worse.
- The gradient has a direct path: ∂y/∂x = I + ∂F/∂x, so it does not vanish across many blocks.

Residual connections are in almost every modern architecture: ResNets, transformers, U-Nets, diffusion models.

## Embeddings
An ==embedding== maps a discrete item (word, token, user, product) to a dense learned vector. nn.Embedding is just a lookup table trained by backprop. Similar items end up close together, so arithmetic on meaning becomes possible (king − man + woman ≈ queen in word2vec).

| Embedding | Learned by |
|---|---|
| word2vec, GloVe | predicting context words / co-occurrence |
| Token embeddings in LLMs | end to end with the language-model loss |
| Sentence/text embeddings | contrastive training (pull paraphrases together) |
| CLIP image–text embeddings | contrastive matching of images and captions |
| Recommender embeddings | predicting user–item interactions |

${demo('contrastive')}

## Autoencoders
An ==autoencoder== compresses the input through a narrow **bottleneck** and reconstructs it:

$$ z = encoder(x), x̂ = decoder(z), loss = ‖x − x̂‖² $$

Uses: dimensionality reduction, denoising (train to reconstruct clean from noisy input), anomaly detection (high reconstruction error = unusual), and pretraining. Masked autoencoders (MAE) reconstruct hidden image patches and are strong vision pretrainers.

${demo('mae-mask')}

## Variational autoencoders
A ==VAE== makes the latent space a probability distribution so you can **sample** new data. The encoder outputs a mean μ and variance σ²; the **reparameterisation trick** z = μ + σ·ε (ε ~ N(0, I)) keeps sampling differentiable. The loss balances reconstruction against a KL term that keeps the latent space close to N(0, I):

$$ L = reconstruction loss + β · KL(q(z|x) ‖ N(0, I)) $$

VAEs give smooth, interpolatable latent spaces; their samples tend to be blurry, which is why GANs and diffusion models took over image generation. But VAEs remain essential as the **compressor** in latent diffusion (Stable Diffusion runs diffusion in a VAE's latent space).

> [!key] Representation learning is the deep idea behind all of this: learn a space where meaningful similarity becomes simple geometry. Good representations make every downstream task easier.
`,
    checks: [
      ['Why do residual connections help gradients?', 'The identity path adds I to the Jacobian (∂y/∂x = I + ∂F/∂x), giving gradients a direct route that does not vanish.'],
      ['What is an embedding layer?', 'A trainable lookup table mapping discrete IDs to dense vectors.'],
      ['How can an autoencoder detect anomalies?', 'It reconstructs normal data well; unusual inputs have high reconstruction error.'],
      ['What is the reparameterisation trick?', 'Writing z = μ + σ·ε with ε ~ N(0, I) so that sampling is differentiable with respect to μ and σ.'],
    ],
    quiz: [
      { q: 'A residual block computes…', o: ['F(x)', 'x · F(x)', 'x + F(x)', 'F(F(x))'], a: 2 },
      { q: 'The KL term in a VAE…', o: ['Improves sharpness', 'Keeps the latent distribution close to the prior', 'Removes the decoder', 'Is the reconstruction loss'], a: 1 },
      { q: 'Stable Diffusion uses a VAE to…', o: ['Classify images', 'Compress images into a latent space for diffusion', 'Tokenise text', 'Detect objects'], a: 1 },
      { q: 'Contrastive learning trains embeddings by…', o: ['Predicting pixels', 'Pulling positive pairs together and pushing negatives apart', 'Minimising weights', 'Sorting data'], a: 1 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 4, minutes: 17,
    title: 'Transfer Learning and Efficient Deep Learning',
    sub: 'Pretrained models, feature extraction and fine-tuning, parameter-efficient methods, scaling laws, and making models small and fast for deployment.',
    md: `
## Stand on giants' shoulders
Training from scratch needs huge data and compute. ==Transfer learning== reuses a model pretrained on a large dataset (ImageNet, web text) and adapts it to your task. It is the default way to do deep learning today.

| Strategy | What you train | When |
|---|---|---|
| Feature extraction | only a new head; backbone frozen | small data, similar domain |
| Fine-tune top layers | head + last blocks | moderate data |
| Full fine-tuning | everything, small lr | more data or a different domain |
| Parameter-efficient (LoRA, adapters) | small added modules | large models, many tasks, limited memory |

${T}python
import torchvision
model = torchvision.models.resnet50(weights="IMAGENET1K_V2")
for p in model.parameters():
    p.requires_grad = False                         # freeze the backbone
model.fc = nn.Linear(model.fc.in_features, 5)       # new head for 5 classes
opt = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
# later: unfreeze layer4 and fine-tune with lr ~1e-5 (discriminative learning rates)
${T}

> [!tip] Use the same preprocessing (resize, normalisation) the backbone was trained with; use a lower learning rate for pretrained layers than for the new head; and unfreeze gradually if data is scarce.

## Parameter-efficient fine-tuning
==LoRA== freezes the weight W and learns a low-rank update W + BA with rank r ≪ d. Only A and B are trained and stored: often < 1% of the parameters, with near full fine-tuning quality. **QLoRA** does this on a 4-bit quantised base model, fine-tuning large LLMs on a single GPU.

${demo('lora')}

## Scaling laws
For transformers, loss falls as a smooth **power law** in parameters N, data D and compute C. The **Chinchilla** result: for a fixed compute budget, scale parameters and training tokens together (≈ 20 tokens per parameter); many earlier models were undertrained. Today models are often trained far beyond that ratio because inference cost favours smaller, longer-trained models.

## Making models efficient
| Technique | Idea | Typical gain |
|---|---|---|
| **Quantisation** | store weights/activations in int8, int4, fp8 | 2–4× smaller, faster |
| **Pruning** | remove small weights or whole channels/heads | smaller; structured pruning gives real speed-ups |
| **Knowledge distillation** | a small student mimics a large teacher's soft outputs | compact models with most of the accuracy |
| Efficient architectures | depthwise convs, MobileNet/EfficientNet, MoE | better accuracy per FLOP |
| Compilation / runtimes | ONNX Runtime, TensorRT, torch.compile, OpenVINO | fused kernels, faster inference |

${demo('quantize')}

${demo('distill')}

## Deployment targets
- **Server GPUs**: batching, mixed precision, TensorRT / vLLM for LLMs.
- **CPU**: ONNX Runtime with int8.
- **Mobile / edge**: Core ML, TensorFlow Lite / LiteRT, ExecuTorch; quantised, small architectures.
- **Browser**: ONNX Runtime Web, WebGPU.

${demo('checklist', { id: 'dl-ship', label: 'Model ready', meta: { title: 'Deep learning project checklist', desc: 'From idea to deployed network.' }, items: [['Baseline with a pretrained model', 'Fine-tuned backbone before any custom architecture.'], ['Data pipeline verified', 'Visualised batches, correct labels, augmentation sanity-checked.'], ['Overfit a small batch', 'Proves the model and loss are wired correctly.'], ['Learning rate found', 'Range test or a short sweep; schedule with warm-up.'], ['Regularisation tuned', 'Weight decay, dropout, augmentation, early stopping.'], ['Evaluation on held-out data', 'Right metrics, error analysis, per-class results.'], ['Efficiency pass', 'Mixed precision, quantisation or distillation if latency matters.'], ['Exported and benchmarked', 'ONNX/TensorRT/mobile format, latency and memory measured.'], ['Monitoring planned', 'Drift and performance tracking in production.']] })}
`,
    checks: [
      ['Feature extraction vs fine-tuning?', 'Feature extraction freezes the pretrained backbone and trains only a new head; fine-tuning also updates some or all pretrained weights with a small learning rate.'],
      ['How does LoRA reduce trainable parameters?', 'It freezes W and learns a low-rank update BA with small rank r, training only A and B.'],
      ['What did the Chinchilla paper find?', 'For compute-optimal training, model size and training tokens should scale together (roughly 20 tokens per parameter).'],
      ['What is knowledge distillation?', 'Training a small student model to match a large teacher\'s softened output distribution.'],
    ],
    quiz: [
      { q: 'With very little data similar to ImageNet, the best start is…', o: ['Train from scratch', 'Freeze a pretrained backbone and train a new head', 'Use no model', 'Full fine-tuning with lr 1.0'], a: 1 },
      { q: 'QLoRA fine-tunes adapters on top of…', o: ['A 4-bit quantised frozen base model', 'A random model', 'Only the embeddings', 'A CNN'], a: 0 },
      { q: 'Which pruning usually gives real speed-ups on standard hardware?', o: ['Unstructured', 'Structured (channels/heads)', 'Random', 'None'], a: 1 },
      { q: 'int8 quantisation primarily reduces…', o: ['Accuracy to zero', 'Memory and latency', 'Training data', 'Parameter count'], a: 1 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['dl-ref'] = {
    head: ['Concept', 'Formula or rule'], mono: [1],
    rows: [
      ['Neuron', 'a = f(wᵀx + b)'], ['ReLU / GELU', 'max(0, z) / z·Φ(z)'], ['Sigmoid', '1 / (1 + e^−z), σ\' ≤ 0.25'], ['Softmax', 'e^zᵢ / Σ e^zⱼ'],
      ['Cross-entropy', '−Σ y log p'], ['Chain rule', '∂L/∂x = ∂L/∂y · ∂y/∂x'], ['Linear layer grads', '∂W = XᵀG, ∂b = ΣG, ∂X = GWᵀ'],
      ['SGD + momentum', 'v ← βv + g; θ ← θ − ηv'], ['Adam', 'm̂/(√v̂ + ε), β₁ = 0.9, β₂ = 0.999'], ['AdamW', 'Adam + decoupled weight decay'],
      ['He init', 'Var(W) = 2 / n_in'], ['Xavier init', 'Var(W) = 1 / n_in or 2/(n_in + n_out)'], ['BatchNorm', 'γ(x − μ_B)/√(σ²_B + ε) + β'],
      ['Inverted dropout', 'keep with prob 1 − p, scale by 1/(1 − p)'], ['Conv output size', '⌊(N + 2P − K)/S⌋ + 1'], ['Conv params', 'K·K·C_in·C_out + C_out'],
      ['RNN', 'hₜ = tanh(W_h hₜ₋₁ + W_x xₜ + b)'], ['LSTM cell', 'cₜ = fₜ⊙cₜ₋₁ + iₜ⊙gₜ'], ['Attention', 'softmax(QKᵀ/√d_k)V'],
      ['Residual block', 'y = x + F(x)'], ['VAE loss', 'reconstruction + β·KL(q(z|x) ‖ N(0, I))'], ['Reparameterisation', 'z = μ + σ·ε'],
      ['LoRA', 'W\' = W + BA, rank r ≪ d'], ['Training loop', 'forward → loss → zero_grad → backward → step'], ['Initial CE loss', '≈ ln(K) for K classes'],
    ],
  };
  CV.GLOSSARIES.dl = [
    ['Neural network', 'layers of weighted sums and non-linear activations'], ['Activation function', 'non-linearity applied after each linear layer'],
    ['Backpropagation', 'reverse-mode chain rule computing all gradients'], ['Autograd', 'automatic differentiation of recorded operations'],
    ['Epoch', 'one full pass over the training data'], ['Batch', 'samples processed together in one step'],
    ['Learning rate', 'step size of parameter updates'], ['Optimiser', 'algorithm that updates parameters from gradients (SGD, Adam)'],
    ['Weight decay', 'shrinking weights toward zero each step'], ['Dropout', 'randomly zeroing units during training'],
    ['Batch normalisation', 'normalising activations over the batch per channel'], ['Layer normalisation', 'normalising over features per example'],
    ['Vanishing gradient', 'gradients shrinking toward zero through many layers'], ['Gradient clipping', 'rescaling gradients whose norm exceeds a threshold'],
    ['Convolution', 'sliding shared kernel producing feature maps'], ['Receptive field', 'input region influencing a unit'],
    ['Pooling', 'downsampling by max or average over windows'], ['RNN', 'network with a hidden state carried across time steps'],
    ['LSTM', 'gated RNN with an additive cell state'], ['Attention', 'weighted average of values by query–key similarity'],
    ['Transformer', 'stack of self-attention and MLP blocks with residuals and norms'], ['Residual connection', 'adding a block\'s input to its output'],
    ['Embedding', 'learned dense vector for a discrete item'], ['Autoencoder', 'network that reconstructs its input through a bottleneck'],
    ['Transfer learning', 'adapting a pretrained model to a new task'], ['LoRA', 'low-rank adapters for efficient fine-tuning'],
    ['Quantisation', 'representing numbers with fewer bits'], ['Distillation', 'training a small model to mimic a large one'],
  ];
  CV.DECKS.dl = [
    ['Training', [
      ['Explain backpropagation.', 'Compute the loss in a forward pass, then apply the chain rule backward through the computational graph, multiplying local derivatives by upstream gradients to get every parameter\'s gradient.'],
      ['Why does initialisation matter?', 'Poor scales make activations and gradients vanish or explode with depth; Xavier/He keep variance roughly constant across layers.'],
      ['What does batch normalisation do and why does it help?', 'Normalises activations per channel using batch statistics, then rescales; it stabilises and speeds up training and allows higher learning rates.'],
      ['How do you debug a network that does not learn?', 'Overfit one batch, check the initial loss, visualise inputs and labels, check gradient norms and the learning rate, and change one thing at a time.'],
      ['Adam vs SGD?', 'Adam adapts per-parameter step sizes and converges fast with little tuning; SGD with momentum and a good schedule can generalise slightly better on some vision tasks.'],
    ]],
    ['Architectures', [
      ['Why do CNNs work well for images?', 'Local connectivity and weight sharing exploit spatial locality and translation equivariance with far fewer parameters.'],
      ['Why do LSTMs handle long sequences better than RNNs?', 'The additive, gated cell state lets information and gradients flow across many steps without vanishing.'],
      ['Explain self-attention.', 'Each token forms a query, key and value; outputs are softmax(QKᵀ/√d)-weighted averages of values, letting every token use information from every other token.'],
      ['Why do residual connections enable very deep networks?', 'They make identity mappings easy and give gradients a direct path through the network.'],
      ['When would you use transfer learning?', 'Almost always when a pretrained model exists for a related domain, especially with limited data or compute.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'Every key deep learning formula and rule on one searchable page.',
    sections: [{ id: 'ref', title: 'Deep learning cheat sheet', html: CV.h.w('ref-table', { key: 'dl-ref', meta: { title: 'Deep learning formulas', desc: 'Type to filter, e.g. "init", "attention", "conv".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'Deep learning vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'dl' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on training and architectures.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'dl' }) }] });
})();

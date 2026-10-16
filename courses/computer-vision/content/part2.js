/* Part II: Deep Learning for Vision (Chapters 6–9) */
(function () {
  const { h } = CV;
  const { f, frac, table, code, w, ul, ol, key, warn, tip, note } = h;

  /* ============================ Chapter 6 ============================ */
  CV.addChapter({
    n: 6, part: 2, minutes: 22,
    title: 'Machine Learning Essentials',
    sub: 'Linear classifiers, softmax and cross-entropy, gradient descent, backprop, activations, overfitting and evaluation metrics.',
    sections: [
      { id: 'learning', title: 'Learning from examples', html: `
        <p>In <span class="term">supervised learning</span> we have a dataset of pairs (x<sub>i</sub>, y<sub>i</sub>), an image and its label, and we want a function f(x; θ) with parameters θ such that f(x<sub>i</sub>) ≈ y<sub>i</sub> and, crucially, that works on <strong>new</strong> images. Learning means choosing θ by minimising a <span class="term">loss function</span> that measures error on the training set.</p>` },
      { id: 'linear', title: 'A linear classifier', html: `
        <p>Flatten an image into a vector x (for a 32 × 32 × 3 image, 3072 numbers). For C classes compute one score per class:</p>
        ${f(`<b>s</b> = <b>W</b> <b>x</b> + <b>b</b>, &nbsp;&nbsp; <b>W</b>: C × 3072, &nbsp; <b>b</b>: C`, 'Linear scores')}
        <p>Each row of W is a <em>template</em>; the score is how much the image matches that template. This is simple, but a single linear template per class cannot capture the variety of real images. Neural networks stack many such layers with non-linearities between them. See the difference below: a linear model can only draw a straight boundary.</p>
        ${w('nn-playground')}` },
      { id: 'softmax', title: 'Softmax and cross-entropy', html: `
        <p>Softmax turns scores into probabilities that are positive and sum to one; the cross-entropy loss is the negative log-probability of the correct class:</p>
        ${f(`<i>p<sub>k</sub></i> = ${frac('exp(<i>s<sub>k</sub></i>)', 'Σ<sub>j</sub> exp(<i>s<sub>j</sub></i>)')}, &nbsp;&nbsp;&nbsp; <i>L</i> = − log <i>p<sub>y</sub></i>`, 'Softmax · Cross-entropy')}
        <p>It is small when the model puts high probability on the right answer and grows without bound when it is confidently wrong. Over a batch of N images we average: L = (1/N) Σ L<sub>i</sub>.</p>
        ${w('softmax-ce')}
        ${warn('In PyTorch <code>nn.CrossEntropyLoss</code> applies log-softmax internally, so feed it raw scores (<strong>logits</strong>), not probabilities.')}
        <p>For <strong>multi-label</strong> problems (an image can contain several classes) use a per-class sigmoid with binary cross-entropy instead of softmax.</p>` },
      { id: 'gd', title: 'Gradient descent and optimizers', html: `
        <p>The gradient ∇<sub>θ</sub>L points toward increasing loss, so we step the opposite way:</p>
        ${f(`θ ← θ − η · ∇<sub>θ</sub><i>L</i>`, 'Gradient descent')}
        <p>η is the <span class="term">learning rate</span>, the single most important hyperparameter. Too large and the loss diverges; too small and training is slow or stuck. We use mini-batches (for example 32 to 256 images) to estimate the gradient: this is <strong>stochastic gradient descent (SGD)</strong>.</p>
        ${w('grad-descent')}
        ${table(['Optimizer', 'Update idea', 'Typical use'], [
          ['SGD', 'plain gradient step', 'stable baseline'],
          ['SGD + momentum (0.9)', 'keeps a moving average of gradients, smoothing noise and speeding along valleys', 'classic CNN training, best final accuracy'],
          ['RMSprop', 'divides by a running average of squared gradients', 'RNNs, older detectors'],
          ['Adam', 'momentum + per-parameter adaptive step sizes', 'fast convergence, default for many tasks'],
          ['AdamW', 'Adam with decoupled weight decay', 'transformers, modern recipes'],
        ])}
        <h3>Learning-rate schedules</h3>
        ${w('lr-schedules')}` },
      { id: 'backprop', title: 'Backpropagation', html: `
        <p>A network is a chain of functions. <span class="term">Backpropagation</span> applies the chain rule to compute the gradient of the loss with respect to every parameter efficiently, reusing intermediate results. For a layer with output a = g(z) and z = W x + b:</p>
        ${f(`∂<i>L</i>/∂<b>W</b> = (∂<i>L</i>/∂<i>a</i>) · <i>g'</i>(<i>z</i>) · <b>x</b><sup>T</sup>`, 'Chain rule')}
        <p>Each layer receives the gradient from the layer above, computes its own parameter gradients and passes a gradient to the layer below. Frameworks such as PyTorch build the computation graph automatically (autograd), so you write only the forward pass and call <code>loss.backward()</code>.</p>
        <h3>Vanishing and exploding gradients</h3>
        <p>In deep networks gradients are products of many terms. If each term is below 1 the product vanishes (early layers stop learning); if above 1 it explodes. Remedies that shaped modern architectures: ReLU activations, careful initialisation (He/Kaiming), normalisation layers, residual connections (Chapter 8), and gradient clipping.</p>` },
      { id: 'act', title: 'Activation functions', html: `
        <p>Without non-linearities a stack of linear layers is just one linear layer. Activations add expressive power.</p>
        ${w('activations')}
        ${ul(['<strong>Sigmoid, tanh:</strong> smooth but saturate (flat tails give tiny gradients). Sigmoid is still used for outputs in binary or multi-label problems.', '<strong>ReLU = max(0, x):</strong> cheap, does not saturate for positive inputs, produces sparse activations. A neuron stuck at negative inputs "dies".', '<strong>Leaky ReLU / PReLU:</strong> small negative slope avoids dead units.', '<strong>GELU, SiLU (Swish):</strong> smooth ReLU-like curves used in transformers, EfficientNet, ConvNeXt and modern YOLO.'])}` },
      { id: 'overfit', title: 'Generalisation, overfitting and regularisation', html: `
        <p>A model that memorises training images but fails on new ones is <span class="term">overfitting</span>. A model too simple to capture the pattern is <span class="term">underfitting</span>. We watch the gap between training and validation loss.</p>
        ${w('overfit')}
        <p>Ways to reduce overfitting:</p>
        ${ul(['<strong>More data and data augmentation</strong> (flips, crops, colour jitter, MixUp, CutMix): the best regulariser.', '<strong>Weight decay</strong> (L2): add λ‖θ‖² to the loss to keep weights small.', '<strong>Dropout:</strong> randomly zero a fraction of activations during training (e.g. 0.5 in fully connected layers).', '<strong>Early stopping:</strong> stop when validation loss stops improving.', 'Smaller model, label smoothing, stochastic depth, transfer learning.'])}
        <h3>Splitting data</h3>
        <p>Always keep three disjoint sets: <strong>train</strong> (fit parameters), <strong>validation</strong> (choose hyperparameters and stopping point), <strong>test</strong> (touch once at the end for an honest estimate). A typical split is 70/15/15 or 80/10/10. When data come from video or the same patient/scene, <strong>split by group</strong> so near-duplicate frames do not leak across sets.</p>
        ${warn('Data leakage is the most common reason a model looks great in the notebook and fails in deployment. If frames from one video appear in both train and test, your test accuracy is meaningless.')}` },
      { id: 'metrics', title: 'Evaluation metrics', html: `
        <p>For a binary decision, a <span class="term">confusion matrix</span> counts true positives (TP), false positives (FP), true negatives (TN) and false negatives (FN).</p>
        ${table(['Metric', 'Formula', 'Meaning'], [
          ['Accuracy', '(TP + TN) / total', 'overall correct; misleading with imbalanced classes'],
          ['Precision', 'TP / (TP + FP)', 'of the things I flagged, how many were right'],
          ['Recall (sensitivity)', 'TP / (TP + FN)', 'of the real positives, how many I found'],
          ['F1 score', '2PR / (P + R)', 'harmonic mean of precision and recall'],
          ['Specificity', 'TN / (TN + FP)', 'of the real negatives, how many I cleared'],
          ['ROC-AUC', 'area under TPR vs FPR curve', 'ranking quality, threshold independent'],
          ['Top-k accuracy', 'true label in the k highest scores', 'ImageNet reports top-1 and top-5'],
        ])}
        ${w('metrics')}
        <p>With imbalanced data (for example 1 percent defects) a model that always says "no defect" has 99 percent accuracy and is useless; use precision, recall, F1 or PR-AUC instead.</p>` },
      { id: 'code', title: 'Code: an MLP in PyTorch', html: `
        ${code(`import torch, torch.nn as nn, torch.nn.functional as F
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

tf = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
train = DataLoader(datasets.MNIST("data", train=True, download=True, transform=tf),
                   batch_size=128, shuffle=True)
test = DataLoader(datasets.MNIST("data", train=False, download=True, transform=tf), batch_size=512)

model = nn.Sequential(nn.Flatten(), nn.Linear(784, 256), nn.ReLU(), nn.Dropout(0.2), nn.Linear(256, 10))
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

for epoch in range(5):
    model.train()
    for x, y in train:
        loss = F.cross_entropy(model(x), y)      # model returns logits
        opt.zero_grad(); loss.backward(); opt.step()
    model.eval(); correct = 0
    with torch.no_grad():
        for x, y in test:
            correct += (model(x).argmax(1) == y).sum().item()
    print(f"epoch {epoch}: test acc {correct / len(test.dataset):.4f}")`)}
        <p>An MLP like this reaches about 98 percent on MNIST. It treats pixels as unrelated numbers, which wastes the image structure; the next chapter fixes that.</p>` },
    ],
    checks: [
      ['Why does PyTorch\'s CrossEntropyLoss expect logits, not probabilities?', 'It applies log-softmax internally for numerical stability.'],
      ['What is the purpose of the validation set versus the test set?', 'Validation guides choices (hyperparameters, early stopping); the test set is used once for an unbiased final estimate.'],
      ['A dataset is 99 percent negatives. Why is accuracy a poor metric?', 'Always predicting negative gives 99 percent; use precision, recall, F1 or PR-AUC.'],
      ['Name two ways to fight vanishing gradients.', 'ReLU-family activations, proper initialisation, normalisation layers, residual connections.'],
    ],
    quiz: [
      { q: 'Training loss explodes to NaN within a few steps. The most likely first fix is…', o: ['Increase batch size', 'Lower the learning rate', 'Add more layers', 'Remove augmentation'], a: 1 },
      { q: 'An image can contain both a dog and a ball. The right output layer and loss are…', o: ['Softmax + cross-entropy', 'Per-class sigmoid + binary cross-entropy', 'ReLU + MSE', 'Softmax + MSE'], a: 1 },
      { q: 'A detector flags 50 items; 40 are real defects; there were 80 real defects in total. Precision and recall are…', o: ['0.8 and 0.5', '0.5 and 0.8', '0.4 and 0.8', '0.8 and 0.8'], a: 0, e: 'P = 40/50 = 0.8, R = 40/80 = 0.5.' },
      { q: 'Training loss keeps falling while validation loss rises. This is…', o: ['Underfitting', 'Overfitting', 'Vanishing gradients', 'A learning-rate warm-up'], a: 1 },
      { q: 'Why is splitting video frames randomly into train/test dangerous?', o: ['It is slow', 'Near-duplicate frames leak across sets, inflating test accuracy', 'It unbalances classes', 'Videos cannot be normalised'], a: 1 },
    ],
  });

  /* ============================ Chapter 7 ============================ */
  CV.addChapter({
    n: 7, part: 2, minutes: 20,
    title: 'Convolutional Neural Networks',
    sub: 'Local connectivity, weight sharing, output size, receptive fields, pooling, 1×1 convs, normalisation and efficient convolutions.',
    sections: [
      { id: 'why', title: 'Why convolution?', html: `
        <p>Feeding a 224 × 224 × 3 image (150,528 numbers) into a fully connected layer with 1000 units needs about <strong>150 million weights</strong> and ignores the fact that nearby pixels are related and that an object looks the same wherever it appears. Convolution builds in three priors:</p>
        ${ul(['<strong>Local connectivity:</strong> each output depends only on a small neighbourhood (for example 3 × 3).', '<strong>Weight sharing:</strong> the same kernel is applied at every location, so far fewer parameters.', '<strong>Translation equivariance:</strong> shift the input and the output shifts the same way; pooling then gives approximate invariance.'])}` },
      { id: 'layer', title: 'The convolution layer', html: `
        <p>An input volume has shape C<sub>in</sub> × H × W. A layer has C<sub>out</sub> filters, each of shape C<sub>in</sub> × K × K. Each filter produces one feature map (output channel) by sliding over the input, multiplying and summing across all input channels, adding a bias.</p>
        ${f(`params = (<i>K</i> · <i>K</i> · <i>C</i><sub>in</sub> + 1) · <i>C</i><sub>out</sub>`, 'Parameters')}
        <p>Example: 3 × 3 conv from 64 to 128 channels has (3 × 3 × 64 + 1) × 128 = 73,856 parameters, independent of image size.</p>
        <h3>Output size</h3>
        ${f(`<i>O</i> = ⌊ (<i>I</i> + 2<i>P</i> − <i>D</i>·(<i>K</i> − 1) − 1) / <i>S</i> ⌋ + 1`, 'Output size')}
        ${ul(['<strong>Padding:</strong> "same" padding (P = (K−1)/2 for odd K, stride 1) keeps the size; "valid" means no padding and the map shrinks.', '<strong>Stride:</strong> step of the sliding window; stride 2 halves the resolution (an alternative to pooling).', '<strong>Dilation (atrous):</strong> gaps between kernel taps enlarge the receptive field with no extra parameters; used in DeepLab and WaveNet-style models.'])}
        <p>Example: I = 224, K = 7, P = 3, S = 2 gives O = ⌊(224 + 6 − 7)/2⌋ + 1 = 112 (ResNet's first layer).</p>
        ${w('conv-calc')}` },
      { id: 'rf', title: 'Receptive field', html: `
        <p>The <span class="term">receptive field</span> of a unit is the region of the input that can influence it. Stacking layers grows it: two 3 × 3 convs see 5 × 5; three see 7 × 7. Three stacked 3 × 3 layers have the receptive field of one 7 × 7 layer but fewer parameters (27 versus 49 per channel pair) and two extra non-linearities, which is the VGG insight. Strides and pooling grow the receptive field much faster.</p>
        ${w('receptive-field')}` },
      { id: 'pool', title: 'Pooling and 1×1 convolution', html: `
        ${w('pooling')}
        <p>Max pooling (2 × 2, stride 2) is classic. <strong>Global average pooling (GAP)</strong> averages each whole feature map to one number, replacing the huge fully connected layers of early nets (introduced in Network-in-Network and GoogLeNet, now standard).</p>
        <h3>1 × 1 convolution</h3>
        <p>A 1 × 1 convolution mixes channels at each pixel: it is a small fully connected layer applied independently at every location. It is used to reduce or expand the number of channels cheaply (bottlenecks in GoogLeNet and ResNet, MobileNet's pointwise layers, FPN lateral connections) and to add non-linearity.</p>` },
      { id: 'norm', title: 'Normalisation and dropout', html: `
        <p><span class="term">Batch Normalisation (BN)</span> standardises each channel over the mini-batch and then rescales with learned parameters:</p>
        ${f(`<i>x̂</i> = (<i>x</i> − μ<sub>B</sub>) / √(σ<sub>B</sub>² + ε), &nbsp;&nbsp; <i>y</i> = γ · <i>x̂</i> + β`, 'BatchNorm')}
        <p>BN allows higher learning rates, speeds up training and regularises. At inference the running averages of μ and σ² gathered during training are used, so the model must be set to <code>eval()</code> mode. Other norms: <strong>LayerNorm</strong> (normalises over features of one sample, used in transformers and ConvNeXt), <strong>GroupNorm</strong> (works with small batches, common in detection and segmentation), <strong>InstanceNorm</strong> (style transfer). Dropout zeroes random activations during training; in conv nets it is mainly used in the classifier head.</p>` },
      { id: 'efficient', title: 'Efficient convolutions', html: `
        <p>A standard K × K convolution costs K² · C<sub>in</sub> · C<sub>out</sub> multiply-adds per output location. Cheaper variants:</p>
        ${ul(['<strong>Depthwise convolution:</strong> one K × K filter per input channel (no channel mixing): cost K² · C<sub>in</sub>.', '<strong>Pointwise (1 × 1) convolution:</strong> mixes channels: cost C<sub>in</sub> · C<sub>out</sub>.', '<strong>Depthwise-separable</strong> = depthwise then pointwise (MobileNet, Xception, EfficientNet).', '<strong>Grouped convolution:</strong> split channels into G groups (ResNeXt, ShuffleNet); cost divided by G.'])}
        ${f(`${frac('<i>K</i>²·<i>C</i><sub>in</sub> + <i>C</i><sub>in</sub>·<i>C</i><sub>out</sub>', '<i>K</i>²·<i>C</i><sub>in</sub>·<i>C</i><sub>out</sub>')} = ${frac('1', '<i>C</i><sub>out</sub>')} + ${frac('1', '<i>K</i>²')}`, 'Cost ratio')}
        ${w('dw-cost')}
        ${note('Parameters, FLOPs and latency are different things. Depthwise layers have few FLOPs but are memory-bound on GPUs, so a "lighter" model is not always faster. Always measure latency on the target hardware.')}` },
      { id: 'anatomy', title: 'Anatomy of a CNN', html: `
        <p>A typical network repeats the pattern <strong>Conv → Norm → Activation (→ Pool)</strong>. As depth increases, spatial size shrinks (224 → 112 → 56 → 28 → 14 → 7) while the number of channels grows (64 → 128 → 256 → 512), trading spatial detail for semantic richness.</p>
        ${w('cnn-shapes')}
        <p>Visualisations show a clear hierarchy: first layers respond to edges and colour blobs; middle layers to textures and parts (wheels, eyes); deep layers to whole objects and scenes.</p>
        ${w('feature-maps')}` },
      { id: 'code', title: 'Building a CNN in PyTorch', html: `
        ${code(`import torch.nn as nn

def block(c_in, c_out):
    return nn.Sequential(
        nn.Conv2d(c_in, c_out, 3, padding=1, bias=False),
        nn.BatchNorm2d(c_out),
        nn.ReLU(inplace=True),
        nn.Conv2d(c_out, c_out, 3, padding=1, bias=False),
        nn.BatchNorm2d(c_out),
        nn.ReLU(inplace=True),
        nn.MaxPool2d(2))

class SmallCNN(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(block(3, 32), block(32, 64), block(64, 128))  # 32x32 -> 4x4
        self.pool = nn.AdaptiveAvgPool2d(1)                                         # global average pooling
        self.head = nn.Sequential(nn.Flatten(), nn.Dropout(0.3), nn.Linear(128, num_classes))

    def forward(self, x):
        return self.head(self.pool(self.features(x)))

model = SmallCNN()
print(sum(p.numel() for p in model.parameters()) / 1e3, "K parameters")`)}
        <p>A network like this reaches roughly 90 to 93 percent accuracy on CIFAR-10 with augmentation, versus about 55 percent for a linear classifier and 60 percent for a plain MLP.</p>` },
    ],
    checks: [
      ['Compute the parameter count of a 3 × 3 conv layer with 16 input and 32 output channels with bias.', '(3 × 3 × 16 + 1) × 32 = 4640.'],
      ['Output size for I = 32, K = 3, P = 1, S = 1? And with S = 2?', '32; and ⌊(32 + 2 − 3)/2⌋ + 1 = 16.'],
      ['Why use a 1 × 1 convolution?', 'To change channel count cheaply and mix channels at each position (bottlenecks, pointwise layers).'],
      ['Why must you call model.eval() at inference with BatchNorm?', 'To use the stored running mean/variance instead of batch statistics and to disable dropout.'],
    ],
    quiz: [
      { q: 'Output size for I = 224, K = 3, P = 0, S = 2, D = 1?', o: ['111', '112', '110', '222'], a: 0, e: '⌊(224 − 2 − 1)/2⌋ + 1 = 110 + 1 = 111.' },
      { q: 'What does dilation buy you?', o: ['Fewer channels', 'A larger receptive field with no extra parameters', 'Translation invariance', 'Lower memory'], a: 1 },
      { q: 'Receptive field of four stacked 3×3 stride-1 convs?', o: ['7×7', '9×9', '12×12', '81×81'], a: 1, e: '1 + 4·2 = 9.' },
      { q: 'For K = 3 and many channels, a depthwise-separable conv is roughly…', o: ['2× cheaper', '8–9× cheaper', '50× cheaper', 'the same cost'], a: 1 },
      { q: 'Which normalisation works well with very small batches?', o: ['BatchNorm', 'GroupNorm', 'Dropout', 'None'], a: 1 },
    ],
  });

  /* ============================ Chapter 8 ============================ */
  CV.addChapter({
    n: 8, part: 2, minutes: 28,
    title: 'Classic CNN Architectures in Detail',
    sub: 'LeNet, AlexNet, VGG, Inception, ResNet, SENet, DenseNet, MobileNet, EfficientNet and ConvNeXt as a chain of design lessons.',
    sections: [
      { id: 'explorer', title: 'The landscape at a glance', html: `
        <p>This chapter walks through the networks that defined the field. Each introduced an idea that is still used today, so read them as a chain of design lessons rather than a museum tour.</p>
        ${w('arch-explorer')}` },
      { id: 'lenet', title: 'LeNet-5 (1998)', html: `
        <p>LeCun's LeNet-5 read handwritten digits (32 × 32 grayscale input) and established the template: convolution, subsampling, convolution, subsampling, fully connected layers. About 60 thousand parameters. Tanh/sigmoid activations and average pooling were used; modern versions swap in ReLU and max pooling.</p>
        ${table(['Layer', 'Operation', 'Output shape'], [['Input', 'grayscale image', '1 × 32 × 32'], ['C1', '6 filters 5 × 5', '6 × 28 × 28'], ['S2', 'average pool 2 × 2', '6 × 14 × 14'], ['C3', '16 filters 5 × 5', '16 × 10 × 10'], ['S4', 'average pool 2 × 2', '16 × 5 × 5'], ['C5', '120 units (5 × 5 conv, acts as FC)', '120'], ['F6', 'fully connected', '84'], ['Output', '10 classes', '10']])}` },
      { id: 'alexnet', title: 'AlexNet (2012)', html: `
        <p>AlexNet (Krizhevsky, Sutskever, Hinton) won ILSVRC 2012 with a top-5 error of about 15.3 percent, against 26.2 percent for the runner-up using classical features. It showed that deep CNNs trained on GPUs scale.</p>
        ${ul(['Input 224 × 224 × 3 (commonly implemented as 227). Five conv layers: 96 filters 11 × 11 stride 4; 256 filters 5 × 5; 384, 384 and 256 filters of 3 × 3. Three max-pool layers. Then FC 4096, FC 4096, FC 1000.', 'About 60 million parameters, mostly in the FC layers.', 'Key ingredients: <strong>ReLU</strong> (training several times faster than tanh), <strong>dropout</strong> (0.5) in FC layers, heavy <strong>data augmentation</strong>, overlapping max pooling, local response normalisation (later replaced by BatchNorm), and training split over two GPUs.'])}` },
      { id: 'vgg', title: 'VGG (2014)', html: `
        <p>VGG (Simonyan and Zisserman) asked: what if we use only 3 × 3 convolutions, and go deeper?</p>
        ${ul(['Uniform design: blocks of 3 × 3 convs (stride 1, padding 1) followed by 2 × 2 max pooling that halves the size; channels double 64 → 128 → 256 → 512 → 512.', 'VGG-16: 13 conv + 3 FC layers, about <strong>138 million</strong> parameters, around 15.5 billion multiply-adds. The first FC layer alone (7 × 7 × 512 × 4096) holds about 103 million parameters.', 'Top-1 about 71.6 percent. Still used as a feature extractor (style transfer, perceptual loss) but heavy and slow.'])}` },
      { id: 'inception', title: 'GoogLeNet and the Inception family', html: `
        <p>GoogLeNet (22 layers, about 7 million parameters, top-5 error 6.7 percent) won ILSVRC 2014 with far fewer parameters than VGG by using the <span class="term">Inception module</span>: apply 1 × 1, 3 × 3, 5 × 5 convolutions and a pooling branch in parallel and concatenate, letting the network choose the best scale. 1 × 1 convolutions placed before the expensive branches reduce channels (bottleneck) to save compute.</p>
        <p>Later versions refined it: Inception-v2/v3 factorised 5 × 5 into two 3 × 3 and n × n into 1 × n followed by n × 1, added BatchNorm and label smoothing; Inception-v4 / Inception-ResNet mixed in residual connections; Xception replaced Inception modules by depthwise-separable convolutions. GoogLeNet also used global average pooling and auxiliary classifiers to help gradients.</p>` },
      { id: 'resnet', title: 'ResNet (2015): residual learning', html: `
        <p>Making plain networks deeper eventually made them worse <em>even on the training set</em> (the <strong>degradation problem</strong>), not because of overfitting but because optimisation became hard. He et al. proposed residual learning: instead of learning a mapping H(x), let a block learn the residual F(x) = H(x) − x and output</p>
        ${f(`<i>y</i> = <i>F</i>(<i>x</i>) + <i>x</i>`, 'Residual block')}
        ${w('block-diagram', { kind: 'bottleneck', kinds: ['basic', 'bottleneck'] })}
        ${key('The identity shortcut gives gradients an unobstructed path to earlier layers (the derivative of y with respect to x contains a constant 1), so very deep networks (152 layers, later 1000+) train. A block that has nothing useful to add can simply learn F(x) ≈ 0, so extra depth rarely hurts.')}
        ${w('residual-flow')}
        <h3>ResNet-50 in detail</h3>
        ${table(['Stage', 'Operations', 'Output'], [['conv1', '7 × 7 conv, 64, stride 2, BN, ReLU', '64 × 112 × 112'], ['pool', '3 × 3 max pool, stride 2', '64 × 56 × 56'], ['conv2_x', '3 bottleneck blocks (1×1,64 / 3×3,64 / 1×1,256)', '256 × 56 × 56'], ['conv3_x', '4 bottleneck blocks (128/128/512), first with stride 2', '512 × 28 × 28'], ['conv4_x', '6 bottleneck blocks (256/256/1024), first with stride 2', '1024 × 14 × 14'], ['conv5_x', '3 bottleneck blocks (512/512/2048), first with stride 2', '2048 × 7 × 7'], ['head', 'global average pool, FC 1000', '1000']])}
        <p>When a block changes the number of channels or the stride, the shortcut uses a 1 × 1 convolution (projection) so the shapes match. ResNet-50 has about 25.6 M parameters and 4.1 billion multiply-adds.</p>
        ${table(['Model', 'Block', 'Blocks per stage', 'Params', 'Top-1'], [['ResNet-18', 'basic', '2, 2, 2, 2', '11.7 M', '≈ 69.8%'], ['ResNet-34', 'basic', '3, 4, 6, 3', '21.8 M', '≈ 73.3%'], ['ResNet-50', 'bottleneck', '3, 4, 6, 3', '25.6 M', '≈ 76.1%'], ['ResNet-101', 'bottleneck', '3, 4, 23, 3', '44.5 M', '≈ 77.4%'], ['ResNet-152', 'bottleneck', '3, 8, 36, 3', '60.2 M', '≈ 78.3%']])}
        <p>Descendants: ResNet-v2 (pre-activation), Wide ResNet, ResNeXt (grouped convolutions, "cardinality"), ResNet-D / ResNet-RS (recipe tweaks lifting ResNet-50 above 80 percent). The ResNet-50 backbone remains the default baseline in research and detection/segmentation toolkits.</p>` },
      { id: 'senet', title: 'SENet and DenseNet (2017)', html: `
        <p><strong>Squeeze-and-Excitation</strong> blocks add channel attention to any block: squeeze (global average pool each channel), excite (two FC layers with a bottleneck ratio, e.g. 16, then a sigmoid) producing a weight in 0–1 per channel, then rescale the feature maps. Cheap and consistently helpful; used in EfficientNet and MobileNetV3. SENet won ILSVRC 2017.</p>
        <p>In a <strong>DenseNet</strong> dense block every layer receives the concatenation of all earlier layers' outputs and passes its own k new feature maps (the growth rate, e.g. 12 or 32) onward. This encourages feature reuse and short gradient paths with few parameters; the cost is high memory use. Transition layers (1 × 1 conv + pooling) shrink the maps between blocks. DenseNet-121: about 8 M parameters, 74.4 percent top-1.</p>` },
      { id: 'mobile', title: 'Mobile and efficient networks', html: `
        ${w('block-diagram', { kind: 'mbconv', kinds: ['mbconv', 'se', 'convnext'] })}
        ${ul(['<strong>MobileNetV1 (2017):</strong> every standard convolution replaced with depthwise-separable (3 × 3 depthwise + 1 × 1 pointwise). About 4.2 M parameters, 569 M multiply-adds, 70.6 percent top-1. Width multiplier α and resolution multiplier trade accuracy for speed.', '<strong>MobileNetV2 (2018):</strong> the <span class="term">inverted residual with linear bottleneck</span>. The block goes narrow → expand (1 × 1, factor 6) → depthwise 3 × 3 → project (1 × 1, <em>no ReLU</em>, to avoid destroying information in the low-dimensional space) → narrow, with the skip joining the narrow ends. About 3.4 M parameters, 300 M multiply-adds, 72 percent top-1.', '<strong>MobileNetV3 (2019):</strong> found by NAS, adds SE blocks and hard-swish. Large: about 75.2 percent top-1 with 5.4 M parameters.', '<strong>ShuffleNet</strong> (group convs + channel shuffle), <strong>GhostNet</strong> (cheap "ghost" feature maps), <strong>MobileNetV4</strong> (2024, targets modern NPUs and DSPs).'])}` },
      { id: 'efficientnet', title: 'EfficientNet (2019): compound scaling', html: `
        <p>Networks can be scaled in depth, width or resolution. Scaling one dimension saturates quickly. EfficientNet scales all three together with one coefficient φ:</p>
        ${f(`depth = α<sup>φ</sup>, &nbsp; width = β<sup>φ</sup>, &nbsp; resolution = γ<sup>φ</sup>, &nbsp;&nbsp; α · β² · γ² ≈ 2`, 'Compound scaling')}
        ${w('compound-scaling')}
        <p>A baseline EfficientNet-B0 was found with architecture search (MBConv blocks with SE and SiLU), then scaled to B1–B7. B0: about 5.3 M parameters, 77.1 percent; B7: about 66 M, 84.3 percent. EfficientNetV2 (2021) uses Fused-MBConv early and progressive learning for faster training.</p>` },
      { id: 'convnext', title: 'ConvNeXt (2022): modernising the ConvNet', html: `
        <p>After vision transformers appeared, ConvNeXt asked whether pure convolution can match them with the same recipe and design choices. Starting from ResNet-50 it applied: the modern training recipe (AdamW, long schedule, heavy augmentation), a <strong>patchify stem</strong> (4 × 4 stride-4 conv), ResNeXt-style <strong>depthwise convs with 7 × 7 kernels</strong>, an inverted bottleneck (4× wider), <strong>LayerNorm</strong> instead of BatchNorm, <strong>GELU</strong> and fewer activation/norm layers per block, and separate downsampling layers. ConvNeXt-Tiny: about 28 M parameters and 82.1 percent top-1, on par with Swin-T. ConvNeXt V2 adds masked-autoencoder pretraining.</p>
        ${note('Accuracy depends heavily on the training recipe. The same ResNet-50 architecture reaches 76 percent with the original recipe and over 80 percent with a modern one; numbers across papers are not strictly comparable.')}` },
      { id: 'lessons', title: 'Design lessons and choosing a backbone', html: `
        ${ol(['Depth helps if optimisation is solved (residual connections, normalisation).', 'Small kernels stacked beat large kernels (VGG), though large depthwise kernels are back in ConvNeXt.', 'Bottlenecks (1 × 1 reduce, 3 × 3, 1 × 1 expand) save compute.', 'Global average pooling removes huge FC layers.', 'Width, depth and resolution should scale together.', 'Skip connections, attention (SE) and efficient convolutions appear in almost every modern block.'])}
        ${table(['Situation', 'Reasonable choice'], [['Quick strong baseline', 'ResNet-50 or ConvNeXt-T pretrained on ImageNet'], ['Mobile / edge CPU', 'MobileNetV3, EfficientNet-B0 to B2, MobileNetV4'], ['Best accuracy, GPU available', 'ConvNeXt-B/L, EfficientNetV2-L, Swin or ViT with large pretraining'], ['Dense prediction (detection, segmentation)', 'ResNet-50/101, ConvNeXt, Swin as backbones with FPN'], ['Very small dataset', 'Pretrained backbone, frozen or lightly fine-tuned']])}` },
    ],
    checks: [
      ['What problem do residual connections solve?', 'The degradation/optimisation problem of very deep nets; the identity path lets gradients flow and makes learning a near-zero residual easy.'],
      ['Why is VGG-16 so large?', 'Most of its 138 M parameters sit in the FC layers (the first FC layer alone has about 103 M).'],
      ['How does a MobileNetV2 inverted residual differ from a ResNet bottleneck?', 'It expands channels, applies a depthwise 3 × 3, then projects back to a narrow layer with a linear (no ReLU) output; skips join the narrow ends.'],
      ['What are the three scaling dimensions in EfficientNet?', 'Depth, width and input resolution, scaled together by a compound coefficient.'],
    ],
    quiz: [
      { q: 'Which network introduced parallel 1×1, 3×3, 5×5 and pooling branches?', o: ['VGG', 'GoogLeNet', 'ResNet', 'DenseNet'], a: 1 },
      { q: 'Why does MobileNetV2 use a linear (no ReLU) projection?', o: ['Speed', 'ReLU in a low-dimensional space destroys information', 'It needs negative outputs for softmax', 'Hardware limitation'], a: 1 },
      { q: 'ResNet-50 blocks per stage are…', o: ['2, 2, 2, 2', '3, 4, 6, 3', '3, 4, 23, 3', '3, 8, 36, 3'], a: 1 },
      { q: 'What does a squeeze-and-excitation block output?', o: ['A spatial attention map', 'A weight in 0–1 per channel', 'A new set of anchors', 'A residual'], a: 1 },
      { q: 'Which is NOT one of ConvNeXt\'s changes to ResNet?', o: ['7×7 depthwise kernels', 'LayerNorm instead of BatchNorm', 'Patchify stem', 'Adding self-attention layers'], a: 3, e: 'ConvNeXt stays purely convolutional.' },
    ],
  });

  /* ============================ Chapter 9 ============================ */
  CV.addChapter({
    n: 9, part: 2, minutes: 18,
    title: 'Training Deep Networks in Practice',
    sub: 'Augmentation, transfer learning, hyperparameters, mixed precision, class imbalance and a debugging checklist.',
    sections: [
      { id: 'loop', title: 'The training loop', html: `
        ${w('training-loop')}
        <p>Good results come less from the architecture than from the <strong>data pipeline</strong>, the <strong>recipe</strong> and careful <strong>debugging</strong>.</p>` },
      { id: 'aug', title: 'Data augmentation', html: `
        <p>Augmentation creates new training samples by applying label-preserving changes. It is the cheapest and most effective regulariser in vision.</p>
        ${w('augment')}
        ${table(['Type', 'Examples', 'Notes'], [['Geometric', 'flip, random crop and resize, rotation, affine, perspective', 'do not flip digits or text; adjust boxes and masks with the image'], ['Photometric', 'brightness, contrast, saturation, hue, grayscale, blur, noise, JPEG artifacts', 'simulate lighting and camera variety'], ['Erasing', 'Cutout, Random Erasing', 'forces the model to use multiple cues'], ['Mixing', 'MixUp (blend two images and labels), CutMix (paste a patch, mix labels by area)', 'strong regularisers for classification'], ['Detection-specific', 'Mosaic (4 images in one), copy-paste, scale jitter', 'used heavily in YOLO training'], ['Policy search', 'AutoAugment, RandAugment, TrivialAugment', 'automatic combinations']])}
        ${warn('Apply augmentation <strong>only to the training set</strong>. Validation and test use deterministic resizing and normalisation.')}` },
      { id: 'transfer', title: 'Transfer learning', html: `
        <p>Networks pretrained on ImageNet (or larger sets) have already learned edges, textures and parts that transfer to nearly any visual task. Training from scratch on a small dataset is almost always worse.</p>
        ${table(['Dataset size', 'Similar to pretraining data', 'Different from pretraining data'], [['Small (hundreds to a few thousand)', 'freeze backbone, train new head', 'freeze early layers, fine-tune later layers with small LR'], ['Large (tens of thousands or more)', 'fine-tune whole network, small LR', 'fine-tune whole network, or train longer from pretrained init']])}
        <p>Practical recipe:</p>
        ${ol(['Replace the final layer with one that has your number of classes.', 'Train only the new head for a few epochs (backbone frozen), LR about 1e-3.', 'Unfreeze the backbone and train all layers with a much smaller LR (e.g. 1e-4 for backbone, 1e-3 for head: <span class="term">discriminative learning rates</span>).', 'Use the same input normalisation as the pretrained model.'])}
        ${code(`import torch, torch.nn as nn
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader

weights = models.ResNet50_Weights.IMAGENET1K_V2
model = models.resnet50(weights=weights)
model.fc = nn.Linear(model.fc.in_features, 12)          # new head for 12 classes

train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.3, 0.3, 0.3, 0.05),
    transforms.ToTensor(),
    transforms.Normalize(weights.transforms().mean, weights.transforms().std)])
val_tf = transforms.Compose([
    transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
    transforms.Normalize(weights.transforms().mean, weights.transforms().std)])

train_ds = datasets.ImageFolder("data/train", train_tf)  # folder per class
val_ds = datasets.ImageFolder("data/val", val_tf)
train_dl = DataLoader(train_ds, batch_size=64, shuffle=True, num_workers=4, pin_memory=True)
val_dl = DataLoader(val_ds, batch_size=128, num_workers=4)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
params = [{"params": [p for n, p in model.named_parameters() if not n.startswith("fc")], "lr": 1e-4},
          {"params": model.fc.parameters(), "lr": 1e-3}]
opt = torch.optim.AdamW(params, weight_decay=0.01)
epochs = 15
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=[3e-4, 3e-3], total_steps=epochs * len(train_dl))
scaler = torch.amp.GradScaler(enabled=(device == "cuda"))
crit = nn.CrossEntropyLoss(label_smoothing=0.1)

for epoch in range(epochs):
    model.train()
    for x, y in train_dl:
        x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
        with torch.autocast(device_type=device, dtype=torch.float16, enabled=(device == "cuda")):
            loss = crit(model(x), y)
        opt.zero_grad(set_to_none=True)
        scaler.scale(loss).backward()
        scaler.step(opt); scaler.update(); sched.step()
    model.eval(); correct = 0
    with torch.no_grad():
        for x, y in val_dl:
            correct += (model(x.to(device)).argmax(1).cpu() == y).sum().item()
    print(f"epoch {epoch + 1}: val acc {correct / len(val_ds):.4f}")

torch.save(model.state_dict(), "best.pt")`)}` },
      { id: 'hparams', title: 'Hyperparameters that matter', html: `
        ${ul(['<strong>Learning rate:</strong> tune first. Use a learning-rate range test (increase LR exponentially over one epoch and pick a value a bit below where loss starts to blow up).', '<strong>Batch size:</strong> larger batches give smoother gradients and better GPU use; scale the LR roughly in proportion (linear scaling rule) with warm-up.', '<strong>Weight decay:</strong> about 1e-4 for SGD on CNNs, 0.01 to 0.05 with AdamW.', '<strong>Epochs:</strong> 10 to 30 for fine-tuning; 90 to 300 for training from scratch on ImageNet-scale data.', 'Augmentation strength and label smoothing (0.1) are cheap wins.'])}
        <h3>Efficiency tricks</h3>
        ${ul(['<strong>Mixed precision</strong> (FP16 or BF16): about 2× faster and half the memory on modern GPUs; use loss scaling with FP16.', '<strong>Gradient accumulation:</strong> simulate a large batch by summing gradients over several steps.', '<strong>EMA of weights:</strong> evaluate a smoothed copy of the model, often +0.2 to 0.5 percent.', '<strong>Data loading:</strong> several workers, <code>pin_memory=True</code>, cache decoded images if the disk is slow; the GPU should never wait.', 'Channels-last memory format and <code>torch.compile</code> can speed up convolutions.'])}
        <h3>Dealing with class imbalance</h3>
        <p>Oversample rare classes, use class-weighted loss, use focal loss (Chapter 10), gather more data for the rare class, and evaluate with per-class precision and recall (not only accuracy).</p>` },
      { id: 'debug', title: 'Debugging checklist', html: `
        ${w('debug-checklist')}
        ${tip('Before training for hours: (1) visualise a batch of images with their labels <em>after</em> augmentation, (2) overfit 10 images to near-zero loss, (3) check the learning curves after one epoch. These three steps catch most bugs.')}
        <h3>Reproducibility and tracking</h3>
        <p>Fix random seeds (torch.manual_seed, NumPy, Python), log hyperparameters, git commit and metrics with TensorBoard, Weights &amp; Biases or MLflow, keep a held-out test set untouched, and save the preprocessing code together with the weights.</p>` },
    ],
    checks: [
      ['Why must augmentation be applied only to the training set?', 'Evaluation must reflect real, unmodified inputs; random changes would make validation noisy and biased.'],
      ['What are discriminative learning rates?', 'Using a smaller LR for pretrained backbone layers and a larger one for the new head.'],
      ['What is the expected initial cross-entropy loss for 10 balanced classes with random weights?', 'About ln(10) = 2.30.'],
      ['A model has 99 percent train accuracy and 70 percent validation accuracy. First suspicions?', 'Overfitting or data leakage; add augmentation/regularisation, check the split.'],
    ],
    quiz: [
      { q: 'You have 800 images of plant diseases similar to ImageNet photos. Best start?', o: ['Train ResNet-50 from scratch', 'Freeze a pretrained backbone and train a new head', 'Use an MLP on pixels', 'Fine-tune only the first layer'], a: 1 },
      { q: 'Your batch must drop from 256 to 64 due to memory. To keep the same effective batch, use…', o: ['Gradient accumulation over 4 steps', 'A higher learning rate', 'More dropout', 'EMA'], a: 0 },
      { q: 'Which augmentation is a bad idea for a digit classifier?', o: ['Small rotations', 'Brightness jitter', 'Horizontal flip', 'Random crop'], a: 2, e: 'Flipping changes meaning for digits and text.' },
      { q: 'Initial loss on a 100-class problem is 9.2. What does that suggest?', o: ['Everything is fine', 'Something is wrong (expected ≈ ln 100 = 4.6): check loss/activation, init, input normalisation', 'Learning rate too small', 'Need more epochs'], a: 1 },
    ],
  });
})();

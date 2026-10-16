/* Part IV: Advanced Topics (Chapters 13–17) */
(function () {
  const { h } = CV;
  const { f, frac, table, code, w, ul, ol, key, warn, tip, note } = h;
  const flow = (d, title, desc) => w('flow', { d, meta: { title, desc } });

  /* ============================ Chapter 13 ============================ */
  CV.addChapter({
    n: 13, part: 4, minutes: 26,
    title: 'Vision Transformers',
    sub: 'Self-attention in detail, ViT, DeiT, Swin and hierarchical transformers, CNN vs ViT, and a minimal ViT in PyTorch.',
    sections: [
      { id: 'why', title: 'From CNNs to transformers', html: `
        <p>Convolution hard-codes locality and translation equivariance; that is why CNNs work well with modest data. Transformers (Vaswani et al., 2017, built for language) instead use <span class="term">self-attention</span>, in which every element can look at every other element directly. This gives a global receptive field from the first layer, a uniform architecture that scales smoothly with data and compute, and the same building block for text, images, audio and video, which makes multimodal models natural.</p>` },
      { id: 'attention', title: 'Self-attention in detail', html: `
        <p>Given N token vectors stacked in X (N × d), three learned linear maps create queries Q = X W<sub>Q</sub>, keys K = X W<sub>K</sub> and values V = X W<sub>V</sub>. Each token's output is a weighted average of all values, with weights from how well its query matches each key:</p>
        ${f(`Attention(<b>Q</b>, <b>K</b>, <b>V</b>) = softmax( ${frac('<b>Q</b> <b>K</b><sup>T</sup>', '√<i>d<sub>k</sub></i>')} ) · <b>V</b>`, 'Scaled dot-product attention')}
        ${ul(['Q K<sup>T</sup> is an N × N matrix of similarity scores; dividing by √d<sub>k</sub> keeps the softmax from saturating as dimension grows.', 'Softmax over each row gives attention weights summing to 1.', 'Multiplying by V mixes information from all tokens into each position.'])}
        ${w('qkv')}
        ${w('attention')}
        <p><strong>Multi-head attention</strong> runs h attention operations in parallel on d/h-dimensional subspaces and concatenates the results, letting heads specialise (nearby texture, symmetric parts, object boundaries). Attention has no sense of order, so positional information must be added (learned embeddings in ViT, sinusoidal encodings, relative biases in Swin, rotary embeddings in newer models).</p>
        <p><strong>Cost:</strong> O(N² · d) time and O(N²) memory for the attention matrix. Token count grows quickly with resolution, which is why windowed, hierarchical and FlashAttention-style implementations exist.</p>
        ${w('attn-cost')}` },
      { id: 'vit', title: 'The Vision Transformer (ViT, 2020)', html: `
        ${flow('vit', 'ViT pipeline', 'Patchify, embed, encode, classify from [CLS].')}
        <p>The ViT recipe ("An image is worth 16×16 words") is deliberately simple:</p>
        ${ol(['<strong>Patchify:</strong> split an H × W × C image into N = HW / P² non-overlapping P × P patches. For 224 × 224 with P = 16: N = 14 × 14 = 196.', '<strong>Linear patch embedding:</strong> flatten each patch (16 × 16 × 3 = 768 numbers) and project to dimension D (implemented as a conv with kernel = stride = P).', 'Prepend a learnable <strong>[CLS]</strong> token and add learned position embeddings (197 × D).', 'Pass through L pre-norm encoder blocks: x = x + MHA(LN(x)); x = x + MLP(LN(x)), with a GELU MLP of hidden width 4D.', 'Take the final [CLS] embedding (or average all tokens) and apply a linear classifier.'])}
        ${w('patchify')}
        ${table(['Model', 'Layers L', 'Hidden D', 'MLP width', 'Heads', 'Params'], [['ViT-Base (B)', '12', '768', '3072', '12', '≈ 86 M'], ['ViT-Large (L)', '24', '1024', '4096', '16', '≈ 307 M'], ['ViT-Huge (H)', '32', '1280', '5120', '16', '≈ 632 M']])}
        <p>"ViT-B/16" means Base with patch size 16. A smaller patch (8) gives more tokens, more detail and much higher cost. ViT-B/16 needs roughly 17.6 GFLOPs per 224 × 224 image.</p>
        ${key('<strong>Data hunger.</strong> With little built-in bias, ViT trained only on ImageNet-1k underperforms strong CNNs (≈ 78% top-1 for ViT-B/16), but pretrained on large datasets (ImageNet-21k, JFT-300M) it matches or beats them and keeps improving with scale. <strong>DeiT</strong> (2021) showed ViT can be trained well on ImageNet-1k alone (≈ 81.8% for DeiT-B) with strong augmentation, stochastic depth, label smoothing and a good AdamW schedule.')}
        <p><strong>Changing resolution:</strong> fine-tuning at higher resolution gives more tokens; position embeddings are resized by 2D interpolation.</p>` },
      { id: 'swin', title: 'Hierarchical and efficient vision transformers', html: `
        <p>Plain ViT keeps one resolution and has global attention cost, which is awkward for dense tasks. Hierarchical designs borrow CNN structure.</p>
        ${flow('swin', 'Swin Transformer', 'Stages with patch merging.')}
        ${ul(['<strong>Patch merging:</strong> at the start of each stage concatenate each 2 × 2 group of neighbouring tokens (4C) and project to 2C: half resolution, double channels; feature maps at strides 4, 8, 16, 32.', '<strong>Window attention (W-MSA):</strong> attention only inside non-overlapping M × M windows (M = 7). Cost becomes linear in the number of tokens.', '<strong>Shifted windows (SW-MSA):</strong> successive blocks shift the window grid by half a window so information flows between windows (cyclic shift + attention mask).', 'Relative position bias added to attention logits.', 'Swin-T: ≈ 29 M parameters, 4.5 GFLOPs, ≈ 81.3% top-1; Swin-B ≈ 88 M. A drop-in backbone for FPN-based detectors and segmenters.'])}
        ${w('swin-windows')}
        ${f(`Ω(MSA) = 4<i>hwC</i>² + 2(<i>hw</i>)²<i>C</i>, &nbsp;&nbsp; Ω(W-MSA) = 4<i>hwC</i>² + 2<i>M</i>²<i>hwC</i>`, 'Complexity')}
        <p><strong>Other designs:</strong> PVT and CvT (pyramids, conv token embeddings), MViT (multiscale, video), CoAtNet / MaxViT (conv early, attention later), MobileViT / EfficientViT / FastViT (mobile-friendly), ViTDet (plain ViT as a detection backbone with a simple pyramid, relying on MAE pretraining), token merging (ToMe), and FlashAttention for exact but memory-efficient attention.</p>` },
      { id: 'vs', title: 'CNN versus ViT', html: `
        ${table(['Aspect', 'CNN', 'Vision Transformer'], [['Inductive bias', 'locality, translation equivariance', 'almost none (position embeddings only)'], ['Small-data performance', 'strong', 'weak unless pretrained or heavily augmented'], ['Large-scale performance', 'good', 'excellent, keeps scaling'], ['Receptive field', 'grows with depth', 'global from layer 1'], ['Compute vs resolution', 'linear', 'quadratic (global attention)'], ['Dense prediction', 'natural (feature maps)', 'needs hierarchical variant or adapters'], ['Hardware support', 'very mature (cuDNN, int8, mobile)', 'improving rapidly'], ['Robustness to shifts', 'moderate; texture bias', 'often better on corruptions and shape bias']])}
        <p>In practice the line has blurred: ConvNeXt shows convolution can match transformers, and hybrids dominate efficiency leaderboards. For a new project, start with a strong pretrained backbone of either family and choose by accuracy–latency on your hardware.</p>` },
      { id: 'code', title: 'A minimal ViT in PyTorch', html: `
        ${code(`import torch, torch.nn as nn

class Block(nn.Module):
    def __init__(self, d, heads, mlp_ratio=4, drop=0.0):
        super().__init__()
        self.n1 = nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, dropout=drop, batch_first=True)
        self.n2 = nn.LayerNorm(d)
        self.mlp = nn.Sequential(nn.Linear(d, d * mlp_ratio), nn.GELU(), nn.Dropout(drop),
                                 nn.Linear(d * mlp_ratio, d))
    def forward(self, x):
        h = self.n1(x)
        x = x + self.attn(h, h, h, need_weights=False)[0]
        return x + self.mlp(self.n2(x))

class ViT(nn.Module):
    def __init__(self, img=224, patch=16, d=384, depth=12, heads=6, n_cls=1000):
        super().__init__()
        n = (img // patch) ** 2
        self.embed = nn.Conv2d(3, d, patch, patch)          # patchify + linear projection
        self.cls = nn.Parameter(torch.zeros(1, 1, d))
        self.pos = nn.Parameter(torch.zeros(1, n + 1, d))
        nn.init.trunc_normal_(self.pos, std=0.02)
        self.blocks = nn.Sequential(*[Block(d, heads) for _ in range(depth)])
        self.norm = nn.LayerNorm(d)
        self.head = nn.Linear(d, n_cls)

    def forward(self, x):
        x = self.embed(x).flatten(2).transpose(1, 2)        # N x tokens x d
        x = torch.cat([self.cls.expand(len(x), -1, -1), x], 1) + self.pos
        x = self.norm(self.blocks(x))
        return self.head(x[:, 0])                           # classify from [CLS]`)}
        <p>In real work use pretrained weights from timm:</p>
        ${code(`import timm
model = timm.create_model("vit_base_patch16_224.augreg_in21k_ft_in1k", pretrained=True, num_classes=10)
cfg = timm.data.resolve_data_config({}, model=model)
transform = timm.data.create_transform(**cfg, is_training=False)`)}` },
    ],
    checks: [
      ['How many tokens does ViT-B/16 create for a 224 × 224 image, and what is the sequence length including [CLS]?', '14 × 14 = 196 patches, 197 with [CLS].'],
      ['Why divide by √d_k in attention?', 'To keep dot products from growing with dimension and saturating the softmax.'],
      ['How does Swin achieve linear complexity and still exchange information between windows?', 'Attention only within local windows; alternate blocks use shifted windows.'],
      ['Why does ViT need more data than a CNN?', 'It lacks built-in locality and translation priors, so it must learn them from data.'],
    ],
    quiz: [
      { q: 'A 384×384 image with patch 16 gives how many patch tokens?', o: ['196', '576', '1024', '384'], a: 1, e: '(384/16)² = 24² = 576.' },
      { q: 'Doubling the resolution of a ViT input multiplies global attention cost by about…', o: ['2×', '4×', '16×', '8×'], a: 2, e: 'Tokens ×4, attention ∝ N² → ×16.' },
      { q: 'What does patch merging in Swin do?', o: ['Removes duplicate tokens', 'Concatenates 2×2 neighbours and projects 4C → 2C, halving resolution', 'Merges heads', 'Adds position embeddings'], a: 1 },
      { q: 'DeiT\'s main contribution was…', o: ['A new attention mechanism', 'Training ViT well on ImageNet-1k alone with a strong recipe (+ distillation token)', 'Window attention', 'Masked pretraining'], a: 1 },
      { q: 'Which statement about attention is true?', o: ['It is order-aware by default', 'It needs positional information added to the tokens', 'It has a local receptive field', 'It has linear cost in N'], a: 1 },
    ],
  });

  /* ============================ Chapter 14 ============================ */
  CV.addChapter({
    n: 14, part: 4, minutes: 30,
    title: 'Self-Supervised Learning and Foundation Models',
    sub: 'SimCLR, MoCo, BYOL, DINO, MAE, CLIP, Segment Anything, vision-language models, open-vocabulary detection and LoRA.',
    sections: [
      { id: 'ssl', title: 'Learning without labels', html: `
        <p>Labels are expensive; images are cheap. <span class="term">Self-supervised learning (SSL)</span> creates a training signal from the data itself, producing general-purpose representations reused with little labelled data (linear probe or fine-tuning). Families:</p>
        ${ul(['<strong>Contrastive:</strong> pull together embeddings of two augmented views of the same image, push apart different images.', '<strong>Self-distillation / non-contrastive:</strong> a student matches a slowly-updated teacher; no negatives needed.', '<strong>Masked image modelling:</strong> hide patches and reconstruct them.', '<strong>Image–text alignment:</strong> use captions from the web as supervision (CLIP).'])}` },
      { id: 'contrastive', title: 'Contrastive learning: SimCLR and MoCo', html: `
        <p><strong>SimCLR</strong> (2020): create two random augmentations of an image (crop, colour jitter, blur), encode both with a backbone plus projection head, and train with NT-Xent over a batch: the two views are positives, all other images are negatives.</p>
        ${f(`ℓ<sub><i>i</i>,<i>j</i></sub> = − log ${frac('exp( sim(<i>z<sub>i</sub></i>, <i>z<sub>j</sub></i>) / τ )', 'Σ<sub><i>k</i>≠<i>i</i></sub> exp( sim(<i>z<sub>i</sub></i>, <i>z<sub>k</sub></i>) / τ )')}`, 'NT-Xent / InfoNCE')}
        ${w('contrastive')}
        <p>SimCLR needs very large batches (4096+) to supply enough negatives; <strong>MoCo</strong> keeps a queue of past embeddings from a momentum (EMA) encoder, so small batches suffice. Strong augmentations, especially random crops plus colour jitter, are essential: they define which invariances are learned.</p>
        <h3>Without negatives: BYOL, SimSiam, DINO</h3>
        <p><strong>BYOL</strong> trains an online network (with an extra predictor) to match a target network whose weights are an EMA of the online weights; no negatives, yet no collapse thanks to the predictor, asymmetry and EMA. <strong>DINO</strong> (2021) applies self-distillation to ViTs: student and teacher see different crops (small local for the student, large global for the teacher); the teacher output is centred and sharpened to avoid collapse. Remarkably, a DINO ViT's attention maps segment objects without supervision. <strong>DINOv2</strong> (2023) scales this with a curated 142M-image dataset and image- plus patch-level objectives; its frozen features work very well for classification, retrieval, depth and segmentation with simple linear heads.</p>` },
      { id: 'mae', title: 'Masked autoencoders (MAE, 2021)', html: `
        ${flow('mae', 'MAE', 'Asymmetric encoder–decoder.')}
        ${w('mae-mask')}
        <p>MAE masks a very high fraction (75%) of patches. The ViT encoder only processes the visible 25% (pretraining ≈ 3× cheaper); a small decoder receives encoded tokens plus learned mask tokens and reconstructs the missing pixels. High masking makes the task non-trivial and forces semantic understanding. MAE-pretrained ViTs fine-tune excellently and became standard backbones (ViTDet, SAM's encoder). Related: BEiT (predict discrete visual tokens), data2vec, I-JEPA (predict embeddings of masked regions, not pixels).</p>
        <p><strong>How SSL is evaluated:</strong> linear probing (freeze backbone, train a linear classifier), k-NN on frozen features, and full fine-tuning. Good SSL features give high linear-probe accuracy and strong low-data fine-tuning.</p>` },
      { id: 'clip', title: 'CLIP: connecting images and language', html: `
        ${flow('clip', 'CLIP training', 'Contrastive image–text pretraining.')}
        <p><strong>CLIP</strong> (OpenAI, 2021) trains on about 400 million image–text pairs. A batch of N pairs gives an N × N similarity matrix; a symmetric cross-entropy loss makes each image most similar to its own caption (and vice versa).</p>
        <p><strong>Zero-shot classification:</strong> embed prompts like "a photo of a {class}" for every class name; the class whose text embedding is closest to the image embedding wins, with no task-specific training. CLIP ViT-L/14 reaches roughly 76% zero-shot top-1 on ImageNet and is notably robust under distribution shift.</p>
        ${w('clip-zeroshot')}
        <p>Applications: text-to-image search, zero-shot recognition, dataset filtering, text encoder for diffusion models, and the vision encoder of most VLMs. Successors: OpenCLIP, <strong>SigLIP</strong> (per-pair sigmoid loss instead of batch softmax; scales better, smaller batches), EVA-CLIP.</p>
        ${code(`import torch, open_clip
from PIL import Image
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
tok = open_clip.get_tokenizer("ViT-B-32")
img = preprocess(Image.open("dog.jpg")).unsqueeze(0)
text = tok(["a photo of a dog", "a photo of a cat", "a photo of a bicycle"])
with torch.no_grad():
    fi, ft = model.encode_image(img), model.encode_text(text)
    fi, ft = fi / fi.norm(dim=-1, keepdim=True), ft / ft.norm(dim=-1, keepdim=True)
    probs = (100.0 * fi @ ft.T).softmax(dim=-1)
print(probs)`)}` },
      { id: 'sam', title: 'Segment Anything (SAM)', html: `
        ${flow('sam', 'SAM architecture', 'Heavy encoder once, light decoder per prompt.')}
        <p>SAM (Meta, 2023) is a foundation model for <strong>promptable segmentation</strong>: given an image and a prompt (points, a box, a rough mask, or in some versions text), return valid masks for the prompted object.</p>
        ${ul(['<strong>Image encoder:</strong> a ViT-H pretrained with MAE (≈ 632 M params) converts a 1024 × 1024 image into a 64 × 64 × 256 embedding. Expensive, but run once per image.', '<strong>Prompt encoder:</strong> points and boxes become positional encodings plus learned type embeddings; masks pass through small convs.', '<strong>Mask decoder:</strong> a light transformer decoder with two-way attention, then upsampling; predicts three masks for an ambiguous prompt (part, object, whole) with predicted IoU scores. Tens of milliseconds, so interactive.', '<strong>Data engine and SA-1B:</strong> model-in-the-loop annotation produced 1.1 billion masks on 11 million images.'])}
        <p><strong>SAM 2</strong> (2024) extends to video with streaming memory attention, propagating a prompt through a clip. SAM is widely used for auto-labelling: generate masks, correct them, then train a small fast model for deployment.</p>
        ${code(`from segment_anything import sam_model_registry, SamPredictor
import numpy as np, cv2
sam = sam_model_registry["vit_b"](checkpoint="sam_vit_b.pth").to("cuda")
pred = SamPredictor(sam)
pred.set_image(cv2.cvtColor(cv2.imread("room.jpg"), cv2.COLOR_BGR2RGB))   # heavy encoder runs once
masks, scores, _ = pred.predict(point_coords=np.array([[420, 310]]), point_labels=np.array([1]),
                                multimask_output=True)                    # 3 candidate masks
best = masks[scores.argmax()]`)}` },
      { id: 'vlm', title: 'Vision-language models (VLMs)', html: `
        ${flow('vlm', 'VLM architecture', 'Vision encoder → projector → LLM.')}
        ${ol(['<strong>Vision encoder:</strong> a CLIP or SigLIP ViT (sometimes with tiling for high resolution) turns the image into patch features.', '<strong>Projector:</strong> a linear layer or MLP (LLaVA), a Q-Former with learned queries (BLIP-2), or a resampler (Flamingo) maps visual features into the LLM\'s token space.', '<strong>Language model:</strong> a decoder-only transformer reads visual + text tokens and generates the answer autoregressively.'])}
        <p>Training: stage 1 aligns vision and language on image–caption pairs (mostly the projector); stage 2 does visual instruction tuning on conversation, VQA, OCR and grounding data (projector + LLM, often with LoRA). Examples: LLaVA, BLIP-2, Flamingo, Qwen-VL, PaliGemma and proprietary assistants. Capabilities: captioning, VQA, OCR, chart and document understanding, grounding, reasoning over images.</p>
        ${warn('Known weaknesses: hallucination, counting and precise spatial relations, fine text at low resolution, and cost (hundreds to thousands of visual tokens per image). For fixed-class production tasks, a small specialised model is still faster, cheaper and more accurate.')}` },
      { id: 'openvocab', title: 'Open-vocabulary detection and segmentation', html: `
        ${ul(['<strong>OWL-ViT / OWLv2:</strong> CLIP-style ViT with detection heads; text or image queries.', '<strong>Grounding DINO:</strong> DINO detector fused with a text encoder; type a phrase ("person wearing a yellow helmet") and get boxes.', '<strong>YOLO-World:</strong> real-time open-vocabulary YOLO whose text embeddings can be pre-computed and folded into the weights.', '<strong>CLIPSeg, SEEM, Grounded-SAM:</strong> text-to-mask pipelines (Grounding DINO boxes prompt SAM).'])}
        ${tip('A powerful workflow: use Grounding DINO + SAM to auto-label thousands of images, review quickly, then train a compact YOLO for deployment ("distilling" the foundation model into an edge model).')}` },
      { id: 'decide', title: 'Using foundation models: a decision guide', html: `
        ${table(['Option', 'When', 'Cost'], [['Zero-shot prompt (CLIP, Grounding DINO, VLM)', 'no labelled data, classes change often', 'none, but slower and less accurate'], ['Frozen features + linear head / k-NN (DINOv2, CLIP)', 'few labels (tens to hundreds), fast baseline', 'very low'], ['Parameter-efficient fine-tuning (LoRA, adapters, prompt tuning)', 'moderate data, limited GPU', 'low; trains under 1% of weights'], ['Full fine-tuning', 'plenty of data, need best accuracy', 'higher'], ['Distill into a small model', 'deployment on edge / real time', 'extra training stage']])}
        <p><strong>LoRA</strong> keeps a pretrained weight matrix W frozen and learns a low-rank update W' = W + B A, with A: r × k and B: d × r, r tiny (4 to 64). Only A and B are trained and stored.</p>
        ${w('lora')}` },
    ],
    checks: [
      ['In SimCLR, what counts as a positive and what as negatives?', 'Positive: two augmented views of the same image. Negatives: views of all other images in the batch.'],
      ['Why can MAE mask 75 percent of patches and still learn?', 'Images are highly redundant, so reconstructing missing content needs semantic understanding; the encoder sees only visible patches, making it efficient.'],
      ['How does CLIP do zero-shot classification?', 'Compare the image embedding with text embeddings of prompts for each class name; pick the highest cosine similarity.'],
      ['Why is SAM\'s design interactive?', 'The heavy image encoder runs once per image; only the light prompt encoder and decoder run for each new prompt.'],
      ['What are the three parts of a typical VLM?', 'Vision encoder, projector/connector, and a large language model.'],
    ],
    quiz: [
      { q: 'MoCo avoids SimCLR\'s huge batches by…', o: ['Removing negatives', 'A queue of past embeddings from a momentum encoder', 'Masking patches', 'Using text'], a: 1 },
      { q: 'What prevents collapse in BYOL without negatives?', o: ['Huge batches', 'Predictor + asymmetry + EMA target network', 'Label smoothing', 'Pixel reconstruction'], a: 1 },
      { q: 'A batch of 256 image–caption pairs gives CLIP a similarity matrix of…', o: ['256 values', '256 × 256', '512 × 512', '256 × 768'], a: 1 },
      { q: 'You have 50 labelled images per class and a laptop GPU. Best first try?', o: ['Full fine-tune of ViT-H', 'DINOv2/CLIP frozen features + linear head or k-NN', 'Train from scratch', 'GAN augmentation'], a: 1 },
      { q: 'LoRA with d = k = 1024 and r = 8 trains about what fraction of the layer?', o: ['0.8%', '1.6%', '8%', '50%'], a: 1, e: '8·(1024+1024) / 1024² ≈ 1.56%.' },
    ],
  });

  /* ============================ Chapter 15 ============================ */
  CV.addChapter({
    n: 15, part: 4, minutes: 24,
    title: 'Generative Vision Models',
    sub: 'Autoencoders and VAEs, GANs, diffusion models, classifier-free guidance, latent diffusion, ControlNet and evaluation.',
    sections: [
      { id: 'intro', title: 'Discriminative vs generative', html: `
        <p>Discriminative models learn p(y | x): what is in this image? Generative models learn the distribution of images p(x) itself, so we can sample new images, complete or edit existing ones, and condition generation on text, sketches or depth.</p>` },
      { id: 'vae', title: 'Autoencoders and VAEs', html: `
        <p>An <strong>autoencoder</strong> compresses an image to a small latent code z with an encoder and reconstructs it with a decoder, trained with a reconstruction loss. Useful for compression, denoising and anomaly detection, but its latent space is not organised for sampling.</p>
        <p>A <span class="term">Variational Autoencoder (VAE)</span> makes the latent space smooth and sampleable: the encoder outputs a mean μ and variance σ², and z = μ + σ ⊙ ε (ε ~ N(0, I), the <strong>reparameterisation trick</strong>, which keeps sampling differentiable). The loss is the negative ELBO:</p>
        ${f(`<i>L</i> = E<sub><i>q</i>(<i>z</i>|<i>x</i>)</sub>[ −log <i>p</i>(<i>x</i> | <i>z</i>) ] + KL( <i>q</i>(<i>z</i> | <i>x</i>) ‖ N(0, I) )`, 'VAE objective')}
        <p>The first term is reconstruction; the KL term keeps the latent distribution close to a standard normal, so decoding random z gives plausible images. VAE samples tend to be blurry, but VAEs are the compression stage inside Stable Diffusion. VQ-VAE / VQGAN use a discrete codebook of latent tokens, enabling autoregressive transformer generators.</p>` },
      { id: 'gan', title: 'Generative Adversarial Networks', html: `
        <p>A generator G maps noise z to an image; a discriminator D tries to tell real from fake. They play a minimax game:</p>
        ${f(`min<sub><i>G</i></sub> max<sub><i>D</i></sub> &nbsp; E<sub><i>x</i></sub>[ log <i>D</i>(<i>x</i>) ] + E<sub><i>z</i></sub>[ log(1 − <i>D</i>(<i>G</i>(<i>z</i>))) ]`, 'GAN objective')}
        ${w('gan-1d')}
        <p>Milestones: DCGAN, WGAN (Wasserstein loss for stability), pix2pix (paired translation), CycleGAN (unpaired, with cycle consistency), StyleGAN 1–3 (mapping network and per-layer style modulation), BigGAN, GigaGAN. GANs are fast at inference (one pass) but hard to train (instability, <strong>mode collapse</strong>) and have been largely overtaken by diffusion for general synthesis; they remain popular for super-resolution, real-time effects and image-to-image tasks.</p>` },
      { id: 'diffusion', title: 'Diffusion models', html: `
        <p>Diffusion models (DDPM, 2020) are trained by a surprisingly simple idea.</p>
        <p><strong>Forward process (fixed).</strong> Add a little Gaussian noise at each of T steps (typically T = 1000) following a schedule β<sub>t</sub>: q(x<sub>t</sub> | x<sub>t−1</sub>) = N(√(1 − β<sub>t</sub>) x<sub>t−1</sub>, β<sub>t</sub> I). With α<sub>t</sub> = 1 − β<sub>t</sub> and ᾱ<sub>t</sub> = α<sub>1</sub>α<sub>2</sub>…α<sub>t</sub>, a closed form jumps straight to any step:</p>
        ${f(`<i>x<sub>t</sub></i> = √ᾱ<sub><i>t</i></sub> · <i>x</i><sub>0</sub> + √(1 − ᾱ<sub><i>t</i></sub>) · ε, &nbsp;&nbsp; ε ~ N(0, I)`, 'Forward process')}
        ${w('diffusion-forward')}
        <p><strong>Reverse process (learned).</strong> A network ε<sub>θ</sub>(x<sub>t</sub>, t) is trained to predict the noise that was added:</p>
        ${f(`<i>L</i> = E<sub><i>x</i>₀, <i>t</i>, ε</sub> [ ‖ ε − ε<sub>θ</sub>(<i>x<sub>t</sub></i>, <i>t</i>) ‖² ]`, 'Training loss')}
        <p>Training: pick an image, a random t and noise ε, build x<sub>t</sub>, predict ε, minimise the squared error. Sampling: start from pure noise x<sub>T</sub> and repeatedly denoise:</p>
        ${f(`<i>x</i><sub><i>t</i>−1</sub> = ${frac('1', '√α<sub><i>t</i></sub>')} ( <i>x<sub>t</sub></i> − ${frac('1 − α<sub><i>t</i></sub>', '√(1 − ᾱ<sub><i>t</i></sub>)')} ε<sub>θ</sub>(<i>x<sub>t</sub></i>, <i>t</i>) ) + σ<sub><i>t</i></sub><i>z</i>`, 'DDPM sampling step')}
        ${w('diffusion-reverse')}
        <p>The network is usually a U-Net with ResNet blocks, self-attention at low resolution and a sinusoidal timestep embedding in every block; newer models use Diffusion Transformers (DiT). <strong>Faster sampling:</strong> DDIM and ODE solvers (DPM-Solver, Euler) give good images in 20–50 steps; distillation and consistency models in 1–4. <strong>Flow matching / rectified flow</strong> (Stable Diffusion 3, Flux) learns a velocity field moving noise to data along nearly straight paths.</p>` },
      { id: 'cfg', title: 'Conditioning and classifier-free guidance', html: `
        <p>To control generation the denoiser also receives a condition c (class label, text embedding, edge map). Text is injected through <strong>cross-attention</strong>: image features are queries, text-encoder tokens (CLIP or T5) are keys and values. <span class="term">Classifier-free guidance (CFG)</span> trains the model with the condition randomly dropped, then at sampling extrapolates away from the unconditional prediction:</p>
        ${f(`ε̂ = ε<sub>θ</sub>(<i>x<sub>t</sub></i>, ∅) + <i>w</i> · ( ε<sub>θ</sub>(<i>x<sub>t</sub></i>, <i>c</i>) − ε<sub>θ</sub>(<i>x<sub>t</sub></i>, ∅) )`, 'Classifier-free guidance')}
        ${w('cfg')}
        <p>Guidance scale w (about 5–10 for text-to-image) trades diversity for fidelity to the prompt.</p>` },
      { id: 'ldm', title: 'Latent diffusion (Stable Diffusion)', html: `
        ${flow('ldm', 'Latent diffusion', 'Diffusion in a compressed latent space.')}
        <p>Pixel-space diffusion at 512 × 512 is expensive. Latent Diffusion Models first train a VAE that compresses an image 8× per side (512 × 512 × 3 → 64 × 64 × 4, about 48× fewer values), run diffusion in that latent space, and decode the final latent back to pixels. Components: text encoder, denoising U-Net/DiT, VAE decoder, scheduler (sampler).</p>
        <h3>Control and customisation</h3>
        ${ul(['<strong>ControlNet:</strong> adds spatial conditions (edges, depth, pose, segmentation) through a trainable copy of the encoder joined to the frozen model by zero-initialised convolutions.', '<strong>LoRA, DreamBooth, textual inversion:</strong> learn a new subject or style from a handful of images.', 'Inpainting/outpainting, InstructPix2Pix (edit by instruction), IP-Adapter (image prompts), super-resolution diffusion, video diffusion (temporal layers).'])}
        <h3>Evaluating generative models</h3>
        <p><strong>FID</strong> (Fréchet Inception Distance): distance between Gaussian fits of Inception features of real and generated images (lower is better). Also Inception Score, CLIP score (prompt alignment), precision/recall of distributions and human preference tests. Metrics are imperfect; always look at samples.</p>
        ${code(`# Inference with Hugging Face diffusers
import torch
from diffusers import StableDiffusionXLPipeline
pipe = StableDiffusionXLPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0",
                                                 torch_dtype=torch.float16).to("cuda")
img = pipe("a sketch of a robot reading a book, clean line art",
           num_inference_steps=30, guidance_scale=7.0).images[0]
img.save("robot.png")

# Core of DDPM training: predict the noise
def diffusion_loss(model, x0, alphas_bar):      # x0: N x C x H x W in [-1, 1]
    n = x0.shape[0]
    t = torch.randint(0, len(alphas_bar), (n,), device=x0.device)
    eps = torch.randn_like(x0)
    ab = alphas_bar[t].view(n, 1, 1, 1)
    xt = ab.sqrt() * x0 + (1 - ab).sqrt() * eps  # closed-form forward process
    return torch.nn.functional.mse_loss(model(xt, t), eps)`)}
        ${warn('Generative models can create convincing fake images (deepfakes), reproduce training-data styles and raise copyright and consent questions. Use provenance tools (watermarks, C2PA content credentials), respect licences, and disclose synthetic media.')}` },
    ],
    checks: [
      ['What does a diffusion network learn to predict in DDPM training?', 'The Gaussian noise added to the image at a random timestep.'],
      ['Why is latent diffusion cheaper than pixel diffusion?', 'Denoising runs on a compressed latent (e.g. 64 × 64 × 4) instead of full-resolution pixels.'],
      ['What does classifier-free guidance do?', 'Extrapolates from the unconditional to the conditional noise prediction, increasing prompt adherence at a cost in diversity.'],
      ['Compare GANs and diffusion models.', 'GANs sample in one pass but train unstably (mode collapse); diffusion trains stably with high quality and diversity but needs many sampling steps.'],
    ],
    quiz: [
      { q: 'What does the reparameterisation trick make possible?', o: ['Discrete latents', 'Backpropagating through sampling z = μ + σ⊙ε', 'Faster sampling', 'Text conditioning'], a: 1 },
      { q: 'At t = T in the forward process, x_T is essentially…', o: ['The original image', 'Pure Gaussian noise', 'A blurred image', 'The latent code'], a: 1 },
      { q: 'With guidance scale w = 0, CFG gives…', o: ['Conditional samples', 'Unconditional samples', 'No output', 'The training image'], a: 1 },
      { q: 'Stable Diffusion\'s VAE turns a 512×512×3 image into…', o: ['64×64×4 latent', '256×256×3', '8×8×512', '77 tokens'], a: 0 },
      { q: 'ControlNet adds spatial conditions via…', o: ['A new text encoder', 'A trainable encoder copy linked by zero-initialised convolutions', 'Retraining the whole U-Net', 'A GAN discriminator'], a: 1 },
    ],
  });

  /* ============================ Chapter 16 ============================ */
  CV.addChapter({
    n: 16, part: 4, minutes: 20,
    title: 'Efficient Models and Deployment',
    sub: 'What to measure, quantization, pruning, distillation, operator fusion, export formats, hardware, and building real-time systems.',
    sections: [
      { id: 'measure', title: 'What to measure', html: `
        <p>A model is only useful when it runs where it is needed: a phone, a camera, a robot, a browser or a server farm.</p>
        ${table(['Metric', 'Meaning', 'Caveat'], [['Parameters', 'model size (memory for weights)', 'not equal to speed'], ['FLOPs / MACs', 'arithmetic operations per image', 'ignores memory traffic; depthwise layers look cheap but are memory-bound'], ['Latency', 'time for one image (ms), batch size 1 for real-time', 'measure on target hardware, include pre/post-processing'], ['Throughput', 'images per second at a given batch size', 'server workloads'], ['Memory', 'peak RAM/VRAM; activations dominate at high resolution', 'critical on edge'], ['Energy', 'joules per inference', 'critical on battery'], ['Accuracy', 'task metric on target data', 'always report with speed']])}
        ${tip('Benchmark properly: warm up, synchronise the GPU (<code>torch.cuda.synchronize()</code>) before timing, repeat many times and report median and 95th percentile.')}` },
      { id: 'quant', title: 'Quantization', html: `
        <p>Store and compute weights (and activations) in 8-bit integers instead of 32-bit floats: 4× smaller, usually 2–4× faster on hardware with integer units, small accuracy loss. A real value x maps to an integer with a scale s and zero point z:</p>
        ${f(`<i>q</i> = clip( round(<i>x</i> / <i>s</i>) + <i>z</i>, <i>q</i><sub>min</sub>, <i>q</i><sub>max</sub> ), &nbsp;&nbsp; <i>x</i> ≈ <i>s</i> · (<i>q</i> − <i>z</i>)`, 'Affine quantization')}
        ${w('quantize')}
        ${ul(['<strong>FP16 / BF16:</strong> half precision, nearly free on GPUs (2× faster, half the memory).', '<strong>Post-Training Quantization (PTQ):</strong> calibrate scales on a few hundred representative images; no retraining.', '<strong>Quantization-Aware Training (QAT):</strong> simulate quantization during fine-tuning; best accuracy at INT8 and below.', '<strong>Per-channel</strong> scales for weights beat per-tensor.', 'Be careful with detectors: box regression and the first/last layers are most sensitive.'])}` },
      { id: 'prune', title: 'Pruning and knowledge distillation', html: `
        ${w('pruning')}
        <p><strong>Knowledge distillation</strong> trains a small student to mimic a large teacher. With temperature T the student matches the teacher's softened probabilities as well as the hard labels:</p>
        ${f(`<i>L</i> = α · CE(<i>y</i>, <i>p<sub>s</sub></i>) + (1 − α) · <i>T</i>² · KL( softmax(<i>z<sub>t</sub></i>/<i>T</i>) ‖ softmax(<i>z<sub>s</sub></i>/<i>T</i>) )`, 'Distillation')}
        ${w('distill')}
        <p>Variants distil intermediate features, attention maps or detector outputs. Distilling a foundation model into a small task model is a very effective edge strategy.</p>` },
      { id: 'graph', title: 'Efficient architecture and graph optimisation', html: `
        ${ul(['Choose efficient families: MobileNet, EfficientNet-Lite, YOLO-n/s, RepVGG, EfficientViT.', '<strong>Operator fusion:</strong> fold BatchNorm into the preceding conv: w\' = w · γ / √(σ² + ε), b\' = (b − μ) · γ / √(σ² + ε) + β, and fuse activations; saves memory traffic. <strong>Re-parameterisation</strong> (RepVGG, YOLOv6/7) trains multi-branch blocks and merges them into one 3 × 3 conv for inference.', 'Lower input resolution and crop regions of interest before the heavy model.', '<strong>Cascades:</strong> a tiny model filters easy frames, a bigger one processes the rest.'])}` },
      { id: 'export', title: 'Export formats, runtimes and hardware', html: `
        ${table(['Format / runtime', 'Target'], [['ONNX + ONNX Runtime', 'portable interchange; CPU, GPU, mobile, web'], ['TensorRT', 'NVIDIA GPUs and Jetson; fastest on NVIDIA; FP16/INT8'], ['OpenVINO', 'Intel CPUs, iGPUs, VPUs'], ['TensorFlow Lite', 'Android, microcontrollers, Coral Edge TPU'], ['Core ML', 'Apple devices (Neural Engine)'], ['NCNN / MNN / TNN', 'mobile ARM CPUs and GPUs'], ['ExecuTorch / PyTorch Mobile', 'on-device PyTorch'], ['WebGPU / ONNX Web / TF.js', 'in the browser']])}
        ${code(`# Export a PyTorch model to ONNX and run it
import torch, onnxruntime as ort, numpy as np
model.eval()
dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy, "model.onnx", input_names=["images"], output_names=["logits"],
                  dynamic_axes={"images": {0: "batch"}}, opset_version=17)
sess = ort.InferenceSession("model.onnx", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
out = sess.run(None, {"images": np.random.randn(1, 3, 224, 224).astype(np.float32)})[0]

# Benchmarking latency correctly on GPU
import time, torch
model = model.cuda().half().eval()
x = torch.randn(1, 3, 640, 640, device="cuda", dtype=torch.half)
with torch.no_grad():
    for _ in range(20): model(x)                       # warm-up
    torch.cuda.synchronize(); ts = []
    for _ in range(200):
        t0 = time.perf_counter(); model(x); torch.cuda.synchronize(); ts.append(time.perf_counter() - t0)
print("median ms:", 1000 * sorted(ts)[len(ts) // 2])`)}
        ${table(['Platform', 'Typical use', 'Notes'], [['Desktop / server GPU', 'training, batch inference', 'highest throughput, FP16/BF16'], ['NVIDIA Jetson (Nano, Orin)', 'robots, cameras, drones', 'TensorRT, DeepStream'], ['Raspberry Pi / ARM CPU', 'hobby and low-cost edge', 'small models, NCNN or TFLite, INT8'], ['Google Coral / other NPUs', 'always-on vision', 'INT8 TFLite models only'], ['Smartphones (NPU/GPU)', 'on-device apps', 'Core ML, NNAPI, TFLite, ExecuTorch'], ['Microcontrollers', 'TinyML sensors', 'kilobytes of RAM; tiny CNNs']])}` },
      { id: 'realtime', title: 'Building a real-time system', html: `
        ${w('latency')}
        ${ul(['<strong>The model is only part of the latency.</strong> Capture, decoding, resizing, normalisation, NMS, tracking and drawing often cost as much as inference. Profile the whole pipeline; use GPU decoding and zero-copy buffers (GStreamer, DeepStream) for multi-camera systems.', 'Batching helps throughput on servers; real-time edge uses batch size 1 and pipelining (capture, infer and post-process in parallel threads).', 'Serving: FastAPI or gRPC wrappers, NVIDIA Triton, TorchServe, or a message queue for async jobs.', 'Monitoring: log input statistics and prediction confidence, sample frames for review, track drift, plan retraining. Version datasets, code and weights together.', '<strong>Preprocessing parity:</strong> same resize interpolation, colour order and normalisation as in training. This is the number-one cause of "works in the notebook, fails on device".'])}` },
    ],
    checks: [
      ['Why can a model with fewer FLOPs still be slower?', 'Latency also depends on memory access and hardware support; depthwise layers have low FLOPs but poor hardware utilisation.'],
      ['Difference between PTQ and QAT?', 'PTQ calibrates a trained model without retraining; QAT simulates quantization during fine-tuning for better accuracy.'],
      ['What does knowledge distillation transfer?', 'The teacher\'s soft predictions (and optionally features) to a smaller student.'],
      ['Why must you synchronise the GPU when timing?', 'CUDA calls are asynchronous; without synchronisation you only measure launch time.'],
    ],
    quiz: [
      { q: 'INT8 weights vs FP32 weights: model size shrinks by…', o: ['2×', '4×', '8×', '32×'], a: 1 },
      { q: 'Which pruning gives a direct speed-up on ordinary hardware?', o: ['Unstructured', 'Structured (whole channels)', 'Random', 'None'], a: 1 },
      { q: 'You want to run a detector on an NVIDIA Jetson as fast as possible. Export to…', o: ['Core ML', 'TensorRT', 'TF.js', 'OpenVINO'], a: 1 },
      { q: 'Your model is great in Python but bad on the phone. First suspect?', o: ['Too few epochs', 'Preprocessing mismatch (colour order, resize, normalisation)', 'Wrong optimizer', 'Dropout'], a: 1 },
    ],
  });

  /* ============================ Chapter 17 ============================ */
  CV.addChapter({
    n: 17, part: 4, minutes: 16,
    title: 'Robustness, Explainability and Responsible Use',
    sub: 'Distribution shift, shortcut learning, adversarial examples, calibration, Grad-CAM, fairness, privacy and governance.',
    sections: [
      { id: 'shift', title: 'Distribution shift and shortcut learning', html: `
        <p>Models are trained on one distribution and deployed on another: different cameras, weather, seasons, hospitals, countries. Accuracy can drop sharply (ImageNet-C applies blur, noise, fog and JPEG artefacts and measures the degradation). Mitigations: diverse training data, strong augmentation matching deployment, domain adaptation and test-time adaptation, large pretrained models (often more robust), test-time augmentation, and continual monitoring and retraining.</p>
        <p><strong>Shortcut learning:</strong> networks use whatever cue predicts the label, even a spurious one: a "wolf vs husky" classifier that really detects snow; a pneumonia model reading the hospital's scanner marker; a "cow" detector relying on green pasture. Detect shortcuts by testing on out-of-context data, using saliency maps, and curating balanced datasets.</p>` },
      { id: 'adv', title: 'Adversarial examples', html: `
        <p>Tiny, imperceptible perturbations can flip a prediction. The classic <strong>FGSM</strong> attack moves the input one step in the direction that increases the loss:</p>
        ${f(`<i>x'</i> = <i>x</i> + ε · sign( ∇<sub><i>x</i></sub> <i>L</i>(<i>f</i>(<i>x</i>), <i>y</i>) )`, 'FGSM')}
        ${w('fgsm')}
        <p>Physical attacks (stickers, patches) also exist. Defences: adversarial training (improves robustness at a cost in clean accuracy), input pre-processing, certified methods, ensembles; no defence is complete. Security-sensitive systems should combine the model with other sensors and sanity checks.</p>` },
      { id: 'calib', title: 'Calibration and uncertainty', html: `
        <p>A model that says "95 percent confident" should be right 95 percent of the time. Modern deep networks are often over-confident. Measure with Expected Calibration Error (ECE) and reliability diagrams; fix with <strong>temperature scaling</strong> (divide logits by a single learned T on validation data), label smoothing or ensembles.</p>
        ${w('calibration')}
        <p>For uncertainty, use deep ensembles, MC dropout or evidential methods. For out-of-distribution inputs use max-softmax, energy scores or feature-distance methods, and reject uncertain cases to a human.</p>` },
      { id: 'xai', title: 'Explaining predictions', html: `
        ${ul(['<strong>Saliency maps / gradients:</strong> which pixels change the output most.', '<strong>Grad-CAM:</strong> weight the last conv feature maps A<sup>k</sup> by the average gradient of the class score with respect to each map, sum them, keep positive values.', 'Occlusion sensitivity, LIME, SHAP, integrated gradients; for transformers, attention rollout and gradient-based attribution.'])}
        ${f(`α<sub><i>k</i></sub> = (1/<i>Z</i>) Σ<sub><i>i</i>,<i>j</i></sub> ∂<i>y<sup>c</sup></i> / ∂<i>A<sup>k</sup><sub>ij</sub></i>, &nbsp;&nbsp; Heatmap = ReLU( Σ<sub><i>k</i></sub> α<sub><i>k</i></sub> · <i>A<sup>k</sup></i> )`, 'Grad-CAM')}
        ${w('gradcam')}
        ${code(`import torch, torch.nn.functional as F
feats, grads = {}, {}
layer = model.layer4[-1]                                    # last conv block of a ResNet
layer.register_forward_hook(lambda m, i, o: feats.update(a=o))
layer.register_full_backward_hook(lambda m, gi, go: grads.update(g=go[0]))

x = preprocess(img).unsqueeze(0)
score = model(x)[0].max()                                   # top class score
model.zero_grad(); score.backward()
w = grads["g"].mean(dim=(2, 3), keepdim=True)               # alpha_k
cam = F.relu((w * feats["a"]).sum(1, keepdim=True))
cam = F.interpolate(cam, size=x.shape[-2:], mode="bilinear")[0, 0]
cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)    # heatmap in [0, 1]`)}
        ${note('Saliency maps are sanity checks, not proofs of reasoning: always combine them with performance on carefully designed test sets.')}` },
      { id: 'fair', title: 'Fairness, privacy and governance', html: `
        ${ul(['<strong>Evaluate by subgroup</strong> (skin tone, age, gender, geography, camera type), not only the average. Large gaps indicate data or modelling bias. Fairness criteria (demographic parity, equalised odds) can conflict; choose with stakeholders.', '<strong>Privacy:</strong> images of people are personal data. Minimise collection, blur or discard faces when not needed, process on-device where possible, secure storage, and follow the applicable law (e.g. GDPR in Europe, India\'s Digital Personal Data Protection Act 2023, sector rules for medical data).', '<strong>Documentation:</strong> a datasheet for your dataset and a model card (intended use, training data, metrics by subgroup, limitations).', '<strong>Human in the loop</strong> for high-stakes decisions (medical, legal, safety); define failure handling and escalation.', '<strong>Security:</strong> protect against data poisoning, model extraction, and prompt injection in multimodal systems.', '<strong>Environmental cost:</strong> reuse pretrained models and prefer efficient architectures.'])}` },
    ],
    checks: [
      ['What is shortcut learning? Give an example.', 'Using spurious cues that correlate with labels in training (for example snow for "wolf").'],
      ['What does Grad-CAM show?', 'A heatmap of image regions that most increased the class score, from gradient-weighted last-layer feature maps.'],
      ['What does temperature scaling fix?', 'Over-confidence: divides logits by one learned scalar so confidence matches accuracy.'],
      ['Why evaluate performance by subgroup?', 'Average accuracy can hide large error-rate gaps between groups.'],
    ],
    quiz: [
      { q: 'Temperature scaling changes a classifier\'s…', o: ['Accuracy', 'Confidence values but not the argmax', 'Architecture', 'Training data'], a: 1 },
      { q: 'FGSM perturbs each pixel by…', o: ['Random noise', 'ε times the sign of the loss gradient', 'The full gradient', 'A blur kernel'], a: 1 },
      { q: 'A model is 95% accurate overall but 70% on one skin-tone group. This shows…', o: ['Overfitting', 'A subgroup performance gap hidden by the average', 'Good calibration', 'Adversarial vulnerability'], a: 1 },
      { q: 'Which best describes saliency maps?', o: ['Proof of the model\'s reasoning', 'Sanity checks to combine with careful test sets', 'A training loss', 'A defence against attacks'], a: 1 },
    ],
  });
})();

/* Part III: Core Vision Tasks (Chapters 10–12) */
(function () {
  const { h } = CV;
  const { f, frac, table, code, w, ul, ol, key, warn, tip, note } = h;
  const flow = (d, title, desc) => w('flow', { d, meta: { title, desc } });

  /* ============================ Chapter 10 ============================ */
  CV.addChapter({
    n: 10, part: 3, minutes: 40,
    title: 'Object Detection',
    sub: 'IoU, AP and mAP, NMS, anchors, the R-CNN family, FPN, YOLO from v1 to today, focal loss, anchor-free heads and DETR.',
    sections: [
      { id: 'problem', title: 'Problem definition and box formats', html: `
        <p>Object detection answers <strong>"what is where?"</strong>: for every object of interest, output a bounding box, a class label and a confidence score. The number of objects is unknown and varies per image, which makes detection harder than classification.</p>
        ${table(['Format', 'Values', 'Used by'], [['xyxy', 'x_min, y_min, x_max, y_max (pixels)', 'OpenCV drawing, many APIs'], ['xywh', 'x_min, y_min, width, height', 'COCO JSON'], ['cxcywh normalised', 'centre x, centre y, w, h, each divided by image size (0 to 1)', 'YOLO label files, DETR']])}
        <p>A YOLO label file has one line per object: <code>class cx cy w h</code>, for example <code>2 0.512 0.430 0.200 0.350</code>.</p>
        ${w('box-formats')}` },
      { id: 'iou', title: 'Evaluation: IoU, precision–recall, AP and mAP', html: `
        <p><span class="term">Intersection over Union</span> measures box overlap: area(A ∩ B) / area(A ∪ B).</p>
        ${w('iou')}
        <p><strong>Matching.</strong> A prediction is a true positive if its class is right and its IoU with a not-yet-matched ground-truth box is above a threshold (commonly 0.5); otherwise it is a false positive. Ground-truth boxes no prediction matched are false negatives.</p>
        <p><strong>Average Precision (AP).</strong> Sort all predictions of one class by confidence. Walking down the list, compute precision and recall at each step to draw the precision–recall curve. AP is the area under this curve (made monotone by taking the maximum precision at any higher recall).</p>
        ${w('ap-curve')}
        ${ul(['<strong>mAP@0.5</strong> (PASCAL VOC style): mean of AP over classes at IoU 0.5.', '<strong>mAP@[0.5:0.95]</strong> (COCO style, written AP): mean over 10 IoU thresholds 0.50, 0.55, …, 0.95 and over classes. It rewards precise localisation and is the headline COCO number.', '<strong>AP<sub>S</sub>, AP<sub>M</sub>, AP<sub>L</sub>:</strong> AP for small (area below 32² pixels), medium and large objects. Small-object AP is usually the weakest.', '<strong>Speed:</strong> FPS and latency (ms) on stated hardware at a stated input size, with or without NMS. Always report accuracy and speed together.'])}` },
      { id: 'nms', title: 'Non-Maximum Suppression', html: `
        <p>Dense detectors fire many boxes around each object. NMS cleans them up: sort boxes by score; keep the best; discard remaining boxes of the same class whose IoU with it exceeds a threshold (for example 0.5 to 0.7); repeat.</p>
        ${w('nms')}
        <p>Variants: <strong>Soft-NMS</strong> (decay scores instead of deleting, helps crowded scenes), DIoU-NMS, class-agnostic NMS. Modern end-to-end detectors (DETR, YOLOv10 and later NMS-free heads) learn to avoid duplicates and drop this step.</p>
        ${code(`import torch
from torchvision.ops import nms, box_iou
keep = nms(boxes_xyxy, scores, iou_threshold=0.5)   # indices of boxes to keep`)}` },
      { id: 'anchors', title: 'Anchors and box regression', html: `
        <p>Many detectors place <span class="term">anchor boxes</span> (prior boxes with several scales and aspect ratios, e.g. 1:1, 1:2, 2:1) at every location of a feature map. Each anchor predicts a class score and an offset that turns the anchor into the final box:</p>
        ${f(`<i>t<sub>x</sub></i> = (<i>x</i> − <i>x<sub>a</sub></i>)/<i>w<sub>a</sub></i>, &nbsp; <i>t<sub>y</sub></i> = (<i>y</i> − <i>y<sub>a</sub></i>)/<i>h<sub>a</sub></i>, &nbsp; <i>t<sub>w</sub></i> = log(<i>w</i>/<i>w<sub>a</sub></i>), &nbsp; <i>t<sub>h</sub></i> = log(<i>h</i>/<i>h<sub>a</sub></i>)`, 'Box encoding')}
        <p>Predicting offsets (small, well-scaled numbers) is easier than predicting absolute coordinates, and the log makes size changes multiplicative. During training each anchor is assigned positive (IoU above about 0.5–0.7), negative (below about 0.3–0.4) or ignored.</p>
        ${w('anchors')}` },
      { id: 'rcnn', title: 'Two-stage detectors: the R-CNN family', html: `
        <h3>R-CNN (2014)</h3>
        <p>About 2000 region proposals per image from Selective Search, each warped to 227 × 227 and run through a CNN; SVMs classify, regression refines boxes. Accurate for its time but about <strong>47 seconds per image</strong> because the CNN ran 2000 times.</p>
        <h3>Fast R-CNN (2015)</h3>
        <p>Run the CNN once on the whole image, project each proposal onto the feature map and pool a fixed-size feature (7 × 7) with <strong>RoI Pooling</strong>. A small head with class softmax and box regression is trained jointly with a multi-task loss. About 2 s per image, mostly proposal generation.</p>
        <h3>Faster R-CNN (2015)</h3>
        <p>Replaces Selective Search with a <span class="term">Region Proposal Network (RPN)</span> that shares the backbone features:</p>
        ${ol(['A 3 × 3 conv slides over the backbone feature map.', 'At each location there are k anchors (typically 3 scales × 3 aspect ratios = 9).', 'Two sibling 1 × 1 convolutions output, per anchor, an objectness score (2k outputs) and box offsets (4k outputs).', 'The top few hundred proposals after NMS go to the second stage: RoI pooling / RoI Align extracts a fixed feature per proposal, and FC layers predict the class and refine the box.'])}
        ${flow('fasterrcnn', 'Faster R-CNN data flow', 'Hover nodes for details; dots show data moving through the network.')}
        <p>Loss: L = L<sub>cls</sub> + λ L<sub>box</sub> for both the RPN and the second stage. Faster R-CNN reached about 5 FPS and is the reference two-stage design.</p>
        <h3>RoI Pooling vs RoI Align</h3>
        <p>RoI Pooling rounds proposal coordinates to the feature-map grid twice, causing misalignment that hurts small objects and masks. <strong>RoI Align</strong> (Mask R-CNN) avoids rounding and samples the feature map with bilinear interpolation at exact positions.</p>
        <h3>Mask R-CNN (2017) and Cascade R-CNN</h3>
        <p>Mask R-CNN adds a third parallel branch, a small FCN predicting a binary mask (e.g. 28 × 28 per class) for each RoI, and uses RoI Align. With a keypoint head it also does pose. Cascade R-CNN chains several heads with increasing IoU thresholds to produce higher-quality boxes.</p>` },
      { id: 'fpn', title: 'Feature Pyramid Network (FPN)', html: `
        <p>Objects appear at many sizes. Deep feature maps are semantically rich but coarse; shallow maps are fine but weak. FPN builds a pyramid by combining them: a top-down path upsamples deeper maps by 2 and adds them to lateral connections (1 × 1 convs) from the backbone, producing P2–P5 each with 256 channels. Small objects are detected on high-resolution levels, large objects on low-resolution levels.</p>
        ${flow('fpn', 'Feature Pyramid Network', 'Bottom-up, top-down and lateral connections.')}
        <p>FPN and its bidirectional variants PANet and BiFPN appear in almost every modern detector.</p>` },
      { id: 'onestage', title: 'One-stage detectors: YOLOv1, SSD, RetinaNet', html: `
        <p>One-stage detectors skip proposals and predict classes and boxes directly at every location of one or more feature maps. They are simpler and faster; early versions lagged in accuracy because of the foreground/background imbalance problem.</p>
        <h3>YOLOv1 (2016): "You Only Look Once"</h3>
        <p>YOLOv1 divides the image into an S × S grid (S = 7). Each cell predicts B = 2 boxes, each with (x, y, w, h, confidence), plus C class probabilities shared by the cell. For PASCAL VOC (C = 20) the output is a 7 × 7 × (2 × 5 + 20) = <strong>7 × 7 × 30</strong> tensor. The network (24 conv layers, 2 FC layers) ran at 45 FPS, then astonishing. The loss is a weighted sum of squared errors (box coordinates weighted by 5, no-object confidence by 0.5, square roots on width and height to soften large-box errors).</p>
        ${w('yolo-grid')}
        <p>Weaknesses: each cell predicts only one class and two boxes, so groups of small objects are missed; limited aspect-ratio generalisation; coarse localisation.</p>
        <h3>SSD (2016)</h3>
        <p>Single Shot MultiBox Detector predicts from several feature maps of different resolutions (38 × 38, 19 × 19, 10 × 10, 5 × 5, 3 × 3, 1 × 1), each with default boxes of several aspect ratios. This multi-scale design influenced YOLOv3 onward.</p>
        <h3>RetinaNet and focal loss (2017)</h3>
        <p>A dense detector looks at around 100,000 locations per image, nearly all background. The flood of easy negatives dominates the loss and gradient: the <strong>foreground/background class imbalance</strong>. RetinaNet (FPN backbone + two small conv subnets) fixes it with <span class="term">focal loss</span>, which down-weights easy examples:</p>
        ${f(`FL(<i>p<sub>t</sub></i>) = − α<sub>t</sub> (1 − <i>p<sub>t</sub></i>)<sup>γ</sup> log(<i>p<sub>t</sub></i>), &nbsp;&nbsp; γ = 2, α = 0.25`, 'Focal loss')}
        ${w('focal-loss')}
        <p>With focal loss RetinaNet matched two-stage accuracy at one-stage speed.</p>` },
      { id: 'yolo', title: 'The YOLO family and a modern YOLO in detail', html: `
        ${table(['Version', 'Year', 'Main ideas'], [
          ['YOLOv2 / YOLO9000', '2016', 'BatchNorm, anchor boxes with sizes from k-means on training boxes, higher-res classifier, multi-scale training, Darknet-19'],
          ['YOLOv3', '2018', 'Darknet-53 backbone with residual connections; predictions at 3 scales (FPN-like); independent logistic classifiers (multi-label)'],
          ['YOLOv4', '2020', 'CSPDarknet53, SPP, PANet neck; "bag of freebies" (Mosaic, CIoU loss, label smoothing, DropBlock) and "bag of specials" (Mish)'],
          ['YOLOv5', '2020', 'PyTorch implementation by Ultralytics; CSP blocks, auto-anchors, easy training and export; sizes n, s, m, l, x'],
          ['YOLOX', '2021', 'decoupled head, anchor-free, SimOTA dynamic label assignment'],
          ['YOLOv6, YOLOv7', '2022', 're-parameterised convolutions (RepVGG style), E-ELAN, trainable bag-of-freebies'],
          ['YOLOv8', '2023', 'anchor-free, decoupled head, C2f blocks, Task-Aligned Assigner, DFL + CIoU loss; one framework for detect, segment, classify, pose, oriented boxes'],
          ['YOLOv9', '2024', 'Programmable Gradient Information (PGI), GELAN architecture'],
          ['YOLOv10', '2024', 'NMS-free training with consistent dual assignments (one-to-many for training, one-to-one for inference)'],
          ['YOLO11, YOLOv12', '2024–2025', 'refined C3k2 blocks; YOLOv12 adds attention-centric design (area attention, R-ELAN)'],
          ['YOLO26', 'late 2025', 'Ultralytics\' edge-focused generation, described as end-to-end NMS-free with a simplified head for fast CPU/NPU inference; check current docs'],
        ])}
        ${note('Version numbers come from different groups (Joseph Redmon for v1–v3; various labs and Ultralytics afterwards), so they are not one linear research line. Compare models by measured accuracy and latency on your data and hardware, not by version number.')}
        ${flow('yolo', 'Anatomy of a modern YOLO (v5/v8 style)', 'Backbone → PAN-FPN neck → decoupled heads at three strides.')}
        <p><strong>Backbone (CSPDarknet with C2f).</strong> Input 640 × 640 × 3. A stride-2 conv stem, then stages of Conv (stride 2) + C2f blocks. A C2f block splits the channels, passes half through a chain of small bottlenecks, and concatenates every intermediate output, giving rich gradient flow at low cost. The last stage ends with <strong>SPPF</strong>: three consecutive 5 × 5 max-pools whose outputs are concatenated, enlarging the receptive field cheaply. Outputs at strides 8, 16 and 32 (P3, P4, P5).</p>
        <p><strong>Neck (PAN-FPN).</strong> A top-down path spreads semantic information to high-resolution maps, then a bottom-up path spreads precise localisation back to deeper maps: three maps with 80 × 80, 40 × 40 and 20 × 20 cells for a 640 input.</p>
        <p><strong>Head (decoupled, anchor-free).</strong> Separate small branches per scale: classification (one score per class, BCE) and box. Each grid cell predicts distances from its centre to the four box edges, expressed through a discrete distribution over 16 bins (<span class="term">Distribution Focal Loss, DFL</span>) whose expectation is the distance. Total candidates = 80² + 40² + 20² = <strong>8400</strong>, then confidence filtering and NMS (in NMS-free versions, a one-to-one head makes this unnecessary).</p>
        <p><strong>Training signal.</strong></p>
        ${ul(['<strong>Label assignment</strong> decides which cells are responsible for each object. YOLOv8 uses the Task-Aligned Assigner (TAL): for each ground-truth box it ranks candidate cells by t = s<sup>α</sup> · u<sup>β</sup> (s = predicted score for the true class, u = IoU, α ≈ 0.5, β ≈ 6) and takes the top-k (k ≈ 10).', 'Loss = λ<sub>box</sub>·CIoU + λ<sub>cls</sub>·BCE + λ<sub>dfl</sub>·DFL.', 'Augmentation: Mosaic, random affine, HSV jitter, MixUp, flips; Mosaic is switched off for the last epochs.'])}
        <h3>Box regression losses</h3>
        ${f(`IoU loss = 1 − IoU, &nbsp;&nbsp; GIoU = IoU − |<i>C</i> \\ (<i>A</i> ∪ <i>B</i>)| / |<i>C</i>|<br>DIoU = IoU − ρ²(<i>b</i>, <i>b</i><sup>gt</sup>) / <i>c</i>², &nbsp;&nbsp; CIoU = DIoU − α·<i>v</i>, &nbsp; <i>v</i> = (4/π²)(arctan(<i>w</i><sup>gt</sup>/<i>h</i><sup>gt</sup>) − arctan(<i>w</i>/<i>h</i>))²`, 'Box losses')}
        <p>Plain IoU gives zero gradient when boxes do not overlap; GIoU fixes this with the enclosing box C, DIoU adds centre distance for faster convergence, and CIoU adds aspect-ratio consistency. Try them in the IoU demo above.</p>
        ${table(['Model', 'Params', 'GFLOPs', 'mAP 50-95', 'Typical target'], [['YOLOv8n', '3.2 M', '8.7', '37.3', 'mobile, microcontroller-class boards, CPU'], ['YOLOv8s', '11.2 M', '28.6', '44.9', 'edge GPUs (Jetson), real-time'], ['YOLOv8m', '25.9 M', '78.9', '50.2', 'balanced'], ['YOLOv8l', '43.7 M', '165.2', '52.9', 'server GPU'], ['YOLOv8x', '68.2 M', '257.8', '53.9', 'best accuracy']])}` },
      { id: 'anchorfree', title: 'Anchor-free detectors and label assignment', html: `
        ${ul(['<strong>FCOS (2019):</strong> every location inside a ground-truth box predicts distances (l, t, r, b) to the sides, plus a centerness score that suppresses low-quality predictions far from the centre.', '<strong>CenterNet (2019, "objects as points"):</strong> predicts a heatmap whose peaks are object centres and regresses size and offset there. Peak extraction with a 3 × 3 max-pool replaces NMS.', '<strong>CornerNet:</strong> detects top-left and bottom-right corners and groups them by embeddings.'])}
        <p>Anchor-free designs remove anchor hyperparameters and are now the norm. How targets are assigned matters a lot: static IoU rules gave way to adaptive ones: <strong>ATSS</strong> (threshold from candidate IoU statistics), <strong>OTA / SimOTA</strong> (optimal transport, dynamic k per object) and <strong>TAL</strong>. Good assignment gives each object a few high-quality positives and avoids contradictory targets.</p>` },
      { id: 'detr', title: 'Transformer detectors: DETR and successors', html: `
        ${flow('detr', 'DETR', 'Detection as set prediction.')}
        ${ol(['A CNN backbone (ResNet-50) produces a feature map; a 1 × 1 conv reduces channels and the map is flattened to a sequence with positional encodings.', 'A transformer encoder applies self-attention so every location sees the whole image.', 'A transformer decoder takes N learned <strong>object queries</strong> (N = 100) and, through self-attention among queries and cross-attention to image features, produces N output embeddings.', 'A small FFN turns each embedding into a class (including "no object") and a box (cx, cy, w, h).', '<strong>Hungarian matching</strong> finds the one-to-one assignment between predictions and ground truth that minimises a matching cost (classification + L1 + GIoU); the loss is computed on matched pairs; unmatched predictions learn "no object".'])}
        ${w('hungarian')}
        <p>Because of one-to-one matching, DETR needs no anchors and no NMS. Drawbacks: very slow convergence (about 500 epochs on COCO) and weak small-object performance. Successors: <strong>Deformable DETR</strong> (attention over a few sampled points on multi-scale features, ~10× faster training), DAB-DETR (queries as box coordinates), DN-DETR / <strong>DINO</strong> (denoising queries; DINO-style models led COCO leaderboards), and <strong>RT-DETR</strong> (real-time DETR; R50 variant reported at about 53 AP and over 100 FPS on a T4 with TensorRT).</p>` },
      { id: 'small', title: 'Small objects and open-vocabulary detection', html: `
        <p>Small objects are the hardest case. Remedies: higher input resolution; keep the P2 (stride 4) level; tile large images into overlapping crops and merge (SAHI); scale augmentation and copy-paste; larger backbones; careful assignment settings; measure AP<sub>S</sub> separately.</p>
        <p>Classic detectors know a fixed class list. <strong>Open-vocabulary detectors</strong> (OWL-ViT, Grounding DINO, YOLO-World, GLIP) use vision-language alignment so you can detect "a red backpack" by typing a prompt, with no training. Slower and less accurate than a tuned closed-set model, but excellent for prototyping and auto-labelling (Chapter 14).</p>` },
      { id: 'practice', title: 'Practical detection with Ultralytics YOLO', html: `
        ${code(`dataset/
  images/train/*.jpg   images/val/*.jpg
  labels/train/*.txt   labels/val/*.txt   # one txt per image: "class cx cy w h" normalised

# data.yaml
path: /data/dataset
train: images/train
val: images/val
names:
  0: helmet
  1: no_helmet
  2: vest`, 'dataset layout')}
        ${code(`from ultralytics import YOLO

model = YOLO("yolov8s.pt")                  # pretrained on COCO; any size or newer version
model.train(data="data.yaml", epochs=100, imgsz=640, batch=16, patience=20,
            device=0, project="runs", name="ppe", cos_lr=True, close_mosaic=10)

metrics = model.val()                       # mAP50, mAP50-95, per-class results
print(metrics.box.map50, metrics.box.map)

results = model.predict("test.jpg", conf=0.25, iou=0.6, imgsz=640)
for r in results:
    for b in r.boxes:
        print(int(b.cls), float(b.conf), b.xyxy[0].tolist())

model.export(format="onnx", imgsz=640)      # also: engine (TensorRT), tflite, openvino, ncnn`)}
        ${ul(['<strong>Data beats architecture.</strong> A few hundred well-labelled, varied images per class usually matter more than switching YOLO versions. Include hard negatives (background images, about 5–10 percent).', '<strong>Label consistently:</strong> tight boxes, label every instance, one policy for truncated/occluded objects. Tools: CVAT, Label Studio, Roboflow, LabelImg.', 'Start with a small pretrained model and the default recipe; look at the confusion matrix, PR curves and failure images before changing anything.', 'Match training imgsz to deployment, and keep camera and lighting close to deployment.', 'Tune the confidence threshold on the validation set; the default 0.25 is rarely optimal.', 'For video, add a tracker (Chapter 12) and smooth results over time.'])}` },
    ],
    checks: [
      ['What is the difference between mAP@0.5 and mAP@[0.5:0.95]?', 'The second averages AP over ten IoU thresholds from 0.5 to 0.95, so it penalises imprecise boxes; it is the main COCO metric.'],
      ['Why does focal loss help dense detectors?', 'It down-weights the huge number of easy background examples so training focuses on hard ones.'],
      ['How does DETR avoid NMS?', 'One-to-one Hungarian matching during training teaches each query to claim a distinct object.'],
      ['How many predictions does a YOLOv8 head produce for a 640 × 640 input?', '80 × 80 + 40 × 40 + 20 × 20 = 8400 candidate predictions.'],
      ['What does IoU loss lack that GIoU, DIoU and CIoU add?', 'Gradient for non-overlapping boxes (GIoU), a centre-distance term (DIoU), an aspect-ratio term (CIoU).'],
    ],
    quiz: [
      { q: 'Two 10×10 boxes overlap in a 5×10 region. IoU = ?', o: ['0.5', '0.33', '0.25', '0.67'], a: 1, e: 'I = 50, U = 100 + 100 − 50 = 150, IoU = 1/3.' },
      { q: 'What did Faster R-CNN replace Selective Search with?', o: ['RoI Align', 'A Region Proposal Network sharing backbone features', 'An FPN', 'Hungarian matching'], a: 1 },
      { q: 'Why does RoI Align beat RoI Pooling for masks?', o: ['More channels', 'No coordinate rounding; bilinear sampling at exact positions', 'It uses attention', 'It is learned'], a: 1 },
      { q: 'In FPN, small objects are best detected on…', o: ['P5 (stride 32)', 'P2/P3 (high resolution)', 'The classifier head', 'The RPN only'], a: 1 },
      { q: 'You lower NMS IoU threshold from 0.7 to 0.3 in a crowded scene. Likely effect?', o: ['More duplicate boxes', 'True neighbouring objects get suppressed', 'Higher recall', 'Nothing'], a: 1, e: 'A lower threshold deletes boxes that overlap less, including real adjacent objects.' },
      { q: 'YOLOv1 on VOC outputs a tensor of size…', o: ['13×13×125', '7×7×30', '80×80×84', '19×19×255'], a: 1 },
    ],
  });

  /* ============================ Chapter 11 ============================ */
  CV.addChapter({
    n: 11, part: 3, minutes: 26,
    title: 'Image Segmentation',
    sub: 'Semantic, instance, panoptic and promptable segmentation; FCN, U-Net, DeepLab, SegFormer, Mask2Former, losses and code.',
    sections: [
      { id: 'types', title: 'Kinds of segmentation', html: `
        <p>Segmentation assigns labels at the pixel level. It gives precise shapes instead of boxes and is essential for medical imaging, autonomous driving, remote sensing, photo editing and robotics.</p>
        ${table(['Type', 'Question answered', 'Output'], [['Semantic', 'what class is each pixel?', 'one class map; all cars share the label "car"'], ['Instance', 'which pixel belongs to which object?', 'one mask per object (only countable things)'], ['Panoptic', 'both together', 'every pixel gets a class and, for things, an instance id'], ['Promptable (SAM)', 'segment what I point at', 'masks from clicks, boxes or text']])}
        ${tip('Go back to the task explorer in Chapter 1 and switch between Semantic, Instance and Panoptic to see the difference on one image.')}` },
      { id: 'metrics', title: 'Metrics', html: `
        ${f(`IoU<sub>c</sub> = TP / (TP + FP + FN), &nbsp;&nbsp; mIoU = (1/C) Σ<sub>c</sub> IoU<sub>c</sub><br>Dice<sub>c</sub> = 2TP / (2TP + FP + FN) = 2·IoU / (1 + IoU)`, 'Overlap metrics')}
        ${w('iou-dice')}
        <p>Pixel accuracy is easy but misleading when one class (such as background) dominates. <strong>mIoU</strong> is the standard for semantic segmentation; <strong>Dice / F1</strong> is common in medical imaging; boundary F-score measures contour quality. For panoptic segmentation, <strong>PQ = SQ × RQ</strong>, where SQ is the mean IoU of matched segments and RQ = TP / (TP + 0.5 FP + 0.5 FN).</p>` },
      { id: 'fcn', title: 'Fully Convolutional Networks and upsampling', html: `
        <p><strong>FCN (2015)</strong> turned classification networks into dense predictors: replace the fully connected layers by convolutions so the network accepts any image size and outputs a coarse score map, then upsample it back to image size with transposed convolutions. Because deep features are coarse, FCN adds skip connections that fuse deeper (semantic) and shallower (fine) maps (FCN-32s, 16s, 8s refer to the final upsampling stride). This encoder–decoder pattern underlies everything that follows.</p>
        <h3>Upsampling operators</h3>
        ${ul(['<strong>Bilinear / nearest interpolation:</strong> fixed, no parameters, usually followed by a conv.', '<strong>Transposed convolution</strong> ("deconvolution"): learned upsampling; can produce checkerboard artefacts unless kernel size is divisible by stride.', '<strong>Pixel shuffle:</strong> rearranges channels into space (super-resolution).', '<strong>Unpooling</strong> (SegNet): remember max-pool indices and place values back there.'])}
        ${w('upsample')}` },
      { id: 'unet', title: 'U-Net (2015)', html: `
        ${flow('unet', 'U-Net', 'Encoder, decoder and skip connections. Hover nodes.')}
        <p>U-Net was designed for biomedical images with very few labelled examples and remains the default segmentation architecture.</p>
        ${ul(['<strong>Encoder:</strong> repeated blocks of two 3 × 3 convs + ReLU, then 2 × 2 max pooling. Each downsampling doubles channels (64, 128, 256, 512) and halves resolution.', '<strong>Bottleneck:</strong> two 3 × 3 convs at the lowest resolution (1024 channels).', '<strong>Decoder:</strong> 2 × 2 up-convolution (halve channels, double resolution), concatenate with the encoder map from the same level (the skip connection), then two 3 × 3 convs.', '<strong>Output:</strong> 1 × 1 convolution to the number of classes (or 1 channel with sigmoid for binary masks).'])}
        ${key('<strong>Why skip connections matter.</strong> The encoder knows <em>what</em> is in the image but has lost <em>where</em>; the early encoder layers still know exactly where edges are. Concatenating them gives the decoder both context and precise localisation.')}
        <p>The original network had about 31 million parameters and used heavy elastic-deformation augmentation and a border-emphasis weight map. Variants: U-Net++, Attention U-Net, ResUNet, <strong>nnU-Net</strong> (self-configuring, wins many medical benchmarks), and U-Nets with a pretrained ResNet/EfficientNet encoder, which is the practical default.</p>` },
      { id: 'deeplab', title: 'DeepLab and context modules', html: `
        <p>DeepLab (v1–v3+) keeps resolution high without losing receptive field by using <span class="term">atrous (dilated) convolution</span>.</p>
        ${w('atrous')}
        ${flow('aspp', 'Atrous Spatial Pyramid Pooling', 'Parallel multi-rate context branches.')}
        <p>DeepLabv3+ adds a light decoder that fuses low-level features and uses depthwise-separable atrous convolutions. <strong>PSPNet</strong> uses a pyramid pooling module (pool to 1 × 1, 2 × 2, 3 × 3, 6 × 6, upsample, concatenate). <strong>HRNet</strong> keeps a high-resolution stream throughout and exchanges information with lower-resolution streams.</p>` },
      { id: 'transformer', title: 'Transformer-based segmentation', html: `
        ${ul(['<strong>SegFormer (2021):</strong> a hierarchical transformer encoder (Mix Transformer) producing multi-scale features, positional-encoding-free (3 × 3 depthwise convs inside the MLP), and a simple all-MLP decoder. Efficient and strong on ADE20K and Cityscapes.', '<strong>Mask2Former (2022):</strong> one architecture for semantic, instance and panoptic. A pixel decoder builds multi-scale features; a transformer decoder with <em>masked attention</em> (each query attends only within its current predicted mask) predicts a set of masks and classes, in the spirit of DETR.', '<strong>Segment Anything (SAM):</strong> promptable foundation segmenter (Chapter 14).'])}` },
      { id: 'instance', title: 'Instance segmentation', html: `
        ${flow('maskrcnn', 'Mask R-CNN', 'A mask branch in parallel with class and box.')}
        ${ul(['<strong>Mask R-CNN:</strong> two-stage; for each RoI, RoI Align gives a 14 × 14 map that a small conv/deconv head turns into a 28 × 28 mask per class; the box branch decides the class and the mask branch only the shape.', '<strong>YOLACT / YOLOv8-seg:</strong> one-stage. A small set (e.g. 32) of prototype masks for the whole image plus 32 coefficients per detection. Mask = sigmoid(prototypes · coefficients), cropped to the box. Very fast.', '<strong>SOLO / SOLOv2:</strong> instances by location, no boxes.', '<strong>Mask2Former, MaskDINO:</strong> query-based, state of the art.'])}
        ${w('proto-masks')}` },
      { id: 'losses', title: 'Losses for segmentation', html: `
        ${table(['Loss', 'Formula idea', 'When'], [['Pixel-wise cross-entropy', 'average CE over all pixels', 'default; weight classes if imbalanced'], ['Dice loss', '1 − 2Σpg / (Σp + Σg)', 'small foreground, medical; directly optimises overlap'], ['Focal loss', 'down-weights easy pixels', 'heavy imbalance'], ['Tversky / Focal Tversky', 'weight FP and FN differently', 'when missing a lesion is worse than a false alarm'], ['BCE + Dice', 'sum of both', 'common robust default'], ['Lovász-softmax', 'surrogate for IoU', 'maximise mIoU']])}` },
      { id: 'code', title: 'Code: a compact U-Net and Dice loss', html: `
        ${code(`import torch, torch.nn as nn, torch.nn.functional as F

def dconv(i, o):
    return nn.Sequential(nn.Conv2d(i, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(True),
                         nn.Conv2d(o, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(True))

class UNet(nn.Module):
    def __init__(self, in_ch=3, n_cls=1, base=32):
        super().__init__()
        c = [base, base * 2, base * 4, base * 8, base * 16]
        self.enc = nn.ModuleList([dconv(in_ch, c[0]), dconv(c[0], c[1]),
                                  dconv(c[1], c[2]), dconv(c[2], c[3])])
        self.mid = dconv(c[3], c[4])
        self.up = nn.ModuleList([nn.ConvTranspose2d(c[4 - i], c[3 - i], 2, stride=2) for i in range(4)])
        self.dec = nn.ModuleList([dconv(c[3 - i] * 2, c[3 - i]) for i in range(4)])
        self.out = nn.Conv2d(c[0], n_cls, 1)

    def forward(self, x):
        skips = []
        for e in self.enc:
            x = e(x); skips.append(x); x = F.max_pool2d(x, 2)
        x = self.mid(x)
        for up, dec, s in zip(self.up, self.dec, reversed(skips)):
            x = up(x)
            x = dec(torch.cat([s, x], dim=1))   # skip connection: concatenate
        return self.out(x)                      # logits, shape N x n_cls x H x W

def dice_loss(logits, target, eps=1.0):        # binary segmentation
    p = torch.sigmoid(logits).flatten(1)
    t = target.flatten(1)
    inter = (p * t).sum(1)
    return 1 - ((2 * inter + eps) / (p.sum(1) + t.sum(1) + eps)).mean()

loss_fn = lambda lg, tg: F.binary_cross_entropy_with_logits(lg, tg) + dice_loss(lg, tg)

# In practice start from a pretrained encoder
import segmentation_models_pytorch as smp
model = smp.Unet(encoder_name="resnet34", encoder_weights="imagenet", in_channels=3, classes=1)`)}
        ${note('Input height and width must be divisible by 2<sup>depth</sup> (here 16) for the concatenations to line up; pad or resize accordingly.')}` },
    ],
    checks: [
      ['Why does U-Net concatenate encoder features into the decoder?', 'Early features hold precise spatial detail that deep features lost; fusing them gives accurate boundaries plus context.'],
      ['IoU is 0.6. What is the Dice score?', '2 × 0.6 / 1.6 = 0.75.'],
      ['How does a YOLO-seg model produce instance masks?', 'Prototype masks combined linearly with per-detection coefficients, then cropped to the box.'],
      ['What does ASPP do?', 'Applies parallel atrous convolutions with different rates plus global pooling to capture multi-scale context.'],
    ],
    quiz: [
      { q: 'A road scene: you need every pixel labelled, and each car separately. Which task?', o: ['Semantic', 'Instance', 'Panoptic', 'Detection'], a: 2 },
      { q: 'Why is pixel accuracy misleading for a tumour mask covering 1% of the image?', o: ['It is slow', 'Predicting all background already scores 99%', 'It ignores colour', 'It needs boxes'], a: 1 },
      { q: 'A transposed conv with K = 3, S = 2 tends to produce…', o: ['Blur', 'Checkerboard artefacts', 'Aliasing in colour', 'Nothing unusual'], a: 1 },
      { q: 'Which loss lets you penalise false negatives more than false positives?', o: ['Dice', 'Tversky', 'Cross-entropy', 'Lovász'], a: 1 },
      { q: 'Mask2Former\'s masked attention means each query attends…', o: ['To all pixels', 'Only within its current predicted mask', 'Only to other queries', 'To the text prompt'], a: 1 },
    ],
  });

  /* ============================ Chapter 12 ============================ */
  CV.addChapter({
    n: 12, part: 3, minutes: 24,
    title: 'Tracking, Faces, Pose, Video and 3D',
    sub: 'SORT to ByteTrack, face recognition with ArcFace, pose heatmaps, OCR, video models, depth, point clouds, NeRF, Gaussian splatting and more.',
    sections: [
      { id: 'mot', title: 'Multi-object tracking', html: `
        <p><strong>Tracking-by-detection</strong> is the dominant paradigm: detect objects in every frame, then associate detections across frames to give each object a persistent ID.</p>
        ${w('tracking')}
        ${ul(['<strong>SORT (2016):</strong> a Kalman filter per track predicts where each object will be (constant velocity over box centre, scale, aspect ratio), and the Hungarian algorithm assigns detections to tracks by IoU. Fast and simple, but identity switches when objects cross or are occluded.', '<strong>DeepSORT:</strong> adds an appearance embedding (a small re-identification CNN) to the matching cost, so identities survive occlusion; cascade matching and Mahalanobis gating.', '<strong>ByteTrack (2021):</strong> also associates <em>low-confidence</em> detections in a second pass (they are often partly occluded true objects), greatly reducing missed tracks.', '<strong>OC-SORT, BoT-SORT, StrongSORT:</strong> better motion models, camera-motion compensation and appearance.', '<strong>Single-object tracking:</strong> Siamese trackers (SiamFC, SiamRPN) match a template against a search region; transformer trackers (OSTrack) are state of the art.'])}
        <p>Metrics: <strong>MOTA</strong> = 1 − (FN + FP + ID switches) / #GT objects; <strong>IDF1</strong> (identity consistency); <strong>HOTA</strong> (balances detection and association).</p>
        ${code(`from ultralytics import YOLO
model = YOLO("yolov8n.pt")
for r in model.track(source="traffic.mp4", tracker="bytetrack.yaml", persist=True, stream=True, conf=0.3):
    for box in r.boxes:
        if box.id is not None:
            print(int(box.id), int(box.cls), box.xyxy[0].tolist())`)}` },
      { id: 'faces', title: 'Face detection and recognition', html: `
        <p>A face system is a pipeline: <strong>detect</strong> faces (MTCNN, RetinaFace, YOLO-face), <strong>align</strong> them (5 landmarks → similarity transform to a canonical position), <strong>embed</strong> with a CNN into a vector (typically 512-d), and <strong>compare</strong> embeddings.</p>
        ${ul(['<strong>Verification</strong> (same person?): cosine similarity of embeddings vs a threshold.', '<strong>Identification</strong> (who is this?): nearest-neighbour search in a gallery (FAISS for scale).'])}
        <p>The key is training the embedding so the same person clusters and different people are far apart (metric learning): <strong>triplet loss</strong> (FaceNet) pulls an anchor toward a positive and pushes it from a negative by a margin; <strong>margin-based softmax losses</strong> (SphereFace, CosFace, ArcFace) normalise features and class weights so logits are cosines, then add a margin.</p>
        ${f(`<i>L</i> = − log ${frac('e<sup><i>s</i>·cos(θ<sub>y</sub> + <i>m</i>)</sup>', 'e<sup><i>s</i>·cos(θ<sub>y</sub> + <i>m</i>)</sup> + Σ<sub>j≠y</sub> e<sup><i>s</i>·cos θ<sub>j</sub></sup>')}, &nbsp; <i>s</i> = 64, <i>m</i> = 0.5`, 'ArcFace')}
        ${w('arcface')}
        <p>Real-world requirements: choose the threshold from a target false-accept rate on data resembling deployment; add liveness / anti-spoofing; test accuracy across demographics, because error rates can differ between groups.</p>
        ${warn('Face recognition raises serious privacy, consent and bias issues and is regulated in many places. Use consented data, document intended use, and keep humans in the loop for consequential decisions.')}` },
      { id: 'pose', title: 'Human pose estimation', html: `
        <p>Locate body keypoints (COCO has 17: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles).</p>
        ${ul(['<strong>Top-down:</strong> detect each person, crop, predict keypoints (HRNet, SimpleBaseline, ViTPose). More accurate; cost grows with the number of people.', '<strong>Bottom-up:</strong> detect all keypoints, then group into people (OpenPose with Part Affinity Fields, HigherHRNet). Cost independent of crowd size.', '<strong>Single-stage:</strong> YOLO-pose predicts person box and keypoints together.'])}
        ${w('pose')}
        <p>Accuracy is measured with OKS (Object Keypoint Similarity) and AP over OKS thresholds. MediaPipe BlazePose gives 33 landmarks in real time on phones. Extensions: hands, face landmarks, 3D pose, body meshes (SMPL).</p>` },
      { id: 'ocr', title: 'Optical Character Recognition', html: `
        <p>Classic OCR has two stages: <strong>text detection</strong> (EAST, DBNet, CRAFT; possibly rotated regions) and <strong>text recognition</strong> (CRNN: CNN features → bidirectional LSTM → <span class="term">CTC loss</span>, which aligns output with the transcript without character-level boxes; transformer recognisers such as TrOCR). Tools: Tesseract, EasyOCR, PaddleOCR. For documents, layout-aware models (LayoutLM, Donut) read forms, invoices and tables end to end, and VLMs can now read text directly.</p>` },
      { id: 'video', title: 'Video understanding', html: `
        <p>A clip is a tensor of shape T × C × H × W. Approaches:</p>
        ${ul(['Per-frame CNN + temporal pooling or RNN/transformer on top: simple and surprisingly strong.', '<strong>Two-stream</strong> networks: RGB frames + stacked optical flow; late fusion.', '<strong>3D CNNs</strong> (C3D, I3D, R(2+1)D): 3D kernels K<sub>t</sub> × K × K. I3D "inflates" pretrained 2D kernels into 3D.', '<strong>SlowFast (2019):</strong> a Slow pathway (few frames, many channels) for appearance and a Fast pathway (many frames, few channels) for motion, with lateral connections.', '<strong>Temporal Shift Module:</strong> shifts part of the channels forward/backward in time inside a 2D CNN, at zero extra FLOPs.', '<strong>Video transformers:</strong> TimeSformer, ViViT, Video Swin, VideoMAE (masked autoencoding with 90 percent masking).'])}
        <p>Tasks: action recognition (Kinetics, UCF101), temporal localisation, video object segmentation (SAM 2, XMem), captioning, anomaly detection. Memory and compute are the main constraints; sample frames sparsely.</p>` },
      { id: '3d', title: 'Depth, 3D and point clouds', html: `
        ${ul(['<strong>Monocular depth:</strong> MiDaS, DPT, Depth Anything predict depth from one image; relative depth is easy, metric depth needs known camera/scale cues.', '<strong>Point clouds</strong> (LiDAR) are unordered sets of 3D points. <strong>PointNet</strong> applies a shared MLP to each point and a symmetric max-pool to be order-invariant; PointNet++ adds local grouping. For driving: voxel/pillar methods (VoxelNet, PointPillars), CenterPoint, and bird\'s-eye-view transformers (BEVFormer, BEVFusion).'])}
        ${w('pointnet')}
        <p><strong>NeRF (2020)</strong> represents a scene as an MLP mapping 3D position and viewing direction to colour and density; images are rendered by integrating along camera rays, with positional encoding for detail. Training needs posed images (from COLMAP).</p>
        ${f(`<i>C</i>(<b>r</b>) = ∫ <i>T</i>(<i>t</i>) · σ(<b>r</b>(<i>t</i>)) · <b>c</b>(<b>r</b>(<i>t</i>), <b>d</b>) d<i>t</i>, &nbsp;&nbsp; <i>T</i>(<i>t</i>) = exp(−∫<sub>0</sub><sup><i>t</i></sup> σ(<b>r</b>(<i>s</i>)) d<i>s</i>)`, 'Volume rendering')}
        <p><strong>3D Gaussian Splatting (2023)</strong> represents the scene explicitly as millions of anisotropic 3D Gaussians (position, covariance, opacity, view-dependent colour) rasterised in real time: NeRF-quality renderings at 100+ FPS and fast training.</p>` },
      { id: 'more', title: 'Retrieval, anomaly detection and restoration', html: `
        <p><strong>Image retrieval:</strong> map images to vectors where similar images are close (CNN features, DINOv2 or CLIP embeddings), index with approximate nearest neighbours (FAISS, ScaNN, HNSW), search by cosine similarity. Powers visual search, deduplication, recommendation and retrieval for VLM systems.</p>
        <p><strong>Anomaly detection for inspection:</strong> defects are rare and varied, so one-class methods learn only from normal images. PaDiM and PatchCore store features of normal patches from a pretrained network and flag test patches far from that memory; autoencoders and flow models are alternatives. They output an anomaly map and an image score.</p>
        <p><strong>Restoration:</strong> super-resolution (SRCNN, EDSR, ESRGAN, SwinIR, diffusion-based), denoising, deblurring, deraining, low-light enhancement and inpainting are image-to-image problems trained with L1/perceptual losses (plus adversarial or diffusion objectives for realism).</p>` },
    ],
    checks: [
      ['Why does ByteTrack use low-confidence detections?', 'They are often occluded true objects; a second association pass recovers tracks that would otherwise break.'],
      ['Why is the angular margin in ArcFace useful?', 'It forces larger angular separation between identities, producing more discriminative embeddings.'],
      ['What is the difference between top-down and bottom-up pose estimation?', 'Top-down detects people first then estimates keypoints per crop; bottom-up detects all keypoints then groups them.'],
      ['What property of max-pooling makes PointNet suitable for point clouds?', 'It is a symmetric function, so the result does not depend on the order of the points.'],
    ],
    quiz: [
      { q: 'SORT predicts each track\'s next position with…', o: ['An LSTM', 'A Kalman filter (constant velocity)', 'Optical flow', 'A transformer'], a: 1 },
      { q: 'DeepSORT improves on SORT mainly by adding…', o: ['Low-confidence detections', 'An appearance (re-ID) embedding', 'Anchor boxes', '3D boxes'], a: 1 },
      { q: 'Face verification decides…', o: ['Who someone is from a gallery', 'Whether two faces are the same person via an embedding similarity threshold', 'Where faces are', 'Age and gender'], a: 1 },
      { q: 'CTC loss in OCR is useful because…', o: ['It detects text regions', 'It aligns output sequences without character-level boxes', 'It is faster than softmax', 'It handles colour'], a: 1 },
      { q: 'What does 3D Gaussian Splatting trade compared with NeRF?', o: ['An implicit MLP for explicit Gaussians rasterised in real time', 'Images for point clouds', 'Depth for colour', 'Nothing; they are identical'], a: 0 },
    ],
  });
})();

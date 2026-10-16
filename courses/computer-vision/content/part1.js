/* Part I: Foundations (Chapters 1–5) */
(function () {
  const { h } = CV;
  const { f, frac, table, code, w, ul, ol, key, warn, tip, note } = h;

  /* ============================ Chapter 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 10,
    title: 'What is Computer Vision?',
    sub: 'Turning a grid of numbers into statements about the world, and why that is so hard.',
    sections: [
      { id: 'goal', title: 'The goal', html: `
        <p><span class="term">Computer vision (CV)</span> is the field of building systems that extract useful information from images and video. A camera gives a grid of numbers; a vision system must turn those numbers into statements such as <em>"this is a cat"</em>, <em>"there are three cars at these positions"</em>, <em>"this pixel belongs to the road"</em>, or <em>"the camera moved 2 m forward"</em>.</p>
        <p>The difficulty is that vision is an <strong>inverse problem</strong>. The physical world (3D shape, materials, lighting, viewpoint) is projected onto a 2D array, and many different worlds produce the same image. Humans solve this effortlessly using a lifetime of prior knowledge. Machines must learn or be given that prior knowledge.</p>
        ${key('A pixel value alone means almost nothing. Meaning comes from <strong>context</strong>: neighbouring pixels, scale, texture, shape and prior knowledge. Every technique in this course is a way of capturing context.')}
      ` },
      { id: 'hard', title: 'Why vision is hard', html: `
        ${ul([
          '<strong>Viewpoint variation:</strong> the same object looks completely different from another angle.',
          '<strong>Illumination:</strong> shadows, glare and colour casts change pixel values without changing the object.',
          '<strong>Scale and resolution:</strong> an object can fill the frame or be 10 pixels wide.',
          '<strong>Occlusion and clutter:</strong> objects are partly hidden or surrounded by distractors.',
          '<strong>Intra-class variation:</strong> chairs come in thousands of shapes; "chair" is a function, not a shape.',
          '<strong>Deformation:</strong> people, animals and cloth change shape.',
          '<strong>Noise, blur, compression:</strong> real cameras are imperfect.',
        ])}
        <p>Try it: each nuisance below changes a large fraction of the pixels, yet you still see the same house, car and tree. A good vision system must be just as unbothered.</p>
        ${w('difficulty')}
      ` },
      { id: 'tasks', title: 'The main tasks', html: `
        <p>Vision is not one problem but a family of them. They differ in what the output looks like: a single label, a set of boxes, a label per pixel, coordinates, or even new images.</p>
        ${w('task-explorer')}
        ${table(['Task', 'Input', 'Output', 'Typical models'], [
          ['Image classification', 'image', 'one label (or several)', 'ResNet, EfficientNet, ViT, ConvNeXt'],
          ['Object detection', 'image', 'boxes + labels + scores', 'Faster R-CNN, YOLO, RT-DETR'],
          ['Semantic segmentation', 'image', 'class label for every pixel', 'U-Net, DeepLab, SegFormer'],
          ['Instance segmentation', 'image', 'a mask per object', 'Mask R-CNN, YOLO-seg, SAM'],
          ['Panoptic segmentation', 'image', 'semantic + instance together', 'Mask2Former'],
          ['Keypoint / pose estimation', 'image', 'landmark coordinates', 'HRNet, YOLO-pose'],
          ['Object tracking', 'video', 'object identities over time', 'SORT, DeepSORT, ByteTrack'],
          ['Depth estimation', 'image(s)', 'distance for each pixel', 'MiDaS, Depth Anything'],
          ['Optical flow', 'frame pair', 'motion vector per pixel', 'Lucas–Kanade, RAFT'],
          ['OCR', 'image', 'text', 'CRNN, TrOCR'],
          ['Image generation', 'text / noise', 'new images', 'GAN, diffusion models'],
          ['Vision-language', 'image + text', 'caption, answer, grounding', 'CLIP, LLaVA-style VLMs'],
        ])}
      ` },
      { id: 'history', title: 'A short history', html: `
        <p>The field moved through three eras: early geometric and neural ideas, a long period of hand-crafted features, and, since 2012, learned features at ever larger scale.</p>
        ${w('timeline')}
      ` },
      { id: 'pipelines', title: 'Classical pipeline vs deep pipeline', html: `
        <p>In the <strong>classical pipeline</strong> an engineer designs each stage: pre-processing, feature extraction (corners, edges, HOG), then a simple classifier (SVM) on top. In the <strong>deep pipeline</strong> the feature extractor and classifier are one network trained end to end on data.</p>
        <div class="w-row" style="margin:18px 0">
          <div class="w-col callout note" style="margin:0;display:block"><b class="ct">Classical</b><p>image → hand-designed filters → features (HOG, SIFT) → SVM → label</p><p style="font-size:14px;color:var(--text-2)">Wins for geometry (calibration, SLAM), tiny devices, very little data. Fast, interpretable.</p></div>
          <div class="w-col callout key" style="margin:0;display:block"><b class="ct">Deep</b><p>image → one network trained end to end → label</p><p style="font-size:14px;color:var(--text-2)">Wins when you have lots of labelled data and compute.</p></div>
        </div>
        ${tip('A good practitioner knows both. Classical methods are still the default for camera geometry, and they make excellent pre-processing and augmentation.')}
      ` },
    ],
    checks: [
      ['Why is vision called an inverse problem?', 'Many different 3D scenes can create the same 2D image, so recovering the scene needs prior knowledge.'],
      ['Name three sources of difficulty in vision.', 'Viewpoint, illumination, occlusion, scale, deformation, intra-class variation, noise.'],
      ['Which year marks the start of the deep learning era in vision and why?', '2012: AlexNet beat classical methods on ImageNet by a large margin.'],
    ],
    quiz: [
      { q: 'A model outputs a class label for every pixel, but all cars share the same label "car". Which task is it?', o: ['Instance segmentation', 'Semantic segmentation', 'Object detection', 'Panoptic segmentation'], a: 1, e: 'Semantic segmentation labels pixels by class only; instance segmentation would separate individual cars.' },
      { q: 'What does a pixel value alone tell you about the scene?', o: ['The object class', 'The 3D depth', 'Almost nothing without context', 'The lighting direction'], a: 2, e: 'Meaning comes from context: neighbours, scale, texture, shape and priors.' },
      { q: 'When do classical (non-learned) methods still tend to win?', o: ['Large labelled datasets with GPUs', 'Geometry tasks such as calibration and SLAM, tiny devices, very little data', 'Open-vocabulary detection', 'Image generation'], a: 1, e: 'The book lists geometry, tiny devices and problems with very little data.' },
      { q: 'Which pair is correctly matched?', o: ['Optical flow → one label per image', 'OCR → boxes and scores', 'Depth estimation → distance for each pixel', 'Tracking → new images'], a: 2 },
    ],
  });

  /* ============================ Chapter 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 16,
    title: 'Images and How They Are Formed',
    sub: 'Pinhole projection, lenses and sensors, sampling and quantization, colour spaces and the array conventions that cause silent bugs.',
    sections: [
      { id: 'pinhole', title: 'The pinhole camera', html: `
        <p>The simplest camera is a dark box with a tiny hole. Light from a scene point travels in a straight line through the hole and lands on the back plane, producing an <strong>inverted</strong> image. By similar triangles, a 3D point (X, Y, Z) in camera coordinates projects to image coordinates</p>
        ${f(`<i>x</i> = <i>f</i> · <i>X</i> / <i>Z</i>, &nbsp;&nbsp; <i>y</i> = <i>f</i> · <i>Y</i> / <i>Z</i>`, 'Perspective projection')}
        <p>where <code>f</code> is the focal length (distance from hole to image plane). Distant objects (large Z) appear smaller. This is <span class="term">perspective projection</span>, the foundation of all geometric vision.</p>
        ${w('pinhole')}
      ` },
      { id: 'sensors', title: 'Lenses, exposure and sensors', html: `
        <p>A real camera uses a lens to gather more light than a pinhole while keeping the image sharp. The thin-lens equation relates focal length f, object distance z and image distance z':</p>
        ${f(`1/<i>f</i> = 1/<i>z</i> + 1/<i>z'</i>`, 'Thin lens')}
        <p>Three settings control exposure:</p>
        ${ul(['<strong>Aperture:</strong> lens opening; also controls depth of field. A wide aperture gives a bright image and shallow depth of field.', '<strong>Shutter speed:</strong> motion blur versus brightness.', '<strong>ISO:</strong> sensor gain; amplifies noise too.'])}
        <p>Most sensors are CMOS chips with a <span class="term">Bayer filter</span>: each photosite records only red, green or blue (twice as many green). The camera <em>demosaics</em> this pattern to full colour. Sensors add noise: <strong>shot noise</strong> (random photon arrival, grows with signal) and <strong>read noise</strong> (electronics). This is why low-light images look grainy.</p>
      ` },
      { id: 'digital', title: 'Digital images: sampling and quantization', html: `
        <p>A digital image is a function f(x, y) that has been <strong>sampled</strong> on a grid (the pixels) and <strong>quantized</strong> to a finite number of levels (usually 256 levels, 8 bits per channel).</p>
        ${ul(['<strong>Grayscale image:</strong> a 2D array of shape H × W with values 0 (black) to 255 (white).', '<strong>Colour image:</strong> a 3D array H × W × 3 (three channel matrices).', 'An uncompressed 1920 × 1080 RGB image needs 1920 × 1080 × 3 = 6,220,800 bytes, about 6 MB.'])}
        ${w('pixel-inspector')}
        <h3>Sampling and aliasing</h3>
        <p>The <strong>Nyquist theorem</strong> says you must sample at more than twice the highest spatial frequency present, otherwise fine patterns appear as false coarse patterns (<span class="term">aliasing</span>, moiré). Cameras use an optical low-pass filter, and in software you should <strong>blur before downsampling</strong>.</p>
        ${w('sampling')}
      ` },
      { id: 'conventions', title: 'Array conventions you must remember', html: `
        ${table(['Library', 'Layout', 'Colour order', 'Value range'], [
          ['OpenCV (cv2)', 'H × W × C', '<strong style="color:var(--bad)">BGR</strong>', 'uint8 0–255'],
          ['PIL / matplotlib', 'H × W × C', 'RGB', 'uint8 0–255'],
          ['PyTorch tensors', 'C × H × W (batch: N × C × H × W)', 'RGB', 'float 0–1, usually normalised'],
          ['TensorFlow / Keras', 'H × W × C', 'RGB', 'float or uint8'],
        ])}
        ${w('tensor-layout')}
        ${warn('OpenCV loads images as <strong>BGR</strong>, not RGB. Forgetting <code>cv2.cvtColor(img, cv2.COLOR_BGR2RGB)</code> before feeding a pretrained model is one of the most common silent bugs: accuracy drops but nothing crashes.')}
      ` },
      { id: 'color', title: 'Colour spaces', html: `
        ${ul([
          '<strong>RGB:</strong> additive mixing; what sensors and screens use.',
          '<strong>Grayscale:</strong> luminance only, Y = 0.299 R + 0.587 G + 0.114 B (weights reflect the eye\'s sensitivity to green).',
          '<strong>HSV / HSL:</strong> hue (colour type), saturation (purity), value (brightness). Excellent for colour-based segmentation because hue is largely independent of brightness.',
          '<strong>YCbCr:</strong> luma plus two chroma channels; JPEG and video codecs keep full luma but subsample chroma because the eye is less sensitive to colour detail.',
          '<strong>CIE Lab:</strong> perceptually uniform, so Euclidean distance approximates perceived colour difference.',
        ])}
        ${w('color-spaces')}
        ${w('hsv-mask')}
      ` },
      { id: 'formats', title: 'Image file formats and compression', html: `
        ${table(['Format', 'Compression', 'Notes'], [
          ['PNG', 'lossless', 'good for screenshots, masks, medical data'],
          ['JPEG', 'lossy (8×8 block DCT, quantization)', 'small files; artifacts at block edges; avoid for training labels'],
          ['BMP / TIFF', 'none or lossless', 'raw archival'],
          ['WebP / AVIF / HEIC', 'lossy or lossless', 'modern, efficient'],
          ['Video (H.264, H.265)', 'lossy inter-frame', 'key frames plus motion-compensated differences'],
        ])}
      ` },
      { id: 'python', title: 'Working with images in Python', html: `
        ${code(`import cv2
import numpy as np

img = cv2.imread("photo.jpg")               # BGR uint8, shape (H, W, 3)
print(img.shape, img.dtype)                 # e.g. (1080, 1920, 3) uint8

rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # for matplotlib / PyTorch
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) # shape (H, W)
hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

crop    = img[100:300, 200:500]             # rows (y) first, then columns (x)
resized = cv2.resize(img, (640, 480))       # note: (width, height) order
flipped = cv2.flip(img, 1)                  # horizontal flip

# normalise to float for a neural network
x = rgb.astype(np.float32) / 255.0
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]  # ImageNet mean and std
x = np.transpose(x, (2, 0, 1))              # HWC -> CHW

cv2.imwrite("gray.png", gray)`)}
        ${tip('Remember "row, column" indexing for arrays (<code>img[y, x]</code>) but "x, y" order for OpenCV drawing and sizing functions (<code>cv2.circle(img, (x, y), ...)</code>, <code>cv2.resize(img, (w, h))</code>).')}
      ` },
    ],
    checks: [
      ['What shape does a PyTorch batch of 8 RGB 224 × 224 images have?', '(8, 3, 224, 224), i.e. N × C × H × W.'],
      ['Why does OpenCV colour order matter for pretrained models?', 'Models expect RGB; BGR input swaps red and blue channels and silently hurts accuracy.'],
      ['Using similar triangles, how does an object\'s image size change when it moves twice as far away?', 'It halves, because x = f X / Z.'],
    ],
    quiz: [
      { q: 'You downsample a photo of a striped shirt by 4× and see wavy false patterns. What should you have done?', o: ['Use JPEG instead of PNG', 'Blur (low-pass filter) before downsampling', 'Convert to HSV first', 'Increase the bit depth'], a: 1, e: 'Aliasing: frequencies above Nyquist fold into false coarse patterns. Blur first.' },
      { q: 'Why is HSV good for colour-based segmentation?', o: ['It is perceptually uniform', 'Hue is largely independent of brightness', 'It uses fewer bits', 'JPEG stores it natively'], a: 1, e: 'Shadows change V much more than H, so a hue range survives lighting changes.' },
      { q: 'Which call resizes an image to 640 wide and 480 tall?', o: ['cv2.resize(img, (480, 640))', 'cv2.resize(img, (640, 480))', 'img[640, 480]', 'np.resize(img, (640, 480, 3))'], a: 1, e: 'OpenCV sizing uses (width, height).' },
      { q: 'How many bytes does an uncompressed 8-bit 1920×1080 RGB image need?', o: ['2,073,600', '6,220,800', '16,588,800', '921,600'], a: 1, e: '1920 × 1080 × 3 = 6,220,800 bytes ≈ 6 MB.' },
      { q: 'Which format should you avoid for segmentation label masks?', o: ['PNG', 'TIFF', 'JPEG', 'BMP'], a: 2, e: 'Lossy JPEG artifacts corrupt the exact class ids at edges.' },
    ],
  });

  /* ============================ Chapter 3 ============================ */
  CV.addChapter({
    n: 3, part: 1, minutes: 24,
    title: 'Classical Image Processing',
    sub: 'Point operations, histograms, convolution, edges, morphology, frequency, geometric warps: the fixed operations every vision system still uses.',
    sections: [
      { id: 'intro', title: 'Why classical processing still matters', html: `
        <p>Before any learning, we clean and transform images with fixed mathematical operations. These operations are still used everywhere: as <strong>pre-processing</strong>, as <strong>data augmentation</strong>, and inside the <strong>first layers of neural networks</strong>.</p>` },
      { id: 'point', title: 'Point operations', html: `
        <p>A point operation changes each pixel independently: <code>s = T(r)</code>.</p>
        ${ul([
          '<strong>Brightness / contrast:</strong> g = a·f + b (a controls contrast, b brightness).',
          '<strong>Negative:</strong> s = 255 − r.',
          '<strong>Gamma correction:</strong> s = 255 · (r / 255)<sup>γ</sup>. Gamma below 1 brightens dark regions; above 1 darkens.',
          '<strong>Thresholding:</strong> s = 255 if r > T, else 0. <span class="term">Otsu\'s method</span> picks T automatically by maximising the variance between the two resulting classes; it works well when the histogram is bimodal. <strong>Adaptive thresholding</strong> computes a local threshold per neighbourhood and handles uneven lighting.',
        ])}
        ${w('point-ops')}
      ` },
      { id: 'histeq', title: 'Histogram equalization', html: `
        <p>The histogram counts pixels at each intensity. A low-contrast image has a narrow histogram. Equalization remaps intensities using the cumulative distribution function (CDF) so that output levels spread across the full range:</p>
        ${f(`<i>s<sub>k</sub></i> = (<i>L</i> − 1) · Σ<sub>j=0..k</sub> <i>p</i>(<i>r<sub>j</sub></i>), &nbsp;&nbsp; <i>p</i>(<i>r<sub>j</sub></i>) = <i>n<sub>j</sub></i> / (<i>H</i> · <i>W</i>)`, 'Equalization')}
        ${w('hist-eq')}
        <p><span class="term">CLAHE</span> (Contrast Limited Adaptive Histogram Equalization) does this on small tiles and clips the histogram to avoid amplifying noise. It is the standard fix for dull medical and low-light images.</p>
      ` },
      { id: 'conv', title: 'Spatial filtering and convolution', html: `
        <p>A filter slides a small matrix (the <span class="term">kernel</span>) over the image. At each location the output is the weighted sum of the neighbourhood. For a kernel w of size (2a+1) × (2b+1):</p>
        ${f(`<i>g</i>(<i>x</i>, <i>y</i>) = Σ<sub>s=−a..a</sub> Σ<sub>t=−b..b</sub> <i>w</i>(<i>s</i>, <i>t</i>) · <i>f</i>(<i>x</i> + <i>s</i>, <i>y</i> + <i>t</i>)`, 'Filtering')}
        ${note('Strictly this is cross-correlation; true convolution flips the kernel. Deep learning libraries implement cross-correlation and still call it convolution, and since kernels are learned the difference is irrelevant.')}
        ${w('conv-step')}
        <h3>Common kernels</h3>
        ${table(['Filter', 'Kernel idea', 'Effect'], [
          ['Box (mean)', 'all weights equal, sum to 1', 'simple blur'],
          ['Gaussian', 'weights from a bell curve', 'smooth blur without ringing'],
          ['Sharpen / unsharp mask', 'f + k (f − blur(f))', 'boosts edges'],
          ['Sobel x / y', '[−1 0 1; −2 0 2; −1 0 1] and its transpose', 'horizontal and vertical gradients'],
          ['Laplacian', '[0 1 0; 1 −4 1; 0 1 0]', 'second derivative, blobs and edges'],
          ['Median', 'non-linear: median of the window', 'removes salt-and-pepper noise, keeps edges'],
          ['Bilateral', 'weights by spatial distance and intensity difference', 'smooths while preserving edges'],
        ])}
        <p>The 2D Gaussian is</p>
        ${f(`<i>G</i>(<i>x</i>, <i>y</i>) = ${frac('1', '2πσ²')} · exp( −(<i>x</i>² + <i>y</i>²) / (2σ²) )`, 'Gaussian')}
        <p>A key property: the Gaussian is <strong>separable</strong>, so a k × k convolution can be done as one 1D pass along rows and one along columns, reducing cost from O(k²) to O(2k) per pixel. Deep networks use the same idea in depthwise-separable convolutions (Chapter 7).</p>
        <p><strong>Border handling:</strong> when the kernel overhangs the image you must pad (zeros, replicate edge pixels, or reflect). Reflection is the common default in OpenCV.</p>
        ${w('filter-lab')}
      ` },
      { id: 'edges', title: 'Edge detection', html: `
        <p>An edge is a place where intensity changes quickly, so it corresponds to a large image gradient. With derivative estimates g<sub>x</sub> and g<sub>y</sub> (for example from Sobel):</p>
        ${f(`|∇<i>f</i>| = √(<i>g<sub>x</sub></i>² + <i>g<sub>y</sub></i>²), &nbsp;&nbsp; θ = atan2(<i>g<sub>y</sub></i>, <i>g<sub>x</sub></i>)`, 'Gradient')}
        <h3>The Canny edge detector</h3>
        <p>Canny (1986) is still the default edge detector. Its five steps:</p>
        ${ol(['Smooth with a Gaussian to suppress noise.', 'Compute gradient magnitude and direction (Sobel).', '<strong>Non-maximum suppression:</strong> keep a pixel only if it is the local maximum along the gradient direction, thinning edges to one pixel wide.', '<strong>Double threshold:</strong> strong edges (above the high threshold), weak edges (between thresholds), and rejected pixels.', '<strong>Hysteresis:</strong> keep weak edges only if connected to a strong edge.'])}
        ${w('canny')}
        ${code('edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 1.4), threshold1=50, threshold2=150)')}
      ` },
      { id: 'morph', title: 'Morphological operations', html: `
        <p>On binary (or gray) images, morphology uses a <span class="term">structuring element</span> (like a small kernel):</p>
        ${ul(['<strong>Erosion:</strong> shrinks white regions; removes small specks.', '<strong>Dilation:</strong> grows white regions; fills small holes.', '<strong>Opening</strong> = erosion then dilation: removes noise while keeping size.', '<strong>Closing</strong> = dilation then erosion: closes small gaps.', '<strong>Gradient</strong> = dilation minus erosion: outlines.', '<strong>Top-hat:</strong> image minus opening; extracts small bright details.'])}
        ${w('morphology')}
        <p>After thresholding and cleaning, <strong>connected components</strong> and <strong>contours</strong> (<code>cv2.connectedComponents</code>, <code>cv2.findContours</code>) give you separate objects with areas, bounding boxes and shapes.</p>
      ` },
      { id: 'freq', title: 'Frequency domain', html: `
        <p>The Fourier transform expresses an image as a sum of sine waves. <strong>Low frequencies</strong> carry overall structure and smooth areas; <strong>high frequencies</strong> carry edges, fine detail and noise. Blurring is a low-pass filter; sharpening boosts high frequencies.</p>
        ${w('freq-split')}
        <p>The <span class="term">convolution theorem</span> says convolution in space equals multiplication in frequency, so very large kernels are cheaper in the Fourier domain. JPEG compression uses a related transform (the DCT) and throws away the high-frequency coefficients the eye barely notices.</p>
      ` },
      { id: 'geo', title: 'Geometric transformations', html: `
        ${table(['Transform', 'Matrix', 'Degrees of freedom', 'Preserves'], [
          ['Translation', '2×3', '2', 'shape, size, angles'],
          ['Rigid (rotation + translation)', '2×3', '3', 'lengths, angles'],
          ['Similarity (adds uniform scale)', '2×3', '4', 'angles, ratios'],
          ['Affine', '2×3', '6', 'parallel lines, ratios along lines'],
          ['Projective (homography)', '3×3', '8', 'straight lines only'],
        ])}
        <p>In <strong>homogeneous coordinates</strong> a point (x, y) is written (x, y, 1) and a homography H maps it by matrix multiplication followed by division by the third coordinate:</p>
        ${f(`[<i>x'</i>, <i>y'</i>, <i>w'</i>]<sup>T</sup> = <b>H</b> · [<i>x</i>, <i>y</i>, 1]<sup>T</sup>, &nbsp;&nbsp; (<i>u</i>, <i>v</i>) = (<i>x'</i>/<i>w'</i>, <i>y'</i>/<i>w'</i>)`, 'Homography')}
        ${w('geo-transform')}
        <p>Warping needs <strong>interpolation</strong> to compute pixel values at non-integer coordinates: nearest neighbour (fast, blocky), bilinear (default, smooth), bicubic (sharper). Use <code>cv2.INTER_AREA</code> when shrinking images.</p>
        ${code(`# Perspective correction of a document photo from four corner points
src = np.float32([[120, 80], [980, 60], [1010, 760], [90, 790]])  # corners found in the photo
dst = np.float32([[0, 0], [800, 0], [800, 600], [0, 600]])        # target rectangle
H = cv2.getPerspectiveTransform(src, dst)
scan = cv2.warpPerspective(img, H, (800, 600))`)}
      ` },
      { id: 'pyramids', title: 'Image pyramids and template matching', html: `
        <p>A <span class="term">Gaussian pyramid</span> repeatedly blurs and halves an image, giving a multi-scale representation, so a detector tuned to one size can find objects at all sizes. The <strong>Laplacian pyramid</strong> stores the differences between levels and is used for blending and compression. Feature Pyramid Networks (Chapter 10) bring the same idea into deep detectors.</p>
        <p><strong>Template matching</strong> slides a small patch over the image and scores similarity, usually with normalised cross-correlation (<code>cv2.matchTemplate</code>, <code>cv2.TM_CCOEFF_NORMED</code>). It is fast and exact but breaks under rotation, scale and lighting change, which motivated the learned and invariant features of the next chapter.</p>
      ` },
      { id: 'coins', title: 'A complete classical example: counting coins', html: `
        ${w('coin-pipeline')}
        ${code(`img  = cv2.imread("coins.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (7, 7), 0)
_, bw = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
bw = cv2.morphologyEx(bw, cv2.MORPH_OPEN,  kernel, iterations=2)  # remove specks
bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, kernel, iterations=2)  # fill holes

contours, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
coins = [c for c in contours if cv2.contourArea(c) > 500]
print("coins:", len(coins))`)}
        ${note('Classical pipelines are brittle but fast, interpretable and need no training data. Use them for controlled settings (a fixed camera over a conveyor), as pre-processing, and for augmentations.')}
      ` },
    ],
    checks: [
      ['Why do we blur before running an edge detector?', 'Derivatives amplify noise; Gaussian smoothing suppresses it so only real edges remain.'],
      ['What does the median filter do better than the Gaussian filter?', 'It removes salt-and-pepper (impulse) noise while preserving edges.'],
      ['How many degrees of freedom does a homography have?', '8 (a 3 × 3 matrix defined up to scale).'],
      ['What is the difference between opening and closing?', 'Opening (erode then dilate) removes small bright specks; closing (dilate then erode) fills small dark holes.'],
    ],
    quiz: [
      { q: 'A kernel whose weights sum to 0 (like Sobel or Laplacian) responds to…', o: ['Average brightness', 'Changes in intensity (edges)', 'Colour hue', 'Nothing; it is invalid'], a: 1, e: 'Constant regions give zero response, so only change is detected.' },
      { q: 'Why is a separable Gaussian cheaper?', o: ['It uses integers', 'k×k becomes two 1D passes: O(k²) → O(2k) per pixel', 'It skips border pixels', 'It runs in the frequency domain'], a: 1 },
      { q: 'In Canny, what is hysteresis for?', o: ['Thinning edges to 1 px', 'Keeping weak edges only if connected to strong edges', 'Removing salt noise', 'Choosing σ automatically'], a: 1 },
      { q: 'Which transform keeps parallel lines parallel but not angles?', o: ['Rigid', 'Similarity', 'Affine', 'Projective'], a: 2, e: 'Affine: 6 DoF, preserves parallel lines and ratios along lines.' },
      { q: 'Otsu\'s method chooses a threshold that…', o: ['Equals the mean intensity', 'Maximises between-class variance', 'Minimises the number of edges', 'Equalizes the histogram'], a: 1, e: 'Works best for bimodal histograms.' },
    ],
  });

  /* ============================ Chapter 4 ============================ */
  CV.addChapter({
    n: 4, part: 1, minutes: 18,
    title: 'Local Features and Matching',
    sub: 'Corners, scale space, SIFT, ORB, RANSAC, HOG, Viola–Jones and bag of visual words.',
    sections: [
      { id: 'why', title: 'Why features?', html: `
        <p>Pixels change with lighting, viewpoint and noise. A <span class="term">local feature</span> is a small, distinctive, repeatable pattern (a corner, a blob) described by a vector that stays similar when the image changes. Features let us match two photos of the same place, stitch panoramas, track objects, reconstruct 3D and recognise instances.</p>
        <p>A feature pipeline has three steps:</p>
        ${ol(['<strong>Detect</strong> interest points (keypoints) that can be found again in another image.', '<strong>Describe</strong> the neighbourhood of each keypoint with a vector (descriptor).', '<strong>Match</strong> descriptors between images, then verify geometrically.'])}
        <p>A good keypoint is repeatable, distinctive, local (robust to occlusion), efficient and invariant to the expected changes (rotation, scale, lighting).</p>` },
      { id: 'harris', title: 'Corners: the Harris detector', html: `
        <p>Flat regions look the same when you shift a window; edges change only across the edge; corners change in every direction. Harris measures this with the <span class="term">structure tensor</span> built from image gradients over a window:</p>
        ${f(`<b>M</b> = Σ<sub>window</sub> <i>w</i>(<i>x</i>,<i>y</i>) · [ <i>I<sub>x</sub></i>² &nbsp; <i>I<sub>x</sub>I<sub>y</sub></i> ; &nbsp; <i>I<sub>x</sub>I<sub>y</sub></i> &nbsp; <i>I<sub>y</sub></i>² ]`, 'Structure tensor')}
        <p>Both eigenvalues of M large means a corner; one large means an edge; both small means a flat area. To avoid computing eigenvalues Harris uses the response</p>
        ${f(`<i>R</i> = det(<b>M</b>) − <i>k</i> · trace(<b>M</b>)², &nbsp;&nbsp; <i>k</i> ≈ 0.04 to 0.06`, 'Harris response')}
        ${w('harris')}
        <p>Corners are local maxima of R above a threshold. <strong>Shi–Tomasi</strong> (used by <code>cv2.goodFeaturesToTrack</code>) simply uses the smaller eigenvalue. <strong>FAST</strong> is a very fast corner test comparing a pixel to a circle of 16 neighbours. Harris is rotation invariant but <strong>not scale invariant</strong>: a corner at one zoom looks like a smooth curve at another.</p>` },
      { id: 'scale', title: 'Scale space and blobs', html: `
        <p>To find features at any size we search over scale. The scale-normalised <span class="term">Laplacian of Gaussian (LoG)</span> responds strongly to blobs whose size matches the Gaussian σ. <span class="term">Difference of Gaussians (DoG)</span> approximates LoG cheaply by subtracting two blurred copies of the image, and is the detector used in SIFT.</p>` },
      { id: 'sift', title: 'SIFT: Scale-Invariant Feature Transform', html: `
        <p>SIFT (Lowe, 1999 and 2004) was the dominant descriptor for fifteen years. Its stages:</p>
        ${ol([
          '<strong>Scale-space extrema:</strong> build a Gaussian pyramid of octaves, subtract neighbouring blur levels (DoG), and find points that are maxima or minima among their 26 neighbours (8 in the same level, 9 above, 9 below).',
          '<strong>Keypoint localisation:</strong> refine position to sub-pixel accuracy; discard low-contrast points and points along edges (using a Harris-like curvature ratio).',
          '<strong>Orientation assignment:</strong> build a 36-bin histogram of gradient directions around the keypoint; the peak gives a dominant orientation, which gives rotation invariance.',
          '<strong>Descriptor:</strong> rotate the 16 × 16 patch to the dominant orientation, divide into a 4 × 4 grid of cells, and in each cell build an 8-bin gradient orientation histogram. This gives 4 × 4 × 8 = <strong>128 numbers</strong>. Normalise to unit length (and clip, renormalise) for illumination robustness.',
        ])}
        <p>Descriptors from histograms of gradients are robust to small shifts and lighting changes. The SIFT patent expired in 2020, and SIFT is included in OpenCV (<code>cv2.SIFT_create()</code>).</p>` },
      { id: 'orb', title: 'Fast binary descriptors: BRIEF and ORB', html: `
        <p>SIFT's float vectors are slow to compare. <strong>BRIEF</strong> compares the intensity of random pixel pairs inside a patch and stores each result as one bit. <strong>ORB</strong> (Oriented FAST and Rotated BRIEF) adds orientation and scale pyramids and produces a 256-bit descriptor. Binary descriptors are compared with <span class="term">Hamming distance</span> (count of differing bits), a single XOR and popcount, and are the standard choice for real-time systems such as ORB-SLAM.</p>
        ${table(['Method', 'Detector', 'Descriptor', 'Size', 'Speed', 'Robustness'], [
          ['SIFT', 'DoG', 'gradient histograms', '128 floats', 'slow', 'excellent scale/rotation'],
          ['SURF', 'fast Hessian', 'Haar responses', '64 floats', 'medium', 'good'],
          ['ORB', 'oriented FAST', 'rotated BRIEF', '256 bits', 'very fast', 'good, weaker for big scale change'],
          ['AKAZE', 'nonlinear scale space', 'binary', '486 bits', 'medium', 'good'],
          ['SuperPoint', 'learned', 'learned', '256 floats', 'GPU', 'strong on hard conditions'],
        ])}` },
      { id: 'ransac', title: 'Matching and RANSAC', html: `
        <p>Brute-force matching compares every descriptor in image A with every one in image B and picks the nearest. Many nearest neighbours are wrong, so use <span class="term">Lowe's ratio test</span>: accept a match only if the distance to the best candidate is less than about 0.75 of the distance to the second best. A distinctive feature has one clearly better match; an ambiguous one has several similar candidates. For large sets use approximate search (FLANN, k-d trees).</p>
        ${w('ratio-test')}
        <p>Even after the ratio test some matches are wrong (outliers). <span class="term">RANSAC</span> (Random Sample Consensus) fits a geometric model robustly:</p>
        ${ol(['Randomly pick the minimal number of matches needed (4 for a homography, 8 or 5 for epipolar geometry).', 'Fit the model.', 'Count inliers: matches that agree with the model within a pixel tolerance.', 'Repeat; keep the model with the most inliers; refit on all inliers.'])}
        ${f(`<i>N</i> = log(1 − <i>p</i>) / log(1 − <i>w<sup>s</sup></i>)`, 'Iterations needed')}
        <p>With inlier ratio w, sample size s and success probability p. For example with 50 percent inliers, s = 4 and p = 0.99, N is about 72.</p>
        ${w('ransac')}
        ${code(`orb = cv2.ORB_create(nfeatures=2000)
k1, d1 = orb.detectAndCompute(imgA_gray, None)
k2, d2 = orb.detectAndCompute(imgB_gray, None)

bf = cv2.BFMatcher(cv2.NORM_HAMMING)
pairs = bf.knnMatch(d1, d2, k=2)
good = [m for m, n in pairs if m.distance < 0.75 * n.distance]   # ratio test

src = np.float32([k1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
dst = np.float32([k2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
H, mask = cv2.findHomography(src, dst, cv2.RANSAC, ransacReprojThreshold=3.0)
print("inliers:", int(mask.sum()), "of", len(good))

pano = cv2.warpPerspective(imgA, H, (imgA.shape[1] + imgB.shape[1], imgA.shape[0]))
pano[0:imgB.shape[0], 0:imgB.shape[1]] = imgB                     # simple stitch`)}` },
      { id: 'hog', title: 'Global descriptors: HOG and Haar cascades', html: `
        <p><span class="term">HOG</span> (Histogram of Oriented Gradients, Dalal and Triggs 2005) describes a whole window rather than a point. Compute gradients; divide the window into 8 × 8 pixel cells; build a 9-bin orientation histogram (weighted by magnitude) in each cell; group cells into overlapping 2 × 2 blocks (16 × 16 pixels) and L2-normalise each block. For a 64 × 128 pedestrian window there are 7 × 15 = 105 blocks of 36 values: <strong>3780 numbers</strong>. A linear SVM on HOG was the standard pedestrian detector for a decade.</p>
        ${w('hog')}
        <p><strong>Viola–Jones</strong> (2001) made real-time face detection practical with three ideas: Haar-like features (differences of sums of rectangles), the <span class="term">integral image</span> (so any rectangle sum costs 4 look-ups), and an AdaBoost <strong>cascade</strong> that rejects most non-face windows after very few cheap tests. <code>cv2.CascadeClassifier</code> still ships these models.</p>` },
      { id: 'bovw', title: 'Bag of Visual Words', html: `
        <p>To classify whole images with local features: extract many SIFT descriptors from a training set, cluster them with k-means into a vocabulary of K "visual words", represent each image as a histogram of word counts (often tf-idf weighted), and train an SVM. This was the state of the art for image classification before 2012.</p>
        ${code(`from sklearn.cluster import MiniBatchKMeans
from sklearn.svm import LinearSVC
sift = cv2.SIFT_create()

def descriptors(path):
    g = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    return sift.detectAndCompute(g, None)[1]

all_desc = np.vstack([descriptors(p) for p in train_paths])
kmeans = MiniBatchKMeans(n_clusters=500, random_state=0).fit(all_desc)

def bovw(path):
    words = kmeans.predict(descriptors(path))
    h = np.bincount(words, minlength=500).astype(np.float32)
    return h / h.sum()

clf = LinearSVC().fit([bovw(p) for p in train_paths], train_labels)`)}` },
      { id: 'learned', title: 'Where learned features took over', html: `
        <p>Deep networks learn features directly from data and beat hand-crafted ones on classification and detection. For matching, learned detectors/descriptors (SuperPoint, D2-Net, DISK) with learned matchers (SuperGlue, LightGlue, LoFTR) are more robust than SIFT under extreme viewpoint and lighting change, while SIFT/ORB remain popular for their simplicity and CPU speed.</p>` },
    ],
    checks: [
      ['Why is the Harris detector not scale invariant?', 'A fixed-size window sees a corner at one scale but a smooth curve at another; SIFT adds scale-space search to fix this.'],
      ['What is the length of a SIFT descriptor and how is it formed?', '128 values: a 4 × 4 grid of cells with an 8-bin gradient-orientation histogram each.'],
      ['What does RANSAC do and why is it needed after descriptor matching?', 'It fits a model using random minimal samples and keeps the one with most inliers, rejecting wrong matches.'],
      ['How many numbers are in a standard HOG descriptor for a 64 × 128 window?', '3780 (105 blocks × 36).'],
    ],
    quiz: [
      { q: 'The structure tensor at a point has λ₁ = 900 and λ₂ = 3. What is it?', o: ['Corner', 'Edge', 'Flat region', 'Blob'], a: 1, e: 'One large eigenvalue: intensity changes in only one direction.' },
      { q: 'ORB descriptors are compared with…', o: ['Euclidean distance', 'Cosine similarity', 'Hamming distance', 'IoU'], a: 2, e: 'Binary strings: XOR + popcount.' },
      { q: 'How many matches does RANSAC sample per iteration to fit a homography?', o: ['2', '3', '4', '8'], a: 2 },
      { q: 'In Lowe\'s ratio test, a match is accepted when…', o: ['d₁ < 0.75 · d₂', 'd₂ < 0.75 · d₁', 'd₁ < 0.75', 'both distances are small'], a: 0 },
      { q: 'What made Viola–Jones rectangle features cheap to evaluate?', o: ['GPUs', 'The integral image (4 look-ups per rectangle)', 'FFT', 'Binary descriptors'], a: 1 },
    ],
  });

  /* ============================ Chapter 5 ============================ */
  CV.addChapter({
    n: 5, part: 1, minutes: 18,
    title: 'Camera Geometry, Stereo and Motion',
    sub: 'The camera matrix, calibration, PnP, epipolar geometry, stereo depth, structure from motion, SLAM and optical flow.',
    sections: [
      { id: 'matrix', title: 'The camera matrix', html: `
        <p>The pinhole projection from Chapter 2 becomes a matrix equation in homogeneous coordinates. A world point X = (X, Y, Z, 1) is first moved into camera coordinates by the <strong>extrinsics</strong> (rotation R and translation t), then projected using the <strong>intrinsics</strong> K:</p>
        ${f(`<i>s</i> · [<i>u</i>, <i>v</i>, 1]<sup>T</sup> = <b>K</b> · [ <b>R</b> | <b>t</b> ] · [<i>X</i>, <i>Y</i>, <i>Z</i>, 1]<sup>T</sup>, &nbsp;&nbsp; <b>K</b> = [ <i>f<sub>x</sub></i> &nbsp;γ&nbsp; <i>c<sub>x</sub></i> ; 0 &nbsp;<i>f<sub>y</sub></i>&nbsp; <i>c<sub>y</sub></i> ; 0 0 1 ]`, 'Projection')}
        ${ul(['<strong>f<sub>x</sub>, f<sub>y</sub>:</strong> focal length in pixel units (focal length divided by pixel size).', '<strong>(c<sub>x</sub>, c<sub>y</sub>):</strong> principal point, usually near the image centre.', '<strong>γ:</strong> skew, almost always 0.', '<strong>R</strong> (3 DoF) and <strong>t</strong> (3) describe the camera pose: 6 DoF.'])}
        <p><strong>Lens distortion</strong> bends straight lines. Radial distortion (barrel or pincushion) is modelled by coefficients k₁, k₂, k₃; tangential distortion by p₁, p₂. Wide-angle and action cameras have strong distortion that must be undone before measuring geometry.</p>
        ${w('virtual-camera')}` },
      { id: 'calib', title: 'Camera calibration and PnP', html: `
        <p>Calibration estimates K and the distortion coefficients. <strong>Zhang's method</strong> photographs a flat checkerboard from 10 to 20 different poses; corners are detected with sub-pixel accuracy and the unknown parameters are solved by least squares. Quality is reported as the <span class="term">reprojection error</span> (mean pixel distance between detected corners and the projections of the model); under about 0.5 pixel is good.</p>
        ${code(`objp = np.zeros((6 * 9, 3), np.float32)
objp[:, :2] = np.mgrid[0:9, 0:6].T.reshape(-1, 2) * 25.0   # 25 mm squares
obj_pts, img_pts = [], []
for path in glob.glob("calib/*.jpg"):
    g = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    ok, corners = cv2.findChessboardCorners(g, (9, 6))
    if ok:
        corners = cv2.cornerSubPix(g, corners, (11, 11), (-1, -1),
                  (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
        obj_pts.append(objp); img_pts.append(corners)
rms, K, dist, rvecs, tvecs = cv2.calibrateCamera(obj_pts, img_pts, g.shape[::-1], None, None)
undistorted = cv2.undistort(img, K, dist)`)}
        <h3>Pose from known points (PnP)</h3>
        <p>If you know several 3D points and where they appear in the image, <code>cv2.solvePnP</code> (with RANSAC) recovers the camera pose. This is how augmented-reality markers (ArUco) and object pose tracking work.</p>` },
      { id: 'epipolar', title: 'Two-view geometry', html: `
        <p>Two cameras (or one camera moved) viewing the same scene are related by <span class="term">epipolar geometry</span>. A point x in image 1 lies on a known epipolar line in image 2, so matching is a 1D search instead of 2D. The relationship is captured by the <strong>fundamental matrix</strong> F (3 × 3, rank 2, 7 DoF):</p>
        ${f(`<i>x'</i><sup>T</sup> · <b>F</b> · <i>x</i> = 0`, 'Epipolar constraint')}
        <p>With calibrated cameras the <strong>essential matrix</strong> E = K'<sup>T</sup> F K encodes only rotation and translation, E = [t]<sub>×</sub> R. Given E, the relative pose (R, t) can be recovered up to an unknown scale (a single camera cannot know absolute size). The 8-point algorithm estimates F from 8 correspondences; the 5-point algorithm estimates E from 5 and is used inside RANSAC.</p>` },
      { id: 'stereo', title: 'Triangulation and stereo depth', html: `
        <p>Once two views and their poses are known, the 3D point is where the two viewing rays intersect (<span class="term">triangulation</span>). In a <strong>rectified</strong> stereo pair (images warped so epipolar lines are horizontal rows), matching reduces to finding the horizontal shift, the <span class="term">disparity</span> d = x<sub>L</sub> − x<sub>R</sub>. Depth follows from similar triangles:</p>
        ${f(`<i>Z</i> = <i>f</i> · <i>B</i> / <i>d</i>`, 'Stereo depth')}
        ${w('stereo')}
        <p>B is the baseline (distance between the cameras). Larger baseline and focal length give better depth accuracy; far objects have tiny disparity and large depth error. Classic matchers are block matching and semi-global matching (SGM, <code>cv2.StereoSGBM_create</code>); deep models (PSMNet, RAFT-Stereo) are more accurate.</p>` },
      { id: 'sfm', title: 'Structure from Motion and SLAM', html: `
        <p><span class="term">Structure from Motion (SfM)</span> reconstructs 3D structure and camera poses from an unordered photo collection:</p>
        ${ol(['Detect and match features across image pairs (SIFT or learned).', 'Geometric verification with RANSAC on E or F.', 'Initialise from the best pair, then add images one by one (PnP), triangulating new points.', '<strong>Bundle adjustment:</strong> jointly refine all camera poses and 3D points by minimising total reprojection error with nonlinear least squares (Levenberg–Marquardt).'])}
        <p>COLMAP is the standard open-source tool. <strong>Visual SLAM</strong> (e.g. ORB-SLAM3) does this online from a video stream with tracking, mapping and loop-closure threads. Visual odometry estimates ego-motion only. These pipelines also feed NeRF and 3D Gaussian Splatting, which need accurate camera poses to train.</p>` },
      { id: 'flow', title: 'Optical flow: estimating motion', html: `
        <p>Optical flow is the apparent motion of every pixel between two frames. The <strong>brightness constancy</strong> assumption says a moving point keeps its intensity: I(x + u, y + v, t + 1) = I(x, y, t). A first-order Taylor expansion gives one equation per pixel:</p>
        ${f(`<i>I<sub>x</sub></i> · <i>u</i> + <i>I<sub>y</sub></i> · <i>v</i> + <i>I<sub>t</sub></i> = 0`, 'Optical flow constraint')}
        <p>Two unknowns (u, v) but one equation: this is the <span class="term">aperture problem</span> (through a small window an edge only reveals motion perpendicular to itself).</p>
        ${w('aperture')}
        <p><strong>Lucas–Kanade</strong> assumes constant flow in a small window and solves the stacked equations by least squares; it gives sparse, accurate tracking of corners (<code>cv2.calcOpticalFlowPyrLK</code>) and works over large motion with image pyramids. <strong>Horn–Schunck</strong> adds a global smoothness term for dense flow; <strong>Farnebäck</strong> computes dense flow with polynomial expansion. Deep methods (FlowNet, PWC-Net, RAFT) build an all-pairs correlation volume and refine the flow with recurrent updates, and are far more accurate.</p>
        ${code(`prev_pts = cv2.goodFeaturesToTrack(prev_gray, maxCorners=200, qualityLevel=0.01, minDistance=7)
next_pts, status, err = cv2.calcOpticalFlowPyrLK(prev_gray, next_gray, prev_pts, None,
                                                 winSize=(21, 21), maxLevel=3)
tracked = next_pts[status.flatten() == 1]
flow = cv2.calcOpticalFlowFarneback(prev_gray, next_gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)  # dense`)}
        <h3>Monocular depth with deep learning</h3>
        <p>A single image has no depth cue in pure geometry, but deep networks learn cues such as perspective, object size and occlusion. Models like MiDaS and Depth Anything predict relative (or metric) depth from one image and are now common for robotics and image editing.</p>` },
    ],
    checks: [
      ['What do the intrinsic and extrinsic parameters describe?', 'Intrinsics K: focal length, principal point (the camera\'s internal optics). Extrinsics R, t: the camera\'s pose in the world.'],
      ['Write the depth formula for a rectified stereo pair.', 'Z = f B / d, with focal length f, baseline B and disparity d.'],
      ['Why is optical flow ambiguous at a straight edge?', 'The aperture problem: only the motion component perpendicular to the edge is observable.'],
      ['What does bundle adjustment minimise?', 'The total reprojection error over all camera poses and 3D points.'],
    ],
    quiz: [
      { q: 'A stereo rig has f = 700 px and B = 0.12 m. A point has disparity 21 px. Its depth is…', o: ['0.4 m', '4 m', '40 m', '1.75 m'], a: 1, e: 'Z = 700 × 0.12 / 21 = 4 m.' },
      { q: 'How many degrees of freedom does a camera pose have?', o: ['3', '4', '6', '8'], a: 2 },
      { q: 'A good calibration typically has reprojection error under about…', o: ['0.5 px', '5 px', '50 px', '0.5 m'], a: 0 },
      { q: 'Why can a single moving camera only recover translation up to scale?', o: ['Lens distortion', 'It cannot know absolute size from images alone', 'The essential matrix is rank 1', 'RANSAC is random'], a: 1 },
      { q: 'Which method assumes constant flow in a small window?', o: ['Horn–Schunck', 'Lucas–Kanade', 'RAFT', 'SGM'], a: 1 },
    ],
  });
})();

/* Machine Learning course lessons (Markdown) */
(function () {
  const T = '```';
  const demo = (name, o) => `::demo ${name}${o ? ' ' + JSON.stringify(o) : ''}`;

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 14,
    title: 'What is Machine Learning?',
    sub: 'Learning from data instead of writing rules: the main types of learning, the end-to-end workflow, and the vocabulary used everywhere else.',
    md: `
## Programs that learn
Tom Mitchell's definition: a program **learns** from experience **E** with respect to task **T** and performance measure **P** if its performance on T, measured by P, improves with E.

| Traditional programming | Machine learning |
|---|---|
| rules + data → answers | data + answers → rules (a model) |
| a human writes the logic | an algorithm fits the logic from examples |
| breaks on cases nobody anticipated | generalises from patterns, but only as well as the data allows |

> [!key] A machine learning ==model== is a function f(x; θ) with parameters θ. ==Training== searches for the θ that makes predictions match the data, by minimising a ==loss function==. Everything else is detail about which function, which loss and which search.

## Types of learning
| Type | Data | Goal | Examples |
|---|---|---|---|
| **Supervised** | inputs x with labels y | predict y for new x | spam detection, house prices, diagnosis |
| **Unsupervised** | inputs x only | find structure | customer segments, anomaly detection, compression |
| **Semi-supervised** | few labels, many unlabelled | use both | medical images with limited annotation |
| **Self-supervised** | labels created from the data itself | learn representations | predict the next word, fill masked patches |
| **Reinforcement** | rewards from interaction | learn a policy | games, robotics, recommendations |

Supervised problems split into ==regression== (continuous y: price, temperature) and ==classification== (discrete y: spam/not spam, digit 0–9).

## The ML workflow
1. **Frame the problem**: what decision will the prediction support? What metric matters? What is the baseline?
2. **Collect and understand data**: sources, labels, biases, leakage risks. Explore with plots and summary statistics.
3. **Prepare data**: clean, split, engineer and scale features (next lesson).
4. **Train models**: start simple (a baseline), then try stronger models.
5. **Evaluate** on held-out data with the right metric; analyse errors.
6. **Tune** hyperparameters with cross-validation.
7. **Deploy and monitor**: serve predictions, watch for drift, retrain.

${T}python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = LogisticRegression(max_iter=5000)
model.fit(X_train, y_train)                 # learn θ from training data
print(accuracy_score(y_test, model.predict(X_test)))   # ≈ 0.96 on unseen data
${T}

## Key vocabulary
| Term | Meaning |
|---|---|
| Feature | an input variable (column) |
| Label / target | what we want to predict |
| Sample / instance | one row |
| Parameters | values learned in training (weights) |
| Hyperparameters | settings chosen before training (learning rate, tree depth, k) |
| Generalisation | performing well on new, unseen data |
| Overfitting | memorising training noise; poor generalisation |
| Underfitting | too simple to capture the pattern |

## The no free lunch theorem
Averaged over all possible problems, no learning algorithm beats any other. Every algorithm encodes assumptions (==inductive bias==): linear models assume additive effects, trees assume axis-aligned splits, k-NN assumes nearby points share labels. Good ML means matching assumptions to your data, and verifying with experiments.

> [!tip] Always build a dumb **baseline** first: predict the mean (regression) or the majority class (classification). If your model cannot clearly beat it, something is wrong.
`,
    checks: [
      ['What is the difference between traditional programming and ML?', 'In traditional programming humans write rules; in ML an algorithm learns the rules (a model) from data and answers.'],
      ['Regression vs classification?', 'Regression predicts a continuous value; classification predicts a discrete category.'],
      ['Parameters vs hyperparameters?', 'Parameters are learned during training; hyperparameters are set beforehand and control the learning process or model capacity.'],
      ['Why build a baseline?', 'To know whether a model adds value: if it cannot beat predicting the mean or majority class, something is wrong.'],
    ],
    quiz: [
      { q: 'Grouping customers by purchase behaviour without labels is…', o: ['Supervised regression', 'Unsupervised clustering', 'Reinforcement learning', 'Classification'], a: 1 },
      { q: 'Predicting a house price is…', o: ['Classification', 'Regression', 'Clustering', 'Dimensionality reduction'], a: 1 },
      { q: 'The maximum depth of a decision tree is a…', o: ['Parameter', 'Hyperparameter', 'Label', 'Feature'], a: 1 },
      { q: 'The no free lunch theorem says…', o: ['Deep learning always wins', 'No algorithm is best for every problem', 'More data never helps', 'Linear models are optimal'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 17,
    title: 'Data Preparation and Feature Engineering',
    sub: 'Train/validation/test splits, data leakage, missing values, encoding categories, scaling, and building features that make models work.',
    md: `
## Garbage in, garbage out
Most real ML effort goes into data. A simple model on good features usually beats a complex model on poor ones.

## Splitting the data
| Split | Used for | Typical size |
|---|---|---|
| **Training** | fitting parameters | 60–80% |
| **Validation** | choosing hyperparameters and models | 10–20% |
| **Test** | one final, unbiased estimate | 10–20% |

- **Stratify** classification splits so class proportions match.
- **Time series**: split by time (train on the past, test on the future), never randomly.
- **Grouped data** (several rows per patient/user): split by group so the same person is not in train and test.

> [!warn] ==Data leakage== is information from outside the training set (or from the future) sneaking into training. Classic causes: scaling or imputing using statistics from the whole dataset, features computed after the outcome (e.g. "refund issued" when predicting fraud), duplicates across splits, and random splits on time series. Leakage produces great offline scores and failures in production.

## Missing values
| Strategy | When |
|---|---|
| Drop rows | few missing values, missing at random |
| Drop columns | mostly empty, low value |
| Impute mean / median / mode | simple baseline (median is robust to outliers) |
| Impute with a model (KNN, iterative) | values are predictable from other features |
| Add a "was missing" indicator | missingness itself carries information |

Tree ensembles like XGBoost and LightGBM handle missing values natively.

## Encoding categorical features
| Encoding | How | Good for |
|---|---|---|
| One-hot | one binary column per category | linear models, few categories |
| Ordinal | map ordered categories to integers (S < M < L) | naturally ordered data, trees |
| Target / mean encoding | replace category with mean target (computed out-of-fold!) | high-cardinality features |
| Hashing | hash categories into k buckets | huge vocabularies, streaming |
| Embeddings | learned dense vectors | neural networks |

## Scaling numeric features
Distance-based and gradient-based models (k-NN, SVM, linear/logistic regression, neural nets, PCA) need features on comparable scales. Trees do not care.

| Scaler | Formula | Notes |
|---|---|---|
| Standardisation | z = (x − μ) / σ | the default choice |
| Min–max | (x − min) / (max − min) | maps to [0, 1]; sensitive to outliers |
| Robust | (x − median) / IQR | resistant to outliers |
| Log / Box-Cox | log(1 + x) | tames right-skewed data (income, counts) |

## Feature engineering
- **Domain features**: ratios (debt / income), differences, aggregates (purchases in last 30 days).
- **Date-time**: hour, weekday, month, holiday flags; cyclic encoding with sin/cos for hour of day.
- **Text**: bag of words, TF-IDF, or embeddings from a pretrained model.
- **Interactions and polynomials**: x₁·x₂, x², for linear models.
- **Binning**: turn age into age groups when the effect is step-like.

## Do it with pipelines
Fit every preprocessing step on the **training data only**, and bundle steps so cross-validation stays leak-free.

${T}python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression

numeric = ["age", "income", "balance"]
categorical = ["city", "plan"]

preprocess = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median")),
                      ("scale", StandardScaler())]), numeric),
    ("cat", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                      ("onehot", OneHotEncoder(handle_unknown="ignore"))]), categorical),
])

model = Pipeline([("prep", preprocess), ("clf", LogisticRegression(max_iter=1000))])
model.fit(X_train, y_train)      # imputers and scalers learn only from X_train
${T}

${demo('checklist', { id: 'ml-data', label: 'Data readiness', meta: { title: 'Data preparation checklist', desc: 'Run through this before training anything serious.' }, items: [['Target defined precisely', 'What exactly is predicted, at what moment, for which decision?'], ['Splits are realistic', 'Stratified, grouped or time-based to mirror production.'], ['No leakage', 'No future information, no target-derived features, preprocessing fit on train only.'], ['Duplicates removed', 'Especially across train and test.'], ['Missing values handled', 'Imputed, flagged or left for a model that handles them.'], ['Categories encoded', 'Unknown categories at prediction time are handled.'], ['Scales comparable', 'For distance- and gradient-based models.'], ['Outliers investigated', 'Errors fixed, real extremes kept or transformed.'], ['Baseline recorded', 'Majority class or mean prediction score on the validation set.']] })}
`,
    checks: [
      ['What is data leakage? Give two examples.', 'Using information unavailable at prediction time: e.g. scaling with whole-dataset statistics, features recorded after the outcome, or random splits on time series.'],
      ['Why fit scalers only on training data?', 'Fitting on all data leaks test-set statistics into training and inflates evaluation scores.'],
      ['Which models need feature scaling?', 'Distance- and gradient-based ones: k-NN, SVM, linear/logistic regression, neural networks, PCA. Tree models do not.'],
      ['How should you split time-series data?', 'By time: train on earlier periods and validate/test on later ones.'],
    ],
    quiz: [
      { q: 'One-hot encoding a feature with 50,000 unique values is problematic because…', o: ['It loses information', 'It creates a huge sparse matrix', 'Trees cannot use it', 'It leaks the target'], a: 1 },
      { q: 'Which scaler is most robust to outliers?', o: ['Min–max', 'Standard', 'Robust (median/IQR)', 'None'], a: 2 },
      { q: 'A "days since account closed" feature for predicting account closure is…', o: ['Good engineering', 'Target leakage', 'Regularisation', 'Augmentation'], a: 1 },
      { q: 'sklearn Pipelines help prevent leakage because…', o: ['They are faster', 'Preprocessing is re-fit on each training fold only', 'They remove outliers', 'They add features'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 2, minutes: 17,
    title: 'Linear Regression and Gradient Descent',
    sub: 'The simplest model done properly: least squares, the normal equation, gradient descent, polynomial features and the assumptions behind the numbers.',
    md: `
## The model
$$ ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b = wᵀx + b $$

Each weight says how much the prediction changes when that feature increases by one unit, holding the others fixed. Linear regression is fast, interpretable and a strong baseline.

## The loss: mean squared error
$$ MSE = (1/n) Σ (yᵢ − ŷᵢ)² $$

Squaring makes all errors positive, punishes large errors heavily, and gives a smooth bowl-shaped (convex) loss with a single minimum.

${demo('ml-linreg')}

## Solving it, two ways
**Closed form (normal equation)**:

$$ w = (XᵀX)⁻¹ Xᵀy $$

Exact in one step, but costs O(n·d² + d³) and fails when features are collinear (XᵀX not invertible).

**Gradient descent**: start somewhere and walk downhill.

$$ w ← w − η · ∂MSE/∂w, with ∂MSE/∂w = −(2/n) Xᵀ(y − Xw) $$

${T}python
import numpy as np

def fit_gd(X, y, lr=0.01, epochs=1000):
    n, d = X.shape
    w, b = np.zeros(d), 0.0
    for _ in range(epochs):
        y_hat = X @ w + b
        err = y_hat - y
        w -= lr * (2 / n) * X.T @ err      # gradient of MSE w.r.t. w
        b -= lr * (2 / n) * err.sum()
    return w, b
${T}

${demo('grad-descent')}

| Variant | Uses per step | Trade-off |
|---|---|---|
| Batch GD | all n samples | accurate gradient, slow on big data |
| Stochastic GD (SGD) | 1 sample | noisy but cheap; can escape shallow minima |
| Mini-batch GD | 32–1024 samples | the standard in practice |

> [!key] The ==learning rate== η is the most important hyperparameter of gradient descent. Too small: painfully slow. Too large: oscillation or divergence. Always **scale features** first, or the loss bowl becomes a long narrow valley and descent zig-zags.

## Polynomial and basis features
Linear in the **parameters**, not necessarily in the inputs. Add x², x³, x₁x₂ or other basis functions and linear regression fits curves. More flexible features increase the risk of overfitting (see lesson 5).

## Evaluating regression
| Metric | Formula | Notes |
|---|---|---|
| MAE | mean \\|y − ŷ\\| | same unit as y, robust to outliers |
| MSE / RMSE | mean (y − ŷ)², its square root | penalises large errors |
| R² | 1 − SS_res / SS_tot | fraction of variance explained; 0 = predicting the mean |
| MAPE | mean \\|y − ŷ\\| / \\|y\\| | relative error; breaks near y = 0 |

## Assumptions (for valid inference)
Linearity, independent errors, constant error variance (homoscedasticity), and roughly normal residuals; plus no severe multicollinearity. Prediction can still work when they are violated, but coefficients, p-values and confidence intervals become unreliable. **Plot the residuals**: patterns mean the model is missing structure.

${T}python
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score

reg = LinearRegression().fit(X_train, y_train)
pred = reg.predict(X_test)
print(reg.coef_, reg.intercept_)
print("MAE", mean_absolute_error(y_test, pred), "R2", r2_score(y_test, pred))
${T}
`,
    checks: [
      ['Write the normal equation.', 'w = (XᵀX)⁻¹Xᵀy.'],
      ['Why scale features before gradient descent?', 'Unscaled features make the loss surface elongated, so descent zig-zags and needs a tiny learning rate.'],
      ['What does R² = 0 mean?', 'The model explains no more variance than always predicting the mean of y.'],
      ['How can linear regression fit a curve?', 'By adding non-linear basis features such as x², x³ or interactions; the model stays linear in its parameters.'],
    ],
    quiz: [
      { q: 'MSE is preferred over MAE when…', o: ['Outliers should be ignored', 'Large errors should be penalised heavily', 'Targets are categories', 'There is no data'], a: 1 },
      { q: 'If the learning rate is too large, gradient descent may…', o: ['Converge faster always', 'Diverge or oscillate', 'Stop immediately', 'Underfit only'], a: 1 },
      { q: 'Mini-batch gradient descent uses…', o: ['One sample per step', 'All samples per step', 'A small subset per step', 'No gradients'], a: 2 },
      { q: 'A curved pattern in a residual plot suggests…', o: ['Perfect fit', 'Missing non-linear structure', 'Too much data', 'Data leakage'], a: 1 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 16,
    title: 'Logistic Regression and Classification',
    sub: 'From scores to probabilities: the sigmoid, log loss, decision boundaries, multiclass softmax, and choosing a threshold.',
    md: `
## From regression to classification
Linear regression outputs any real number; for classification we want a probability. ==Logistic regression== passes the linear score through the ==sigmoid==:

$$ p = σ(z) = 1 / (1 + e^(−z)), z = wᵀx + b $$

The score z is the **log-odds**: log(p / (1 − p)) = wᵀx + b. A weight of 0.7 means one unit of that feature multiplies the odds by e^0.7 ≈ 2.

## The loss: binary cross-entropy (log loss)
$$ L = −(1/n) Σ [ y·log p + (1 − y)·log(1 − p) ] $$

Confident wrong answers are punished severely (−log of a tiny number is huge). The loss is convex, so gradient descent finds the global minimum. The gradient is beautifully simple: ∂L/∂w = (1/n) Xᵀ(p − y).

## Decision boundary
Predict class 1 when p ≥ 0.5, i.e. when wᵀx + b ≥ 0. That boundary is a **straight line** (a hyperplane in higher dimensions). Non-linear boundaries need engineered features or a different model.

## Multiclass: softmax regression
For K classes, compute one score per class and normalise with ==softmax==:

$$ p_k = e^(z_k) / Σ_j e^(z_j) $$

The loss becomes categorical cross-entropy, −log p_true.

${demo('softmax-ce')}

Alternatives: **one-vs-rest** (K binary classifiers) and **one-vs-one** (K(K−1)/2 classifiers, used by SVMs).

## Choosing the threshold
0.5 is not sacred. The right threshold depends on the cost of each error type: a cancer screen should flag more cases (lower threshold, higher recall); a spam filter should rarely bin real mail (higher threshold, higher precision).

${demo('ml-roc')}

## Regularised logistic regression
Scikit-learn applies L2 regularisation by default; the hyperparameter **C** is the *inverse* strength (smaller C = stronger regularisation). Lesson 6 explains why this helps.

${T}python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000))
clf.fit(X_train, y_train)
proba = clf.predict_proba(X_test)[:, 1]          # P(class = 1)
pred = (proba >= 0.3).astype(int)                 # custom threshold for higher recall
${T}

> [!key] Logistic regression is a probabilistic, interpretable, fast and well-calibrated baseline for classification. Use it before anything fancier, especially on tabular data with many features.

## Other linear classifiers
- **Perceptron**: updates only on mistakes; no probabilities.
- **Linear SVM**: maximises the margin (next lessons).
- **Linear discriminant analysis**: models each class as a Gaussian with shared covariance.
`,
    checks: [
      ['What does the logistic regression score z represent?', 'The log-odds of the positive class: log(p/(1−p)) = wᵀx + b.'],
      ['Why use cross-entropy instead of MSE for classification?', 'It is convex for logistic regression, heavily punishes confident wrong predictions, and matches the maximum-likelihood objective for probabilities.'],
      ['What shape is a logistic regression decision boundary?', 'A straight line / hyperplane, where wᵀx + b = 0.'],
      ['When would you lower the decision threshold below 0.5?', 'When false negatives are costly and you need higher recall, e.g. disease screening.'],
    ],
    quiz: [
      { q: 'σ(0) equals…', o: ['0', '0.5', '1', 'e'], a: 1 },
      { q: 'In scikit-learn, a smaller C in LogisticRegression means…', o: ['Weaker regularisation', 'Stronger regularisation', 'More iterations', 'Higher threshold'], a: 1 },
      { q: 'Softmax outputs…', o: ['Independent probabilities', 'A probability distribution summing to 1', 'Log-odds', 'Distances'], a: 1 },
      { q: 'A weight of ln 2 on a feature means one unit increase…', o: ['Adds 2 to the probability', 'Doubles the odds', 'Halves the probability', 'Has no effect'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 18,
    title: 'Evaluating Models',
    sub: 'Cross-validation, the confusion matrix, precision, recall, F1, ROC-AUC and PR curves, and the bias–variance trade-off.',
    md: `
## Why held-out data?
A model scored on its own training data is graded on the exam it memorised. Estimate ==generalisation== on data the model never saw.

## Cross-validation
==k-fold cross-validation== splits the training data into k folds; train on k − 1 and validate on the remaining one, k times; report the mean and spread.

${T}python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1")
print(scores.mean(), "+/-", scores.std())
${T}

Variants: **stratified** (keeps class ratios), **group k-fold** (one group per fold), **time-series split** (expanding window), **nested CV** (outer loop for evaluation, inner for tuning, so tuning does not bias the estimate).

## The confusion matrix
| | Predicted positive | Predicted negative |
|---|---|---|
| **Actual positive** | True positive (TP) | False negative (FN) |
| **Actual negative** | False positive (FP) | True negative (TN) |

${demo('metrics')}

| Metric | Formula | Question it answers |
|---|---|---|
| Accuracy | (TP + TN) / all | how often am I right? (misleading on imbalanced data) |
| Precision | TP / (TP + FP) | when I say positive, how often am I right? |
| Recall (sensitivity, TPR) | TP / (TP + FN) | how many positives did I catch? |
| Specificity (TNR) | TN / (TN + FP) | how many negatives did I correctly clear? |
| F1 | 2·P·R / (P + R) | harmonic mean of precision and recall |
| ROC-AUC | area under TPR vs FPR | ranking quality across all thresholds |
| PR-AUC (average precision) | area under precision vs recall | better than ROC-AUC for rare positives |
| Log loss | cross-entropy | quality of the probabilities themselves |

> [!warn] With 1% fraud, a model that always says "not fraud" is 99% accurate and useless. On imbalanced data, report precision, recall, F1 and PR-AUC.

## Bias and variance
Expected error decomposes into

$$ error = bias² + variance + irreducible noise $$

- ==Bias==: error from wrong assumptions (a line fitted to a curve). High bias = **underfitting**.
- ==Variance==: sensitivity to the particular training sample. High variance = **overfitting**.

${demo('overfit')}

| Symptom | Diagnosis | Fixes |
|---|---|---|
| High train error, high val error | underfitting (bias) | more features, more flexible model, less regularisation, train longer |
| Low train error, high val error | overfitting (variance) | more data, regularisation, simpler model, feature selection, early stopping, ensembling |
| Both low, but production is bad | distribution shift or leakage | check splits, monitor live data |

## Learning curves
Plot training and validation scores against training-set size. If the curves converge at a poor score, more data will not help (bias). If there is a persistent gap, more data or regularisation will (variance).

${T}python
from sklearn.model_selection import learning_curve
sizes, train_sc, val_sc = learning_curve(model, X, y, cv=5, train_sizes=[0.1, 0.3, 0.5, 0.7, 1.0])
${T}
`,
    checks: [
      ['Why is accuracy misleading on imbalanced data?', 'Predicting the majority class gets high accuracy while missing every minority case.'],
      ['Precision vs recall?', 'Precision: of predicted positives, how many are right. Recall: of actual positives, how many were found.'],
      ['What does a large gap between training and validation scores indicate?', 'High variance (overfitting).'],
      ['When is PR-AUC preferred over ROC-AUC?', 'When positives are rare; ROC-AUC can look good thanks to many true negatives, while PR-AUC focuses on the positive class.'],
    ],
    quiz: [
      { q: 'TP = 40, FP = 10, FN = 20. Precision is…', o: ['0.67', '0.80', '0.50', '0.40'], a: 1 },
      { q: 'With the same numbers, recall is…', o: ['0.67', '0.80', '0.33', '0.20'], a: 0 },
      { q: 'Training and validation error are both high. The model is…', o: ['Overfitting', 'Underfitting', 'Perfect', 'Leaking data'], a: 1 },
      { q: 'Nested cross-validation is used to…', o: ['Speed up training', 'Get an unbiased estimate when tuning hyperparameters', 'Handle missing values', 'Encode categories'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 2, minutes: 14,
    title: 'Regularisation and Model Selection',
    sub: 'Ridge, Lasso and Elastic Net; why penalising weights reduces overfitting; and tuning hyperparameters with grid, random and Bayesian search.',
    md: `
## Penalise complexity
==Regularisation== adds a penalty on the size of the weights to the loss, trading a little bias for a large drop in variance.

| Method | Penalty | Effect |
|---|---|---|
| **Ridge (L2)** | λ Σ wⱼ² | shrinks all weights smoothly; handles collinearity |
| **Lasso (L1)** | λ Σ \\|wⱼ\\| | drives some weights exactly to 0: built-in feature selection |
| **Elastic Net** | λ [α Σ \\|wⱼ\\| + (1 − α) Σ wⱼ²] | sparse like Lasso, stable with correlated features like Ridge |

$$ Ridge loss = MSE + λ · ‖w‖² $$

> [!key] Why does L1 give zeros? The L1 constraint region is a diamond with corners on the axes; the loss contours usually touch it at a corner, where some weights are exactly zero. The L2 region is a circle with no corners, so weights shrink but rarely vanish.

- λ = 0: plain least squares (risk of overfitting).
- λ → ∞: all weights → 0 (underfitting).
- **Always scale features** first: the penalty treats all weights equally, so units matter.
- Do not penalise the bias term.

## Other forms of regularisation
- **Early stopping**: stop training when validation loss stops improving.
- **Model constraints**: max tree depth, min samples per leaf, fewer features.
- **Dropout, weight decay, data augmentation**: in deep learning.
- **Ensembling**: averaging many models reduces variance.

## Hyperparameter tuning
| Method | How | When |
|---|---|---|
| Grid search | try every combination | few hyperparameters, small ranges |
| Random search | sample combinations randomly | many hyperparameters; usually beats grid for the same budget |
| Bayesian optimisation (Optuna, Hyperopt) | model score as a function of settings, sample promising regions | expensive models |
| Successive halving / Hyperband | give more budget to promising configs | large searches |

${T}python
from sklearn.model_selection import RandomizedSearchCV
from sklearn.linear_model import ElasticNet
from scipy.stats import loguniform, uniform

search = RandomizedSearchCV(
    make_pipeline(StandardScaler(), ElasticNet(max_iter=10000)),
    {"elasticnet__alpha": loguniform(1e-4, 10), "elasticnet__l1_ratio": uniform(0, 1)},
    n_iter=50, cv=5, scoring="neg_root_mean_squared_error", random_state=0)
search.fit(X_train, y_train)
print(search.best_params_, -search.best_score_)
${T}

> [!tip] Search learning rates and regularisation strengths on a **log scale** (0.0001, 0.001, 0.01, …), because their effect is multiplicative.

## Model selection rules of thumb
- Prefer the simplest model within one standard error of the best CV score.
- Touch the test set once, at the very end.
- Track experiments (parameters, data version, metrics) with MLflow or Weights & Biases.
`,
    checks: [
      ['What is the difference between L1 and L2 regularisation?', 'L1 (Lasso) penalises absolute weights and can set weights exactly to zero; L2 (Ridge) penalises squared weights and shrinks them smoothly.'],
      ['Why scale features before regularising?', 'The penalty treats all weights equally, so features on larger scales would be penalised differently.'],
      ['Why does random search often beat grid search?', 'For the same budget it tries more distinct values of each important hyperparameter instead of repeating values of unimportant ones.'],
    ],
    quiz: [
      { q: 'Which method performs automatic feature selection?', o: ['Ridge', 'Lasso', 'OLS', 'Standard scaling'], a: 1 },
      { q: 'Increasing λ in Ridge regression…', o: ['Increases variance', 'Increases bias and reduces variance', 'Has no effect', 'Removes features'], a: 1 },
      { q: 'With highly correlated features, a good choice is…', o: ['Lasso only', 'Elastic Net', 'No regularisation', 'Higher learning rate'], a: 1 },
      { q: 'Learning rates are best searched on a…', o: ['Linear scale', 'Log scale', 'Single value', 'Random integers'], a: 1 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 2, minutes: 16,
    title: 'k-Nearest Neighbours and Support Vector Machines',
    sub: 'Instance-based learning with k-NN, the curse of dimensionality, maximum-margin classifiers and the kernel trick.',
    md: `
## k-nearest neighbours
To predict a new point, find the **k** closest training points and take a majority vote (classification) or the average (regression). There is no training step: k-NN is a ==lazy learner== that stores the data.

${demo('ml-knn')}

| Choice | Effect |
|---|---|
| small k | flexible, noisy boundary: low bias, high variance |
| large k | smooth boundary: high bias, low variance |
| distance metric | Euclidean, Manhattan, cosine (for text/embeddings) |
| weighting | weight votes by 1/distance |

**Must scale features.** Prediction is slow on big data (compare against every point) unless you use KD-trees, ball trees or approximate nearest-neighbour indexes (FAISS, HNSW), the same technology behind vector databases in RAG systems.

## The curse of dimensionality
In high dimensions, points become almost equally far from each other, so "nearest" loses meaning, and the data needed to cover the space grows exponentially. Remedies: feature selection, dimensionality reduction (PCA), or learned embeddings where distance is meaningful.

## Support vector machines
A linear ==SVM== finds the hyperplane that separates the classes with the **largest margin**. Only the points on the margin, the ==support vectors==, determine it.

$$ minimise ½‖w‖² + C Σ ξᵢ subject to yᵢ(wᵀxᵢ + b) ≥ 1 − ξᵢ $$

- ξᵢ are slack variables allowing violations (soft margin).
- **C** controls the trade-off: large C = few violations, narrow margin (risk of overfitting); small C = wide margin, more violations.
- Equivalent to minimising ==hinge loss== max(0, 1 − y·f(x)) plus L2 regularisation.

## The kernel trick
Map inputs to a higher-dimensional space where classes become linearly separable, without computing the mapping: replace dot products with a ==kernel== K(x, x').

| Kernel | Formula | Use |
|---|---|---|
| Linear | xᵀx' | high-dimensional sparse data (text) |
| Polynomial | (γ xᵀx' + r)^d | feature interactions |
| RBF (Gaussian) | exp(−γ ‖x − x'‖²) | default non-linear choice |

For RBF, **γ** sets the reach of each point: large γ = wiggly boundary (overfit), small γ = smooth.

${T}python
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV

svm = make_pipeline(StandardScaler(), SVC(kernel="rbf", probability=True))
grid = GridSearchCV(svm, {"svc__C": [0.1, 1, 10, 100], "svc__gamma": [0.001, 0.01, 0.1, 1]}, cv=5)
grid.fit(X_train, y_train)
${T}

> [!note] SVMs shine on small-to-medium datasets with many features (text classification, bioinformatics). Kernel SVMs scale roughly O(n²)–O(n³) in samples, so for millions of rows use linear SVMs, gradient boosting or neural networks.
`,
    checks: [
      ['Why is k-NN called a lazy learner?', 'It does no work at training time; it stores the data and computes distances at prediction time.'],
      ['What happens to k-NN as k increases?', 'The boundary becomes smoother: variance falls and bias rises.'],
      ['What are support vectors?', 'The training points on or inside the margin; they alone determine the SVM decision boundary.'],
      ['What does the kernel trick do?', 'It computes dot products in a high-dimensional feature space via a kernel function, without explicitly mapping the data.'],
    ],
    quiz: [
      { q: 'In an RBF SVM, a very large γ tends to…', o: ['Underfit', 'Overfit', 'Have no effect', 'Remove support vectors'], a: 1 },
      { q: 'A large C in a soft-margin SVM means…', o: ['Wider margin, more violations', 'Narrower margin, fewer violations', 'Linear kernel', 'More regularisation'], a: 1 },
      { q: 'The curse of dimensionality mainly hurts…', o: ['Distance-based methods like k-NN', 'Decision tree depth', 'Learning rate', 'Sigmoid outputs'], a: 0 },
      { q: 'SVM training minimises hinge loss plus…', o: ['L1 penalty', 'L2 penalty on w', 'Cross-entropy', 'Gini impurity'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 2, minutes: 19,
    title: 'Decision Trees and Ensembles',
    sub: 'How trees split, why single trees overfit, and how bagging, random forests and gradient boosting (XGBoost, LightGBM, CatBoost) dominate tabular data.',
    md: `
## Decision trees
A tree asks a sequence of yes/no questions about features ("income ≤ 50k?") and makes a prediction at each leaf. Trees handle mixed feature types, need no scaling, capture interactions and are easy to explain.

## Choosing splits
At each node the algorithm (CART) tries every feature and threshold and picks the split with the largest **impurity decrease**.

| Criterion | Formula | Task |
|---|---|---|
| Gini impurity | 1 − Σ pₖ² | classification (sklearn default) |
| Entropy | −Σ pₖ log₂ pₖ | classification (information gain) |
| MSE / variance | mean (y − ȳ)² | regression |

${demo('ml-tree-split')}

## Controlling overfitting
A fully grown tree memorises the training data. Limit growth with **max_depth**, **min_samples_leaf**, **min_samples_split**, **max_leaf_nodes**, or prune afterwards with **cost-complexity pruning** (ccp_alpha).

## Ensembles: many models beat one
### Bagging and random forests
==Bagging== trains many trees on **bootstrap samples** (sampling rows with replacement) and averages them, cutting variance. A ==random forest== also considers only a random subset of features at each split (≈ √d for classification), decorrelating the trees so averaging helps more.

- Robust defaults; hard to badly overfit by adding trees.
- **Out-of-bag (OOB)** error: each tree is evaluated on the ~37% of rows it never saw, a free validation estimate.
- Feature importances (use permutation importance for reliability).

### Boosting
==Boosting== trains models **sequentially**, each focusing on the errors of the ensemble so far. ==Gradient boosting== fits each new small tree to the negative gradient of the loss (for MSE, simply the residuals):

$$ F_m(x) = F_(m−1)(x) + η · h_m(x) $$

${T}python
# gradient boosting for regression, from scratch
pred = np.full(len(y), y.mean())
trees = []
for m in range(200):
    residual = y - pred                       # negative gradient of MSE
    tree = DecisionTreeRegressor(max_depth=3).fit(X, residual)
    pred += 0.1 * tree.predict(X)             # learning rate (shrinkage)
    trees.append(tree)
${T}

| Library | Strengths |
|---|---|
| **XGBoost** | regularised objective, fast, handles missing values, very widely used |
| **LightGBM** | histogram-based, leaf-wise growth, fastest on large data |
| **CatBoost** | excellent native handling of categorical features, strong defaults |
| sklearn HistGradientBoosting | LightGBM-style, built into scikit-learn |

Key hyperparameters: number of trees, **learning rate** (smaller + more trees = better but slower), max depth / num leaves, subsampling of rows and columns, L1/L2 regularisation. Use **early stopping** on a validation set.

${T}python
import lightgbm as lgb

model = lgb.LGBMClassifier(n_estimators=2000, learning_rate=0.03, num_leaves=31,
                           subsample=0.8, colsample_bytree=0.8)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)],
          callbacks=[lgb.early_stopping(100)])
${T}

| | Random forest | Gradient boosting |
|---|---|---|
| Trees built | independently, in parallel | sequentially |
| Reduces mainly | variance | bias (and variance with shrinkage) |
| Tuning needed | little | more |
| Typical accuracy on tabular data | very good | usually best |

> [!key] For structured/tabular data, gradient-boosted trees remain the state of the art in most benchmarks and competitions, often beating deep learning. Start there after your linear baseline.

### Stacking
Train a meta-model on the out-of-fold predictions of several different base models. Common in competitions; adds complexity in production.
`,
    checks: [
      ['How does a decision tree choose a split?', 'It tries features and thresholds and picks the one that maximises impurity decrease (Gini, entropy or variance reduction).'],
      ['What two sources of randomness does a random forest use?', 'Bootstrap sampling of rows for each tree and random feature subsets at each split.'],
      ['How does gradient boosting differ from bagging?', 'Boosting builds trees sequentially, each fitting the errors (negative gradients) of the current ensemble; bagging builds independent trees and averages them.'],
      ['What is out-of-bag error?', 'An error estimate using, for each tree, the training rows not in its bootstrap sample.'],
    ],
    quiz: [
      { q: 'Gini impurity of a node with 50% / 50% classes is…', o: ['0', '0.25', '0.5', '1'], a: 2, e: '1 − (0.5² + 0.5²) = 0.5.' },
      { q: 'Random forests mainly reduce…', o: ['Bias', 'Variance', 'Training time', 'Feature count'], a: 1 },
      { q: 'In gradient boosting with MSE loss, each new tree fits…', o: ['The original labels', 'The residuals', 'Random noise', 'The features'], a: 1 },
      { q: 'Which library is known for native categorical feature handling?', o: ['XGBoost', 'CatBoost', 'NumPy', 'Matplotlib'], a: 1 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 3, minutes: 16,
    title: 'Clustering',
    sub: 'Grouping unlabelled data: k-means and k-means++, choosing k, hierarchical clustering, DBSCAN and Gaussian mixture models.',
    md: `
## Unsupervised structure
==Clustering== groups similar points without labels. Uses: customer segmentation, grouping documents, image compression, anomaly detection, and exploring a new dataset.

## k-means
Minimise ==inertia==, the sum of squared distances from each point to its cluster centroid, by alternating:

1. **Assign** each point to the nearest centroid.
2. **Update** each centroid to the mean of its points.

${demo('ml-kmeans')}

- Converges quickly, but to a **local** optimum: run several initialisations (n_init) and keep the best.
- ==k-means++== spreads the initial centroids out (sampling proportional to squared distance) and is the default.
- Assumes roughly spherical, similarly sized clusters; scale features first.

### Choosing k
| Method | Idea |
|---|---|
| Elbow | plot inertia vs k; look for the bend |
| Silhouette score | (b − a) / max(a, b): how much closer a point is to its own cluster than the next; range −1…1 |
| Gap statistic | compare inertia with random data |
| Domain needs | "marketing can handle 5 segments" |

## Hierarchical clustering
**Agglomerative**: start with every point as a cluster and repeatedly merge the closest pair. The result is a ==dendrogram==; cut it at any height to get clusters. **Linkage** defines cluster distance: single (min, chains), complete (max), average, or **Ward** (minimise variance increase, the usual default). No need to pick k up front; O(n²) memory limits it to moderate data sizes.

## DBSCAN
Density-based: a point with at least **min_samples** neighbours within radius **ε** is a core point; clusters grow through connected core points; points in sparse regions are labelled **noise**.

- Finds arbitrarily shaped clusters and outliers.
- No k needed, but ε is sensitive; struggles when densities vary (HDBSCAN fixes much of this).

## Gaussian mixture models
A ==GMM== assumes data comes from K Gaussians and fits their means, covariances and weights with the **EM algorithm** (E-step: soft-assign points; M-step: update parameters). Gives **soft** probabilistic memberships and elliptical clusters; k-means is a special case with hard assignments and equal spherical covariances.

| Algorithm | Cluster shape | Needs k? | Noise handling | Scale |
|---|---|---|---|---|
| k-means | spherical | yes | none | very large |
| Agglomerative | depends on linkage | cut level | none | moderate |
| DBSCAN / HDBSCAN | arbitrary | no | yes | large |
| GMM | elliptical | yes | soft membership | moderate |

${T}python
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score

X_s = StandardScaler().fit_transform(X)
for k in range(2, 9):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X_s)
    print(k, km.inertia_, silhouette_score(X_s, km.labels_))

db = DBSCAN(eps=0.5, min_samples=5).fit(X_s)     # label -1 = noise
${T}

> [!tip] Clusters are hypotheses, not facts. Profile each cluster (means of key features), check stability across random seeds and subsamples, and ask whether the groups are actionable.
`,
    checks: [
      ['What two steps does k-means alternate?', 'Assign each point to the nearest centroid, then move each centroid to the mean of its assigned points.'],
      ['Why use k-means++ initialisation?', 'It spreads initial centroids apart, leading to faster convergence and better local optima.'],
      ['What does DBSCAN label as noise?', 'Points that are neither core points nor within ε of a core point.'],
      ['How does a GMM differ from k-means?', 'It gives soft probabilistic assignments and models elliptical clusters with their own covariances.'],
    ],
    quiz: [
      { q: 'Which algorithm can find crescent-shaped clusters and outliers?', o: ['k-means', 'DBSCAN', 'PCA', 'Linear regression'], a: 1 },
      { q: 'A silhouette score near 1 means…', o: ['Points are well matched to their clusters', 'Clusters overlap', 'Random assignment', 'Too few clusters'], a: 0 },
      { q: 'GMMs are fitted with…', o: ['Gradient boosting', 'The EM algorithm', 'Backpropagation', 'Minimax'], a: 1 },
      { q: 'Ward linkage merges clusters that…', o: ['Are farthest apart', 'Least increase total within-cluster variance', 'Have the most points', 'Are randomly chosen'], a: 1 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 3, minutes: 15,
    title: 'Dimensionality Reduction',
    sub: 'PCA from variance and eigenvectors, explained variance, and non-linear embeddings with t-SNE and UMAP.',
    md: `
## Why reduce dimensions?
- Visualise high-dimensional data in 2D/3D.
- Remove noise and redundancy (correlated features).
- Speed up and regularise downstream models.
- Fight the curse of dimensionality.

Two families: **feature selection** (keep a subset of original columns) and **feature extraction** (build new combined features).

## Principal component analysis
==PCA== finds orthogonal directions (principal components) of **maximum variance**. Projecting onto the top k components keeps as much variance as possible, equivalently minimising reconstruction error.

${demo('ml-pca')}

Algorithm:
1. Centre the data (subtract the mean); usually standardise.
2. Compute the covariance matrix Σ = XᵀX / n (or use SVD of X directly).
3. Its **eigenvectors** are the principal directions; **eigenvalues** are the variance along each.
4. Project: Z = X·W_k using the top-k eigenvectors.

$$ explained variance ratio of component i = λᵢ / Σ λⱼ $$

${T}python
from sklearn.decomposition import PCA

pca = make_pipeline(StandardScaler(), PCA(n_components=0.95))   # keep 95% of variance
Z = pca.fit_transform(X_train)
print(pca[-1].n_components_, pca[-1].explained_variance_ratio_.cumsum())
${T}

> [!key] PCA is linear and unsupervised: it keeps directions of large variance, which are not necessarily the directions that separate classes. For supervised reduction, consider LDA; for non-linear structure, use the methods below.

## Non-linear embeddings
| Method | Preserves | Notes |
|---|---|---|
| **t-SNE** | local neighbourhoods | beautiful 2D cluster plots; distances between clusters and cluster sizes are not meaningful; slow; perplexity matters |
| **UMAP** | local + more global structure | faster than t-SNE, scales to millions, can transform new data |
| **Autoencoders** | whatever the network learns | neural compression (Deep Learning course) |
| Kernel PCA, Isomap, LLE | manifold structure | classic manifold learning |

> [!warn] Use t-SNE and UMAP for **visualisation and exploration**. Do not read meaning into gaps between clusters, and do not feed t-SNE output into a downstream model.

## Other techniques
- **Truncated SVD / LSA**: PCA-like reduction for sparse matrices (TF-IDF text).
- **NMF**: non-negative parts-based factors (topics, image parts).
- **Feature selection**: variance thresholds, mutual information, L1 models, recursive feature elimination, permutation importance.
`,
    checks: [
      ['What does PCA maximise?', 'The variance of the data projected onto each successive orthogonal component.'],
      ['How do you choose the number of PCA components?', 'Keep enough to reach a target cumulative explained variance (e.g. 95%) or look for an elbow in the scree plot.'],
      ['Why standardise before PCA?', 'Otherwise features with large units dominate the variance and the components.'],
      ['What should you not conclude from a t-SNE plot?', 'That distances between clusters or cluster sizes are meaningful.'],
    ],
    quiz: [
      { q: 'Principal components are…', o: ['Correlated', 'Orthogonal', 'Always the original features', 'Class labels'], a: 1 },
      { q: 'The eigenvalue of a principal component equals…', o: ['Its mean', 'The variance along it', 'Its label', 'The learning rate'], a: 1 },
      { q: 'Which method is best for a 2D visualisation of local cluster structure?', o: ['Linear regression', 't-SNE or UMAP', 'One-hot encoding', 'Lasso'], a: 1 },
      { q: 'Truncated SVD is preferred to PCA for…', o: ['Dense images', 'Sparse TF-IDF matrices', 'Time series', 'Labels'], a: 1 },
    ],
  });

  /* ============================ 11 ============================ */
  CV.addChapter({
    n: 11, part: 4, minutes: 17,
    title: 'Imbalanced Data, Interpretability and Practical Tips',
    sub: 'Handling rare classes, probability calibration, explaining models with permutation importance and SHAP, and common pitfalls.',
    md: `
## Imbalanced classes
Fraud, disease and failures are rare. Techniques, roughly in order of preference:

1. **Use the right metric**: precision, recall, F1, PR-AUC; cost-based metrics.
2. **Tune the threshold** on validation data for the business trade-off.
3. **Class weights**: class_weight="balanced" or scale_pos_weight in XGBoost.
4. **Resampling**: undersample the majority, oversample the minority, or **SMOTE** (synthesise minority points). Resample only the training folds, never validation or test.
5. Collect more minority examples, or reframe as anomaly detection.

## Calibration
A ==calibrated== model's 0.8 means "right 80% of the time". Trees, SVMs and boosted models are often miscalibrated; resampling distorts probabilities too. Check with a **reliability diagram** and fix with **Platt scaling** (logistic) or **isotonic regression** via CalibratedClassifierCV.

${demo('calibration')}

## Interpretability
| Method | Scope | Notes |
|---|---|---|
| Coefficients | global | linear models; compare only on standardised features |
| Impurity feature importance | global | trees; biased toward high-cardinality features |
| **Permutation importance** | global | drop in score when a feature is shuffled; model-agnostic |
| Partial dependence / ICE plots | global / local | how predictions change with one feature |
| **SHAP values** | local + global | game-theoretic contribution of each feature to each prediction |
| LIME | local | fit a simple model around one prediction |
| Counterfactuals | local | the smallest change that flips the decision |

${T}python
import shap
explainer = shap.TreeExplainer(model)          # fast exact SHAP for tree ensembles
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test)          # global: which features matter, and in which direction
${T}

> [!warn] Feature importance shows what the **model** uses, not what **causes** the outcome. Correlated features split importance between them, and a model can rely on a proxy (postcode) for a sensitive attribute.

## Common pitfalls
${demo('picker', { meta: { title: 'What went wrong?', desc: 'Pick a symptom to see the likely cause.' }, items: [['99.9% validation accuracy on day one', 'Probably target leakage or duplicate rows across splits. Inspect the top features.'], ['Great offline, poor in production', 'Distribution shift, training/serving skew (features computed differently), or leakage.'], ['Score changes a lot between random seeds', 'High variance: small data, unstable model; use repeated CV and report the spread.'], ['Model ignores the minority class', 'Imbalance: use class weights, threshold tuning and PR-based metrics.'], ['Huge coefficients that flip sign', 'Multicollinearity or unscaled features; regularise and standardise.'], ['k-NN or SVM performs terribly', 'Features not scaled.'], ['Test score much worse than CV score', 'Tuning overfit to the validation folds, or test set differs; use nested CV.']] })}

## Practical defaults
| Data | First model | Strong model |
|---|---|---|
| Tabular, classification | logistic regression | LightGBM / XGBoost / CatBoost |
| Tabular, regression | Ridge | gradient-boosted trees |
| Text (small data) | TF-IDF + logistic regression | fine-tuned transformer |
| Images, audio | pretrained network features + linear model | fine-tuned deep network |
| Few samples, many features | regularised linear model / SVM | same, with careful CV |
`,
    checks: [
      ['Why must SMOTE be applied only inside training folds?', 'Synthetic points derived from validation/test data would leak information and inflate scores.'],
      ['What is a calibrated classifier?', 'One whose predicted probabilities match observed frequencies (0.8 → correct 80% of the time).'],
      ['What does permutation importance measure?', 'How much the model\'s score drops when a feature\'s values are randomly shuffled.'],
      ['Does high feature importance imply causation?', 'No. It shows what the model relies on, which may be a correlated proxy.'],
    ],
    quiz: [
      { q: 'Which fixes miscalibrated probabilities?', o: ['SMOTE', 'Isotonic regression / Platt scaling', 'PCA', 'Dropout'], a: 1 },
      { q: 'SHAP values explain…', o: ['Only global importance', 'Each feature\'s contribution to individual predictions', 'Training speed', 'Data quality'], a: 1 },
      { q: 'A first step for imbalanced classification should be…', o: ['Drop the minority class', 'Choose appropriate metrics and tune the threshold', 'Use accuracy', 'Remove features'], a: 1 },
      { q: 'Training/serving skew means…', o: ['Features are computed differently in training and production', 'The model is too large', 'The data is imbalanced', 'The learning rate is wrong'], a: 0 },
    ],
  });

  /* ============================ 12 ============================ */
  CV.addChapter({
    n: 12, part: 4, minutes: 15,
    title: 'ML in Production: Pipelines and MLOps',
    sub: 'From notebook to service: reproducible pipelines, model serving, monitoring for drift, retraining, and the tools of MLOps.',
    md: `
## Most of the work is not the model
In production, the model is a small box surrounded by data collection, validation, feature pipelines, serving infrastructure, monitoring and retraining. ==MLOps== applies DevOps discipline to this whole lifecycle.

${T}text
data sources → validation → feature pipeline → training → evaluation → registry
                                                                      ↓
users ← monitoring ← serving (batch / real-time API) ←─────── deployment
   └──────── feedback & new labels ──────────► retraining trigger
${T}

## Reproducibility
- Version **code** (git), **data** (DVC, lakeFS, dataset snapshots) and **models** (a model registry).
- Fix random seeds; pin library versions (requirements.txt / lock files / Docker).
- Track experiments: parameters, metrics, artefacts (MLflow, Weights & Biases).
- Package preprocessing **with** the model (one sklearn Pipeline, saved with joblib) to avoid training/serving skew.

${T}python
import joblib, mlflow

with mlflow.start_run():
    model.fit(X_train, y_train)
    mlflow.log_params(model.get_params())
    mlflow.log_metric("val_f1", f1_score(y_val, model.predict(X_val)))
    joblib.dump(model, "model.joblib")
    mlflow.log_artifact("model.joblib")
${T}

## Serving patterns
| Pattern | When | Example |
|---|---|---|
| **Batch** | predictions can be precomputed | nightly churn scores written to a table |
| **Online API** | low-latency, per-request | fraud check at checkout via FastAPI/Flask |
| **Streaming** | events processed continuously | Kafka + feature store |
| **Edge / on-device** | privacy, offline, latency | ONNX / TFLite on phones |

${T}python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib, pandas as pd

app = FastAPI()
model = joblib.load("model.joblib")

class Customer(BaseModel):
    age: int
    income: float
    plan: str

@app.post("/predict")
def predict(c: Customer):
    p = model.predict_proba(pd.DataFrame([c.model_dump()]))[0, 1]
    return {"churn_probability": round(float(p), 4)}
${T}

## Monitoring
| What drifts | Meaning | Detect with |
|---|---|---|
| **Data drift** | input distribution P(x) changes | PSI, KS test, feature statistics |
| **Concept drift** | relationship P(y \\| x) changes | falling accuracy once labels arrive |
| **Prediction drift** | output distribution shifts | score histograms |
| Data quality | nulls, schema changes, out-of-range values | validation checks (Great Expectations, pandera) |

Also monitor latency, error rates, cost and fairness metrics by segment.

## Deployment safety
- **Shadow mode**: run the new model alongside the old without affecting users.
- **Canary / A/B tests**: route a small share of traffic, compare business metrics.
- **Rollback** plan and model versioning.
- **Retraining**: on a schedule or triggered by drift, with automatic evaluation gates before promotion.

${demo('checklist', { id: 'ml-prod', label: 'Production readiness', meta: { title: 'Shipping a model', desc: 'Tick off before your model serves real users.' }, items: [['Baseline and business metric agreed', 'The model beats the baseline on the metric that matters.'], ['Pipeline packaged', 'Preprocessing + model saved as one artefact.'], ['Versions pinned', 'Code, data snapshot, model and dependencies recorded.'], ['Input validation', 'Schema and range checks on every request.'], ['Latency and cost measured', 'Under realistic load.'], ['Monitoring dashboards', 'Data drift, prediction drift, performance, errors.'], ['Fairness checked', 'Metrics broken down by relevant groups.'], ['Rollout plan', 'Shadow or canary first, with rollback.'], ['Retraining plan', 'Trigger, evaluation gate and owner defined.']] })}
`,
    checks: [
      ['What is training/serving skew and how do you prevent it?', 'Features computed differently in training and production; prevent it by packaging preprocessing with the model and sharing feature code (feature stores).'],
      ['Data drift vs concept drift?', 'Data drift: input distribution changes. Concept drift: the relationship between inputs and the target changes.'],
      ['What is shadow deployment?', 'Running a new model on live traffic without using its predictions, to compare it safely with the current model.'],
    ],
    quiz: [
      { q: 'Nightly scoring of all customers is…', o: ['Online serving', 'Batch serving', 'Edge serving', 'Streaming'], a: 1 },
      { q: 'MLflow is mainly used for…', o: ['Data labelling', 'Experiment tracking and model registry', 'Plotting', 'Web serving only'], a: 1 },
      { q: 'Fraudsters change tactics so old patterns no longer predict fraud. This is…', o: ['Data leakage', 'Concept drift', 'Overfitting', 'Underfitting'], a: 1 },
      { q: 'A canary release…', o: ['Sends all traffic to the new model', 'Sends a small share of traffic to the new model first', 'Never uses the new model', 'Deletes the old model'], a: 1 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['ml-ref'] = {
    head: ['Concept', 'Formula or rule'], mono: [1],
    rows: [
      ['Linear regression', 'ŷ = wᵀx + b'], ['Normal equation', 'w = (XᵀX)⁻¹Xᵀy'], ['MSE', '(1/n) Σ (y − ŷ)²'], ['MAE', '(1/n) Σ |y − ŷ|'],
      ['R²', '1 − SS_res / SS_tot'], ['Gradient descent', 'w ← w − η ∇L(w)'], ['Sigmoid', 'σ(z) = 1 / (1 + e^−z)'],
      ['Log loss', '−[y log p + (1 − y) log(1 − p)]'], ['Softmax', 'p_k = e^z_k / Σ e^z_j'], ['Ridge', 'MSE + λ‖w‖²'], ['Lasso', 'MSE + λ‖w‖₁'],
      ['Precision', 'TP / (TP + FP)'], ['Recall / TPR', 'TP / (TP + FN)'], ['FPR', 'FP / (FP + TN)'], ['F1', '2PR / (P + R)'],
      ['Bias–variance', 'error = bias² + variance + noise'], ['Gini impurity', '1 − Σ pₖ²'], ['Entropy', '−Σ pₖ log₂ pₖ'],
      ['Gradient boosting', 'F_m = F_(m−1) + η h_m, h_m fits −∂L/∂F'], ['Random forest', 'bagging + random feature subsets'],
      ['SVM objective', '½‖w‖² + C Σ max(0, 1 − y f(x))'], ['RBF kernel', 'exp(−γ‖x − x\'‖²)'], ['k-means objective', 'Σ ‖x − μ_c(x)‖²'],
      ['Silhouette', '(b − a) / max(a, b)'], ['PCA explained variance', 'λᵢ / Σ λⱼ'], ['Standardise', 'z = (x − μ) / σ'],
    ],
  };
  CV.GLOSSARIES.ml = [
    ['Feature', 'an input variable used for prediction'], ['Label / target', 'the output a supervised model learns to predict'],
    ['Training set', 'data used to fit model parameters'], ['Validation set', 'data used to tune hyperparameters and compare models'],
    ['Test set', 'held-out data for a final unbiased estimate'], ['Cross-validation', 'repeatedly training and validating on different folds'],
    ['Data leakage', 'information unavailable at prediction time used in training'], ['Overfitting', 'learning noise; good on train, poor on new data'],
    ['Underfitting', 'too simple to capture the signal'], ['Bias', 'error from wrong model assumptions'], ['Variance', 'error from sensitivity to the training sample'],
    ['Regularisation', 'penalising complexity to improve generalisation'], ['Hyperparameter', 'a setting chosen before training'],
    ['Loss function', 'what training minimises'], ['Learning rate', 'step size in gradient descent'],
    ['Logistic regression', 'linear model + sigmoid for classification'], ['Decision boundary', 'where the predicted class changes'],
    ['Confusion matrix', 'table of TP, FP, FN, TN'], ['ROC curve', 'TPR vs FPR across thresholds'], ['Calibration', 'agreement of predicted probabilities with frequencies'],
    ['Bagging', 'averaging models trained on bootstrap samples'], ['Boosting', 'sequentially adding models that correct earlier errors'],
    ['Support vectors', 'training points that define the SVM margin'], ['Kernel', 'similarity function standing in for a feature-space dot product'],
    ['Inertia', 'k-means within-cluster sum of squares'], ['PCA', 'projection onto directions of maximum variance'],
    ['SHAP', 'additive per-feature attributions from game theory'], ['Data drift', 'change in the input distribution over time'],
    ['Concept drift', 'change in the input–target relationship'], ['MLOps', 'practices for deploying and operating ML reliably'],
  ];
  CV.DECKS.ml = [
    ['Fundamentals', [
      ['Explain the bias–variance trade-off.', 'Simple models have high bias (underfit); flexible models have high variance (overfit). Total error = bias² + variance + noise; regularisation, data and model choice balance them.'],
      ['How do you detect and fix overfitting?', 'Training score much better than validation score. Fix with more data, regularisation, simpler models, early stopping, feature selection or ensembling.'],
      ['What is data leakage? Give examples.', 'Using information not available at prediction time: target-derived features, preprocessing fit on all data, duplicates across splits, random splits of time series.'],
      ['Why not use accuracy on imbalanced data?', 'A majority-class predictor scores high while catching no positives; use precision, recall, F1 or PR-AUC.'],
      ['L1 vs L2 regularisation?', 'L1 yields sparse weights (feature selection); L2 shrinks weights smoothly and handles correlated features.'],
    ]],
    ['Algorithms', [
      ['How does a random forest work?', 'Many decision trees trained on bootstrap samples with random feature subsets at each split; predictions are averaged or voted.'],
      ['Random forest vs gradient boosting?', 'RF builds independent trees in parallel and reduces variance; boosting builds trees sequentially to correct errors, usually more accurate but needs more tuning.'],
      ['How does logistic regression produce probabilities?', 'A linear score passed through the sigmoid; trained by minimising log loss.'],
      ['What is the kernel trick?', 'Computing inner products in a high-dimensional feature space via a kernel function, enabling non-linear boundaries without explicit mapping.'],
      ['How do you choose k in k-means?', 'Elbow of inertia, silhouette score, gap statistic, and domain constraints.'],
      ['What does PCA do?', 'Finds orthogonal directions of maximum variance (covariance eigenvectors) and projects data onto the top ones.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'Formulas, metrics and algorithms on one searchable page.',
    sections: [{ id: 'ref', title: 'ML cheat sheet', html: CV.h.w('ref-table', { key: 'ml-ref', meta: { title: 'Machine learning formulas', desc: 'Type to filter, e.g. "loss", "recall", "tree".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'Machine learning vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'ml' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on fundamentals and algorithms.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'ml' }) }] });
})();

// ═══════════════════════════════════════════════════════════════════
//  STUDENT SETTINGS: the things you will most likely want to change
// ═══════════════════════════════════════════════════════════════════

// ► MODEL FILE: change this path to point to your own trained model
const MODEL_PATH = 'assets/model.pict';

// ► CANVAS COLOR: background of the drawing canvas.
//   Must match what your model was trained on (the original face model uses black).
const BG_COLOR = 0;          // 0 = black, 255 = white, or '#ff0000', etc.

// ► BRUSH COLOR: color of the lines you draw.
//   Should contrast with BG_COLOR and match your training data.
const BRUSH_COLOR = 255;     // 255 = white

// ► BRUSH SIZE: slider range and starting value (in pixels)
const BRUSH_MIN = 0.5;
const BRUSH_MAX = 20;
const BRUSH_START = 1;

// ═════════════════════════DON'T EDIT BELOW THIS LINE══════════════════════════════════════════

const SIZE = 256;            // size the model works at (don't change unless your model differs)
const OUTPUT_SIZE = 512;     // size of the dithered output image
const MAX_CANVAS = 512;      // biggest the drawing canvas will get (on desktop)
const MARGIN = 32;           // space left around the canvas on small screens

let displaySize = MAX_CANVAS; // current canvas size, set in getCanvasSize()
let inputImg, inputCanvas, modelCanvas, output, statusMsg, pix2pix, clearBtn, transferBtn;
let brushSlider, brushLabel;
let isDrawing = false;

// Mobile friendly: canvas shrinks to fit narrow screens, never grows past MAX_CANVAS
function getCanvasSize() {
  return Math.floor(Math.min(MAX_CANVAS, windowWidth - MARGIN));
}

//this code section allows the generated image to scale up from 256 x 256 to 512 x 512 using a dithering effect
// ── Floyd-Steinberg dither ───────────────────────────────────────────
function ditherFloydSteinbergColor(pg) {
  pg.loadPixels();
  const w = pg.width, h = pg.height;

  const r = new Float32Array(w * h);
  const g = new Float32Array(w * h);
  const b = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    r[i] = pg.pixels[o];
    g[i] = pg.pixels[o + 1];
    b[i] = pg.pixels[o + 2];
  }

  const levels = 4;
  const step = 255 / (levels - 1);
  const clamp = v => Math.min(255, Math.max(0, v));
  const quantize = v => Math.round(Math.round(v / step) * step);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const oldR = r[idx], oldG = g[idx], oldB = b[idx];
      const newR = quantize(oldR), newG = quantize(oldG), newB = quantize(oldB);
      r[idx] = newR; g[idx] = newG; b[idx] = newB;
      const errR = oldR - newR, errG = oldG - newG, errB = oldB - newB;
      if (x + 1 < w) {
        r[idx+1] = clamp(r[idx+1] + errR*7/16);
        g[idx+1] = clamp(g[idx+1] + errG*7/16);
        b[idx+1] = clamp(b[idx+1] + errB*7/16);
      }
      if (y + 1 < h) {
        if (x - 1 >= 0) {
          r[idx+w-1] = clamp(r[idx+w-1] + errR*3/16);
          g[idx+w-1] = clamp(g[idx+w-1] + errG*3/16);
          b[idx+w-1] = clamp(b[idx+w-1] + errB*3/16);
        }
        r[idx+w] = clamp(r[idx+w] + errR*5/16);
        g[idx+w] = clamp(g[idx+w] + errG*5/16);
        b[idx+w] = clamp(b[idx+w] + errB*5/16);
        if (x + 1 < w) {
          r[idx+w+1] = clamp(r[idx+w+1] + errR*1/16);
          g[idx+w+1] = clamp(g[idx+w+1] + errG*1/16);
          b[idx+w+1] = clamp(b[idx+w+1] + errB*1/16);
        }
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    pg.pixels[o]   = r[i];
    pg.pixels[o+1] = g[i];
    pg.pixels[o+2] = b[i];
    pg.pixels[o+3] = 255;
  }
  pg.updatePixels();
}
// ── END Floyd-Steinberg dither ───────────────────────────────────────────


function setup() {
  pixelDensity(1);

  displaySize = getCanvasSize();
  inputCanvas = createCanvas(displaySize, displaySize);
  inputCanvas.class('border-box').parent('input');

  // Stops the page from scrolling while you draw with a finger
  inputCanvas.elt.style.touchAction = 'none';

  modelCanvas = createGraphics(SIZE, SIZE);
  modelCanvas.pixelDensity(1);

  background(BG_COLOR);

  output    = select('#output');
  statusMsg = select('#status');

  // Keep the output image inside the screen on phones
  // output.elt.style.maxWidth = '100%';
  output.elt.style.height = 'auto';

  transferBtn = select('#transferBtn');
  clearBtn    = select('#clearBtn');
  clearBtn.mousePressed(clearCanvas);



// ── Visual brush controls ──

const controls = select('#brushControls');

// Main control panel
const panel = createDiv().parent(controls);
panel.style('display', 'flex');
panel.style('flex-direction', 'column');
panel.style('align-items', 'center');
panel.style('gap', '10px');

// Heading
createSpan('BRUSH').parent(panel)
  .style('font-size', '12px')
  .style('font-weight', 'bold')
  .style('letter-spacing', '1px');

// Size display
brushLabel = createSpan(BRUSH_START + ' px').parent(panel);
brushLabel.style('font-size', '18px');
brushLabel.style('font-weight', 'bold');

// Brush preview
const preview = createDiv().parent(panel);

preview.style('width', '50px');
preview.style('height', '50px');
preview.style('border-radius', '50%');
preview.style('background', '#111');
preview.style('border', '1px solid #aaa');
preview.style('display', 'flex');
preview.style('align-items', 'center');
preview.style('justify-content', 'center');

// Actual brush dot
const brushDot = createDiv().parent(preview);

brushDot.style('background', 'white');
brushDot.style('border-radius', '50%');

// Vertical slider
brushSlider = createSlider(
  BRUSH_MIN,
  BRUSH_MAX,
  BRUSH_START,
  0.5
).parent(panel);

brushSlider.elt.style.writingMode = 'vertical-lr';
brushSlider.elt.style.direction = 'rtl';
brushSlider.elt.style.width = '24px';
brushSlider.elt.style.height = '120px';
brushSlider.elt.style.cursor = 'pointer';
brushSlider.elt.style.margin = '0';




// Update preview and size
function updateBrushPreview() {
  const size = Number(brushSlider.value());

  brushLabel.html(size + ' px');

  // Scale preview to make the size difference visible
  const previewSize = Math.max(3, Math.min(40, size * 2));

  brushDot.style('width', previewSize + 'px');
  brushDot.style('height', previewSize + 'px');
}

brushSlider.input(updateBrushPreview);

updateBrushPreview();

  strokeCap(ROUND);
  strokeJoin(ROUND);

  // p5 accessibility: describe the canvas for screen readers
  describe(
    'A drawing canvas. Use a mouse or touch to sketch a face using thin lines on a background. Draw simple outlines for eyebrows, eyes, a nose, and a mouth, then click the Transfer button to generate an AI-rendered face from your sketch.'
  );

  pix2pix = ml5.pix2pix(MODEL_PATH, modelLoaded);
}

function draw() {
  // Only draw when the pointer is actually on the canvas
  // (so dragging the brush slider doesn't scribble on it)
  const onCanvas = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

  if (mouseIsPressed && onCanvas) {
    isDrawing = true;
    stroke(BRUSH_COLOR);
    // Brush is scaled so it looks the same on a smaller phone canvas
    strokeWeight(brushSlider.value() * (width / MAX_CANVAS));
    noFill();
    line(mouseX, mouseY, pmouseX, pmouseY);
  } else {
    isDrawing = false;
  }

  // Update canvas description dynamically based on drawing state
  describeElement(
    inputCanvas.elt,
    isDrawing
      ? 'Drawing in progress on the face sketch canvas.'
      : 'Face sketch canvas. Draw lines to outline eyebrows, eyes, a nose, and a mouth.',
    LABEL
  );
}

// Keeps the canvas sized to the screen (e.g. when a phone rotates).
// Resizing clears a p5 canvas, so we copy the drawing and paste it back.
function windowResized() {
  const newSize = getCanvasSize();
  if (newSize === displaySize) return;

  const snapshot = get();
  displaySize = newSize;
  resizeCanvas(displaySize, displaySize);
  background(BG_COLOR);
  image(snapshot, 0, 0, displaySize, displaySize);
}

function modelLoaded() {
  statusMsg.html('Model Loaded!');
  transferBtn.mousePressed(transfer);
}

function clearCanvas() {
  statusMsg.html('');
  background(BG_COLOR);
  output.elt.src = '';
  output.elt.alt = 'The AI-generated face output will appear here after clicking Transfer.';
}

function transfer() {
  statusMsg.html('Transferring...');
  output.elt.alt = 'Generating AI face from your sketch, please wait.';

  // Drawn input: copies the canvas down to the model's 256 x 256 size
  modelCanvas.image(get(), 0, 0, SIZE, SIZE);

  pix2pix.transfer(modelCanvas.elt, function(err, result) {
    if (err) { console.log(err); return; }
    if (result && result.src) {
      statusMsg.html('generation done!');

      loadImage(result.src, p5img => {
        const tmp = createGraphics(OUTPUT_SIZE, OUTPUT_SIZE);
        tmp.pixelDensity(1);
        tmp.image(p5img, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ditherFloydSteinbergColor(tmp);

        tmp.canvas.toBlob(blob => {
          output.elt.src = URL.createObjectURL(blob);
          output.elt.alt = 'AI-generated face produced from your line drawing. A color-dithered portrait based on the face sketch you drew.';
        });
      });
    }
  });
}
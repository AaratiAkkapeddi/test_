# Template sketch to image --  pix2pix (p5.js + ml5.js)

Draw a line sketch in the browser and a trained pix2pix model turns it into an image. The output is then color-dithered.

## Folder structure

```
./assets/model.pict   your trained model
./styles.css
./index.html
./main.js             the sketch (all the code you will edit)
```

## Getting started

### 1. Add your model

Copy your trained `.pict` file into the `assets` folder. Easiest is to name it `model.pict`, replacing the existing one.

If you use a different filename, open `main.js` and change this line at the top:

```js
const MODEL_PATH = 'assets/model.pict';
```

### 2. Run a local server

Browsers block model files when you open `index.html` by double-clicking it, so you need a local server. Use one of these from the project folder:

- **VS Code:** install the *Live Server* extension, right-click `index.html`, choose *Open with Live Server*.
- **Python:**
  ```
  python3 -m http.server 8000
  ```
  then go to `http://localhost:8000`.

### 3. Try it

1. Wait for the status text to say **Model Loaded!**
2. Draw on the canvas.
3. Click **Transfer** to generate the image.
4. Click **Clear** to start over.

## Things to customize

All of these are in the **STUDENT SETTINGS** block at the top of `main.js`:

| Setting | What it does |
| --- | --- |
| `MODEL_PATH` | Path to your `.pict` file |
| `BG_COLOR` | Canvas background color |
| `BRUSH_COLOR` | Color of the lines you draw |
| `BRUSH_MIN`, `BRUSH_MAX`, `BRUSH_START` | Range and starting value of the brush size slider |

**Important:** `BG_COLOR` and `BRUSH_COLOR` should match how your training drawings looked. If your model was trained on white lines on black, changing the colors will give strange results.

## Editing the page (`index.html`)

`index.html` is the structure and text of the page. You can add content around the sketch without touching `main.js`:

- **Add text:** put headings and paragraphs anywhere inside `<body>`:
  ```html
  <h1>My Project Title</h1>
  <p>A short description of what this does and how it was made.</p>
  ```
- **Add an image:** put the file in `assets/` and reference it:
  ```html
  <img src="assets/my-image.jpg" alt="Describe the image">
  ```
- **Add a link:** `<a href="https://example.com">link text</a>`
- **Change the page title** (browser tab): edit the `<title>` in the `<head>`.

Don't delete or rename the elements listed under "Required elements" below, or the sketch will stop working. Add new content *around* them.


## Required elements in `index.html`

The sketch looks for these IDs, so keep them in your HTML:

`#input` (canvas container), `#output` (an `<img>`), `#status`, `#transferBtn`, `#clearBtn`

It also needs the p5.js and ml5.js scripts loaded before `main.js`.

## Editing the style (`styles.css`)

`styles.css` controls how the page looks. Each rule picks an element and sets its properties:


## Troubleshooting

- **Stuck on "Transferring..." or nothing happens:** open the browser console (right-click, Inspect, Console) and look for errors.
- **Model won't load / 404 error:** check that `MODEL_PATH` matches the real filename and that you are using a local server, not opening the file directly.
- **Results look wrong:** check that your drawing style (line weight, colors, subject) is similar to your training data.
- **The brush slider doesn't appear:** it is added under the canvas automatically. To place it elsewhere, add `<div id="brushControls"></div>` to `index.html`.
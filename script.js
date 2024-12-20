let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

const body = document.getElementById('body');
const openBtn = document.getElementById('open-photo');
const saveBtn = document.getElementById('save-photo');
const menuBtn = document.getElementById('menu-btn');
const cropBtn = document.getElementById('crop-btn');
const menu = document.getElementById('menu');
const grayscaleItem = document.getElementById('grayscale');
const rotateItem = document.getElementById('rotate');
const scaleItem = document.getElementById('scale');
const cropItem = document.getElementById('crop');
const scaleModal = document.getElementById('scale-modal');
const scaleRatioInput = document.getElementById('scale-ratio');
const applyScaleBtn = document.getElementById('apply-scale');
const cropFrame = document.getElementById('crop-frame');

body.append(canvas);

openBtn.onclick = openPhoto;
saveBtn.onclick = savePhoto;
menuBtn.onclick = toggleMenu;
cropBtn.onclick = cropPhoto;
menu.onclick = toggleMenu;
grayscaleItem.onclick = grayscalePhoto;
rotateItem.onclick = rotatePhoto;
scaleItem.onclick = showScaleModal;
cropItem.onclick = showCropFrame;
applyScaleBtn.onclick = applyScale;

function toggleMenu() {
  menu.hidden = !menu.hidden;
}

function showScaleModal() {
  scaleModal.showModal();
}

function showCropFrame() {
  cropFrame.hidden = false;
  cropBtn.hidden = false;

  onkeydown = (e) => {
    if (e.key === 'Escape') {
      cropFrame.hidden = true;
      onkeydown = null;
    }
  };

  canvas.onmousedown = (e) => {
    const { x: x1, y: y1 } = e;

    cropFrame.style.left = `${x1}px`;
    cropFrame.style.top = `${y1}px`;
    cropFrame.style.width = '0px';
    cropFrame.style.height = '0px';

    canvas.onmousemove = (e) => {
      const { x: x2, y: y2 } = e;

      cropFrame.style.width = `${x2 - x1}px`;
      cropFrame.style.height = `${y2 - y1}px`;
    };

    canvas.onmouseup = () => {
      canvas.onmousemove = null;
      canvas.onmouseup = null;
    };
  };
}

async function openPhoto() {
  try {
    const [fileHandle] = await showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'Images',
          accept: { 'image/*': ['.png', '.jpeg', '.jpg'] },
        }
      ]
    });
    const file = await fileHandle.getFile();
    const contents = await file.arrayBuffer();
    const img = new Image();

    img.src = URL.createObjectURL(new Blob([contents]));
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  } catch (error) {
    alert('File selection was cancelled');
  }
}

async function savePhoto() {
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve));
  const fileHandle = await showSaveFilePicker({
    suggestedName: 'edited-image.png',
    types: [
      {
        description: 'PNG Images',
        accept: { 'image/png': ['.png'] },
      },
    ],
  });
  const writeFile = await fileHandle.createWritable();

  await writeFile.write(imageBlob);
  await writeFile.close();
}

function grayscalePhoto() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }

  ctx.putImageData(imageData, 0, 0);
}

function rotatePhoto() {
  const canvasReplacement = document.createElement('canvas');
  const ctxReplacement = canvasReplacement.getContext('2d');

  canvasReplacement.width = canvas.height;
  canvasReplacement.height = canvas.width;

  const centerX = canvas.height / 2;
  const centerY = canvas.width / 2;

  ctxReplacement.save();
  ctxReplacement.translate(centerX, centerY);
  ctxReplacement.rotate(Math.PI / 2);
  ctxReplacement.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  ctxReplacement.restore();

  canvas.replaceWith(canvasReplacement);

  canvas = canvasReplacement;
  ctx = ctxReplacement;
}

function applyScale() {
  const ratio = scaleRatioInput.valueAsNumber;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const scaledWidth = Math.round(canvas.width * ratio);
  const scaledHeight = Math.round(canvas.height * ratio);

  const scaledImageData = ctx.createImageData(scaledWidth, scaledHeight);
  const scaledData = scaledImageData.data;

  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const srcX = Math.floor(x / ratio);
      const srcY = Math.floor(y / ratio);

      const srcIndex = (srcY * imageData.width + srcX) * 4;
      const destIndex = (y * scaledWidth + x) * 4;

      scaledData[destIndex] = imageData.data[srcIndex];
      scaledData[destIndex + 1] = imageData.data[srcIndex + 1];
      scaledData[destIndex + 2] = imageData.data[srcIndex + 2];
      scaledData[destIndex + 3] = imageData.data[srcIndex + 3];
    }
  }

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  ctx.putImageData(scaledImageData, 0, 0);
}

function cropPhoto() {
  const x1 = parseInt(cropFrame.style.left) - canvas.offsetLeft;
  const y1 = parseInt(cropFrame.style.top) - canvas.offsetTop;
  const width = parseInt(cropFrame.style.width);
  const height = parseInt(cropFrame.style.height);
  const imageData = ctx.getImageData(x1, y1, width, height);

  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(imageData, 0, 0);

  cropFrame.hidden = true;
  cropBtn.hidden = true;
}

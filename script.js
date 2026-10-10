const STICKERS_PER_CUBE = 3;
const CUBE_SIZE = 10;

const artColors = {
  portrait: {
    background: '#ead8b5', hair: '#392b28', hairLight: '#594036',
    skin: '#d99b72', skinLight: '#efbd91', shadow: '#b96f56',
    shirt: '#365849', shirtLight: '#65856f', eyes: '#25312d', mouth: '#8b5147'
  },
  sunset: {
    sky: '#f8cb7a', skyLight: '#f3b968', orange: '#ed8b59',
    orangeLight: '#f3a365', horizon: '#bd5c58', sun: '#ffe4a1',
    water: '#536e7a', waterLight: '#78909a'
  },
  flower: {
    background: '#e8dfc9', petal: '#f3e9d2', petalAccent: '#e3a46f',
    center: '#c7773d', stem: '#72865d', leaf: '#9ba875'
  }
};

function portfolioStickerColor(artName, x, y) {
  if (artName === 'portrait') {
    const isFace = ((x - 15) / 8.1) ** 2 + ((y - 13) / 10.2) ** 2 < 1;
    const isHair = ((x - 15) / 8.7) ** 2 + ((y - 11) / 10.2) ** 2 < 1 && y < 12;
    const colors = artColors.portrait;

    if (y < 4) return x < 4 || x > 25 ? '#d3c6a8' : '#e7d7b7';
    if (y >= 22 && x >= 5 && x <= 24) return (x + y) % 7 ? colors.shirt : colors.shirtLight;
    if (isFace) {
      if ((y === 11 || y === 12) && [12, 13, 18, 19].includes(x)) return colors.eyes;
      if (y === 17 && x >= 13 && x <= 17) return colors.mouth;
      if (isHair) return (x + y) % 6 ? colors.hair : colors.hairLight;
      if (x < 10 || x > 20) return colors.shadow;
      return (x + y) % 8 < 5 ? colors.skinLight : colors.skin;
    }
    if (y < 13 && (x < 8 || x > 22)) return colors.hair;
    return colors.background;
  }

  if (artName === 'sunset') {
    const colors = artColors.sunset;
    if (y < 7) return (x + y) % 5 ? colors.sky : colors.skyLight;
    if (y < 15) return (x + y) % 6 ? colors.orange : colors.orangeLight;
    if (y < 19) return colors.horizon;
    if ((x - 21) ** 2 + (y - 15) ** 2 < 4.3 ** 2 && y < 19) return colors.sun;
    if (y < 22) return colors.horizon;
    return (x + y) % 5 ? colors.water : colors.waterLight;
  }

  if (artName === 'flower') {
    const colors = artColors.flower;
    const distance = Math.hypot(x - 15, y - 11);
    if (distance < 3.2) return (x + y) % 4 ? colors.center : colors.petalAccent;
    if (distance < 8 && y < 17) return (x + y) % 7 ? colors.petal : colors.petalAccent;
    const leftLeaf = ((x - 10) / 5) ** 2 + ((y - 22) / 2.8) ** 2 < 1 && y > 18;
    const rightLeaf = ((x - 20) / 5) ** 2 + ((y - 24) / 2.8) ** 2 < 1 && y > 20;
    if ([14, 15, 16].includes(x) && y >= 17) return colors.stem;
    if (leftLeaf || rightLeaf) return colors.leaf;
    return colors.background;
  }

  return '#eeeeee';
}

function buildPortfolioMosaic(mosaic) {
  const artName = mosaic.dataset.art || 'portrait';

  for (let cubeY = 0; cubeY < CUBE_SIZE; cubeY += 1) {
    for (let cubeX = 0; cubeX < CUBE_SIZE; cubeX += 1) {
      const cube = document.createElement('span');
      cube.className = 'cube';
      cube.setAttribute('aria-hidden', 'true');

      for (let stickerY = 0; stickerY < STICKERS_PER_CUBE; stickerY += 1) {
        for (let stickerX = 0; stickerX < STICKERS_PER_CUBE; stickerX += 1) {
          const x = cubeX * STICKERS_PER_CUBE + stickerX;
          const y = cubeY * STICKERS_PER_CUBE + stickerY;
          const sticker = document.createElement('span');
          sticker.className = 'sticker';
          sticker.style.setProperty('--sticker-color', portfolioStickerColor(artName, x, y));
          cube.appendChild(sticker);
        }
      }

      mosaic.appendChild(cube);
    }
  }
}

document.querySelectorAll('.mosaic[data-art]').forEach(buildPortfolioMosaic);

const form = document.querySelector('#request-form');
const imageInput = document.querySelector('#image-upload');
const sizeSelect = document.querySelector('#cube-size');
const customSizeInput = document.querySelector('#custom-size');
const customSizeField = document.querySelector('#custom-size-field');
const previewBox = document.querySelector('#preview-box');
const previewCanvas = document.querySelector('#preview-canvas');
const previewContext = previewCanvas.getContext('2d', { willReadFrequently: true });
const fileName = document.querySelector('#file-name');
const stepOne = document.querySelector('#form-step-1');
const stepTwo = document.querySelector('#form-step-2');
const stepLabel = document.querySelector('#step-label');
const summary = document.querySelector('#request-summary');
let selectedImage = null;
let previewUrl = null;

// Classic sticker colors used to approximate the uploaded image.
const cubePalette = ['#ffffff', '#ffcf00', '#c41e3a', '#ff5800', '#0051ba', '#009e60'];

const PRICE_TIERS = [
  { cubes: 10, price: 75 },
  { cubes: 20, price: 200 },
  { cubes: 30, price: 400 },
  { cubes: 40, price: 650 },
  { cubes: 50, price: 950 }
];

function getCubeCount() {
  if (sizeSelect.value === 'custom') return Number(customSizeInput.value);
  return Number(sizeSelect.value);
}

function getImageStickerCount() {
  return getCubeCount() * STICKERS_PER_CUBE;
}

function estimatePrice(cubeCount) {
  if (cubeCount <= PRICE_TIERS[0].cubes) return PRICE_TIERS[0].price;
  if (cubeCount >= PRICE_TIERS[PRICE_TIERS.length - 1].cubes) {
    return PRICE_TIERS[PRICE_TIERS.length - 1].price;
  }

  for (let i = 1; i < PRICE_TIERS.length; i += 1) {
    const lower = PRICE_TIERS[i - 1];
    const upper = PRICE_TIERS[i];

    if (cubeCount <= upper.cubes) {
      const progress = (cubeCount - lower.cubes) / (upper.cubes - lower.cubes);
      return Math.round(lower.price + progress * (upper.price - lower.price));
    }
  }

  return PRICE_TIERS[PRICE_TIERS.length - 1].price;
}

function updatePriceEstimate() {
  const cubeCount = getCubeCount();
  const output = document.querySelector('#estimated-price');

  if (!Number.isInteger(cubeCount) || cubeCount < 1 || cubeCount > 50) {
    output.textContent = '—';
    return;
  }

  output.textContent = `$${estimatePrice(cubeCount).toLocaleString('en-US')}`;
}

function nearestCubeColor(red, green, blue) {
  let nearest = cubePalette[0];
  let smallestDistance = Infinity;

  for (const hex of cubePalette) {
    const color = hex.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16));
    const distance = (red - color[0]) ** 2 + (green - color[1]) ** 2 + (blue - color[2]) ** 2;
    if (distance < smallestDistance) {
      nearest = hex;
      smallestDistance = distance;
    }
  }

  return nearest;
}

function drawPreview() {
  if (!selectedImage) return;
  const count = getImageStickerCount();
  if (!Number.isInteger(count) || count < 3 || count > 150) return;

  // Match the preview canvas to the image shape instead of squeezing a wide
  // or tall image into a square. The selected cube count applies to its long side.
  const aspect = selectedImage.naturalWidth / selectedImage.naturalHeight;
  const cubeCount = getCubeCount();
  const cubeColumns = aspect >= 1 ? cubeCount : Math.max(1, Math.round(cubeCount * aspect));
  const cubeRows = aspect >= 1 ? Math.max(1, Math.round(cubeCount / aspect)) : cubeCount;
  const stickerWidth = cubeColumns * STICKERS_PER_CUBE;
  const stickerHeight = cubeRows * STICKERS_PER_CUBE;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = stickerWidth;
  sampleCanvas.height = stickerHeight;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sampleContext.fillStyle = '#ffffff';
  sampleContext.fillRect(0, 0, stickerWidth, stickerHeight);
  sampleContext.imageSmoothingEnabled = true;
  const scale = Math.min(stickerWidth / selectedImage.naturalWidth, stickerHeight / selectedImage.naturalHeight);
  const fittedWidth = selectedImage.naturalWidth * scale;
  const fittedHeight = selectedImage.naturalHeight * scale;
  const offsetX = (stickerWidth - fittedWidth) / 2;
  const offsetY = (stickerHeight - fittedHeight) / 2;
  sampleContext.drawImage(selectedImage, offsetX, offsetY, fittedWidth, fittedHeight);

  const imageData = sampleContext.getImageData(0, 0, stickerWidth, stickerHeight);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const [r, g, b] = imageData.data.slice(i, i + 3);
    const color = nearestCubeColor(r, g, b).match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16));
    imageData.data[i] = color[0];
    imageData.data[i + 1] = color[1];
    imageData.data[i + 2] = color[2];
    imageData.data[i + 3] = 255;
  }

  sampleContext.putImageData(imageData, 0, 0);
  previewCanvas.width = stickerWidth;
  previewCanvas.height = stickerHeight;
  previewContext.imageSmoothingEnabled = false;
  previewContext.clearRect(0, 0, stickerWidth, stickerHeight);
  previewContext.drawImage(sampleCanvas, 0, 0);
  previewBox.hidden = false;
  const maxPreviewSide = Math.min(360, Math.max(120, previewBox.clientWidth - 34));
  const previewWidth = aspect >= 1 ? maxPreviewSide : maxPreviewSide * aspect;
  const previewHeight = aspect >= 1 ? maxPreviewSide / aspect : maxPreviewSide;
  previewCanvas.style.width = `${previewWidth}px`;
  previewCanvas.style.height = `${previewHeight}px`;
  document.querySelector('#preview-dimensions').textContent = `${stickerWidth} × ${stickerHeight} stickers`;
  document.querySelector('#preview-cubes').textContent = `${cubeColumns} × ${cubeRows} cubes`;
}

function setError(id, message) {
  document.querySelector(id).textContent = message;
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  selectedImage = null;
  previewBox.hidden = true;
  setError('#step-1-error', '');

  if (!file) {
    fileName.textContent = 'Your photo is used for the preview only. It won’t be sent with your request.';
    return;
  }

  if (!file.type.startsWith('image/')) {
    imageInput.value = '';
    fileName.textContent = 'Please choose an image file.';
    setError('#step-1-error', 'That file is not an image. Please choose an image file.');
    return;
  }

  fileName.textContent = file.name;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    selectedImage = image;
    drawPreview();
  };
  image.onerror = () => setError('#step-1-error', 'I couldn’t read that image. Try another file.');
  image.src = previewUrl;
});

window.addEventListener('resize', () => {
  if (selectedImage) drawPreview();
});

sizeSelect.addEventListener('change', () => {
  customSizeField.hidden = sizeSelect.value !== 'custom';
  setError('#step-1-error', '');
  updatePriceEstimate();
  drawPreview();
});

customSizeInput.addEventListener('input', () => {
  setError('#step-1-error', '');
  updatePriceEstimate();
  drawPreview();
});

updatePriceEstimate();

document.querySelector('#next-button').addEventListener('click', () => {
  setError('#step-1-error', '');
  if (!imageInput.files.length || !selectedImage) {
    setError('#step-1-error', 'Please upload an image before continuing.');
    return;
  }

  const cubeCount = getCubeCount();
  if (!Number.isInteger(cubeCount) || cubeCount < 1 || cubeCount > 50) {
    setError('#step-1-error', 'Choose a custom cube count between 1 and 50.');
    customSizeInput.focus();
    return;
  }

  drawPreview();
  const aspect = selectedImage.naturalWidth / selectedImage.naturalHeight;
  const cubeColumns = aspect >= 1 ? cubeCount : Math.max(1, Math.round(cubeCount * aspect));
  const cubeRows = aspect >= 1 ? Math.max(1, Math.round(cubeCount / aspect)) : cubeCount;
  const price = `$${estimatePrice(cubeCount).toLocaleString('en-US')}`;
  summary.innerHTML = `<div><strong>Image:</strong> ${escapeHtml(imageInput.files[0].name)}</div><div><strong>Size:</strong> ${cubeColumns} × ${cubeRows} cubes (${cubeColumns * 3} × ${cubeRows * 3} stickers)</div><div><strong>Starting price:</strong> ${price}</div>`;
  stepOne.hidden = true;
  stepTwo.hidden = false;
  stepLabel.textContent = 'Contact info';
  document.querySelector('[data-step-dot="1"]').classList.remove('active');
  document.querySelector('[data-step-dot="2"]').classList.add('active');
  document.querySelector('#customer-name').focus();
});

document.querySelector('#back-button').addEventListener('click', () => {
  stepTwo.hidden = true;
  stepOne.hidden = false;
  stepLabel.textContent = 'Artwork details';
  document.querySelector('[data-step-dot="2"]').classList.remove('active');
  document.querySelector('[data-step-dot="1"]').classList.add('active');
  setError('#step-2-error', '');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError('#step-2-error', '');

  const name = document.querySelector('#customer-name').value.trim();
  const email = document.querySelector('#customer-email').value.trim();
  const phone = document.querySelector('#customer-phone').value.trim();
  if (!name) {
    setError('#step-2-error', 'Please enter your name.');
    return;
  }
  if (!email && !phone) {
    setError('#step-2-error', 'Please add an email address or phone number.');
    return;
  }

  const endpoint = form.action;
  if (endpoint.includes('YOUR_FORM_ID')) {
    setError('#step-2-error', 'Connect your Formspree form first by replacing YOUR_FORM_ID in index.html.');
    return;
  }

  const count = getCubeCount();
  const aspect = selectedImage.naturalWidth / selectedImage.naturalHeight;
  const cubeColumns = aspect >= 1 ? count : Math.max(1, Math.round(count * aspect));
  const cubeRows = aspect >= 1 ? Math.max(1, Math.round(count / aspect)) : count;
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.innerHTML;
  const formData = new FormData(form);

  // Keep the upload local for the preview; only send request details to Formspree.
  formData.delete('image');
  formData.set('_subject', `New Rubik’s Cube art request from ${name}`);
  formData.set('Estimated starting price', `$${estimatePrice(count).toLocaleString('en-US')}`);
  formData.set('Requested cube size', `${cubeColumns} × ${cubeRows} cubes`);
  formData.set('Sticker resolution', `${previewCanvas.width} × ${previewCanvas.height}`);
  formData.set('Photo', 'Preview only; please contact the customer to request the original image.');
  if (email) formData.set('_replyto', email);

  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const details = result.errors?.map((error) => error.message).join(' ');
      throw new Error(details || 'The request could not be sent. Please try again.');
    }

    document.querySelector('.step-indicator').hidden = true;
    stepOne.hidden = true;
    stepTwo.hidden = true;
    const success = document.querySelector('#request-result');
    success.textContent = 'Request sent! You’ll receive a follow-up at the contact details you provided.';
    success.hidden = false;
  } catch (error) {
    setError('#step-2-error', error.message || 'The request could not be sent. Please try again.');
    submitButton.disabled = false;
    submitButton.innerHTML = submitLabel;
  }
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

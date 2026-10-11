const fileInput = document.querySelector('.file-input');
const previewImage = document.querySelector('.sample-photo');
const glowLayer = document.querySelector('.glow-layer');
const fisheyeLayer = document.querySelector('.fisheye-layer');
const photoStage = document.querySelector('.viewfinder');
const photoContent = document.querySelector('.photo-content');
const dateStamp = document.querySelector('.date-stamp');
const dateDisplay = document.querySelector('.date-display');
const dateInput = document.querySelector('.date-input');
const fileName = document.querySelector('.file-name');
const fileDimensions = document.querySelector('.file-dimensions');
const photoFileName = document.querySelector('.photo-file-name');
const photoFileDimensions = document.querySelector('.photo-file-dimensions');
const resetButton = document.querySelector('.reset');
const resetMobileButton = document.querySelector('.reset-mobile');
const dateToggle = document.querySelector('.date-toggle');
const presetCards = [...document.querySelectorAll('.preset-card')];
const saveButtons = [...document.querySelectorAll('.save-top, .save-mobile')];
const shareButton = document.querySelector('.share-mobile');
const uploadDropzone = document.querySelector('.upload-dropzone');
let activeObjectUrl = null;
let activeFileName = 'pocket-film';
let sourceWidth = 0;
let sourceHeight = 0;
let grainTile = null;

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return value ? value.replaceAll('-', '/') : '';
}

function setExportAvailability(enabled) {
  [...saveButtons, shareButton].forEach((button) => {
    button.setAttribute('aria-disabled', String(!enabled));
  });
}

function setPresetSelected(preset) {
  document.body.dataset.preset = preset;
  presetCards.forEach((card) => {
    const selected = card.dataset.preset === preset;
    card.classList.toggle('is-active', selected);
    card.disabled = !activeObjectUrl;
  });
  resetButton.disabled = !activeObjectUrl || preset === 'none';
  resetMobileButton.disabled = resetButton.disabled;
}

function fitEffectsToPhoto() {
  if (!sourceWidth || !sourceHeight) return;
  const stage = photoStage.getBoundingClientRect();
  if (!stage.width || !stage.height) return;

  let outputWidth = sourceWidth;
  let outputHeight = sourceHeight;
  const preset = document.body.dataset.preset;
  const instantFrame = ['polaroid', 'polaroidsx70', 'polaroidblack', 'polaroiddesign'].includes(preset);
  if (instantFrame) {
    outputWidth = sourceWidth * 1.1;
    outputHeight = sourceHeight * 1.24;
  }
  const scale = Math.min(stage.width / outputWidth, stage.height / outputHeight);
  const width = outputWidth * scale;
  const height = outputHeight * scale;
  photoContent.style.width = `${width}px`;
  photoContent.style.height = `${height}px`;

  if (instantFrame) {
    previewImage.style.left = '4.55%';
    previewImage.style.top = '4.03%';
    previewImage.style.width = '90.9%';
    previewImage.style.height = '80.65%';
  } else {
    previewImage.style.left = '0';
    previewImage.style.top = '0';
    previewImage.style.width = '100%';
    previewImage.style.height = '100%';
  }

  if (instantFrame) {
    dateStamp.style.right = '5%';
    dateStamp.style.bottom = '16%';
  } else {
    dateStamp.style.right = '3%';
    dateStamp.style.bottom = '3%';
  }

  const baseFontSize = Math.max(12, Math.min(32, width * 0.045));
  dateStamp.style.setProperty('--stamp-size', `${baseFontSize}px`);
  const availableStampWidth = width * 0.94;
  if (dateStamp.scrollWidth > availableStampWidth) {
    const fittedFontSize = baseFontSize * availableStampWidth / dateStamp.scrollWidth;
    dateStamp.style.setProperty('--stamp-size', `${Math.max(10, fittedFontSize)}px`);
  }
  if (document.body.dataset.preset === 'fisheye') renderFisheyePreview();
}

function openFilePicker() {
  fileInput.click();
}

document.querySelectorAll('[data-open-file]').forEach((button) => {
  button.addEventListener('click', openFilePicker);
});

uploadDropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openFilePicker();
  }
});

['dragenter', 'dragover'].forEach((eventName) => {
  uploadDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadDropzone.classList.add('is-dragging');
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  uploadDropzone.addEventListener(eventName, () => uploadDropzone.classList.remove('is-dragging'));
});

uploadDropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  uploadDropzone.classList.remove('is-dragging');
  const file = event.dataTransfer?.files?.[0];
  if (file) loadPhotoFile(file);
});

async function loadPhotoFile(file) {
  const hasSupportedExtension = /\.(jpe?g|png)$/i.test(file.name);
  const hasSupportedType = ['image/jpeg', 'image/png', 'application/octet-stream'].includes(file.type);
  if (!hasSupportedExtension || (file.type && !hasSupportedType)) {
    window.alert('Selecciona una imagen JPG o PNG.');
    return;
  }

  const nextObjectUrl = URL.createObjectURL(file);
  const probe = new Image();
  probe.src = nextObjectUrl;
  try {
    await probe.decode();
  } catch {
    URL.revokeObjectURL(nextObjectUrl);
    window.alert('No se pudo abrir esta imagen. Prueba con otro archivo JPG o PNG.');
    return;
  }

  const previousObjectUrl = activeObjectUrl;
  activeObjectUrl = nextObjectUrl;
  activeFileName = file.name.replace(/\.[^.]+$/, '') || 'pocket-film';
  sourceWidth = probe.naturalWidth;
  sourceHeight = probe.naturalHeight;
  previewImage.src = nextObjectUrl;
  glowLayer.src = nextObjectUrl;
  previewImage.alt = `Foto seleccionada: ${file.name}`;
  fileName.textContent = file.name;
  fileDimensions.textContent = `· ${sourceWidth} × ${sourceHeight} px`;
  photoFileName.textContent = file.name;
  photoFileDimensions.textContent = `${sourceWidth} × ${sourceHeight} px`;
  document.body.dataset.state = 'selected';
  setExportAvailability(true);
  const today = localDateValue();
  dateInput.value = today;
  updateDateStamp(today);
  setPresetSelected('digicam');
  requestAnimationFrame(fitEffectsToPhoto);
  if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
}

function updateDateStamp(value) {
  const formatted = formatDate(value);
  dateDisplay.textContent = formatted;
  dateStamp.textContent = formatted;
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) loadPhotoFile(file);
  fileInput.value = '';
});

dateInput.addEventListener('change', () => updateDateStamp(dateInput.value));
document.querySelector('.today-button').addEventListener('click', () => {
  const today = localDateValue();
  dateInput.value = today;
  updateDateStamp(today);
});
document.querySelector('.calendar-button').addEventListener('click', () => {
  if (dateInput.showPicker) dateInput.showPicker();
  else dateInput.click();
});

dateToggle.addEventListener('click', () => {
  const enabled = dateToggle.getAttribute('aria-checked') !== 'true';
  dateToggle.setAttribute('aria-checked', String(enabled));
  document.body.dataset.stamp = enabled ? 'on' : 'off';
});

presetCards.forEach((card) => {
  card.addEventListener('click', () => {
    if (!activeObjectUrl) return;
    setPresetSelected(card.dataset.preset);
    requestAnimationFrame(fitEffectsToPhoto);
  });
});

function resetPreset() {
  if (!activeObjectUrl) return;
  document.body.dataset.stamp = 'off';
  dateToggle.setAttribute('aria-checked', 'false');
  setPresetSelected('none');
  requestAnimationFrame(fitEffectsToPhoto);
}
resetButton.addEventListener('click', resetPreset);
resetMobileButton.addEventListener('click', resetPreset);

function drawFilteredImage(context, image, width, height, filter, x = 0, y = 0) {
  context.save();
  context.filter = filter;
  context.drawImage(image, x, y, width, height);
  context.restore();
}

function drawFisheyeImage(context, image, x, y, width, height, maxDimension = 1500) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const warpedWidth = Math.max(1, Math.round(width * scale));
  const warpedHeight = Math.max(1, Math.round(height * scale));
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = warpedWidth;
  sourceCanvas.height = warpedHeight;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error('No se pudo preparar el efecto ojo de pez');
  sourceContext.drawImage(image, 0, 0, warpedWidth, warpedHeight);

  const source = sourceContext.getImageData(0, 0, warpedWidth, warpedHeight);
  const warped = sourceContext.createImageData(warpedWidth, warpedHeight);
  const centerX = (warpedWidth - 1) / 2;
  const centerY = (warpedHeight - 1) / 2;
  const diagonal = Math.hypot(centerX, centerY);
  const theta = 1.08;
  const edge = Math.tan(theta);

  for (let py = 0; py < warpedHeight; py += 1) {
    for (let px = 0; px < warpedWidth; px += 1) {
      const dx = px - centerX;
      const dy = py - centerY;
      const radius = Math.hypot(dx, dy) / diagonal;
      const sourceRadius = radius === 0 ? 0 : Math.tan(Math.min(1, radius) * theta) / edge;
      const sourceX = Math.round(centerX + (radius ? dx / radius * sourceRadius : 0));
      const sourceY = Math.round(centerY + (radius ? dy / radius * sourceRadius : 0));
      const targetIndex = (py * warpedWidth + px) * 4;
      const sourceIndex = (Math.min(warpedHeight - 1, Math.max(0, sourceY)) * warpedWidth + Math.min(warpedWidth - 1, Math.max(0, sourceX))) * 4;
      warped.data[targetIndex] = source.data[sourceIndex];
      warped.data[targetIndex + 1] = source.data[sourceIndex + 1];
      warped.data[targetIndex + 2] = source.data[sourceIndex + 2];
      warped.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
  sourceContext.putImageData(warped, 0, 0);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(sourceCanvas, x, y, width, height);
  context.restore();
}

function renderFisheyePreview() {
  if (!previewImage.naturalWidth || !previewImage.naturalHeight) return;
  const previewWidth = Math.min(1200, sourceWidth);
  const previewHeight = Math.max(1, Math.round(previewWidth * sourceHeight / sourceWidth));
  fisheyeLayer.width = previewWidth;
  fisheyeLayer.height = previewHeight;
  const context = fisheyeLayer.getContext('2d');
  if (!context) return;
  drawFisheyeImage(context, previewImage, 0, 0, previewWidth, previewHeight, 1200);
}

function addFilmGrain(context, x, y, width, height) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128;
    grainTile.height = 128;
    const grainContext = grainTile.getContext('2d');
    const pixels = grainContext.createImageData(grainTile.width, grainTile.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const shade = Math.random() < 0.5 ? 0 : 255;
      pixels.data[index] = shade;
      pixels.data[index + 1] = shade;
      pixels.data[index + 2] = shade;
      pixels.data[index + 3] = 72;
    }
    grainContext.putImageData(pixels, 0, 0);
  }
  context.save();
  context.globalAlpha = 0.28;
  context.fillStyle = context.createPattern(grainTile, 'repeat');
  context.fillRect(x, y, width, height);
  context.restore();
}

function renderImage() {
  const preset = document.body.dataset.preset;
  const isPolaroid = ['polaroid', 'polaroidsx70', 'polaroidblack', 'polaroiddesign'].includes(preset);
  const marginX = isPolaroid ? Math.round(sourceWidth * 0.05) : 0;
  const marginTop = isPolaroid ? Math.round(sourceHeight * 0.05) : 0;
  const marginBottom = isPolaroid ? Math.round(sourceHeight * 0.19) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth + marginX * 2;
  canvas.height = sourceHeight + marginTop + marginBottom;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas no disponible');

  if (isPolaroid) {
    context.fillStyle = preset === 'polaroidblack' ? '#171719' : preset === 'polaroidsx70' ? '#e8e0cf' : '#f7f4ed';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const x = marginX;
  const y = marginTop;

  if (preset === 'matte') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(84%) contrast(91%) brightness(106%)');
    const liftedBlacks = context.createLinearGradient(0, y, 0, y + sourceHeight);
    liftedBlacks.addColorStop(0, '#e9d6bd12');
    liftedBlacks.addColorStop(1, '#e9d6bd28');
    context.fillStyle = liftedBlacks;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'cinematic') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(112%) contrast(108%) brightness(102%)');
    const coolShadows = context.createLinearGradient(0, y + sourceHeight, 0, y);
    coolShadows.addColorStop(0, '#168b8a28');
    coolShadows.addColorStop(0.62, '#168b8a00');
    context.fillStyle = coolShadows;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    const warmHighlights = context.createRadialGradient(sourceWidth * 0.55, y + sourceHeight * 0.2, 0, sourceWidth * 0.55, y + sourceHeight * 0.2, Math.max(sourceWidth, sourceHeight) * 0.85);
    warmHighlights.addColorStop(0, '#ffad5a22');
    warmHighlights.addColorStop(1, '#ffad5a00');
    context.fillStyle = warmHighlights;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'pastel') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(86%) contrast(91%) brightness(108%)');
    const softColor = context.createLinearGradient(0, y, sourceWidth, y + sourceHeight);
    softColor.addColorStop(0, '#ffd8e51c');
    softColor.addColorStop(0.52, '#d8d3ff18');
    softColor.addColorStop(1, '#ffe4cf20');
    context.fillStyle = softColor;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'glow') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(92%) contrast(91%) brightness(107%)');
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.24;
    context.filter = `blur(${Math.max(4, sourceWidth * 0.004)}px)`;
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    context.restore();
    const softBloom = context.createRadialGradient(sourceWidth * 0.5, y + sourceHeight * 0.36, 0, sourceWidth * 0.5, y + sourceHeight * 0.36, Math.max(sourceWidth, sourceHeight) * 0.82);
    softBloom.addColorStop(0, '#fff6e62a');
    softBloom.addColorStop(1, '#fff6e600');
    context.fillStyle = softBloom;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'bwfilm') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'grayscale(1) contrast(112%) brightness(102%)');
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'flash') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(118%) contrast(120%) brightness(105%)');
    const flash = context.createRadialGradient(sourceWidth * 0.5, sourceHeight * 0.34, 0, sourceWidth * 0.5, sourceHeight * 0.34, Math.max(sourceWidth, sourceHeight) * 0.78);
    flash.addColorStop(0, '#fff5dc2a');
    flash.addColorStop(0.42, '#ffd39d10');
    flash.addColorStop(1, '#2a130d18');
    context.fillStyle = flash;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'japan') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(16%) saturate(125%) contrast(106%) brightness(103%)');
    const warmth = context.createLinearGradient(0, y, sourceWidth, y + sourceHeight);
    warmth.addColorStop(0, '#ffbd6b1c');
    warmth.addColorStop(1, '#e24e2812');
    context.fillStyle = warmth;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'dreamcore') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(130%) brightness(112%) contrast(90%) hue-rotate(6deg)');
    const dreamyTones = context.createLinearGradient(0, y, 0, y + sourceHeight);
    dreamyTones.addColorStop(0, '#c6b5ff36');
    dreamyTones.addColorStop(0.34, '#ffd4ef28');
    dreamyTones.addColorStop(0.68, '#75ddf42d');
    dreamyTones.addColorStop(1, '#a5f3d726');
    context.fillStyle = dreamyTones;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.16;
    context.filter = `blur(${Math.max(4, sourceWidth * 0.003)}px)`;
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    context.restore();
    const softBloom = context.createRadialGradient(sourceWidth * 0.68, y + sourceHeight * 0.28, 0, sourceWidth * 0.68, y + sourceHeight * 0.28, Math.max(sourceWidth, sourceHeight) * 0.9);
    softBloom.addColorStop(0, '#fff5e82c');
    softBloom.addColorStop(1, '#fff5e800');
    context.fillStyle = softBloom;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'vhs') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(130%) contrast(112%) hue-rotate(-6deg)');
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.12;
    context.filter = 'hue-rotate(125deg)';
    context.drawImage(previewImage, x + Math.max(1, sourceWidth * 0.0015), y, sourceWidth, sourceHeight);
    context.restore();
    context.fillStyle = '#11101830';
    const lineStep = Math.max(4, Math.round(sourceHeight / 700));
    for (let lineY = y; lineY < y + sourceHeight; lineY += lineStep) {
      context.fillRect(x, lineY, sourceWidth, Math.max(1, lineStep * 0.35));
    }
  } else if (preset === 'grain') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'contrast(106%) saturate(96%)');
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'lightleak') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(112%) contrast(103%)');
    const leak = context.createRadialGradient(x + sourceWidth * 0.08, y + sourceHeight * 0.08, 0, x + sourceWidth * 0.08, y + sourceHeight * 0.08, Math.max(sourceWidth, sourceHeight) * 0.8);
    leak.addColorStop(0, '#ffb45a66');
    leak.addColorStop(0.35, '#ff5a1f25');
    leak.addColorStop(1, '#ff5a1f00');
    context.fillStyle = leak;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'vignette') {
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    const vignette = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.min(sourceWidth, sourceHeight) * 0.18, x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.max(sourceWidth, sourceHeight) * 0.72);
    vignette.addColorStop(0, '#100b0900');
    vignette.addColorStop(0.58, '#100b0910');
    vignette.addColorStop(1, '#100b09b8');
    context.fillStyle = vignette;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'halation') {
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.2;
    context.filter = `blur(${Math.max(5, sourceWidth * 0.006)}px) brightness(1.4) saturate(1.25)`;
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    context.restore();
    const warmHalo = context.createRadialGradient(x + sourceWidth * 0.55, y + sourceHeight * 0.25, 0, x + sourceWidth * 0.55, y + sourceHeight * 0.25, Math.max(sourceWidth, sourceHeight) * 0.78);
    warmHalo.addColorStop(0, '#ff8e6c12');
    warmHalo.addColorStop(1, '#ff8e6c00');
    context.fillStyle = warmHalo;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'golden') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(12%) saturate(118%) contrast(104%) brightness(105%)');
    const goldenLight = context.createLinearGradient(0, y, sourceWidth, y + sourceHeight);
    goldenLight.addColorStop(0, '#ffc36b32');
    goldenLight.addColorStop(0.52, '#ffb85a10');
    goldenLight.addColorStop(1, '#f06b321c');
    context.fillStyle = goldenLight;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'coolblue') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(92%) contrast(106%) hue-rotate(-7deg) brightness(102%)');
    const coolTone = context.createLinearGradient(0, y + sourceHeight, 0, y);
    coolTone.addColorStop(0, '#287dad35');
    coolTone.addColorStop(0.56, '#509bd912');
    coolTone.addColorStop(1, '#8eb8ff12');
    context.fillStyle = coolTone;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'bwdramatic') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'grayscale(1) contrast(145%) brightness(98%)');
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'disposable') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(8%) saturate(105%) contrast(118%) brightness(103%)');
    const directFlash = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.36, 0, x + sourceWidth * 0.5, y + sourceHeight * 0.36, Math.max(sourceWidth, sourceHeight) * 0.72);
    directFlash.addColorStop(0, '#fff2d944');
    directFlash.addColorStop(0.42, '#ffd09316');
    directFlash.addColorStop(1, '#26150c35');
    context.fillStyle = directFlash;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'toycam') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(128%) contrast(112%) brightness(103%)');
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.12;
    context.filter = `blur(${Math.max(4, sourceWidth * 0.003)}px)`;
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
    context.restore();
    const toyVignette = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.min(sourceWidth, sourceHeight) * 0.2, x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.max(sourceWidth, sourceHeight) * 0.72);
    toyVignette.addColorStop(0, '#160b1600');
    toyVignette.addColorStop(0.7, '#160b1618');
    toyVignette.addColorStop(1, '#160b167c');
    context.fillStyle = toyVignette;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'super8') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(18%) saturate(112%) contrast(96%) brightness(104%)');
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
    context.save();
    context.fillStyle = '#fff0ce20';
    context.fillRect(x, y, sourceWidth, Math.max(2, sourceHeight * 0.012));
    context.fillRect(x, y + sourceHeight * 0.988, sourceWidth, Math.max(2, sourceHeight * 0.012));
    context.strokeStyle = '#fff3d24a';
    context.lineWidth = Math.max(1, sourceWidth * 0.0012);
    [0.08, 0.31, 0.67, 0.91].forEach((position) => {
      const scratchX = x + sourceWidth * position;
      context.beginPath();
      context.moveTo(scratchX, y + sourceHeight * 0.08);
      context.lineTo(scratchX + sourceWidth * 0.006, y + sourceHeight * 0.42);
      context.stroke();
    });
    context.restore();
  } else if (preset === 'fisheye') {
    drawFisheyeImage(context, previewImage, x, y, sourceWidth, sourceHeight);
    const lensShade = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.min(sourceWidth, sourceHeight) * 0.28, x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.max(sourceWidth, sourceHeight) * 0.74);
    lensShade.addColorStop(0, '#05060900');
    lensShade.addColorStop(0.78, '#05060912');
    lensShade.addColorStop(1, '#0506099c');
    context.fillStyle = lensShade;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'y2k') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(122%) contrast(112%) brightness(106%) hue-rotate(-5deg)');
    context.save();
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = 0.08;
    context.filter = 'hue-rotate(145deg)';
    context.drawImage(previewImage, x + Math.max(1, sourceWidth * 0.001), y, sourceWidth, sourceHeight);
    context.restore();
    const ccdFlash = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.32, 0, x + sourceWidth * 0.5, y + sourceHeight * 0.32, Math.max(sourceWidth, sourceHeight) * 0.78);
    ccdFlash.addColorStop(0, '#eaf8ff30');
    ccdFlash.addColorStop(0.48, '#54c9ff10');
    ccdFlash.addColorStop(1, '#101a3928');
    context.fillStyle = ccdFlash;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === '35mm') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(7%) saturate(108%) contrast(112%) brightness(102%)');
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
    const filmVignette = context.createRadialGradient(x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.min(sourceWidth, sourceHeight) * 0.28, x + sourceWidth * 0.5, y + sourceHeight * 0.5, Math.max(sourceWidth, sourceHeight) * 0.76);
    filmVignette.addColorStop(0, '#21180f00');
    filmVignette.addColorStop(1, '#21180f52');
    context.fillStyle = filmVignette;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'matrix') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(88%) contrast(128%) brightness(94%)');
    context.save();
    context.globalCompositeOperation = 'color';
    context.globalAlpha = 0.58;
    context.fillStyle = '#16b84f';
    context.fillRect(x, y, sourceWidth, sourceHeight);
    context.restore();
    const greenGlow = context.createLinearGradient(0, y, 0, y + sourceHeight);
    greenGlow.addColorStop(0, '#5aff8a20');
    greenGlow.addColorStop(0.52, '#00d45508');
    greenGlow.addColorStop(1, '#00190b70');
    context.fillStyle = greenGlow;
    context.fillRect(x, y, sourceWidth, sourceHeight);
  } else if (preset === 'joji') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(74%) contrast(108%) brightness(92%)');
    const jojiTone = context.createLinearGradient(0, y, sourceWidth, y + sourceHeight);
    jojiTone.addColorStop(0, '#8f354322');
    jojiTone.addColorStop(0.52, '#4b17271b');
    jojiTone.addColorStop(1, '#10131c52');
    context.fillStyle = jojiTone;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    const redGlow = context.createRadialGradient(x + sourceWidth * 0.76, y + sourceHeight * 0.25, 0, x + sourceWidth * 0.76, y + sourceHeight * 0.25, Math.max(sourceWidth, sourceHeight) * 0.62);
    redGlow.addColorStop(0, '#df68702c');
    redGlow.addColorStop(1, '#df687000');
    context.fillStyle = redGlow;
    context.fillRect(x, y, sourceWidth, sourceHeight);
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'polaroidsx70') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(14%) saturate(82%) contrast(91%) brightness(108%)', x, y);
    addFilmGrain(context, x, y, sourceWidth, sourceHeight);
  } else if (preset === 'polaroidblack') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'saturate(112%) contrast(116%) brightness(98%)', x, y);
  } else if (preset === 'polaroiddesign') {
    drawFilteredImage(context, previewImage, sourceWidth, sourceHeight, 'sepia(3%) saturate(102%) contrast(102%) brightness(102%)', x, y);
  } else {
    context.drawImage(previewImage, x, y, sourceWidth, sourceHeight);
  }

  if (preset === 'polaroiddesign') {
    context.save();
    context.strokeStyle = '#c9585f';
    context.lineWidth = Math.max(3, sourceWidth * 0.009);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    const heartX = canvas.width / 2;
    const heartY = y + sourceHeight + marginBottom * 0.52;
    const heartSize = sourceWidth * 0.075;
    context.beginPath();
    context.moveTo(heartX, heartY + heartSize * 0.46);
    context.bezierCurveTo(heartX - heartSize * 0.18, heartY + heartSize * 0.23, heartX - heartSize * 0.62, heartY - heartSize * 0.06, heartX - heartSize * 0.47, heartY - heartSize * 0.4);
    context.bezierCurveTo(heartX - heartSize * 0.34, heartY - heartSize * 0.68, heartX - heartSize * 0.03, heartY - heartSize * 0.42, heartX, heartY - heartSize * 0.2);
    context.bezierCurveTo(heartX + heartSize * 0.18, heartY - heartSize * 0.56, heartX + heartSize * 0.56, heartY - heartSize * 0.55, heartX + heartSize * 0.53, heartY - heartSize * 0.2);
    context.bezierCurveTo(heartX + heartSize * 0.5, heartY + heartSize * 0.08, heartX + heartSize * 0.2, heartY + heartSize * 0.32, heartX, heartY + heartSize * 0.46);
    context.stroke();
    context.restore();
  }

  if (document.body.dataset.stamp !== 'off') {
    const stamp = formatDate(dateInput.value || localDateValue());
    const fontSize = Math.max(20, Math.round(sourceWidth * 0.035));
    const insetX = Math.round(sourceWidth * 0.04);
    const insetY = Math.round(sourceHeight * 0.045);
    context.save();
    context.font = `bold ${fontSize}px "Courier New", monospace`;
    context.textAlign = 'right';
    context.textBaseline = 'bottom';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(2, fontSize * 0.09);
    context.strokeStyle = '#26180a';
    context.shadowColor = '#ffad0099';
    context.shadowBlur = fontSize * 0.24;
    context.strokeText(stamp, x + sourceWidth - insetX, y + sourceHeight - insetY);
    context.fillStyle = '#ffad00';
    context.fillText(stamp, x + sourceWidth - insetX, y + sourceHeight - insetY);
    context.restore();
  }
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo crear el archivo PNG.')), 'image/png');
  });
}

async function exportPhoto(share = false) {
  if (!activeObjectUrl) return;
  try {
    const canvas = renderImage();
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `${activeFileName}-pocket-film.png`, { type: 'image/png' });
    if (share && navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ files: [file], title: 'POCKET//FILM' });
      return;
    }
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    if (share) window.alert('Este navegador no permite compartir archivos desde la página. Se descargó la foto para que puedas compartirla.');
  } catch (error) {
    if (error.name === 'AbortError') return;
    window.alert('No se pudo preparar la foto. Prueba con una imagen más pequeña.');
  }
}

saveButtons.forEach((button) => button.addEventListener('click', () => exportPhoto(false)));
shareButton.addEventListener('click', () => exportPhoto(true));

window.addEventListener('resize', fitEffectsToPhoto);
if ('ResizeObserver' in window) new ResizeObserver(fitEffectsToPhoto).observe(photoStage);
window.addEventListener('pagehide', () => {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
});

setExportAvailability(false);

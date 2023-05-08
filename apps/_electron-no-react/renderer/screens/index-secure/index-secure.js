// Import JSDoc types
/** @typedef {import('./index-secure-preload').ExposedAPI} ExposedAPI */


// Get the exposed API from the "main" process
// This object is exposed inside "preload"
/** @type {ExposedAPI} */
const _exposedAPI = window.exposedAPI;

// Local State

/** @type {File|undefined} */
let selectedFile = undefined;
let inputImageSizes = {
  w: 0,
  h: 0,
};

// UI components

const nodes = {
  form: document.querySelector('#img-form'),
  img: document.querySelector('#img'),
  outputPath: document.querySelector('#output-path'),
  filename: document.querySelector('#filename'),
  heightInput: document.querySelector('#height'),
  widthInput: document.querySelector('#width'),
  toast: document.querySelector('#toast'),
  imageSelectorWrapper: document.querySelector('.image-selector'),
  originalImageInfo: document.querySelector('#original-image-info'),
  originalImageInfoData: document.querySelector('.original-image-info__data'),
};
const toast = {
  node: nodes.toast,
  /** @type {(type?:'info'|'error'|'success', message: string) => void} */
  createToast(type = 'info', message) {
    this.node.innerText = message ?? '---';
    this.node.style.backgroundColor = {
      info: 'white',
      error: 'red',
      success: 'green',
    }[type];
    this.node.style.color = {
      info: 'black',
      error: 'white',
      success: 'white',
    }[type];
    this.node.style.display = 'block';
    setTimeout(() => {
      this.node.style.display = 'none';
      this.node.innerText = '';
    }, 5000);
  }
};

// On start do...
nodes.outputPath.innerText = _exposedAPI.osHomeDirPath + "/Downloads";

// Events Listeners

nodes.img.addEventListener('change', async (e) => {
  // get files selected by hte user in the file input...
  /** @type {HTMLInputElement | null} */
  const input = e.target;
  const files = input.files;
  const file = files[0];

  // ensure that they are images and not other files
  function isImage(file) {
    const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return acceptedImageTypes.includes(file.type);
  }
  if (!isImage(file)) {
    toast.createToast('error', `File ${file.name} is NOT an image. Plase select an image!`);
    nodes.form.style.display = 'none';
    nodes.imageSelectorWrapper.classList.remove('image-selector--image-is-selected');
    return;
  }

  // save local state
  async function getImageOriginalSizes(file) {
    const image = new Image();
    image.src = URL.createObjectURL(file);
    return new Promise(resolve => {
      image.onload = () => resolve({
        width: image.width,
        height: image.height,
      });
    });
  }
  const imageSize = await getImageOriginalSizes(file);
  selectedFile = file;
  inputImageSizes.w = imageSize.width;
  inputImageSizes.h = imageSize.height;

  // show form and show input file data...
  nodes.form.style.display = 'block';
  nodes.filename.innerText = file.name;
  nodes.widthInput.value = imageSize.width;
  nodes.heightInput.value = imageSize.height;
  nodes.imageSelectorWrapper.classList.add('image-selector--image-is-selected');
  nodes.originalImageInfoData.innerHTML = `
    <span>Width</span>
    <span>${imageSize.width}</span>
    <span>Height</span>
    <span>${imageSize.height}</span>
  `;

});

nodes.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // validate the form before submitting...
  const outputW = nodes.widthInput.value;
  const outputH = nodes.heightInput.value;

  if (!outputH && !outputW) {
    toast.createToast('error', "Please insert \"width\" or \"height\". ");
    return;
  }
  if (outputH && outputW) {
    toast.createToast('error', "Please fill only one of \"width\" or \"height\". Not both! ");
    return;
  }

  // form data is valid. Submit ...
  const isSuccess = await _exposedAPI.resizeImage({
    inputFilePath: selectedFile.path,
    inputW: inputImageSizes.w,
    inputH: inputImageSizes.h,
    outputW: nodes.widthInput.value,
    outputH: nodes.heightInput.value,
  });

  if (isSuccess) toast.createToast('success', "Successfully created!");
  else toast.createToast('error', "Error!");
});
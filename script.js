let state = {
    stream: null,
    blob: null,
    reference: {
        red: 255,
        green: 255,
        blue: 255,
    }
}

async function blobCenterPixel(blob) {
    const bitmap = await createImageBitmap(blob)
    const centerX = Math.floor(bitmap.width / 2)
    const centerY = Math.floor(bitmap.height / 2)

    const canvas = new OffscreenCanvas(1, 1)
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, centerX, centerY, 1, 1, 0, 0, 1, 1)
    bitmap.close()

    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return {red, green, blue}
}

async function updateState() {
    if (!state.stream) {
        return
    }

    const track = state.stream.getVideoTracks()[0]
    const capture = new ImageCapture(track)
    state.blob = await capture.takePhoto()
}

async function setCurrentAsReference() {
    if (!state.blob) {
        return
    }
    state.reference = await blobCenterPixel(state.blob)
}


async function updateUi() {
    if (!state.blob) {
        return
    }
    document.querySelector('#preview').src = URL.createObjectURL(state.blob)

    if (!state.reference) {
        return
    }

    const currentValues = await blobCenterPixel(state.blob)
    const updateListItem =async  (color) => {
        const container = document.querySelector('[data-color="' + color + '"]')
        const referenceValue = state.reference[color]
        const currentValue = currentValues[color]

        const delta = currentValue - referenceValue

        container.querySelector('.delta').innerText = delta
        container.querySelector('.values').innerText = currentValue + ' / ' + referenceValue
    }
    await updateListItem('red')
    await updateListItem('green')
    await updateListItem('blue')


}


async function init() {
    state.stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
    document.querySelector('#set-reference').addEventListener('click', () => setCurrentAsReference())

    const loop = async () => {
        await updateState()
        await updateUi()
    }
    loop()
    setInterval(loop, 1000)
}

init()


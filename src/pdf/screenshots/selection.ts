import { toCanvas as htmlToCanvas } from 'html-to-image'

export interface PdfScreenshot {
    pageNumber: number
    position: [number, number]
    dimensions: [number, number]
    screenshot: HTMLCanvasElement
}

export async function promptPdfScreenshot() {
    const rectangleEl = document.createElement('div')
    rectangleEl.style.position = 'absolute'
    rectangleEl.style.left = '0'
    rectangleEl.style.top = '0'
    rectangleEl.style.width = '50px'
    rectangleEl.style.height = '50px'
    rectangleEl.style.border = '1px solid #888'

    const messageEl = document.createElement('div')
    messageEl.style.position = 'absolute'
    messageEl.style.left = '50%'
    messageEl.style.top = '50%'
    messageEl.style.transform = 'translate(-50%, -50%)'
    messageEl.style.border = '3px solid #000'
    messageEl.style.background = '#CCC'
    messageEl.style.padding = '20px'
    messageEl.style.userSelect = 'none'
    messageEl.appendChild(document.createTextNode('Draw a rectangle'))

    const overlayEl = document.createElement('div')
    overlayEl.style.position = 'fixed'
    overlayEl.style.left = '0'
    overlayEl.style.top = '0'
    overlayEl.style.width = '100%'
    overlayEl.style.height = '100%'
    overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
    overlayEl.appendChild(rectangleEl)
    overlayEl.appendChild(messageEl)

    const viewerEl = document.getElementById('viewer')
    viewerEl.appendChild(overlayEl)

    function range(size: number, startAt = 0) {
        return [...Array(size).keys()].map((i) => i + startAt)
    }
    function isPointInClientRect(rect: DOMRect, x: number, y: number): boolean {
        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        )
    }
    function cropCanvas(
        originalCanvas: HTMLCanvasElement,
        position: Vec2,
        dimensions: Vec2,
    ): HTMLCanvasElement {
        // Create a new canvas element to hold the cropped image
        const croppedCanvas = document.createElement('canvas')
        const ctx = croppedCanvas.getContext('2d')

        // Set the dimensions of the new canvas to match the cropped area
        croppedCanvas.width = dimensions[0]
        croppedCanvas.height = dimensions[1]

        // Use the drawImage method to copy the cropped region from the original canvas to the new canvas
        if (ctx) {
            ctx.drawImage(
                originalCanvas,
                position[0],
                position[1],
                dimensions[0],
                dimensions[1],
                0,
                0,
                dimensions[0],
                dimensions[1],
            )
        } else {
            throw new Error('Could not get 2D context for canvas.')
        }

        return croppedCanvas
    }

    type Vec2 = [number, number]
    const translateRect = async (
        absolutePos: Vec2,
        dimensions: Vec2,
    ): Promise<PdfScreenshot | null> => {
        const pdfApplication = (globalThis as any)['PDFViewerApplication']
        const activePageNumber = pdfApplication.page as number
        const pageNumbers = [activePageNumber]
        for (const distance of range(10, 1)) {
            pageNumbers.push(activePageNumber + distance)

            const min = activePageNumber - distance
            if (min > 0) {
                pageNumbers.push(min)
            }
        }

        for (const pageNumber of pageNumbers) {
            const pageEl = viewerEl.querySelector(
                `.page[data-page-number='${pageNumber}']`,
            ) as HTMLDivElement
            if (!pageEl) {
                return null
            }
            const boundingRect = pageEl.getBoundingClientRect()
            if (
                !isPointInClientRect(
                    boundingRect,
                    absolutePos[0],
                    absolutePos[1],
                )
            ) {
                continue
            }
            const position: Vec2 = [
                absolutePos[0] - boundingRect.left,
                absolutePos[1] - boundingRect.top,
            ]

            const pageElCanvas = await htmlToCanvas(pageEl)
            const cropped = cropCanvas(pageElCanvas, position, dimensions)
            ;(window as any)['out'] = cropped.toDataURL()

            const result: PdfScreenshot = {
                pageNumber,
                position,
                dimensions,
                screenshot: cropped,
            }
            return result
        }

        return null
    }

    let initPosition: Vec2 = [0, 0]
    let rectPosition: Vec2 = [0, 0]
    let rectDimensions: Vec2 = [0, 0]
    const moveHandler = (event: MouseEvent) => {
        const currentPosition = [event.clientX, event.clientY]
        const dimensions: Vec2 = [
            currentPosition[0] - initPosition[0],
            currentPosition[1] - initPosition[1],
        ]
        rectPosition = [
            dimensions[0] >= 0 ? initPosition[0] : currentPosition[0],
            dimensions[1] >= 0 ? initPosition[1] : currentPosition[1],
        ]
        rectDimensions = [Math.abs(dimensions[0]), Math.abs(dimensions[1])]
        rectangleEl.style.left = `${rectPosition[0]}px`
        rectangleEl.style.top = `${rectPosition[1]}px`
        rectangleEl.style.width = `${rectDimensions[0]}px`
        rectangleEl.style.height = `${rectDimensions[1]}px`
    }
    overlayEl.addEventListener('mousedown', (event) => {
        initPosition = [event.clientX, event.clientY]
        messageEl.remove()
        overlayEl.addEventListener('mousemove', moveHandler)
    })
    let messageIsCentered = true
    messageEl.addEventListener('mouseenter', () => {
        if (messageIsCentered) {
            messageEl.style.top = '20%'
        } else {
            messageEl.style.top = '50%'
        }
        messageIsCentered = !messageIsCentered
    })
    return new Promise<PdfScreenshot>((resolve) => {
        overlayEl.addEventListener('mouseup', () => {
            const result = translateRect(rectPosition, rectDimensions)
            // console.log(result)
            overlayEl.remove()
            resolve(result)
        })
    })
}

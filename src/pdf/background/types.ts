export interface PDFRemoteInterface {
    refreshSetting(): Promise<void>
    openPdfViewerForNextPdf(): Promise<void>
    doNotOpenPdfViewerForNextPdf(): Promise<void>
    getTempPdfAccessUrl(uploadId: string): Promise<string>
}

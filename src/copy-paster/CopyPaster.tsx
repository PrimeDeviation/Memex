import React from 'react'
import analytics from 'src/analytics'
import type { Template } from './types'
import CopyPaster from './components/CopyPaster'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import * as Raven from 'src/util/raven'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import MarkdownIt from 'markdown-it'
import type { TaskState } from 'ui-logic-core/lib/types'
import {
    defaultOrderableSorter,
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'

interface State {
    isLoading: boolean
    copySuccess: boolean
    templates: Template[]
    tmpTemplate: Template | undefined
    isNew: boolean
    previewString: string
    templateType: 'originalPage' | 'examplePage'
    isPreviewLoading: TaskState
}

const md = new MarkdownIt()
export interface Props {
    initTemplates?: Template[]
    onClickOutside: React.MouseEventHandler
    renderTemplate: (id: number) => Promise<string>
    renderPreview: (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => Promise<string>
    copyPaster?: RemoteCopyPasterInterface
    preventClosingBcEditState?: (state) => void
    getRootElement: () => HTMLElement
}

export default class CopyPasterContainer extends React.PureComponent<
    Props,
    State
> {
    static DEF_TEMPLATE: Template = {
        id: -1,
        title: '',
        code: '',
        order: 1,
        isFavourite: false,
        outputFormat: 'rich-text',
    }

    private copyPasterBG: RemoteCopyPasterInterface

    constructor(props: Props) {
        super(props)
        this.copyPasterBG = props.copyPaster
    }

    state: State = {
        isLoading: false,
        tmpTemplate: undefined,
        templates: this.props.initTemplates ?? [],
        isNew: undefined,
        copySuccess: false,
        previewString: '',
        templateType: 'originalPage',
        isPreviewLoading: 'pristine',
    }

    async componentDidMount() {
        await this.syncTemplates()
        this.setState({ isNew: undefined })
    }

    private async syncTemplates() {
        this.setState({ isLoading: true })
        const templates = await this.copyPasterBG.findAllTemplates()
        const sortedTemplates = templates.sort(defaultOrderableSorter)
        this.setState({ templates: sortedTemplates, isLoading: false })
    }

    private findTemplateForId(id: number): Template {
        const template = this.state.templates.find((t) => t.id === id)

        if (!template) {
            // TODO: error UI state
            throw new Error(`Can't find template for ${id}`)
        }

        return template
    }

    private handleTemplateDelete = async () => {
        // NOTE: delete btn only appears in edit view, hence `state.tmpTemplate.id`
        //  will be set to the template currently being edited
        await this.copyPasterBG.deleteTemplate({
            id: this.state.tmpTemplate.id,
        })
        this.setState({ tmpTemplate: undefined })
        await this.syncTemplates()
    }

    async copyRichTextToClipboard(html: string) {
        // Create a hidden content-editable div
        const hiddenDiv = document.createElement('div')

        hiddenDiv.contentEditable = 'true'
        hiddenDiv.style.position = 'absolute'
        hiddenDiv.style.left = '-9999px'
        hiddenDiv.innerHTML = html

        // Append the hidden div to the body
        document.body.appendChild(hiddenDiv)

        // Select the content of the hidden div
        const range = document.createRange()
        range.selectNodeContents(hiddenDiv)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)

        // Copy the selected content to the clipboard
        document.execCommand('copy')

        // Remove the hidden div from the body
        document.body.removeChild(hiddenDiv)
    }

    private handleTemplateCopy = async (id: number) => {
        this.setState({ isLoading: true })

        try {
            const rendered = await this.props.renderTemplate(id)
            const item = this.state.templates.find((item) => item.id === id)

            if (item) {
                if (
                    item.outputFormat === 'markdown' ||
                    item.outputFormat == null
                ) {
                    await copyToClipboard(rendered)
                }
                if (item.outputFormat === 'rich-text') {
                    const htmlString = md.render(rendered)
                    await this.copyRichTextToClipboard(htmlString)
                }
            }
        } catch (err) {
            console.error('Something went really bad copying:', err.message)
            Raven.captureException(err)
        } finally {
            analytics.trackEvent({
                category: 'TextExporter',
                action: 'copyToClipboard',
            })
            this.setState({ isLoading: false, copySuccess: true })
            setTimeout(() => this.setState({ copySuccess: false }), 3000)
        }
    }

    private handleTemplatePreview = async (
        template: Template,
        templateTypeInput?: 'originalPage' | 'examplePage',
        exportMode?: 'markdown' | 'rich-text',
    ) => {
        let templateType = this.state.templateType
        if (templateTypeInput != null) {
            templateType = templateTypeInput
        }

        if (templateType === 'originalPage') {
            this.setState({ isPreviewLoading: 'running' })
        }
        try {
            const rendered = await this.props.renderPreview(
                template,
                templateType,
            )

            if (this.state.templateType === 'originalPage') {
                this.setState({ isPreviewLoading: 'success' })
            }

            const outputFormat = exportMode ?? template.outputFormat

            if (outputFormat === 'markdown') {
                return rendered
            } else if (outputFormat === 'rich-text') {
                const htmlString = md.render(rendered)
                return htmlString
            }
        } catch (err) {
            console.error(
                'Something did not work when updating the preview:',
                err.message,
            )
            Raven.captureException(err)
        }
    }

    private handleTemplateReorder = async (
        id: number,
        oldIndex: number,
        newIndex: number,
    ) => {
        const templateToReorder = { ...this.findTemplateForId(id) }

        const orderedItems = this.state.templates.map((template) => ({
            id: template.id,
            key: template.order,
        }))
        // Moving an item "forwards" requires a +1 offset due to the algo inserting _before_ an index (see usage)
        const indexOffset = oldIndex < newIndex ? 1 : 0
        const changes =
            newIndex + 1 === orderedItems.length
                ? pushOrderedItem(orderedItems, id)
                : insertOrderedItemBeforeIndex(
                      orderedItems,
                      id,
                      newIndex + indexOffset,
                  )
        templateToReorder.order = changes.create.key

        this.setState({
            tmpTemplate: undefined,
            isNew: undefined,
            templates: [
                ...this.state.templates
                    .map((t) => (t.id === id ? templateToReorder : t))
                    .sort(defaultOrderableSorter),
            ],
        })

        await this.copyPasterBG.updateTemplate(templateToReorder)
        this.props.preventClosingBcEditState(false)
    }

    private handleTemplateSave = async () => {
        const { tmpTemplate } = this.state

        if (tmpTemplate.id === -1) {
            // TODO: Choose order for new one
            await this.copyPasterBG.createTemplate(tmpTemplate)
        } else {
            await this.copyPasterBG.updateTemplate(tmpTemplate)
        }
        this.setState({ tmpTemplate: undefined, isNew: undefined })
        this.props.preventClosingBcEditState(false)
        await this.syncTemplates()
    }

    render() {
        return (
            <CopyPaster
                isNew={this.state.isNew}
                templates={this.state.templates}
                isLoading={this.state.isLoading}
                isPreviewLoading={this.state.isPreviewLoading}
                templateType={this.state.templateType}
                copySuccess={this.state.copySuccess}
                onClickCopy={this.handleTemplateCopy}
                onClickSave={this.handleTemplateSave}
                onReorder={this.handleTemplateReorder}
                onClickDelete={this.handleTemplateDelete}
                onClickOutside={this.props.onClickOutside}
                previewString={this.state.previewString}
                copyPasterEditingTemplate={this.state.tmpTemplate}
                onClickEdit={async (id) => {
                    const template = this.findTemplateForId(id)
                    let previewString = await this.handleTemplatePreview(
                        template,
                    )

                    this.setState({
                        tmpTemplate: template,
                        isNew: false,
                        previewString: previewString,
                    })
                    this.props.preventClosingBcEditState(true)
                }}
                onClickCancel={() => {
                    this.setState({
                        tmpTemplate: undefined,
                        isNew: undefined,
                    })
                    this.props.preventClosingBcEditState(false)
                }}
                onClickNew={() => {
                    this.setState({
                        tmpTemplate: CopyPasterContainer.DEF_TEMPLATE,
                        isNew: true,
                    })
                    this.props.preventClosingBcEditState(true)
                }}
                onClickHowto={() => {
                    window.open(
                        'https://links.memex.garden/tutorials/text-exporter',
                    )
                }}
                onTitleChange={(title) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            title,
                        },
                    }))
                }}
                onOutputFormatChange={async (outputFormat) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            outputFormat,
                        },
                    }))
                    const previewString = await this.handleTemplatePreview(
                        this.state.tmpTemplate,
                        null,
                        outputFormat,
                    )
                    this.setState({
                        previewString: previewString,
                    })
                }}
                onCodeChange={async (code) => {
                    let templates = this.state.templates

                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            code,
                        },
                    }))

                    templates = templates.map((template) =>
                        template.id === this.state.tmpTemplate.id
                            ? this.state.tmpTemplate
                            : template,
                    )

                    this.setState({
                        templates: templates,
                    })

                    let currentTemplate = this.state.tmpTemplate

                    currentTemplate.code = code

                    const previewString = await this.handleTemplatePreview(
                        currentTemplate,
                    )

                    this.setState({ previewString: previewString })
                }}
                changeTemplateType={async (
                    templateType: 'originalPage' | 'examplePage',
                ) => {
                    this.setState({ templateType: templateType })
                    const previewString = await this.handleTemplatePreview(
                        this.state.tmpTemplate,
                        templateType,
                    )

                    this.setState({ previewString: previewString })
                }}
                getRootElement={this.props.getRootElement}
            />
        )
    }
}

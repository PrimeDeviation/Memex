import React from 'react'
import onClickOutside from 'react-onclickoutside'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    SpacePickerDependencies,
    SpacePickerEvent,
    SpacePickerState,
    SpaceDisplayEntry,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from './components/SearchInput'
import AddNewEntry from './components/AddNewEntry'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryRow, { IconStyleWrapper } from './components/EntryRow'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { EntrySelectedList } from './components/EntrySelectedList'
import { ListResultItem } from './components/ListResultItem'
import {
    collections,
    contentSharing,
} from 'src/util/remote-functions-background'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import SpaceContextMenu from 'src/custom-lists/ui/space-context-menu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

class SpacePicker extends StatefulUIElement<
    SpacePickerDependencies,
    SpacePickerState,
    SpacePickerEvent
> {
    static defaultProps: Pick<
        SpacePickerDependencies,
        'createNewEntry' | 'spacesBG' | 'contentSharingBG'
    > = {
        spacesBG: collections,
        contentSharingBG: contentSharing,
        createNewEntry: async (name) =>
            collections.createCustomList({
                name,
            }),
    }

    private displayListRef = React.createRef<HTMLDivElement>()
    private contextMenuRef = React.createRef<SpaceContextMenu>()
    private contextMenuBtnRef = React.createRef<HTMLDivElement>()

    constructor(props: SpacePickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    private get shouldShowAddNewEntry(): boolean {
        if (this.props.filterMode) {
            return false
        }

        const otherLists = (this.logic as ListPickerLogic).defaultEntries.map(
            (e) => ({
                id: e.localId,
                name: e.name,
            }),
        )

        return validateSpaceName(this.state.newEntryName, otherLists).valid
    }

    private get selectedDisplayEntries(): Array<{
        localId: number
        name: string
    }> {
        return this.state.selectedListIds
            .map((entryId) =>
                this.state.displayEntries.find(
                    (entry) => entry.localId === entryId,
                ),
            )
            .filter((entry) => entry != null)
    }

    handleClickOutside = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    handleSelectedListPress = (list: number) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: SpaceDisplayEntry) => {
        this.displayListRef.current.scrollTo(0, 0)
        this.processEvent('resultEntryPress', { entry: list })
    }

    handleResultListAllPress = (list: SpaceDisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: list })

    handleNewListAllPress: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })
    }

    handleResultListFocus = (list: SpaceDisplayEntry, index?: number) => {
        this.processEvent('resultEntryFocus', { entry: list, index })

        const el = document.getElementById(`ListKeyName-${list.localId}`)
        if (el != null) {
            el.scrollTop = el.offsetTop
        }
    }

    handleNewListPress = () => {
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })
    }

    handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.handleClickOutside(event.key)
        }
        this.processEvent('keyPress', { event })
    }

    renderListRow = (entry: SpaceDisplayEntry, index: number) => (
        <EntryRowContainer key={entry.localId}>
            <EntryRow
                createdAt={entry.createdAt}
                onPress={this.handleResultListPress}
                onPressActOnAll={
                    this.props.actOnAllTabs
                        ? (t) =>
                              this.handleResultListAllPress(
                                  t as SpaceDisplayEntry,
                              )
                        : undefined
                }
                onFocus={this.handleResultListFocus}
                key={`ListKeyName-${entry.localId}`}
                id={`ListKeyName-${entry.localId}`}
                index={index}
                name={entry.name}
                selected={this.state.selectedListIds.includes(entry.localId)}
                localId={entry.localId}
                focused={entry.focused}
                remoteId={entry.remoteId}
                resultItem={<ListResultItem>{entry.name}</ListResultItem>}
                removeTooltipText={
                    this.props.removeTooltipText ?? 'Remove from Space'
                }
                contextMenuBtnRef={this.contextMenuBtnRef}
                onContextMenuBtnPress={this.handleSpaceContextMenuOpen(
                    entry.localId,
                )}
                actOnAllTooltipText="Add all tabs in window to Space"
            />
        </EntryRowContainer>
    )

    renderNewListAllTabsButton = () =>
        this.props.actOnAllTabs && (
            <IconStyleWrapper show>
                <TooltipBox
                    tooltipText="Add all tabs in window to Space"
                    placement="left"
                >
                    <Icon
                        filePath={icons.multiEdit}
                        heightAndWidth="20px"
                        onClick={this.handleNewListAllPress}
                    />
                </TooltipBox>
            </IconStyleWrapper>
        )

    renderEmptyList() {
        if (this.state.newEntryName.length > 0 && !this.props.filterMode) {
            return (
                <EmptyListsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>No Space found</SectionTitle>
                </EmptyListsView>
            )
        }

        if (
            this.state.query.length > 0 &&
            this.state.displayEntries.length === 0
        ) {
            return (
                <EmptyListsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>No Space found</SectionTitle>
                </EmptyListsView>
            )
        }

        if (this.state.query === '') {
            return (
                <EmptyListsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>Create your first Space</SectionTitle>
                    <InfoText>
                        {this.props.filterMode
                            ? 'to use as a search filter'
                            : 'by typing into the search field'}
                    </InfoText>
                </EmptyListsView>
            )
        }
    }

    private handleSpaceContextMenuOpen = (listId: number) => async (
        entry: SpaceDisplayEntry,
    ) => {
        const rect = this.contextMenuBtnRef?.current?.getBoundingClientRect()

        // Popup
        if (window.outerWidth < 500) {
            await this.processEvent('updateContextMenuPosition', {
                x: undefined,
                y: undefined,
            })
        } else {
            // right side of screen
            if (window.outerWidth - rect.right < 400) {
                await this.processEvent('updateContextMenuPosition', {
                    x: outerWidth - rect.left,
                })
                //lower side

                if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                    await this.processEvent('updateContextMenuPosition', {
                        y: outerHeight - rect.bottom - 50,
                    })
                }
                // upper side
                else {
                    await this.processEvent('updateContextMenuPosition', {
                        y: outerHeight - rect.bottom + 100,
                    })
                }
            }

            // left side of screen

            if (window.outerWidth - rect.right > window.outerWidth / 2) {
                await this.processEvent('updateContextMenuPosition', {
                    x: outerWidth - rect.right - 320,
                })

                // lower side

                if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                    await this.processEvent('updateContextMenuPosition', {
                        y: outerHeight - rect.bottom + 40,
                    })
                }
                // upper side
                else {
                    await this.processEvent('updateContextMenuPosition', {
                        y: outerHeight - rect.top + 110,
                    })
                }
            }
        }
        await this.processEvent('toggleEntryContextMenu', { listId })
    }

    private handleSpaceContextMenuClose = (listId: number) => async (
        shouldSaveName: boolean,
    ) => {
        if (shouldSaveName) {
            const name = this.contextMenuRef?.current?.state.nameValue
            if (name != null) {
                await this.processEvent('renameList', {
                    listId,
                    name,
                })
            }
        }
        await this.processEvent('toggleEntryContextMenu', { listId })
    }

    private renderSpaceContextMenu = () => {
        if (this.state.contextMenuListId == null) {
            return
        }

        const list = this.state.displayEntries.find(
            (l) => l.localId === this.state.contextMenuListId,
        )
        if (list == null) {
            return
        }

        return (
            <SpaceContextMenu
                loadOwnershipData
                spaceName={list.name}
                ref={this.contextMenuRef}
                localListId={this.state.contextMenuListId}
                xPosition={this.state.contextMenuPositionX}
                yPosition={this.state.contextMenuPositionY}
                contentSharingBG={this.props.contentSharingBG}
                spacesBG={this.props.spacesBG}
                onDeleteSpaceConfirm={() =>
                    this.processEvent('deleteList', {
                        listId: list.localId,
                    })
                }
                editableProps={{
                    onConfirmClick: async (name) => {
                        await this.processEvent('renameList', {
                            listId: list.localId,
                            name,
                        })
                        await this.processEvent('toggleEntryContextMenu', {
                            listId: list.localId,
                        })
                    },
                    onCancelClick: this.handleSpaceContextMenuClose(
                        list.localId,
                    ),
                    errorMessage: this.state.renameListErrorMessage,
                }}
                onSpaceShare={(remoteListId) =>
                    this.processEvent('setListRemoteId', {
                        localListId: list.localId,
                        remoteListId,
                    })
                }
                onClose={this.handleSpaceContextMenuClose(list.localId)}
                remoteListId={list.remoteId}
            />
        )
    }

    renderMainContent() {
        if (this.state.loadingSuggestions === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator size={30} />
                </LoadingBox>
            )
        }

        return (
            <>
                {this.state.contextMenuListId ? (
                    this.renderSpaceContextMenu()
                ) : (
                    <PickerContainer>
                        <PickerSearchInput
                            searchInputPlaceholder={
                                this.props.searchInputPlaceholder ??
                                'Search & Add Spaces'
                            }
                            showPlaceholder={
                                this.state.selectedListIds.length === 0
                            }
                            searchInputRef={this.handleSetSearchInputRef}
                            onChange={this.handleSearchInputChanged}
                            onKeyPress={this.handleKeyPress}
                            value={this.state.query}
                            loading={
                                this.state.loadingQueryResults === 'running'
                            }
                            before={
                                <EntrySelectedList
                                    entries={this.selectedDisplayEntries}
                                    onPress={this.handleSelectedListPress}
                                />
                            }
                        />
                        <EntryList ref={this.displayListRef}>
                            {!(
                                (this.state.query === '' &&
                                    !this.state.displayEntries.length) ||
                                this.state.query.length > 0
                            ) && (
                                <EntryListHeader>Recently used</EntryListHeader>
                            )}
                            {!this.state.displayEntries.length
                                ? this.renderEmptyList()
                                : this.state.displayEntries.map(
                                      this.renderListRow,
                                  )}
                        </EntryList>
                        {this.shouldShowAddNewEntry && (
                            <AddNewEntry
                                resultItem={this.state.newEntryName}
                                onPress={this.handleNewListPress}
                            />
                        )}
                    </PickerContainer>
                )}
            </>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    {this.renderMainContent()}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const EntryListHeader = styled.div`
    padding: 5px 5px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.darkText};
    font-weight: 400;
    margin-bottom: -2px;
`

const EntryList = styled.div`
    position: relative;
    overflow-y: auto;
    max-height: 280px;
    padding-bottom: 5px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.darkhover};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: bold;
    margin-top: 10px;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    width: 100%;
`

const OuterSearchBox = styled.div`
    border-radius: 12px;
    width: 300px;
`
const PickerContainer = styled.div`
    border-radius: 12px;
    width: fill-available;
    padding: 15px;
`

const EmptyListsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

const EntryRowContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 2px;
    border-radius: 6px;
`

const SpaceContextMenuBtn = styled.div`
    border-radius: 3px;
    padding: 2px;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

export default onClickOutside(SpacePicker)

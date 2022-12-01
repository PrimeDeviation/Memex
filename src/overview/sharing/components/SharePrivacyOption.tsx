import React from 'react'
import styled, { css } from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import colors from 'src/dashboard-refactor/colors'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

export interface Props {
    icon: IconKeys
    title: string
    shortcut?: string
    description: string
    isSelected?: boolean
    hasProtectedOption?: boolean
    onClick: (isProtected?: boolean) => void
}

interface State {
    isHovered: boolean
}

class SharePrivacyOption extends React.PureComponent<Props, State> {
    state: State = { isHovered: false }

    private setHoverState = (isHovered: boolean) => () =>
        this.setState({ isHovered })

    private handleProtectedClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onClick(true)
    }

    private get protectedModeShortcut(): string {
        const [modKey, altKey] = [
            getKeyName({ key: 'mod' }),
            getKeyName({ key: 'alt' }),
        ]
        return `(${this.props.shortcut.replace(modKey, altKey)})`
    }

    render() {
        return (
            <PrivacyOptionItem
                onClick={() => this.props.onClick(false)}
                isSelected={this.props.isSelected}
                onMouseEnter={this.setHoverState(true)}
                onMouseLeave={this.setHoverState(false)}
            >
                <Icon
                    heightAndWidth="20px"
                    icon={this.props.icon}
                    hoverOff
                    color={this.props.isSelected ? 'purple' : null}
                />
                <PrivacyOptionBox>
                    <PrivacyOptionTitleBox>
                        <PrivacyOptionTitle>
                            {this.props.title}
                        </PrivacyOptionTitle>
                        <PrivacyOptionShortcut>
                            {this.props.shortcut}
                        </PrivacyOptionShortcut>
                    </PrivacyOptionTitleBox>
                    <PrivacyOptionSubTitle>
                        {this.props.description}
                    </PrivacyOptionSubTitle>
                </PrivacyOptionBox>
                {this.props.isSelected && (
                    <Icon
                        heightAndWidth="18px"
                        filePath={icons.check}
                        color={'purple'}
                        hoverOff
                    />
                )}
            </PrivacyOptionItem>
        )
    }
}

export default SharePrivacyOption

const PrivacyOptionItem = styled(Margin)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    cursor: pointer;
    padding: 10px 10px;
    width: fill-available;
    grid-gap: 10px;
    border-radius: 12px;
    margin-bottom: 2px;

    ${(props) =>
        props.isSelected &&
        css`
            outline: none;
            background-color: ${(props) => props.theme.colors.darkhover};
        `}

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
    }

    &:last-child {
        margin-bottom: 0px;
    }

    &:first-child {
        margin-top: 0px;
    }
`

const PrivacyOptionBox = styled.div`
    flex: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    width: 200px;
    grid-gap: 5px;
`

const PrivacyOptionTitleBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    height: 16px;
    grid-gap: 8px;
`

const PrivacyOptionTitle = styled.div`
    font-size: 12px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.normalText};
`

const PrivacyOptionShortcut = styled.div`
    font-size: 10px;
    font-weight: 400;
    padding: 2px 4px;
    color: ${(props) => props.theme.colors.normalText};
    border: 1px solid ${(props) => props.theme.colors.greyScale9};
    border-radius: 4px;
`

const PrivacyOptionSubTitle = styled.div`
    font-size: 12px;
    font-weight: 400;
    white-space: nowrap;
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${(props) => props.theme.colors.darkText};
`

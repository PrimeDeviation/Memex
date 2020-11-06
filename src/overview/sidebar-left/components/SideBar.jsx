import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import menuStyles from './menu-styles'
import localStyles from './Sidebar.css'
import cx from 'classnames'

class Sidebar extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        isSidebarLocked: PropTypes.bool.isRequired,
        captureStateChange: PropTypes.func.isRequired,
        onMouseLeave: PropTypes.func.isRequired,
        onMouseEnter: PropTypes.func.isRequired,
        closeSidebar: PropTypes.func.isRequired,
        setSidebarLocked: PropTypes.func.isRequired,
        openSidebaronMouseEnter: PropTypes.func.isRequired,
    }

    closeLockedSidebar = () => {
        this.props.setSidebarLocked(false)
        this.props.closeSidebar()
    }

    render() {
        return (
            <div
                onMouseLeave={this.props.onMouseLeave}
                onMouseEnter={this.props.onMouseEnter}
            >
                <div
                    className={localStyles.triggerDiv}
                    onMouseEnter={this.props.openSidebaronMouseEnter}
                    onDragEnter={this.props.openSidebaronMouseEnter}
                />
                <Menu
                    styles={menuStyles(
                        this.props.isSidebarLocked,
                        this.props.isSidebarOpen,
                    )}
                    noOverlay
                    isOpen
                    onStateChange={this.props.captureStateChange}
                >
                    <div
                        className={cx(localStyles.sidebar, {
                            [localStyles.sidebarExpanded]:
                                this.props.isSidebarOpen ||
                                this.props.isSidebarLocked,
                            [localStyles.sidebarLocked]: this.props
                                .isSidebarLocked,
                        })}
                    >
                        <div
                            className={cx(localStyles.container, {
                                [localStyles.containerLocked]: this.props
                                    .isSidebarLocked,
                            })}
                        >
                            {(this.props.isSidebarOpen ||
                                this.props.isSidebarLocked) &&
                                this.props.children}
                        </div>
                    </div>
                </Menu>
            </div>
        )
    }
}

export default Sidebar

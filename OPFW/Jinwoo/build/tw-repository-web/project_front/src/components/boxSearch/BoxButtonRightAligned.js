'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class BoxButtonRightAligned extends React.Component {
    static propTypes = {
        clickHandler: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        }
    }

    componentDidMount() {

    }

    handleClick = () => {
        this.props.clickHandler();
    }

    render() {
        return (
            <div className="col-xs-12">
                <div className="box box-success">
                    <div className="box-footer">
                        <div className="btn-group pull-right">
                            <button type="button" className="btn btn-outline-primary" id="right-aligned-button"
                                    onClick={this.handleClick}> {this.props.title}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
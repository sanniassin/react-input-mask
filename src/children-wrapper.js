import React from "react";

export default class InputMaskChildrenWrapper extends React.Component {
  render() {
    // eslint-disable-next-line react/prop-types
    const { children, ...props } = this.props;
    return React.cloneElement(children, props);
  }
}

import invariant from "invariant";
import warning from "warning";

import { CONTROLLED_PROPS } from "./constants";

export function validateMaxLength(props, maskOptions) {
  warning(
    // parse mask to test against actual mask prop as this.maskOptions
    // will be updated later in componentDidUpdate
    !props.maxLength || !maskOptions.mask,
    "react-input-mask: maxLength property shouldn't be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length."
  );
}

export function validateChildren(props, inputElement) {
  const conflictProps = CONTROLLED_PROPS.filter(
    propId =>
      inputElement.props[propId] != null &&
      inputElement.props[propId] !== props[propId]
  );

  invariant(
    !conflictProps.length,
    `react-input-mask: the following props should be passed to the react-input-mask's component and should not be altered in children's function: ${conflictProps.join(
      ", "
    )}`
  );
}

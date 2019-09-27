import invariant from "invariant";
import warning from "warning";

import { CONTROLLED_PROPS } from "./constants";

export function validateMaxLength(props) {
  warning(
    !props.maxLength || !props.mask,
    "react-input-mask: maxLength property shouldn't be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length."
  );
}

export function validateMaskPlaceholder(props) {
  const { mask, maskPlaceholder } = props;

  invariant(
    !mask ||
      !maskPlaceholder ||
      maskPlaceholder.length === 1 ||
      maskPlaceholder.length === mask.length,
    "react-input-mask: maskPlaceholder should either be a single character or have the same length as the mask:\n" +
      `mask: ${mask}\n` +
      `maskPlaceholder: ${maskPlaceholder}`
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
    `react-input-mask: the following props should be passed to the InputMask component, not to children: ${conflictProps.join(
      ","
    )}`
  );
}

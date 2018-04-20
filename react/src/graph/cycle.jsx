import React from 'react';
import RAudioNode from './../base/audio-node.jsx';
import RComponent from './../base/component.jsx';

import { isConnectable } from './utils.jsx';

/**
 * A RComponent which connects each child to itself as well as the destination
 *
 * @class      RCycle (name)
 */
export default class RCycle extends RComponent {
  constructor(props) {
    super(props);
    this.inputs = [];
  }

  componentWillMount() {
    super.componentWillMount();
    this.context.nodes.set(this.props.identifier, this.inputs);
  }

  componentWillUpdate(nextProps, nextState) {
    // update the node's record in the node registry
    if (this.props.identifier !== nextProps.identifier) {
      this.context.nodes.delete(this.props.identifier);
      this.context.nodes.set(nextProps.identifier, this.inputs);
    }
  }

  render() {
    while(this.inputs.length) this.inputs.pop();

    const children = React.Children
      .toArray(this.props.children)
      .map(c => ({ component: c,  identifier: Symbol(c.type.name + Date.now()) }))
      .map((childTuple, childIndex, childrenArray) => {
        const type = childTuple.component.type;
        if (RComponent.isPrototypeOf(childTuple.component.type) && isConnectable(childTuple.component)) {
          this.inputs.push(childTuple.identifier);
        }

        const pipelineProps = {
          destination: () => {
            let destination = this.props.destination();

            const ownNode = this.context.nodes.get(childTuple.identifier);
            if (!(destination instanceof Array)) destination = [ destination ];

            return destination.concat([ ownNode ])
          },
          identifier: childTuple.identifier
        };

        return React.cloneElement(childTuple.component, pipelineProps);
      });

    if (!this.inputs.length) {
      const destination = this.props.destination();
      if (destination instanceof Array) this.inputs.push(...destination);
      else this.inputs.push(destination);
    }

    if (this.context.debug) {
      return (
        <li>
          <strong>RCycle</strong>
          <ul>
          {children}
          </ul>
        </li>
      )
    }

    return children;
  }
}

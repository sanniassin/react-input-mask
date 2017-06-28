import React from 'react';
import ReactDOM from 'react-dom';
import InputMask from '../src';

class Input extends React.Component {
  state = {
    value: ''
  }

  onChange = (event) => {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    return <InputMask mask="**99-9999-9999" value={this.state.value} onChange={this.onChange} />;
  }
}

ReactDOM.render(<Input />, document.getElementById('root'));

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

var consoleDiv = document.getElementById('console');
var log = console.log;
console.log = (text, ...rest) => {
  log.apply(console, [text, ...rest]);
  consoleDiv.innerHTML = `${escapeHtml(text)}<br/>${consoleDiv.innerHTML}`;
};

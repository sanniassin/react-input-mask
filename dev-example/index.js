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

class CustomInput extends React.Component {
  getInputElement() {
    return this.inputEl;
  }
  render() {
    const { className, placeholder, ...props } = this.props;
    return (
      <label htmlFor="custom-input" className={className}>
        <input id="custom-input" type="text" {...props} ref={(el) => this.inputEl = el} />
        <span>{placeholder}</span>
      </label>
    );
  }
}

class CustomInputMask extends React.Component {
  state = {
    value: ''
  }

  onChange = (event) => {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    return <InputMask Component={CustomInput} mask="**99-9999-9999" value={this.state.value} onChange={this.onChange} placeholder="Custom Input" />;
  }
}

ReactDOM.render((
  <div>
    <div style={{ marginBottom: '16px' }}>
      <Input />
    </div>
    <div>
      <CustomInputMask />
    </div>
  </div>
), document.getElementById('root'));

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

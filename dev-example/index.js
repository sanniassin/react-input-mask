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

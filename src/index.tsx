import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import * as ReactModal from 'react-modal';

ReactDOM.render(<App />, document.getElementById("app"))
ReactModal.setAppElement(document.getElementById("app"));

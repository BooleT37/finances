import React from 'react';
import { observer } from 'mobx-react';
import './App.css';
import { Link } from 'react-router-dom';

const App = observer(function App() {
  return (
    <div className="App">
      <nav
        style={{
          borderBottom: "solid 1px",
          paddingBottom: "1rem",
        }}
      >
        <Link to="/data">Данные</Link> |{" "}
        <Link to="/stats">Статистика</Link>
      </nav>
    </div>
  );
})

export default App;

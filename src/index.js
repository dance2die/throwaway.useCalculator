import React from "react";
import ReactDOM from "react-dom";
import produce from "immer";

import "./styles.css";

const log = console.log;

// Command pattern to emulator calculator
function useCalculator(defaultValue = 0) {
  const [value, setValue] = React.useState(defaultValue);
  // Current command index
  const [commandIndex, setCommandIndex] = React.useState(0);
  const [history, setHistory] = React.useState([]);

  const buildCommand = (operator, operand) => {
    // prettier-ignore
    switch (operator) {
      // ⚠ Note: each command returns an `undo` command
      case '+': return () => { setValue(value + operand); return () => setValue(value - operand) };
      case '-': return () => { setValue(value - operand); return () => setValue(value + operand) };
      case '*': return () => { setValue(value * operand); return () => setValue(value / operand) };
      case '/': return () => { setValue(value / operand); return () => setValue(value * operand) };
      default: throw new Error(`Operator ${operator} is not supported`);
    }
  };

  function operate(operator, operand) {
    log(
      `executing ${value} ${operator} ${operand} & history count => ${
        history.length
      }`
    );
    const command = buildCommand(operator, operand);
    // execute and get the undo command handle
    setHistory(
      produce(history, draft => {
        const undo = command();
        setCommandIndex(commandIndex + 1);
        draft.push({ run: command, undo });
      })
    );
  }

  function undo(count) {
    // I ain't using `forEach`, so sue me.
    for (let i = 0; i < count; i++) {
      if (commandIndex - i < 0) break;
      history[i].undo();
    }

    // It's not a good idea to update a state in a loop so do it in one shot at the end.
    setCommandIndex(Math.max(0, commandIndex - count));
  }

  function redo(count) {
    // I ain't using `forEach`, so sue me.
    for (let i = 0; i < count; i++) {
      if (i >= commandIndex) break;
      history[i].run();
    }

    // It's not a good idea to update a state in a loop so do it in one shot at the end.
    setCommandIndex(Math.max(commandIndex, count));
  }

  React.useEffect(() => log(`Current value = ${value}`));

  return { calculator: { operate, redo, undo }, value };
}

function App() {
  const { calculator, value } = useCalculator(100);
  const [operand, setOperand] = React.useState(5);

  const undo = e => {
    e.preventDefault();
    calculator.undo(1);
  };
  const redo = e => {
    e.preventDefault();
    calculator.redo(1);
  };

  const operate = (e, operator) => {
    e.preventDefault();
    log(`App.operate => ${value} ${operator} ${operand}`);
    calculator.operate(operator, parseInt(operand));
  };

  return (
    <div className="App">
      <header>
        <h1>Calculator Hook</h1>
      </header>
      <section>
        <h2>Current Value</h2>
        <p>{value}</p>
      </section>
      <section>
        <form>
          <input
            id="add"
            value={operand}
            onChange={e => setOperand(e.target.value)}
            type="number"
          />
          <section>
            <button onClick={e => operate(e, "+")}>➕ Add</button>
            <button onClick={e => operate(e, "-")}>➖ Subtract</button>
            <button onClick={e => operate(e, "*")}>❌ Multiply</button>
            <button onClick={e => operate(e, "/")}>➗ Divide</button>
          </section>
          <section>
            <button onClick={undo}>Undo Once</button>
            <button onClick={redo}>Redo Once</button>
          </section>
        </form>
      </section>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

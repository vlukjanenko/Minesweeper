import React from 'react';
import logo from './bomb.svg';
import './App.css';

function Square(props) {

    let clazz = "cell";
    let content = null;

    if (props.state.isOpen) {
        if (!props.state.isBomb) {
            clazz = clazz + " opened";
            content = props.state.value;
        } else {
            clazz = clazz + " explode";
        }
    }
    if (props.state.isFlag) {
        clazz = clazz + " flag";
    }

    return (
        <button
            onClick={props.onClick}
            onContextMenu={props.onContextMenu}
            className={clazz}>{content}</button>
    );
}

class Panel extends React.Component {

    intervalId = null;
    timer = 0;
    value = "0:00"

    incTimer() {
        this.timer++;
        let min = (Math.trunc(this.timer / 60)).toString();
        let sec = (this.timer % 60).toString();
        sec = sec.length === 1 ? "0" + sec : sec;
        this.value =  min + ":" + sec;
    }

    constructor(props) {
        super(props);
    }

    render() {
        if (this.intervalId == null && this.props.state.isBombClicked != null) {
            this.timer = 0;
            this.value = "0:00";
            this.intervalId = setInterval(() => {
                this.incTimer();
                this.setState({})}, 1000);
        }
        if (this.props.state.isBombClicked) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.intervalId != null && this.props.state.isBombClicked == null) {
            this.timer = 0;
            this.value = "0:00";
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        return (
            <div className="panel">
                <div>{this.props.state.bombCount - this.props.state.flagCount > 0 ?
                    this.props.state.bombCount - this.props.state.flagCount : 0}</div>
                <button className="reset" onClick={this.props.onClick} type="button">reset</button>
                <div>{this.value}</div>
            </div>
        )
    }
}

class Board extends React.Component {

    renderSquare(i) {
        return (<Square
            onClick={() => this.props.onClick(i)}
            onContextMenu={() => this.props.onContextMenu(i)}
            state={this.props.state.field[i]} key={i} />);
    }

    renderBoard() {
        let row = [];
        for(let i = 0; i < 72; i++){
            row.push(this.renderSquare(i));
        }
        return row;
    }

    render() {
        return (
            <div className="board">
                        {this.renderBoard()}
            </div>
        )
    }
}

class App extends React.Component {

    win = false;

    clickAround(field, i) {
        let col = i % 8;
        let raw = Math.trunc(i / 8);
        for (let i = raw - 1; i <= raw + 1; i++) {
            for(let j = col - 1; j <= col  + 1; j++) {
                if (i >= 0 && i < 9 && j >= 0 && j < 8 && !field[i * 8 + j].isOpen) {
                    field[i * 8 + j].isOpen = true;
                    field[i * 8 + j].value = this.findBombsAround(field,i * 8 + j);
                }
            }
        }
    }

    findBombsAround(field, i) {
        if (field[i].isBomb) {
            return;
        }
        let value = 0;
        let col = i % 8;
        let raw = Math.trunc(i / 8);
        for (let i = raw - 1; i <= raw + 1; i++) {
            for(let j = col - 1; j <= col  + 1; j++) {
                if (i >= 0 && i < 9 && j >= 0 && j < 8 && field[i * 8 + j].isBomb) {
                    value++;
                }
            }
        }
        if (value == 0) {
            this.clickAround(field, i)
        }
        return value || null;
    }

    checkWin(field) {
        let counter = 0;
        for(let i = 0; i < 72; i++) {
            counter += field[i].isOpen;
        }
        if (counter === 62 && this.state.flagCount === 10) {
            this.setState({
                isBombClicked: true
            })
            this.win = true;
        }
    }

    replaceBomb(field) {
        for(let i = 0; i < 72; i++) {
            if (!field[i].isBomb) {
                field[i].isBomb = true;
                break;
            }
        }
    }

    handleClick(i) {

        if (this.state.isBombClicked) {
            return;
        }
        const field = this.state.field.slice();
        field[i].isOpen = true;
        if (this.state.isBombClicked == null && field[i].isBomb){
            this.replaceBomb(field);
            field[i].isBomb = false;
        }
        field[i].value = this.findBombsAround(field, i);

        if (field[i].isFlag) {
            field[i].isFlag = false;
        }

        this.setState({
            field: field,
            isBombClicked: field[i].isBomb
            });
        if (field[i].isBomb) {
            field.forEach(cell => cell.isOpen = cell.isBomb ? true : cell.isOpen);
        } else {
            this.checkWin(field);
        }
    }

    handleContext(i) {

        const flags = this.state.flagCount;
        const field = this.state.field.slice();

        if (this.state.isBombClicked ||
            (this.state.bombCount - this.state.flagCount === 0 &&
        !field[i].isFlag)) {
            return;
        }

        if (!field[i].isOpen) {
            if (field[i].isFlag) {
                this.setState({flagCount: flags - 1});
            } else {
                this.setState({flagCount: flags + 1});
            }
            field[i].isFlag = !field[i].isFlag;
        }

        this.setState({
            field: field
        })
    }

    resetGame() {
        this.win = false;
        let field = [];
        let rnd;
        let bombCount = 0;
        for (let i = 0; i < 72; i++){
            rnd = Math.random();
            field.push({
                value: null,
                isOpen: false,
                isBomb: rnd > 0.8 && bombCount < 10,
                isFlag: false
            });
            bombCount += field[field.length - 1].isBomb;
        }
        this.setState({
            field: field,
            bombCount: bombCount,
            flagCount: 0,
            isBombClicked: null
        });
    }

    constructor(props) {
        super(props);
        let field = [];
        let rnd;
        let bombCount = 0;
        for (let i = 0; i < 72; i++){
            rnd = Math.random();
            field.push({
                value: null,
                isOpen: false,
                isBomb: rnd > 0.8 && bombCount < 10,
                isFlag: false
            });
           bombCount += field[field.length - 1].isBomb;
        }
        this.state = {
            field: field,
            bombCount: bombCount,
            flagCount: 0,
            isBombClicked: null
        }
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <p>
                        Minesweeper
                    </p>
                </header>
                <Panel
                    onClick = {() => this.resetGame()}
                    state = {this.state}
                />
                <Board
                    onClick = {(i) => this.handleClick(i)}
                    onContextMenu = {(i) => this.handleContext(i)}
                    state = {this.state}/>
            </div>
        );
    }
}

export default App;

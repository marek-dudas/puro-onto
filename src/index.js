import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css';
import $ from 'jquery';
//import yuml_diagram from "yuml-diagram";
import RuleController from './controllers/RuleController.js'; 
import RdfController from './controllers/RdfController.js';
import { thisTypeAnnotation } from "@babel/types";


class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldValue: '', transformed: false, svg: null, title: "", fatherUrl: "", 
      buttons: [], order: 0, 
      ontoModel: [], queryRoots: [], roots: [], changeName: false, elName: ""};

    this.ruleController = new RuleController();
    //this.RdfController = new RuleController(); 
   
  }

  handleChange = (event) => {
    this.setState({ elName: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault(); 
    var rules = this.ruleController.getDefault();
    this.setState({buttons: rules.buttons, title: rules.title});
    /*
    var path = this.ruleController.getFullPath();
    console.log(path);
    path.then(function(results) {
        console.log("IN");
        console.log(results);

        this.setState({queryTree: results}); 
        
        var buttons = this.ruleController.getButtons("BType", ""); 
        this.setState({ order: 0, 
        title: results[0].label.value, 
        buttons: buttons,
        });


      }.bind(this));
      */

     /*
    // někde ulož informaci, že se jedná o first call a pak s tim pracuj
    var results = this.ruleController.firstFind(); 
    
    results.then(function(result) {
      console.log(result);
      // vytvoř metodu pro ged všechny tlacitka 
      var buttons = this.ruleController.getButtons("BType", ""); 
      this.setState({ order: 0, 
        title: result[0].label.value, 
        buttons: buttons,
        queryRoots: result});
   }.bind(this));
   */

  }

  handleClick = (selectedType, selectedUri, createdClass, origin) => {
     let elName = this.state.elName;
    
     if (elName === "" && this.state.changeName === true)
     {
       alert("Je nutné zadat název elementu!");
     }
     else
     {
        this.ruleController.nextElement(selectedType,selectedUri,createdClass, origin, elName).then(function(results) {
          console.log("call");
          console.log(results);
          this.setState({buttons: results.buttons, title: results.title, elName: "", changeName: results.elName});

      }.bind(this));
    }
  }


  createGraph(tripples) {

    let yumlPrep = "";
    let umlType = "kind"
    for (let i = 0; i < tripples.length; i += 3) {
      yumlPrep += "\n [<<" + umlType + ">> \\n " + tripples[i] + "]-" + tripples[i + 1] + ">[" + tripples[i + 2] + "]";
    }
    alert(yumlPrep);
    var yumlText =
      `// {type:class}  
     // {direction:leftToRight}
     // {generate: true}`+ yumlPrep;
    console.log(yumlText);

    //var yuml = new yuml_diagram();
    //var svg = yuml.processYumlDocument(yumlText, false);

    //this.setState({ transformed: true, svg: svg });

  }
  handleClickName = (stateName) =>
  {
    this.setState({changeName : !stateName});
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <form className="w-50" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="comment">Puro model</label>
              <textarea className="form-control" rows="10" id="comment"  > </textarea>
            </div>
            <button type="Submint" className="btn btn-primary" data-toggle="modal" data-target="#exampleModal">
              Start transformation
            </button>
          </form>
          <div className="form-group w-50" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Onto model</label>
            <div className="form-control  h-100" id="exampleFormControlTextarea1">
               {this.state.transformed}
            </div>
 
          </div>
        </div>
        <ModalWindow title={this.state.title} onChange={this.handleChange} elName = {this.state.elName} buttons={this.state.buttons} onClick = {this.handleClick} onClickName = {this.handleClickName} changeName = {this.state.changeName} />
      </div>



    );
  }

}

class ModalWindow extends React.Component {
  render() {
    return (
      <div className="modal fade" id="exampleModal" tabIndex="-1" data-backdrop="static" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog " role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">{this.props.title}</h5>
            </div>
            <div className="modal-body">
            <div className =  {this.props.changeName ? 'input-group inputName' : 'd-none'}>
                  <div className="input-group-prepend">
                    <span className="input-group-text" id="">Name of the element:</span>
                  </div>
                  <input placeholder = "Write name of the new element!" type="text" className="form-control" onChange = {this.props.onChange}  value = {this.props.elName}></input>
                </div> 
              <div className="container-fluid text-center">  
                        
                    <ModalButtons buttons={this.props.buttons} onClick = {this.props.onClick} />
              </div>
            </div>
            <div className="modal-footer">
              <button  type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type = "button"  className =  {this.props.elName ? 'btn btn-primary' : 'd-none'} onClick={() => this.props.onClickName(this.props.changeName)}>Change name</button>
              <button type = "button" className="btn btn-primary">Undo</button>
            </div>
          </div>
        </div>
      </div>

    );
  }
}

class ModalButtons extends React.Component {

  render() {
    return (
    <div className="row text-center col-md-12 ">
      {this.props.buttons.map((value) => {
        return  <div className="col-md-4 text-center">
                      <button type="button"  className="btn btn-success btnModal" onClick = {() => this.props.onClick(value.name, value.uri, value.createdClass, value.origin)} >{value.name}</button>
                </div>
      })}
     </div>
    )
  }
}

class Board extends React.Component {

  render() {
    return [
      <InputField />
    ]

  }
}


ReactDOM.render(
  <Board />,
  document.getElementById('root')
);


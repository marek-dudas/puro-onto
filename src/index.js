import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import $ from 'jquery';
//import yuml_diagram from "yuml-diagram";
import RuleController from './controllers/RuleController.js'; 


class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldValue: '', transformed: false, svg: null, title: "", fatherUrl: "", 
      buttons: ["Kind", "Role", "Collection", "Datatypy", "Subkind"], 
    };

    this.ruleController = new RuleController();
   
  }

  handleChange = (event) => {
    this.setState({ fieldValue: event.target.value });

  }

  handleSubmit = (event) => {
    event.preventDefault();
    // this.inputParse(this.state.value)
    
    this.ruleController.firstFind(); 

    
    
  }

  handleClick = (selected) => {
    
     this.setState({buttons: ["AHOJ","blbe","srpe"]});

     //zkontroluj jestli má subtype jestli má subtype -> jestli vybere kind jdi zpátky na relation 

    
     //processing
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


  render() {
    return (
      <div className="container">
        <div className="row">
          <form className="w-50" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="comment">Comment:</label>
              <textarea className="form-control" rows="10" id="comment" value={this.state.value} onChange={this.handleChange}> </textarea>
            </div>
            <button type="Submint" className="btn btn-primary" data-toggle="modal" data-target="#exampleModal">
              Launch demo modal
        </button>
          </form>
          <div className="form-group w-50" id="graph">
            <label htmlFor="exampleFormControlTextarea1">Example textarea2</label>
            <div className="form-control  h-100" id="exampleFormControlTextarea1">
               {this.state.transformed}
            </div>
          </div>
        </div>
        <ModalWindow title={this.state.title} buttons={this.state.buttons} onClick = {this.handleClick} />
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
              <div className="container-fluid text-center">       
                    <ModalButtons buttons={this.props.buttons} onClick = {this.props.onClick} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel Transformation</button>
              <button type="button" className="btn btn-primary">Undo</button>
              <button type="button" className="btn btn-primary" data-dismiss = "modal">Next</button>
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
                      <button type="button"  className="btn btn-success" onClick = {() => this.props.onClick(value)} >{value}</button>
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


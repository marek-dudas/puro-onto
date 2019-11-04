import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
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
      ontoModel: [], queryRoots: [], roots: []
     
    };

    this.ruleController = new RuleController();
    //this.RdfController = new RuleController(); 
   
  }

  handleChange = (event) => {
    this.setState({ fieldValue: event.target.value });

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

  handleClick = (selectedType, selectedUri, createdClass) => {

     var ontoModel = this.state.ontoModel;
     var lastIndex = ontoModel.length - 1;
     var buttons;
     var prevElement = "";
     


     this.ruleController.nextElement(selectedType,selectedUri,createdClass).then(function(results) {
        console.log("call");
        console.log(results);
        this.setState({buttons: results.buttons, title: results.title});

     }.bind(this));
     
     
     if (Object.keys(ontoModel).length === 50) // jedná se o první záznam
     {
        buttons = 0;
        lastIndex = 0;
        // první v poli zkontroluj jestli strom není prázný!!!!!!!!!!!!!!!!
        var curElement = this.state.queryTree[0];
        //ontoModel.push({url: curElement.btype.value, label: curElement.label.value, from: prevElement, type: selected, puroType: "BType"});
        //Ppriprav tlacitka 
        buttons = this.ruleController.getButtons(ontoModel[lastIndex].puroType,ontoModel[lastIndex].type);
        

        // podívá se to spojitosti 
        if (buttons === 1) {
          var qElement = this.state.queryTree[lastIndex + 1];
          // vymyslet důmyslnější cut
          
          buttons = this.ruleController.getButtons(qElement);
          
          
          
          
          this.setState({title: "Which class represents" + qElement.label.value + " ("+qElement.type.value.split('#')[1]+")?",
          });

        }

        //this.setState({title: this.state.queryTree[1].label.value, order: this.state.order ++, buttons:buttons});


     }
     else
     {
      

      // vytvoř nový záz set state bla bla bla
      // podívej se jestli current state nemá potomka (instance of/subtape of)
      /*
      prevElement = ontoModel[ontoModel.length - 1].type;

      var results = this.ruleController.findRelatedBType(this.state.queryRoots[0].btype.value);
      results.then(function(result) {
        if (Object.keys(result).length > 0)
        {  
        var curElement = result[0];
        // push až na kliknutí
        ontoModel.push({url: curElement.btype.value, label: curElement.label.value, from: prevElement, type: selected, puroType: "BType"});
        this.setState({title: curElement.label.value,
          order: order,
          ontoModel: ontoModel
         });
        }
      }.bind(this))
      */
      // prevElement = ontoModel[ontoModel.length - 1].type;
       //buttons = this.ruleController.getButtons(ontoModel[lastIndex].puroType,ontoModel[lastIndex].type);
        buttons = 0;
     } 
     
     
     
     
     
      
     // jedná se o poslední objekt 
     if (buttons === 4)
     {
      var order = this.state.order + 1; 
      // this.ruleController.
      //pridej do onto modelu
       // tohle je blbost order dávam na query result 
       var curElement = this.state.queryRoots[order];
       
     //  ontoModel.push({url: curElement.btype.value, label: curElement.label.value, from: prevElement, type: selected, puroType: "BType"});
       this.setState({title: curElement.label.value,
                      order: order,
                      ontoModel: ontoModel
                     });
       //rekni si o všechna tlacitka


     }
     else
     {

     }
     console.log(this.state.ontoModel);
     
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
                      <button type="button"  className="btn btn-success" onClick = {() => this.props.onClick(value.name, value.uri, value.createdClass)} >{value.name}</button>
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

